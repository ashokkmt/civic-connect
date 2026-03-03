package handlers

import (
	"encoding/json"
	"net/http"

	"civic/internal/errx"
	"civic/internal/https/response"
	"civic/internal/service"
)

type AdminHandler struct {
	Departments *service.DepartmentService
	Provision   *service.AdminProvisioningService
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
