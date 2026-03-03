package repository

import (
	"context"
	"time"

	"civic/internal/domain"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type IssueRepository interface {
	EnsureIndexes(ctx context.Context) error
	FindNearbyActive(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus) (*domain.Issue, error)
	Create(ctx context.Context, issue *domain.Issue) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Issue, error)
	ListPublicNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error)
	ListCitizenNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, userID string, publicStatuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error)
	ListPending(ctx context.Context, limit int64) ([]*domain.Issue, error)
	ApproveIssue(ctx context.Context, id primitive.ObjectID, adminID, departmentID, severity string, reviewedAt time.Time) error
	RejectIssue(ctx context.Context, id primitive.ObjectID, adminID, reason string, reviewedAt time.Time) error
	AddSupporter(ctx context.Context, id primitive.ObjectID, userID string, allowedStatuses []domain.IssueStatus) (bool, error)
	MarkMerged(ctx context.Context, id, canonicalID primitive.ObjectID) error
}
