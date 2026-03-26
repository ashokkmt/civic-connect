package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"civic/internal/errx"
	"civic/internal/https/middleware"
	"civic/internal/https/response"
	"civic/internal/service"
)

type HeadHandler struct {
	Provision *service.HeadProvisioningService
	Users     *service.UserAdminService
}

type registerWorkerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type updateWorkerRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (h HeadHandler) RegisterWorker(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	var req registerWorkerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	user, err := h.Provision.RegisterWorker(r.Context(), req.Email, req.Password, principal.DepartmentID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"user": user,
	})
}

func (h HeadHandler) ListWorkers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Users == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "worker management is not configured", http.StatusNotImplemented))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	limit := int64(0)
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		parsed, err := strconv.ParseInt(raw, 10, 64)
		if err != nil {
			response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid limit", http.StatusBadRequest))
			return
		}
		limit = parsed
	}

	includeBlocked := strings.EqualFold(strings.TrimSpace(r.URL.Query().Get("includeBlocked")), "true")
	workers, err := h.Users.ListWorkersByDepartment(r.Context(), principal.DepartmentID, includeBlocked, limit)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": workers})
}

func (h HeadHandler) GetWorker(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Users == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "worker management is not configured", http.StatusNotImplemented))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}
	workerID := parseWorkerIDFromPath(r.URL.Path, "/api/v1/head/workers/")
	if workerID == "" {
		response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
		return
	}

	workers, err := h.Users.ListWorkersByDepartment(r.Context(), principal.DepartmentID, true, 500)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}
	for _, worker := range workers {
		if worker != nil && worker.ID == workerID {
			response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": worker})
			return
		}
	}

	response.WriteError(w, r, errx.New("NOT_FOUND", "worker not found", http.StatusNotFound))
}

func (h HeadHandler) UpdateWorker(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Users == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "worker management is not configured", http.StatusNotImplemented))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}
	workerID := parseWorkerIDFromPath(r.URL.Path, "/api/v1/head/workers/")
	if workerID == "" {
		response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
		return
	}

	var req updateWorkerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	if err := h.Users.UpdateWorker(r.Context(), workerID, principal.DepartmentID, service.WorkerUpdateInput{
		Name:  req.Name,
		Email: req.Email,
	}); err != nil {
		response.WriteError(w, r, err)
		return
	}

	h.GetWorker(w, r)
}

func (h HeadHandler) SetWorkerBlocked(w http.ResponseWriter, r *http.Request, blocked bool) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Users == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "worker management is not configured", http.StatusNotImplemented))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	suffix := "/disable"
	if !blocked {
		suffix = "/enable"
	}
	workerID := parseWorkerIDFromPathWithSuffix(r.URL.Path, "/api/v1/head/workers/", suffix)
	if workerID == "" {
		response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
		return
	}

	if err := h.Users.UpdateWorker(r.Context(), workerID, principal.DepartmentID, service.WorkerUpdateInput{Blocked: &blocked}); err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"workerId": workerID, "blocked": blocked})
}

func (h HeadHandler) DeleteWorker(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Users == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "worker management is not configured", http.StatusNotImplemented))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}
	workerID := parseWorkerIDFromPath(r.URL.Path, "/api/v1/head/workers/")
	if workerID == "" {
		response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
		return
	}

	if err := h.Users.DeleteWorker(r.Context(), workerID, principal.DepartmentID); err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"workerId": workerID, "deleted": true})
}

func (h HeadHandler) WorkerRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/disable") {
		h.SetWorkerBlocked(w, r, true)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/enable") {
		h.SetWorkerBlocked(w, r, false)
		return
	}
	if r.Method == http.MethodPatch {
		h.UpdateWorker(w, r)
		return
	}
	if r.Method == http.MethodDelete {
		h.DeleteWorker(w, r)
		return
	}
	h.GetWorker(w, r)
}

func parseWorkerIDFromPath(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	value := strings.Trim(strings.TrimPrefix(path, prefix), "/")
	if value == "" || strings.Contains(value, "/") {
		return ""
	}
	return value
}

func parseWorkerIDFromPathWithSuffix(path, prefix, suffix string) string {
	if !strings.HasPrefix(path, prefix) || !strings.HasSuffix(path, suffix) {
		return ""
	}
	value := strings.Trim(strings.TrimSuffix(strings.TrimPrefix(path, prefix), suffix), "/")
	if value == "" || strings.Contains(value, "/") {
		return ""
	}
	return value
}
