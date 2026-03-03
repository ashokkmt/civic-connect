package response

import (
	"encoding/json"
	"net/http"

	"civic/internal/errx"
)

type Envelope struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ErrBody    `json:"error,omitempty"`
	RequestID string      `json:"requestId,omitempty"`
}

type ErrBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	resp := Envelope{Success: true, Data: data}
	write(w, status, resp)
}

func WriteError(w http.ResponseWriter, r *http.Request, err error) {
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	message := "internal error"

	if appErr, ok := err.(*errx.Error); ok {
		status = appErr.Status
		code = appErr.Code
		message = appErr.Message
	}

	resp := Envelope{
		Success: false,
		Error: &ErrBody{
			Code:    code,
			Message: message,
		},
	}
	write(w, status, resp)
}

func write(w http.ResponseWriter, status int, payload Envelope) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
