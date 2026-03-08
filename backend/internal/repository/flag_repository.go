package repository

import (
	"context"
	"time"

	"civic/internal/domain"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FlagRepository interface {
	EnsureIndexes(ctx context.Context) error
	Create(ctx context.Context, flag *domain.IssueFlag) error
	ListOpen(ctx context.Context, limit int64) ([]*domain.IssueFlag, error)
	Resolve(ctx context.Context, id primitive.ObjectID, resolverID, resolution string, resolvedAt time.Time) (*domain.IssueFlag, error)
}
