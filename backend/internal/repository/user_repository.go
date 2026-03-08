package repository

import (
	"context"

	"civic/internal/domain"
)

type UserRepository interface {
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id string) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	UpdateProfile(ctx context.Context, id, name, email string) error
	UpdatePassword(ctx context.Context, id, passwordHash string) error
	DeleteByID(ctx context.Context, id string) error
	BackfillAuthoritySubRole(ctx context.Context, subRole domain.AuthoritySubRole) (int64, error)
}
