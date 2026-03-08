package handlers

import (
	"net/http"

	"civic/internal/errx"
	"civic/internal/https/response"
	"civic/internal/service"
)

type UploadHandler struct {
	Uploads *service.ImageUploadService
}

func (h UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	if h.Uploads == nil {
		response.WriteError(w, r, errx.New("NOT_IMPLEMENTED", "upload service is not configured", http.StatusNotImplemented))
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, h.Uploads.MaxBytes()+1024)
	if err := r.ParseMultipartForm(h.Uploads.MaxBytes() + 1024); err != nil {
		response.WriteError(w, r, errx.New("PAYLOAD_TOO_LARGE", "file exceeds upload size limit", http.StatusRequestEntityTooLarge))
		return
	}
	_ = r.FormValue("context")

	file, header, err := r.FormFile("file")
	if err != nil {
		response.WriteError(w, r, errx.New("INVALID_INPUT", "file is required", http.StatusBadRequest))
		return
	}
	defer file.Close()

	asset, err := h.Uploads.Upload(r.Context(), file, header.Filename, header.Header.Get("Content-Type"))
	if err != nil {
		response.WriteError(w, r, err)
		return
	}

	response.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"asset": asset,
	})
}
