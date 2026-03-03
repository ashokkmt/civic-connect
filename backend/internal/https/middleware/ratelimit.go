package middleware

import (
	"net/http"
	"sync"
	"time"

	"civic/internal/errx"
	"civic/internal/https/response"
)

type rateEntry struct {
	count int
	reset time.Time
}

type RateLimiter struct {
	mu     sync.Mutex
	max    int
	window time.Duration
	items  map[string]*rateEntry
}

func NewRateLimiter(max int, window time.Duration) *RateLimiter {
	return &RateLimiter{max: max, window: window, items: make(map[string]*rateEntry)}
}

func (rl *RateLimiter) Middleware(keyFunc func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := keyFunc(r)
			now := time.Now()

			rl.mu.Lock()
			entry, ok := rl.items[key]
			if !ok || now.After(entry.reset) {
				entry = &rateEntry{count: 0, reset: now.Add(rl.window)}
				rl.items[key] = entry
			}
			entry.count++
			over := entry.count > rl.max
			rl.mu.Unlock()

			if over {
				response.WriteError(w, r, errx.New("RATE_LIMITED", "rate limit exceeded", http.StatusTooManyRequests))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
