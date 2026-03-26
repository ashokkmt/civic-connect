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
	UserRepo    repository.UserRepository
	DeptRepo    repository.DepartmentRepository
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
	Name         string `json:"name"`
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

	user, err := h.Provision.RegisterAuthority(r.Context(), req.Name, req.Email, req.Password, req.DepartmentID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"user": user,
	})
}

func (h AdminHandler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.DeptRepo == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "department repository is not configured", http.StatusNotImplemented))
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

	items, err := h.DeptRepo.List(r.Context(), limit)
	if err != nil {
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not list departments", http.StatusInternalServerError))
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": items})
}

func (h AdminHandler) DepartmentsMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.DeptRepo == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "department repository is not configured", http.StatusNotImplemented))
		return
	}

	depts, err := h.DeptRepo.List(r.Context(), 500)
	if err != nil {
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not list departments", http.StatusInternalServerError))
		return
	}

	type departmentMetric struct {
		DepartmentID    string `json:"departmentId"`
		Name            string `json:"name"`
		TotalIssues     int64  `json:"totalIssues"`
		ResolvedIssues  int64  `json:"resolvedIssues"`
		OpenEscalations int64  `json:"openEscalations"`
	}

	metrics := make([]departmentMetric, 0, len(depts))
	var totalIssues int64
	var resolvedIssues int64
	var openEscalations int64
	for _, dept := range depts {
		if dept == nil {
			continue
		}
		totalCount, err := h.Issues.CountByDepartment(r.Context(), dept.ID.Hex(), nil)
		if err != nil {
			response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not compute department metrics", http.StatusInternalServerError))
			return
		}
		resolvedCount, err := h.Issues.CountByDepartment(r.Context(), dept.ID.Hex(), []domain.IssueStatus{domain.StatusResolved, domain.StatusAwaitingHeadClose, domain.StatusClosed})
		if err != nil {
			response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not compute department metrics", http.StatusInternalServerError))
			return
		}
		escalatedItems, err := h.Issues.ListEscalated(r.Context(), dept.ID.Hex(), 1000)
		if err != nil {
			response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not compute department metrics", http.StatusInternalServerError))
			return
		}
		escalatedCount := int64(len(escalatedItems))

		totalIssues += totalCount
		resolvedIssues += resolvedCount
		openEscalations += escalatedCount
		metrics = append(metrics, departmentMetric{
			DepartmentID:    dept.ID.Hex(),
			Name:            dept.Name,
			TotalIssues:     totalCount,
			ResolvedIssues:  resolvedCount,
			OpenEscalations: escalatedCount,
		})
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"totals": map[string]int64{
			"departments":     int64(len(metrics)),
			"issuesReported":  totalIssues,
			"issuesResolved":  resolvedIssues,
			"openEscalations": openEscalations,
		},
		"items": metrics,
	})
}

func (h AdminHandler) ListAuthorities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.UserRepo == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "user repository is not configured", http.StatusNotImplemented))
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

	items, err := h.UserRepo.ListAuthorityHeads(r.Context(), limit)
	if err != nil {
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not list authority heads", http.StatusInternalServerError))
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": items})
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

type reassignDepartmentRequest struct {
	DepartmentID string `json:"departmentId"`
	Reason       string `json:"reason"`
}

func (h AdminHandler) ReassignEscalationDepartment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	id, err := parseAdminIDFromPathWithSuffix(r.URL.Path, "/api/v1/admin/issues/", "/escalations/reassign-department")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	var req reassignDepartmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}
	req.DepartmentID = strings.TrimSpace(req.DepartmentID)
	if req.DepartmentID == "" {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "departmentId is required", http.StatusBadRequest))
		return
	}

	if err := h.Issues.ReassignDepartment(r.Context(), id, req.DepartmentID, strings.TrimSpace(req.Reason), time.Now()); err != nil {
		if err == repository.ErrNotFound {
			response.WriteError(w, r, errx.New("NOT_FOUND", "issue not found", http.StatusNotFound))
			return
		}
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not reassign department", http.StatusInternalServerError))
		return
	}

	issue, err := h.Issues.GetByID(r.Context(), id)
	if err != nil {
		response.WriteError(w, r, errx.New("NOT_FOUND", "issue not found", http.StatusNotFound))
		return
	}
	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": toAdminIssueDTO(issue)})
}

func (h AdminHandler) NotifyEscalationHead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	id, err := parseAdminIDFromPathWithSuffix(r.URL.Path, "/api/v1/admin/issues/", "/escalations/notify-head")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	principal, ok := principalFromCtx(r)
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	if err := h.Issues.MarkNotifiedHead(r.Context(), id, principal.UserID, time.Now()); err != nil {
		if err == repository.ErrNotFound {
			response.WriteError(w, r, errx.New("NOT_FOUND", "issue not found", http.StatusNotFound))
			return
		}
		response.WriteError(w, r, errx.New("INTERNAL_ERROR", "could not notify head", http.StatusInternalServerError))
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
	if strings.HasSuffix(r.URL.Path, "/escalations/reassign-department") {
		h.ReassignEscalationDepartment(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/escalations/notify-head") {
		h.NotifyEscalationHead(w, r)
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
	ID               string             `json:"id"`
	Title            string             `json:"title"`
	Status           domain.IssueStatus `json:"status"`
	DepartmentID     string             `json:"departmentId"`
	FlagsCount       int                `json:"flagsCount"`
	SlaViolation     bool               `json:"slaViolation"`
	EscalationLevel  int                `json:"escalationLevel"`
	SlaStage         string             `json:"slaStage"`
	EscalationReason string             `json:"escalationReason,omitempty"`
	NotifiedHeadAt   *time.Time         `json:"notifiedHeadAt,omitempty"`
	NotifiedHeadBy   string             `json:"notifiedHeadBy,omitempty"`
}

func toAdminIssueDTO(issue *domain.Issue) adminIssueDTO {
	if issue == nil {
		return adminIssueDTO{}
	}
	return adminIssueDTO{
		ID:               issue.ID.Hex(),
		Title:            issue.Title,
		Status:           issue.Status,
		DepartmentID:     issue.DepartmentID,
		FlagsCount:       issue.FlagsCount,
		SlaViolation:     issue.SlaViolation,
		EscalationLevel:  issue.EscalationLevel,
		SlaStage:         issue.SlaStage,
		EscalationReason: issue.EscalationReason,
		NotifiedHeadAt:   issue.NotifiedHeadAt,
		NotifiedHeadBy:   issue.NotifiedHeadBy,
	}
}

func toAdminIssuesDTO(issues []*domain.Issue) []adminIssueDTO {
	out := make([]adminIssueDTO, 0, len(issues))
	for _, issue := range issues {
		out = append(out, toAdminIssueDTO(issue))
	}
	return out
}
