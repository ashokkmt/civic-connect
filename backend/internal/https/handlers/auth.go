package handlers

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"strings"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/https/middleware"
	"civic/internal/https/response"
	"civic/internal/service"
)

type AuthHandler struct {
	Auth                    *service.AuthService
	AdminRegistrationSecret string
}

type registerRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	Role         string `json:"role"`
	DepartmentID string `json:"departmentId"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type updateProfileRequest struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

type deleteAccountRequest struct {
	Password string `json:"password"`
}

func (h AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	// Citizen self-registration only: ignore requested role/department.
	result, err := h.Auth.Register(r.Context(), req.Email, req.Password, domain.RoleCitizen, "")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"token": result.Token,
		"user":  result.User,
	})
}

type registerAdminRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	AdminSecret string `json:"adminSecret"`
}

func (h AuthHandler) RegisterAdmin(w http.ResponseWriter, r *http.Request) {
	if strings.TrimSpace(h.AdminRegistrationSecret) == "" {
		response.WriteError(w, r, errx.New("FORBIDDEN", "admin registration is disabled", http.StatusForbidden))
		return
	}

	var req registerAdminRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	secret := strings.TrimSpace(req.AdminSecret)
	expected := strings.TrimSpace(h.AdminRegistrationSecret)
	if secret == "" || expected == "" || subtle.ConstantTimeCompare([]byte(secret), []byte(expected)) != 1 {
		response.WriteError(w, r, errx.New("FORBIDDEN", "invalid admin secret", http.StatusForbidden))
		return
	}
	if len(req.Password) < 12 {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "admin password must be at least 12 characters", http.StatusBadRequest))
		return
	}

	result, err := h.Auth.Register(r.Context(), req.Email, req.Password, domain.RoleAdmin, "")
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"token": result.Token,
		"user":  result.User,
	})
}

func (h AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	result, err := h.Auth.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"token": result.Token,
		"user":  result.User,
	})
}

func (h AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	user, err := h.Auth.GetByID(r.Context(), principal.UserID)
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

func (h AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	var req updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	updated, err := h.Auth.UpdateProfile(r.Context(), principal.UserID, service.ProfileUpdateInput{
		Name:        req.Name,
		Email:       req.Email,
		OldPassword: req.OldPassword,
		NewPassword: req.NewPassword,
	})
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": updated,
	})
}

func (h AuthHandler) DeleteMe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	principal, ok := middleware.GetPrincipal(r.Context())
	if !ok {
		response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
		return
	}

	var req deleteAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "invalid request body", http.StatusBadRequest))
		return
	}

	if err := h.Auth.DeleteAccount(r.Context(), principal.UserID, req.Password); err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"deleted": true,
	})
}

func (h AuthHandler) MeRoutes(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.Me(w, r)
	case http.MethodPatch:
		h.UpdateMe(w, r)
	case http.MethodDelete:
		h.DeleteMe(w, r)
	default:
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
	}
}
