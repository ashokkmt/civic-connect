package service

import (
	"context"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
	"civic/internal/util/geo"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	clusterRadiusMeters       int64 = 50
	publicDefaultLimit        int64 = 100
	publicDefaultRadiusMeters int64 = 2000
)

type IssueService struct {
	issues repository.IssueRepository
}

type IssueCreateInput struct {
	Title       string
	Description string
	ImageURLs   []string
	Lat         float64
	Lng         float64
	UserID      string
}

type IssueCreateResult struct {
	Created           bool
	Issue             *domain.Issue
	MergedIntoIssueID *primitive.ObjectID
	SupporterAdded    bool
}

func NewIssueService(issues repository.IssueRepository) *IssueService {
	return &IssueService{issues: issues}
}

func (s *IssueService) CreateOrMergeIssue(ctx context.Context, input IssueCreateInput) (*IssueCreateResult, error) {
	title := strings.TrimSpace(input.Title)
	description := strings.TrimSpace(input.Description)
	if title == "" || description == "" {
		return nil, errx.New("INVALID_INPUT", "title and description are required", 400)
	}
	if !geo.ValidateCoordinates(input.Lat, input.Lng) {
		return nil, errx.New("INVALID_INPUT", "invalid coordinates", 400)
	}
	if strings.TrimSpace(input.UserID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing user", 401)
	}

	location := domain.GeoPoint{Type: "Point", Coordinates: [2]float64{input.Lng, input.Lat}}
	active := activeClusteringStatuses()

	nearby, err := s.issues.FindNearbyActive(ctx, location, clusterRadiusMeters, active)
	if err == nil && nearby != nil {
		added, err := s.issues.AddSupporter(ctx, nearby.ID, input.UserID, active)
		if err != nil {
			return nil, errx.New("INTERNAL_ERROR", "could not add supporter", 500)
		}
		return &IssueCreateResult{
			Created:           false,
			Issue:             nearby,
			MergedIntoIssueID: &nearby.ID,
			SupporterAdded:    added,
		}, nil
	}
	if err != nil && err != repository.ErrNotFound {
		return nil, errx.New("INTERNAL_ERROR", "could not search for duplicates", 500)
	}

	now := time.Now()
	issue := &domain.Issue{
		Title:            title,
		Description:      description,
		ImageURLs:        input.ImageURLs,
		CreatedByUserID:  input.UserID,
		Location:         location,
		Status:           domain.StatusPendingApproval,
		StatusUpdatedAt:  now,
		SupporterUserIDs: []string{input.UserID},
		SupporterCount:   1,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.issues.Create(ctx, issue); err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not create issue", 500)
	}

	nearbyAfter, err := s.issues.FindNearbyActive(ctx, location, clusterRadiusMeters, active)
	if err == nil && nearbyAfter != nil && nearbyAfter.ID != issue.ID {
		added, err := s.issues.AddSupporter(ctx, nearbyAfter.ID, input.UserID, active)
		if err != nil {
			return nil, errx.New("INTERNAL_ERROR", "could not merge supporter", 500)
		}
		_ = s.issues.MarkMerged(ctx, issue.ID, nearbyAfter.ID)
		return &IssueCreateResult{
			Created:           false,
			Issue:             nearbyAfter,
			MergedIntoIssueID: &nearbyAfter.ID,
			SupporterAdded:    added,
		}, nil
	}

	return &IssueCreateResult{Created: true, Issue: issue, SupporterAdded: true}, nil
}

func (s *IssueService) SupportIssue(ctx context.Context, id primitive.ObjectID, userID string) (*domain.Issue, bool, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, false, errx.New("UNAUTHORIZED", "missing user", 401)
	}

	active := activeSupportStatuses()
	added, err := s.issues.AddSupporter(ctx, id, userID, active)
	if err != nil {
		return nil, false, errx.New("INTERNAL_ERROR", "could not add supporter", 500)
	}
	if !added {
		issue, err := s.issues.GetByID(ctx, id)
		if err != nil {
			return nil, false, errx.New("NOT_FOUND", "issue not found", 404)
		}
		if issue.Status != domain.StatusPendingApproval && issue.Status != domain.StatusApproved && issue.Status != domain.StatusAssigned && issue.Status != domain.StatusInProgress {
			return nil, false, errx.New("FORBIDDEN", "issue not eligible for support", 403)
		}
		return nil, false, errx.New("DUPLICATE_SUPPORT", "support already exists", 409)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, false, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return issue, true, nil
}

