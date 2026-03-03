package repository

import (
	"context"
	"strings"
	"sync"

	"civic/internal/domain"
)

type MemoryUserRepository struct {
	mu      sync.RWMutex
	byID    map[string]*domain.User
	byEmail map[string]*domain.User
}

func NewMemoryUserRepository() *MemoryUserRepository {
	return &MemoryUserRepository{
		byID:    make(map[string]*domain.User),
		byEmail: make(map[string]*domain.User),
	}
}

func (r *MemoryUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	_ = ctx
	key := strings.ToLower(strings.TrimSpace(email))
	if key == "" {
		return nil, ErrNotFound
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	user, ok := r.byEmail[key]
	if !ok {
		return nil, ErrNotFound
	}
	copy := *user
	return &copy, nil
}

func (r *MemoryUserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	_ = ctx
	r.mu.RLock()
	defer r.mu.RUnlock()
	user, ok := r.byID[id]
	if !ok {
		return nil, ErrNotFound
	}
	copy := *user
	return &copy, nil
}

func (r *MemoryUserRepository) Create(ctx context.Context, user *domain.User) error {
	_ = ctx
	if user == nil {
		return nil
	}
	key := strings.ToLower(strings.TrimSpace(user.Email))

	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.byEmail[key]; exists {
		return ErrAlreadyExists
	}
	copy := *user
	r.byID[user.ID] = &copy
	r.byEmail[key] = &copy
	return nil
}
