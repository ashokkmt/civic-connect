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
	"civic/internal/repository"
	"civic/internal/service"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AdminHandler struct {
	Departments *service.DepartmentService
	Provision   *service.AdminProvisioningService
	Flags       *service.FlagService
	Users       *service.UserAdminService
	Issues      repository.IssueRepository
	SLA         *service.SLAService
}

type createDepartmentRequest struct {
	Name string `json:"name"`
}

func (h AdminHandler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	var req createDepartmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	dept, err := h.Departments.Create(r.Context(), req.Name)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"department": dept,
	})
}

type registerAuthorityRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	DepartmentID string `json:"departmentId"`
}

func (h AdminHandler) RegisterAuthority(w http.ResponseWriter, r *http.Request) {
	var req registerAuthorityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	user, err := h.Provision.RegisterAuthority(r.Context(), req.Email, req.Password, req.DepartmentID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"user": user,
	})
}

func (h AdminHandler) ListFlagged(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	limit := int64(100)
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		v, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid limit", http.StatusBadRequest))
			return
		}
		limit = v
	}

	items, err := h.Issues.ListFlagged(r.Context(), limit)
	if err != nil {
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not list flagged issues", http.StatusInternalServerError))
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": toAdminIssuesDTO(items)})
}

type resolveFlagRequest struct {
	Resolution string `json:"resolution"`
}

func (h AdminHandler) ResolveFlag(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	principal, ok := principalFromCtx(r)
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}
	id, err := parseAdminIDFromPathWithSuffix(r.URL.Path, "/api/v1/admin/flags/", "/resolve")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	var req resolveFlagRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}
	flag, err := h.Flags.Resolve(r.Context(), id, principal.UserID, req.Resolution)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"flag": flag})
}

func (h AdminHandler) BlockUser(w http.ResponseWriter, r *http.Request) {
	h.setUserBlocked(w, r, true)
}

func (h AdminHandler) UnblockUser(w http.ResponseWriter, r *http.Request) {
	h.setUserBlocked(w, r, false)
}

func (h AdminHandler) setUserBlocked(w http.ResponseWriter, r *http.Request, blocked bool) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	userID := parseUserIDFromPathWithSuffix(r.URL.Path, "/api/v1/admin/users/", map[bool]string{true: "/block", false: "/unblock"}[blocked])
	if strings.TrimSpace(userID) == "" {
		response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
		return
	}
	if err := h.Users.SetBlocked(r.Context(), userID, blocked); err != nil {
		response.WriteError(w, r, err)
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"userId": userID, "blocked": blocked})
}

func (h AdminHandler) ListEscalations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	limit := int64(100)
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		v, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid limit", http.StatusBadRequest))
			return
		}
		limit = v
	}
	items, err := h.Issues.ListEscalated(r.Context(), "", limit)
	if err != nil {
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not list escalated issues", http.StatusInternalServerError))
		return
	}
	if h.SLA != nil {
		h.SLA.RefreshBatch(r.Context(), items, time.Now())
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": toAdminIssuesDTO(items)})
}

func (h AdminHandler) ResolveEscalation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	id, err := parseAdminIDFromPathWithSuffix(r.URL.Path, "/api/v1/admin/issues/", "/escalations/resolve")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	if err := h.Issues.ResolveEscalation(r.Context(), id, time.Now()); err != nil {
		if err == repository.ErrNotFound {
			response.WriteError(w, r, errx.New("NOT_FOUND", "issue not found", http.StatusNotFound))
			return
		}
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not resolve escalation", http.StatusInternalServerError))
		return
	}
	issue, err := h.Issues.GetByID(r.Context(), id)
	if err != nil {
		response.WriteError(w, r, errx.New("NOT_FOUND", "issue not found", http.StatusNotFound))
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": toAdminIssueDTO(issue)})
}

func (h AdminHandler) FlagRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/resolve") {
		h.ResolveFlag(w, r)
		return
	}
	response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
}

func (h AdminHandler) UserRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/block") {
		h.BlockUser(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/unblock") {
		h.UnblockUser(w, r)
		return
	}
	response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
}

func (h AdminHandler) IssueRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/escalations/resolve") {
		h.ResolveEscalation(w, r)
		return
	}
	response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
}

func parseAdminIDFromPathWithSuffix(path, prefix, suffix string) (primitive.ObjectID, error) {
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

func parseUserIDFromPathWithSuffix(path, prefix, suffix string) string {
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return ""
	}
	id := strings.TrimSuffix(strings.TrimPrefix(path, prefix), suffix)
	id = strings.Trim(id, "/")
	if id == "" || strings.Contains(id, "/") {
		return ""
	}
	return id
}

func principalFromCtx(r *http.Request) (middleware.Principal, bool) {
	if r == nil {
		return middleware.Principal{}, false
	}
	return middleware.GetPrincipal(r.Context())
}

type adminIssueDTO struct {
	ID              string             `json:"id"`
	Title           string             `json:"title"`
	Status          domain.IssueStatus `json:"status"`
	DepartmentID    string             `json:"departmentId"`
	FlagsCount      int                `json:"flagsCount"`
	SlaViolation    bool               `json:"slaViolation"`
	EscalationLevel int                `json:"escalationLevel"`
	SlaStage        string             `json:"slaStage"`
}

func toAdminIssueDTO(issue *domain.Issue) adminIssueDTO {
	if issue == nil {
		return adminIssueDTO{}
	}
	return adminIssueDTO{
		ID:              issue.ID.Hex(),
		Title:           issue.Title,
		Status:          issue.Status,
		DepartmentID:    issue.DepartmentID,
		FlagsCount:      issue.FlagsCount,
		SlaViolation:    issue.SlaViolation,
		EscalationLevel: issue.EscalationLevel,
		SlaStage:        issue.SlaStage,
	}
}

func toAdminIssuesDTO(issues []*domain.Issue) []adminIssueDTO {
	out := make([]adminIssueDTO, 0, len(issues))
	for _, issue := range issues {
		out = append(out, toAdminIssueDTO(issue))
	}
	return out
}
