package middleware

import (
	"context"
	"net/http"
	"strings"

	"civic/internal/errx"
	"civic/internal/https/response"
	"civic/internal/util/jwt"
)

const principalKey ctxKey = "principal"

type Principal struct {
	UserID       string
	Role         string
	DepartmentID string
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

			p := Principal{UserID: claims.UserID, Role: claims.Role, DepartmentID: claims.DepartmentID}
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
