package service

import (
	"context"
	"strings"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
)

type UserAdminService struct {
	users repository.UserRepository
}

type WorkerUpdateInput struct {
	Name    string
	Email   string
	Blocked *bool
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

func (s *UserAdminService) ListWorkersByDepartment(ctx context.Context, departmentID string, includeBlocked bool, limit int64) ([]*domain.User, error) {
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "department id is required", 400)
	}
	workers, err := s.users.ListWorkersByDepartment(ctx, departmentID, includeBlocked, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list workers", 500)
	}
	return workers, nil
}

func (s *UserAdminService) UpdateWorker(ctx context.Context, workerID, departmentID string, input WorkerUpdateInput) error {
	workerID = strings.TrimSpace(workerID)
	departmentID = strings.TrimSpace(departmentID)
	if workerID == "" || departmentID == "" {
		return errx.New("INVALID_INPUT", "worker id and department id are required", 400)
	}
	if err := s.users.UpdateWorker(ctx, workerID, departmentID, input.Name, input.Email, input.Blocked); err != nil {
		if err == repository.ErrNotFound {
			return errx.New("NOT_FOUND", "worker not found", 404)
		}
		if err == repository.ErrAlreadyExists {
			return errx.New("ALREADY_EXISTS", "email already exists", 409)
		}
		return errx.New("INTERNAL_ERROR", "could not update worker", 500)
	}
	return nil
}

func (s *UserAdminService) DeleteWorker(ctx context.Context, workerID, departmentID string) error {
	workerID = strings.TrimSpace(workerID)
	departmentID = strings.TrimSpace(departmentID)
	if workerID == "" || departmentID == "" {
		return errx.New("INVALID_INPUT", "worker id and department id are required", 400)
	}
	if err := s.users.DeleteWorker(ctx, workerID, departmentID); err != nil {
		if err == repository.ErrNotFound {
			return errx.New("NOT_FOUND", "worker not found", 404)
		}
		return errx.New("INTERNAL_ERROR", "could not delete worker", 500)
	}
	return nil
}
