package middleware

import (
	"context"
	"net/http"
	"strings"

	"civic/internal/errx"
	"civic/internal/https/response"
	"civic/internal/repository"
	"civic/internal/util/jwt"
)

const principalKey ctxKey = "principal"

type Principal struct {
	UserID           string
	Role             string
	AuthoritySubRole string
	DepartmentID     string
}

func Auth(jwtManager *jwt.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing token", http.StatusUnauthorized))
				return
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "invalid token", http.StatusUnauthorized))
				return
			}

			claims, err := jwtManager.Parse(parts[1])
			if err != nil {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "invalid token", http.StatusUnauthorized))
				return
			}

			p := Principal{
				UserID:           claims.UserID,
				Role:             claims.Role,
				AuthoritySubRole: claims.AuthoritySubRole,
				DepartmentID:     claims.DepartmentID,
			}
			ctx := WithPrincipal(r.Context(), p)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AuthHydrated validates the JWT signature but hydrates the principal's role/department
// from the current user record in the DB. This prevents stale JWT claims (e.g. after
// manual DB edits during development) from causing incorrect authorization/scoping.
func AuthHydrated(jwtManager *jwt.Manager, users repository.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing token", http.StatusUnauthorized))
				return
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "invalid token", http.StatusUnauthorized))
				return
			}

			claims, err := jwtManager.Parse(parts[1])
			if err != nil {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "invalid token", http.StatusUnauthorized))
				return
			}

			user, err := users.GetByID(r.Context(), claims.UserID)
			if err != nil {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "invalid token", http.StatusUnauthorized))
				return
			}
			if user.Blocked {
				response.WriteError(w, r, errx.New("BLOCKED_USER", "user is blocked", http.StatusForbidden))
				return
			}

			p := Principal{
				UserID:           user.ID,
				Role:             string(user.Role),
				AuthoritySubRole: string(user.AuthoritySubRole),
				DepartmentID:     user.DepartmentID,
			}
			ctx := WithPrincipal(r.Context(), p)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func WithPrincipal(ctx context.Context, principal Principal) context.Context {
	return context.WithValue(ctx, principalKey, principal)
}

func GetPrincipal(ctx context.Context) (Principal, bool) {
	if ctx == nil {
		return Principal{}, false
	}
	p, ok := ctx.Value(principalKey).(Principal)
	return p, ok
}
