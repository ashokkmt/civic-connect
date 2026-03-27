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
	Authority       handlers.AuthorityHandler
	HeadHandler     handlers.HeadHandler
	UploadHandler   handlers.UploadHandler
}

func NewRouter(cfg RouterConfig) http.Handler {
	mux := http.NewServeMux()
	docs := handlers.NewDocsHandler()

	mux.Handle("/healthz", handlers.HealthHandler{AppName: "civic-connect"})
	mux.Handle("/openapi.yaml", http.HandlerFunc(docs.OpenAPI))
	mux.Handle("/api-docs", http.HandlerFunc(docs.SwaggerUI))

	loginLimiter := middleware.NewRateLimiter(10, time.Minute)
	loginKey := func(r *http.Request) string {
		return strings.Split(r.RemoteAddr, ":")[0]
	}
	adminRegLimiter := middleware.NewRateLimiter(5, time.Minute)
	adminRegKey := loginKey
	submissionLimiter := middleware.NewRateLimiter(20, time.Minute)
	uploadLimiter := middleware.NewRateLimiter(20, time.Minute)
	submissionKey := func(r *http.Request) string {
		if p, ok := middleware.GetPrincipal(r.Context()); ok && strings.TrimSpace(p.UserID) != "" {
			return "user:" + p.UserID
		}
		return "ip:" + strings.Split(r.RemoteAddr, ":")[0]
	}
	uploadKey := submissionKey

	mux.Handle("/api/v1/auth/register", http.HandlerFunc(cfg.AuthHandler.Register))
	mux.Handle("/api/v1/auth/register-admin", adminRegLimiter.Middleware(adminRegKey)(http.HandlerFunc(cfg.AuthHandler.RegisterAdmin)))
	mux.Handle("/api/v1/auth/login", loginLimiter.Middleware(loginKey)(http.HandlerFunc(cfg.AuthHandler.Login)))
	mux.Handle("/api/v1/me", cfg.AuthMiddleware(http.HandlerFunc(cfg.AuthHandler.MeRoutes)))

	citizenOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(middleware.RequireRole(string(domain.RoleCitizen))(h))
	}
	adminOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(middleware.RequireRole(string(domain.RoleAdmin))(h))
	}
	authorityOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(middleware.RequireRole(string(domain.RoleAuthority))(h))
	}
	headOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(middleware.RequireAuthorityHead()(h))
	}
	authOnly := func(h http.Handler) http.Handler {
		return cfg.AuthMiddleware(h)
	}

	mux.Handle("/api/v1/issues", http.HandlerFunc(cfg.IssueHandler.ListPublic))
	mux.Handle("/api/v1/issues/stats", http.HandlerFunc(cfg.IssueHandler.PublicStats))
	mux.Handle("/api/v1/issues/", http.HandlerFunc(cfg.IssueHandler.GetPublic))
	mux.Handle("/api/v1/departments", authOnly(http.HandlerFunc(cfg.AdminHandler.ListDepartments)))
	mux.Handle("/api/v1/citizen/issues", citizenOnly(submissionLimiter.MiddlewareForMethods(submissionKey, http.MethodPost)(http.HandlerFunc(cfg.IssueHandler.CitizenIssues))))
	mux.Handle("/api/v1/citizen/issues/", citizenOnly(submissionLimiter.MiddlewareForMethods(submissionKey, http.MethodPost)(http.HandlerFunc(cfg.IssueHandler.CitizenIssueRoutes))))
	mux.Handle("/api/v1/uploads/images", authOnly(uploadLimiter.MiddlewareForMethods(uploadKey, http.MethodPost)(http.HandlerFunc(cfg.UploadHandler.UploadImage))))

	mux.Handle("/api/v1/head/issues/pending", headOnly(http.HandlerFunc(cfg.Moderation.ListPending)))
	mux.Handle("/api/v1/head/issues/escalations", headOnly(http.HandlerFunc(cfg.Moderation.ListEscalations)))
	mux.Handle("/api/v1/head/issues/", headOnly(http.HandlerFunc(cfg.Moderation.IssueRoutes)))
	mux.Handle("/api/v1/head/workers", headOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			cfg.HeadHandler.RegisterWorker(w, r)
		case http.MethodGet:
			cfg.HeadHandler.ListWorkers(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})))
	mux.Handle("/api/v1/head/workers/", headOnly(http.HandlerFunc(cfg.HeadHandler.WorkerRoutes)))
	mux.Handle("/api/v1/admin/departments", adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			cfg.AdminHandler.CreateDepartment(w, r)
		case http.MethodGet:
			cfg.AdminHandler.ListDepartments(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})))
	mux.Handle("/api/v1/admin/departments/metrics", adminOnly(http.HandlerFunc(cfg.AdminHandler.DepartmentsMetrics)))
	mux.Handle("/api/v1/admin/authorities", adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			cfg.AdminHandler.RegisterAuthority(w, r)
		case http.MethodGet:
			cfg.AdminHandler.ListAuthorities(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})))
	mux.Handle("/api/v1/admin/issues/flagged", adminOnly(http.HandlerFunc(cfg.AdminHandler.ListFlagged)))
	mux.Handle("/api/v1/admin/issues/escalations", adminOnly(http.HandlerFunc(cfg.AdminHandler.ListEscalations)))
	mux.Handle("/api/v1/admin/issues/", adminOnly(http.HandlerFunc(cfg.AdminHandler.IssueRoutes)))
	mux.Handle("/api/v1/admin/flags/", adminOnly(http.HandlerFunc(cfg.AdminHandler.FlagRoutes)))
	mux.Handle("/api/v1/admin/users/", adminOnly(http.HandlerFunc(cfg.AdminHandler.UserRoutes)))
	mux.Handle("/api/v1/head/authorities", headOnly(http.HandlerFunc(cfg.HeadHandler.RegisterWorker)))

	mux.Handle("/api/v1/authority/issues", authorityOnly(http.HandlerFunc(cfg.Authority.List)))
	mux.Handle("/api/v1/authority/issues/", authorityOnly(http.HandlerFunc(cfg.Authority.IssueRoutes)))

	var handler http.Handler = mux
	handler = middleware.RequestID(cfg.RequestIDHeader)(handler)
	handler = middleware.RequestLogger(handler)

	return handler
}
