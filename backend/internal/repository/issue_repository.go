package repository

import (
	"context"
	"time"

	"civic/internal/domain"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type IssueRepository interface {
	EnsureIndexes(ctx context.Context) error
	FindNearbyActive(ctx context.Context, location domain.GeoPoint, departmentID string, radiusMeters int64, statuses []domain.IssueStatus) (*domain.Issue, error)
	Create(ctx context.Context, issue *domain.Issue) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Issue, error)
	ListPublicNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, limit int64, offset int64, filters PublicIssueFilters) ([]*domain.Issue, error)
	StatsPublicNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, filters PublicIssueFilters) (PublicIssueStats, error)
	ListCitizenNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, userID string, publicStatuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error)
	ListAuthorityByDepartment(ctx context.Context, departmentID, authorityID string, statuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error)
	ListPending(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error)
	ApproveIssue(ctx context.Context, id primitive.ObjectID, adminID, departmentID, severity, workerID string, reviewedAt time.Time) error
	RejectIssue(ctx context.Context, id primitive.ObjectID, adminID, departmentID, reason string, reviewedAt time.Time) error
	AssignIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID string, assignedAt time.Time) error
	StartIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID string, startedAt time.Time, deadlineAt *time.Time) error
	ResolveIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID, notes string, resolutionImageURLs []string, resolvedAt time.Time) error
	ConfirmResolution(ctx context.Context, id primitive.ObjectID, reporterID string, confirmedAt time.Time) error
	CloseIssue(ctx context.Context, id primitive.ObjectID, departmentID string, closedAt time.Time) error
	AddSupporter(ctx context.Context, id primitive.ObjectID, userID string, allowedStatuses []domain.IssueStatus) (bool, error)
	DeleteByIDAndReporter(ctx context.Context, id primitive.ObjectID, reporterID string) error
	MarkMerged(ctx context.Context, id, canonicalID primitive.ObjectID) error
	UpdatePriorityScore(ctx context.Context, id primitive.ObjectID, score float64, updatedAt time.Time) error
	AdjustFlagsCount(ctx context.Context, id primitive.ObjectID, delta int, updatedAt time.Time) error
	ListFlagged(ctx context.Context, limit int64) ([]*domain.Issue, error)
	ListEscalated(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error)
	ListDeadlineOverdueActive(ctx context.Context, now time.Time, limit int64) ([]*domain.Issue, error)
	AutoTransitionResolvedToAwaitingHeadClose(ctx context.Context, resolvedBefore time.Time, transitionedAt time.Time, limit int64) (int64, error)
	UpdateEscalation(ctx context.Context, id primitive.ObjectID, violation bool, level int, stage string, escalatedAt *time.Time, updatedAt time.Time) error
	ResolveEscalation(ctx context.Context, id primitive.ObjectID, updatedAt time.Time) error
	ReassignWorker(ctx context.Context, id primitive.ObjectID, departmentID, workerID string, updatedAt time.Time) error
	EscalateByHead(ctx context.Context, id primitive.ObjectID, departmentID, reason string, escalatedAt time.Time) error
	ReassignDepartment(ctx context.Context, id primitive.ObjectID, newDepartmentID, reason string, updatedAt time.Time) error
	MarkNotifiedHead(ctx context.Context, id primitive.ObjectID, actorID string, notifiedAt time.Time) error
	CountByDepartment(ctx context.Context, departmentID string, statuses []domain.IssueStatus) (int64, error)
}

type PublicIssueFilters struct {
	Severities []string
	Categories []string
	DateFrom   *time.Time
	DateTo     *time.Time
}

type PublicIssueStats struct {
	Total            int64
	PendingApprovals int64
	InProgress       int64
	Resolved         int64
}
