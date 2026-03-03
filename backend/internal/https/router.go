package https

import (
	"net/http"

	"civic/internal/https/handlers"
	"civic/internal/https/middleware"
)

type RouterConfig struct {
	RequestIDHeader string
}

func NewRouter(cfg RouterConfig) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/healthz", handlers.HealthHandler{AppName: "civicconnect"})

	var handler http.Handler = mux
	handler = middleware.RequestID(cfg.RequestIDHeader)(handler)
	handler = middleware.RequestLogger(handler)

	return handler
}
