package https

import (
	"net/http"
	"time"
	"strings"

	"civic/internal/https/handlers"
	"civic/internal/https/middleware"
)

type RouterConfig struct {
	RequestIDHeader string
	AuthHandler     handlers.AuthHandler
	AuthMiddleware  func(http.Handler) http.Handler
}

func NewRouter(cfg RouterConfig) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/healthz", handlers.HealthHandler{AppName: "civicconnect"})

	loginLimiter := middleware.NewRateLimiter(10, time.Minute)
	loginKey := func(r *http.Request) string {
    	return strings.Split(r.RemoteAddr, ":")[0]
	}

	mux.Handle("/api/v1/auth/register", http.HandlerFunc(cfg.AuthHandler.Register))
	mux.Handle("/api/v1/auth/login", loginLimiter.Middleware(loginKey)(http.HandlerFunc(cfg.AuthHandler.Login)))
	mux.Handle("/api/v1/me", cfg.AuthMiddleware(http.HandlerFunc(cfg.AuthHandler.Me)))

	var handler http.Handler = mux
	handler = middleware.RequestID(cfg.RequestIDHeader)(handler)
	handler = middleware.RequestLogger(handler)

	return handler
}
