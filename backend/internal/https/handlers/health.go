package handlers

import (
	"net/http"

	"civic/internal/https/response"
)

type HealthHandler struct {
	AppName string
}

func (h HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	response.WriteJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
		"app":    h.AppName,
	})
}
