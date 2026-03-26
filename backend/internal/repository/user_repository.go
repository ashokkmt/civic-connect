package repository

import (
	"context"

	"civic/internal/domain"
)

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id string) (*domain.User, error)
	ListAuthorityHeads(ctx context.Context, limit int64) ([]*domain.User, error)
	ListWorkersByDepartment(ctx context.Context, departmentID string, includeBlocked bool, limit int64) ([]*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	UpdateProfile(ctx context.Context, id, name, email string) error
	UpdateWorker(ctx context.Context, id, departmentID, name, email string, blocked *bool) error
	UpdatePassword(ctx context.Context, id, passwordHash string) error
	SetBlocked(ctx context.Context, id string, blocked bool) error
	DeleteWorker(ctx context.Context, id, departmentID string) error
	DeleteByID(ctx context.Context, id string) error
	BackfillAuthoritySubRole(ctx context.Context, subRole domain.AuthoritySubRole) (int64, error)
}
