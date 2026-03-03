package middleware

import (
	"net/http"

	"civic/internal/errx"
	"civic/internal/https/response"
)

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal, ok := GetPrincipal(r.Context())
			if !ok {
				response.WriteError(w, r, errx.New("UNAUTHORIZED", "missing principal", http.StatusUnauthorized))
				return
			}
			if _, ok := allowed[principal.Role]; !ok {
				response.WriteError(w, r, errx.New("FORBIDDEN", "forbidden", http.StatusForbidden))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
