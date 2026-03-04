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

type ModerationHandler struct {
	Moderation *service.ModerationService
}

type approveIssueRequest struct {
	DepartmentID string `json:"departmentId"`
	Severity     string `json:"severity"`
}

type rejectIssueRequest struct {
	Reason string `json:"reason"`
}

func (h ModerationHandler) ListPending(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
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

	issues, err := h.Moderation.ListPending(r.Context(), limit)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"items": issues})
}

func (h ModerationHandler) Approve(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseHeadIDFromPathWithSuffix(r.URL.Path, "/api/v1/head/issues/", "/approve")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	var req approveIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	issue, err := h.Moderation.Approve(r.Context(), id, principal.UserID, req.DepartmentID, req.Severity)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": issue})
}

func (h ModerationHandler) Reject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseHeadIDFromPathWithSuffix(r.URL.Path, "/api/v1/head/issues/", "/reject")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	var req rejectIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	issue, err := h.Moderation.Reject(r.Context(), id, principal.UserID, req.Reason)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": issue})
}

func (h ModerationHandler) Close(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	id, err := parseHeadIDFromPathWithSuffix(r.URL.Path, "/api/v1/head/issues/", "/close")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	issue, err := h.Moderation.Close(r.Context(), id, principal.UserID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{"item": issue})
}

func (h ModerationHandler) IssueRoutes(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/approve") {
		h.Approve(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/reject") {
		h.Reject(w, r)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/close") {
		h.Close(w, r)
		return
	}
	response.WriteError(w, r, errx.New("NOT_FOUND", "not found", http.StatusNotFound))
}

func parseHeadIDFromPathWithSuffix(path, prefix, suffix string) (primitive.ObjectID, error) {
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