func (s *IssueService) GetPublicByID(ctx context.Context, id primitive.ObjectID) (*domain.Issue, error) {
	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.IsMerged || !isPublicStatus(issue.Status) {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return issue, nil
}

func (s *IssueService) GetCitizenByID(ctx context.Context, id primitive.ObjectID, userID string) (*domain.Issue, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing user", 401)
	}
	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.IsMerged {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status == domain.StatusPendingApproval {
		if issue.CreatedByUserID != userID {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return issue, nil
	}
	if !isPublicStatus(issue.Status) {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return issue, nil
}

func (s *IssueService) ListPublicNearby(ctx context.Context, lat, lng float64, radiusMeters int64, limit int64) ([]*domain.Issue, error) {
	if !geo.ValidateCoordinates(lat, lng) {
		return nil, errx.New("INVALID_INPUT", "invalid coordinates", 400)
	}
	if radiusMeters <= 0 {
		radiusMeters = publicDefaultRadiusMeters
	}
	if limit <= 0 {
		limit = publicDefaultLimit
	}

	location := domain.GeoPoint{Type: "Point", Coordinates: [2]float64{lng, lat}}
	issues, err := s.issues.ListPublicNearby(ctx, location, radiusMeters, publicStatuses(), limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list issues", 500)
	}
	return issues, nil
}

func (s *IssueService) ListCitizenNearby(ctx context.Context, userID string, lat, lng float64, radiusMeters int64, limit int64) ([]*domain.Issue, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing user", 401)
	}
	if !geo.ValidateCoordinates(lat, lng) {
		return nil, errx.New("INVALID_INPUT", "invalid coordinates", 400)
	}
	if radiusMeters <= 0 {
		radiusMeters = publicDefaultRadiusMeters
	}
	if limit <= 0 {
		limit = publicDefaultLimit
	}

	location := domain.GeoPoint{Type: "Point", Coordinates: [2]float64{lng, lat}}
	issues, err := s.issues.ListCitizenNearby(ctx, location, radiusMeters, userID, publicStatuses(), limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list issues", 500)
	}
	return issues, nil
}

func (s *IssueService) ConfirmResolution(ctx context.Context, id primitive.ObjectID, userID string) (*domain.Issue, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing user", 401)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.IsMerged || issue.CreatedByUserID != userID {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusResolved {
		return nil, errx.New("INVALID_TRANSITION", "issue not resolved", 409)
	}

	if err := s.issues.ConfirmResolution(ctx, id, userID, time.Now()); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not confirm resolution", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return updated, nil
}

func activeClusteringStatuses() []domain.IssueStatus {
	return []domain.IssueStatus{
		domain.StatusPendingApproval,
		domain.StatusApproved,
		domain.StatusAssigned,
		domain.StatusInProgress,
	}
}

func activeSupportStatuses() []domain.IssueStatus {
	return []domain.IssueStatus{
		domain.StatusPendingApproval,
		domain.StatusApproved,
		domain.StatusAssigned,
		domain.StatusInProgress,
	}
}

func publicStatuses() []domain.IssueStatus {
	return []domain.IssueStatus{
		domain.StatusApproved,
		domain.StatusAssigned,
		domain.StatusInProgress,
		domain.StatusResolved,
		domain.StatusAwaitingAdminClose,
		domain.StatusClosed,
	}
}

func isPublicStatus(status domain.IssueStatus) bool {
	for _, s := range publicStatuses() {
		if s == status {
			return true
		}
	}
	return false
}
