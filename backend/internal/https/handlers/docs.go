package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"civic/internal/errx"
	"civic/internal/https/response"
)

type DocsHandler struct {
	openAPICandidates []string
	swaggerCandidates []string
}

func NewDocsHandler() DocsHandler {
	return DocsHandler{
		openAPICandidates: []string{
			"openapi.yaml",
			filepath.Join("..", "openapi.yaml"),
			filepath.Join("..", "..", "openapi.yaml"),
		},
		swaggerCandidates: []string{
			filepath.Join("docs", "swagger-ui.html"),
			filepath.Join("..", "docs", "swagger-ui.html"),
			filepath.Join("..", "..", "docs", "swagger-ui.html"),
		},
	}
}

func (h DocsHandler) OpenAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	path, ok := firstExistingFile(h.openAPICandidates)
	if !ok {
		response.WriteError(w, r, errx.New("NOT_FOUND", "openapi.yaml not found", http.StatusNotFound))
		return
	}

	w.Header().Set("Content-Type", "application/yaml")
	http.ServeFile(w, r, path)
}

func (h DocsHandler) SwaggerUI(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.WriteError(w, r, errx.New("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}

	path, ok := firstExistingFile(h.swaggerCandidates)
	if !ok {
		response.WriteError(w, r, errx.New("NOT_FOUND", "swagger-ui.html not found", http.StatusNotFound))
		return
	}

	http.ServeFile(w, r, path)
}

func firstExistingFile(candidates []string) (string, bool) {
	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		if _, err := os.Stat(candidate); err == nil {
			return candidate, true
		}
	}
	return "", false
}
