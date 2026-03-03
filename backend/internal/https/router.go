package https

import (
	"net/http"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/https/handlers"
	"civic/internal/https/middleware"
)

type RouterConfig struct {
	RequestIDHeader string
	AuthHandler     handlers.AuthHandler
	AuthMiddleware  func(http.Handler) http.Handler
	IssueHandler    handlers.IssueHandler
	Moderation      handlers.ModerationHandler
	AdminHandler    handlers.AdminHandler
}

func NewRouter(cfg RouterConfig) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/healthz", handlers.HealthHandler{AppName: "civic-connect"})

	loginLimiter := middleware.NewRateLimiter(10, time.Minute)
	loginKey := func(r *http.Request) string {
		return strings.Split(r.RemoteAddr, ":")[0]
	}
	adminRegLimiter := middleware.NewRateLimiter(5, time.Minute)
	adminRegKey := loginKey

	mux.Handle("/api/v1/auth/register", http.HandlerFunc(cfg.AuthHandler.Register))
	mux.Handle("/api/v1/auth/register-admin", adminRegLimiter.Middleware(adminRegKey)(http.HandlerFunc(cfg.AuthHandler.RegisterAdmin)))
	mux.Handle("/api/v1/auth/login", loginLimiter.Middleware(loginKey)(http.HandlerFunc(cfg.AuthHandler.Login)))
	mux.Handle("/api/v1/me", cfg.AuthMiddleware(http.HandlerFunc(cfg.AuthHandler.Me)))

	citizenOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(middleware.RequireRole(string(domain.RoleCitizen))(h))
	}
	adminOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(middleware.RequireRole(string(domain.RoleAdmin))(h))
	}

	mux.Handle("/api/v1/issues", http.HandlerFunc(cfg.IssueHandler.ListPublic))
	mux.Handle("/api/v1/issues/", http.HandlerFunc(cfg.IssueHandler.GetPublic))
	mux.Handle("/api/v1/citizen/issues", citizenOnly(http.HandlerFunc(cfg.IssueHandler.CitizenIssues)))
	mux.Handle("/api/v1/citizen/issues/", citizenOnly(http.HandlerFunc(cfg.IssueHandler.CitizenIssueRoutes)))

	mux.Handle("/api/v1/admin/issues/pending", adminOnly(http.HandlerFunc(cfg.Moderation.ListPending)))
	mux.Handle("/api/v1/admin/issues/", adminOnly(http.HandlerFunc(cfg.Moderation.IssueRoutes)))
	mux.Handle("/api/v1/admin/departments", adminOnly(http.HandlerFunc(cfg.AdminHandler.CreateDepartment)))
	mux.Handle("/api/v1/admin/authorities", adminOnly(http.HandlerFunc(cfg.AdminHandler.RegisterAuthority)))

	var handler http.Handler = mux
	handler = middleware.RequestID(cfg.RequestIDHeader)(handler)
	handler = middleware.RequestLogger(handler)

	return handler
}
