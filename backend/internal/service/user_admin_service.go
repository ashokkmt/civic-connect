package service

import (
	"context"
	"strings"

	"civic/internal/errx"
	"civic/internal/repository"
)

type UserAdminService struct {
	users repository.UserRepository
}

func NewUserAdminService(users repository.UserRepository) *UserAdminService {
	return &UserAdminService{users: users}
}

func (s *UserAdminService) SetBlocked(ctx context.Context, userID string, blocked bool) error {
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return errx.New("INVALID_INPUT", "user id is required", 400)
	}

	if err := s.users.SetBlocked(ctx, userID, blocked); err != nil {
		if err == repository.ErrNotFound {
			return errx.New("NOT_FOUND", "user not found", 404)
		}
		return errx.New("INTERNAL_ERROR", "could not update user block status", 500)
	}
	return nil
}
