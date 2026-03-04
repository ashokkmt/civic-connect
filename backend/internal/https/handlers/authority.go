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

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthorityHandler struct {
	Authority *service.AuthorityService
}

type resolveIssueRequest struct {
	ResolutionNotes string `json:"resolutionNotes"`
}

func (h AuthorityHandler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	limit := int64(0)
	if val := strings.TrimSpace(r.URL.Query().Get("limit")); val != "" {
		parsed, err := strconv.ParseInt(val, 10, 64)
		if err != nil {
			response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid limit", http.StatusBadRequest))
			return
		}
		limit = parsed
	}

	issues, err := h.Authority.ListByDepartment(r.Context(), principal.DepartmentID, principal.UserID, limit)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": issues})
}

func (h AuthorityHandler) Assign(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseAuthorityIDFromPathWithSuffix(r.URL.Path, "/api/v1/authority/issues/", "/assign")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, err := h.Authority.Assign(r.Context(), id, principal.UserID, principal.DepartmentID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": issue})
}

func (h AuthorityHandler) Start(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseAuthorityIDFromPathWithSuffix(r.URL.Path, "/api/v1/authority/issues/", "/start")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, err := h.Authority.Start(r.Context(), id, principal.UserID, principal.DepartmentID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": issue})
}

func (h AuthorityHandler) Resolve(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseAuthorityIDFromPathWithSuffix(r.URL.Path, "/api/v1/authority/issues/", "/resolve")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	var req resolveIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	issue, err := h.Authority.Resolve(r.Context(), id, principal.UserID, principal.DepartmentID, req.ResolutionNotes)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": issue})
}

func (h AuthorityHandler) IssueRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/assign") {
		h.Assign(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/start") {
		h.Start(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/resolve") {
		h.Resolve(w, r)
		return
	}
	response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
}

func parseAuthorityIDFromPathWithSuffix(path, prefix, suffix string) (primitive.ObjectID, error) {
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
