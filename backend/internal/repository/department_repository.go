package repository

import (
	"context"

	"civic/internal/domain"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type DepartmentRepository interface {
	GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Department, error)
	Create(ctx context.Context, dept *domain.Department) error
}
