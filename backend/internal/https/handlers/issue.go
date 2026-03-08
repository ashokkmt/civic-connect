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
	Flags  *service.FlagService
}

type createFlagRequest struct {
	Reason string `json:"reason"`
}

type createIssueRequest struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	ImageURLs    []string `json:"imageUrls"`
	DepartmentID string   `json:"departmentId"`
	Location     struct {
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
		Title:        req.Title,
		Description:  req.Description,
		ImageURLs:    req.ImageURLs,
		Lat:          req.Location.Lat,
		Lng:          req.Location.Lng,
		UserID:       principal.UserID,
		DepartmentID: req.DepartmentID,
	})
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	payload := map[string]interface{}{
		"created":        result.Created,
		"supporterAdded": result.SupporterAdded,
		"issue":          toIssuePublicDTO(result.Issue, principal.UserID),
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

func (h IssueHandler) CitizenIssues(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.ListCitizen(w, r)
	case http.MethodPost:
		h.Create(w, r)
	default:
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
	}
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
	offset := int64(0)
	if val, ok := parseFloatQuery(r, "offset"); ok {
		offset = int64(val)
	}

	statuses, err := parseStatusListQuery(r, "status")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	severities := parseStringListQuery(r, "severity")
	categories := parseStringListQuery(r, "category")
	dateFrom, err := parseTimeQuery(r, "dateFrom")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	dateTo, err := parseTimeQuery(r, "dateTo")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issues, err := h.Issues.ListPublic(r.Context(), service.PublicIssueQuery{
		Lat:          lat,
		Lng:          lng,
		RadiusMeters: radius,
		Limit:        limit,
		Offset:       offset,
		Filters: service.PublicIssueFilters{
			Statuses:   statuses,
			Severities: severities,
			Categories: categories,
			DateFrom:   dateFrom,
			DateTo:     dateTo,
		},
	})
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	resp := make([]issuePublicDTO, 0, len(issues))
	for _, issue := range issues {
		resp = append(resp, toIssuePublicDTO(issue, ""))
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": resp})
}

func (h IssueHandler) PublicStats(w http.ResponseWriter, r *http.Request) {
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

	statuses, err := parseStatusListQuery(r, "status")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	severities := parseStringListQuery(r, "severity")
	categories := parseStringListQuery(r, "category")
	dateFrom, err := parseTimeQuery(r, "dateFrom")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	dateTo, err := parseTimeQuery(r, "dateTo")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	stats, err := h.Issues.StatsPublic(r.Context(), service.PublicIssueQuery{
		Lat:          lat,
		Lng:          lng,
		RadiusMeters: radius,
		Filters: service.PublicIssueFilters{
			Statuses:   statuses,
			Severities: severities,
			Categories: categories,
			DateFrom:   dateFrom,
			DateTo:     dateTo,
		},
	})
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"total":            stats.Total,
		"pendingApprovals": stats.PendingApprovals,
		"inProgress":       stats.InProgress,
		"resolved":         stats.Resolved,
	})
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

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": toIssuePublicDTO(issue, "")})
}

func (h IssueHandler) ListCitizen(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
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

	issues, err := h.Issues.ListCitizenNearby(r.Context(), principal.UserID, lat, lng, radius, limit)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	resp := make([]issuePublicDTO, 0, len(issues))
	for _, issue := range issues {
		resp = append(resp, toIssuePublicDTO(issue, principal.UserID))
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": resp})
}

func (h IssueHandler) GetCitizen(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseIDFromPath(r.URL.Path, "/api/v1/citizen/issues/")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, err := h.Issues.GetCitizenByID(r.Context(), id, principal.UserID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": toIssuePublicDTO(issue, principal.UserID)})
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
		"issue":          toIssuePublicDTO(issue, principal.UserID),
	})
}

func (h IssueHandler) ConfirmResolution(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseIDFromPathWithSuffix(r.URL.Path, "/api/v1/citizen/issues/", "/confirm-resolution")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, err := h.Issues.ConfirmResolution(r.Context(), id, principal.UserID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": toIssuePublicDTO(issue, principal.UserID)})
}

func (h IssueHandler) Flag(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Flags == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "flagging is not configured", http.StatusNotImplemented))
		return
	}
	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}
	id, err := parseIDFromPathWithSuffix(r.URL.Path, "/api/v1/citizen/issues/", "/flags")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	var req createFlagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}
	flag, err := h.Flags.Create(r.Context(), id, principal.UserID, req.Reason)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{"flag": flag})
}

func (h IssueHandler) CitizenIssueRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/support") {
		h.Support(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/confirm-resolution") {
		h.ConfirmResolution(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/flags") {
		h.Flag(w, r)
		return
	}
	h.GetCitizen(w, r)
}

type issuePublicDTO struct {
	ID             string             `json:"id"`
	Title          string             `json:"title"`
	Description    string             `json:"description"`
	ImageURLs      []string           `json:"imageUrls,omitempty"`
	Location       domain.GeoPoint    `json:"location"`
	Status         domain.IssueStatus `json:"status"`
	SupporterCount int                `json:"supporterCount"`
	DepartmentID   string             `json:"departmentId"`
	IsReporter     bool               `json:"isReporter"`
	IsSupporter    bool               `json:"isSupporter"`
	CreatedAt      string             `json:"createdAt"`
	UpdatedAt      string             `json:"updatedAt"`
}

func toIssuePublicDTO(issue *domain.Issue, userID string) issuePublicDTO {
	if issue == nil {
		return issuePublicDTO{}
	}

	isReporter := false
	isSupporter := false
	if userID != "" {
		isReporter = issue.CreatedByUserID == userID
		for _, supporterID := range issue.SupporterUserIDs {
			if supporterID == userID {
				isSupporter = true
				break
			}
		}
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
		IsReporter:     isReporter,
		IsSupporter:    isSupporter,
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

func parseStringListQuery(r *http.Request, key string) []string {
	val := strings.TrimSpace(r.URL.Query().Get(key))
	if val == "" {
		return nil
	}

	parts := strings.Split(val, ",")
	results := make([]string, 0, len(parts))
	for _, part := range parts {
		item := strings.TrimSpace(part)
		if item != "" {
			results = append(results, item)
		}
	}
	return results
}

func parseStatusListQuery(r *http.Request, key string) ([]domain.IssueStatus, error) {
	values := parseStringListQuery(r, key)
	if len(values) == 0 {
		return nil, nil
	}

	statuses := make([]domain.IssueStatus, 0, len(values))
	for _, value := range values {
		status := domain.IssueStatus(strings.TrimSpace(value))
		if status != "" {
			statuses = append(statuses, status)
		}
	}
	return statuses, nil
}

func parseTimeQuery(r *http.Request, key string) (*time.Time, error) {
	val := strings.TrimSpace(r.URL.Query().Get(key))
	if val == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, val)
	if err != nil {
		return nil, errx.New("INVALID_INPUT", "invalid date", http.StatusBadRequest)
	}
	return &parsed, nil
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
