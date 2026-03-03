package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/https/middleware"
	"civic/internal/https/response"
	"civic/internal/service"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type IssueHandler struct {
	Issues *service.IssueService
}

type createIssueRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	ImageURLs   []string `json:"imageUrls"`
	Location    struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
}

func (h IssueHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	var req createIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	result, err := h.Issues.CreateOrMergeIssue(r.Context(), service.IssueCreateInput{
		Title:       req.Title,
		Description: req.Description,
		ImageURLs:   req.ImageURLs,
		Lat:         req.Location.Lat,
		Lng:         req.Location.Lng,
		UserID:      principal.UserID,
	})
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	payload := map[string]interface{}{
		"created":        result.Created,
		"supporterAdded": result.SupporterAdded,
		"issue":          toIssuePublicDTO(result.Issue),
	}
	if result.MergedIntoIssueID != nil {
		payload["mergedIntoIssueId"] = result.MergedIntoIssueID.Hex()
	}
	if result.Issue != nil {
		payload["issueId"] = result.Issue.ID.Hex()
	}

	status := http.StatusCreated
	if !result.Created {
		status = http.StatusOK
	}
	response.WriteJSON(w, status, payload)
}

func (h IssueHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	lat, ok := parseFloatQuery(r, "lat")
	if !ok {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "lat is required", http.StatusBadRequest))
		return
	}
	lng, ok := parseFloatQuery(r, "lng")
	if !ok {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "lng is required", http.StatusBadRequest))
		return
	}

	radius := int64(0)
	if val, ok := parseFloatQuery(r, "radiusMeters"); ok {
		radius = int64(val)
	}
	limit := int64(0)
	if val, ok := parseFloatQuery(r, "limit"); ok {
		limit = int64(val)
	}

	issues, err := h.Issues.ListPublicNearby(r.Context(), lat, lng, radius, limit)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	resp := make([]issuePublicDTO, 0, len(issues))
	for _, issue := range issues {
		resp = append(resp, toIssuePublicDTO(issue))
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": resp})
}

func (h IssueHandler) GetPublic(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	id, err := parseIDFromPath(r.URL.Path, "/api/v1/issues/")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, err := h.Issues.GetPublicByID(r.Context(), id)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": toIssuePublicDTO(issue)})
}

func (h IssueHandler) Support(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseIDFromPathWithSuffix(r.URL.Path, "/api/v1/citizen/issues/", "/support")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, added, err := h.Issues.SupportIssue(r.Context(), id, principal.UserID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"supporterAdded": added,
		"issue":          toIssuePublicDTO(issue),
	})
}

type issuePublicDTO struct {
	ID             string             `json:"id"`
	Title          string             `json:"title"`
	Description    string             `json:"description"`
	ImageURLs      []string           `json:"imageUrls,omitempty"`
	Location       domain.GeoPoint    `json:"location"`
	Status         domain.IssueStatus `json:"status"`
	SupporterCount int                `json:"supporterCount"`
	DepartmentID   string             `json:"departmentId,omitempty"`
	CreatedAt      string             `json:"createdAt"`
	UpdatedAt      string             `json:"updatedAt"`
}

func toIssuePublicDTO(issue *domain.Issue) issuePublicDTO {
	if issue == nil {
		return issuePublicDTO{}
	}

	return issuePublicDTO{
		ID:             issue.ID.Hex(),
		Title:          issue.Title,
		Description:    issue.Description,
		ImageURLs:      issue.ImageURLs,
		Location:       issue.Location,
		Status:         issue.Status,
		SupporterCount: issue.SupporterCount,
		DepartmentID:   issue.DepartmentID,
		CreatedAt:      issue.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      issue.UpdatedAt.Format(time.RFC3339),
	}
}

func parseFloatQuery(r *http.Request, key string) (float64, bool) {
	val := strings.TrimSpace(r.URL.Query().Get(key))
	if val == "" {
		return 0, false
	}
	parsed, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return 0, false
	}
	return parsed, true
}

func parseIDFromPath(path, prefix string) (primitive.ObjectID, error) {
	idStr := strings.TrimPrefix(path, prefix)
	if idStr == "" || strings.Contains(idStr, "/") {
		return primitive.NilObjectID, errx.New("NOT_FOUND", "not found", http.StatusNotFound)
	}
	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return primitive.NilObjectID, errx.New("INVALID_INPUT", "invalid id", http.StatusBadRequest)
	}
	return id, nil
}

func parseIDFromPathWithSuffix(path, prefix, suffix string) (primitive.ObjectID, error) {
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return primitive.NilObjectID, errx.New("NOT_FOUND", "not found", http.StatusNotFound)
	}
	idStr := strings.TrimSuffix(strings.TrimPrefix(path, prefix), suffix)
	idStr = strings.Trim(idStr, "/")
	if idStr == "" || strings.Contains(idStr, "/") {
		return primitive.NilObjectID, errx.New("NOT_FOUND", "not found", http.StatusNotFound)
	}
	id, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return primitive.NilObjectID, errx.New("INVALID_INPUT", "invalid id", http.StatusBadRequest)
	}
	return id, nil
}
