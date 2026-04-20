package service

import (
	"context"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
	"civic/internal/util/geo"
	"civic/internal/util/priority"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const (
	clusterRadiusMeters       int64 = 50
	publicDefaultLimit        int64 = 100
	publicDefaultRadiusMeters int64 = 2000
)

type IssueService struct {
	issues          repository.IssueRepository
	flags           repository.FlagRepository
	priorityWeights priority.Weights
}

type IssueCreateInput struct {
	Title        string
	Description  string
	ImageURLs    []string
	Lat          float64
	Lng          float64
	UserID       string
	DepartmentID string
}

type IssueCreateResult struct {
	Created           bool
	Issue             *domain.Issue
	MergedIntoIssueID *primitive.ObjectID
	SupporterAdded    bool
}

type PublicIssueFilters struct {
	Statuses   []domain.IssueStatus
	Severities []string
	Categories []string
	DateFrom   *time.Time
	DateTo     *time.Time
}

type PublicIssueQuery struct {
	Lat           float64
	Lng           float64
	RadiusMeters  int64
	Limit         int64
	Offset        int64
	Filters       PublicIssueFilters
	IncludeHidden bool
}

type PublicIssueStats struct {
	Total            int64
	PendingApprovals int64
	InProgress       int64
	Resolved         int64
}

func NewIssueService(issues repository.IssueRepository, weights priority.Weights, flags ...repository.FlagRepository) *IssueService {
	var flagRepo repository.FlagRepository
	if len(flags) > 0 {
		flagRepo = flags[0]
	}
	return &IssueService{issues: issues, flags: flagRepo, priorityWeights: weights}
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
	departmentID := strings.TrimSpace(input.DepartmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if len(input.ImageURLs) == 0 {
		return nil, errx.New("INVALID_INPUT", "imageUrls is required", 400)
	}

	location := domain.GeoPoint{Type: "Point", Coordinates: [2]float64{input.Lng, input.Lat}}
	active := activeClusteringStatuses()

	nearby, err := s.issues.FindNearbyActive(ctx, location, departmentID, clusterRadiusMeters, active)
	if err == nil && nearby != nil {
		added, err := s.issues.AddSupporter(ctx, nearby.ID, input.UserID, active)
		if err != nil {
			return nil, errx.New("INTERNAL_ERROR", "could not add supporter", 500)
		}
		updatedIssue, err := s.issues.GetByID(ctx, nearby.ID)
		if err == nil {
			_ = s.refreshPriority(ctx, updatedIssue, time.Now())
			nearby = updatedIssue
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
		DepartmentID:     departmentID,
		Status:           domain.StatusPendingApproval,
		StatusUpdatedAt:  now,
		SupporterUserIDs: []string{input.UserID},
		SupporterCount:   1,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	issue.PriorityScore = priority.Score(issue, now, s.priorityWeights)
	issue.PriorityUpdatedAt = &now

	if err := s.issues.Create(ctx, issue); err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not create issue", 500)
	}

	nearbyAfter, err := s.issues.FindNearbyActive(ctx, location, departmentID, clusterRadiusMeters, active)
	if err == nil && nearbyAfter != nil && nearbyAfter.ID != issue.ID {
		added, err := s.issues.AddSupporter(ctx, nearbyAfter.ID, input.UserID, active)
		if err != nil {
			return nil, errx.New("INTERNAL_ERROR", "could not merge supporter", 500)
		}
		updatedIssue, err := s.issues.GetByID(ctx, nearbyAfter.ID)
		if err == nil {
			if err := s.refreshPriority(ctx, updatedIssue, now); err == nil {
				nearbyAfter = updatedIssue
			}
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

	if s.flags != nil {
		flagged, err := s.flags.ExistsByIssueAndReporter(ctx, id, userID)
		if err != nil {
			return nil, false, errx.New("INTERNAL_ERROR", "could not verify flag status", 500)
		}
		if flagged {
			return nil, false, errx.New("ACTION_ALREADY_TAKEN", "you already flagged this issue", 409)
		}
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
	_ = s.refreshPriority(ctx, issue, time.Now())
	return issue, true, nil
}

func (s *IssueService) ListByReporter(ctx context.Context, userID string, limit int64) ([]*domain.Issue, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing user", 401)
	}
	if limit <= 0 {
		limit = publicDefaultLimit
	}

	issues, err := s.issues.ListByReporter(ctx, userID, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list reporter issues", 500)
	}
	return issues, nil
}

func (s *IssueService) refreshPriority(ctx context.Context, issue *domain.Issue, now time.Time) error {
	if issue == nil {
		return nil
	}
	newScore := priority.Score(issue, now, s.priorityWeights)
	issue.PriorityScore = newScore
	issue.PriorityUpdatedAt = &now
	if err := s.issues.UpdatePriorityScore(ctx, issue.ID, newScore, now); err != nil {
		return err
	}
	return nil
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
		return issue, nil
	}
	if !isPublicStatus(issue.Status) {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return issue, nil
}

func (s *IssueService) ListPublic(ctx context.Context, query PublicIssueQuery) ([]*domain.Issue, error) {
	if !geo.ValidateCoordinates(query.Lat, query.Lng) {
		return nil, errx.New("INVALID_INPUT", "invalid coordinates", 400)
	}
	if query.RadiusMeters <= 0 {
		query.RadiusMeters = publicDefaultRadiusMeters
	}
	if query.Limit <= 0 {
		query.Limit = publicDefaultLimit
	}

	statuses := filterPublicStatuses(query.Filters.Statuses)
	if len(statuses) == 0 {
		statuses = publicStatuses()
	}

	location := domain.GeoPoint{Type: "Point", Coordinates: [2]float64{query.Lng, query.Lat}}
	issues, err := s.issues.ListPublicNearby(ctx, location, query.RadiusMeters, statuses, query.Limit, query.Offset, repository.PublicIssueFilters{
		Severities: query.Filters.Severities,
		Categories: query.Filters.Categories,
		DateFrom:   query.Filters.DateFrom,
		DateTo:     query.Filters.DateTo,
	})
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list issues", 500)
	}
	return issues, nil
}

func (s *IssueService) StatsPublic(ctx context.Context, query PublicIssueQuery) (*PublicIssueStats, error) {
	if !geo.ValidateCoordinates(query.Lat, query.Lng) {
		return nil, errx.New("INVALID_INPUT", "invalid coordinates", 400)
	}
	if query.RadiusMeters <= 0 {
		query.RadiusMeters = publicDefaultRadiusMeters
	}

	statuses := filterStatsStatuses(query.Filters.Statuses)
	location := domain.GeoPoint{Type: "Point", Coordinates: [2]float64{query.Lng, query.Lat}}
	stats, err := s.issues.StatsPublicNearby(ctx, location, query.RadiusMeters, statuses, repository.PublicIssueFilters{
		Severities: query.Filters.Severities,
		Categories: query.Filters.Categories,
		DateFrom:   query.Filters.DateFrom,
		DateTo:     query.Filters.DateTo,
	})
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not load stats", 500)
	}

	return &PublicIssueStats{
		Total:            stats.Total,
		PendingApprovals: stats.PendingApprovals,
		InProgress:       stats.InProgress,
		Resolved:         stats.Resolved,
	}, nil
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

func (s *IssueService) DeleteCitizenIssue(ctx context.Context, id primitive.ObjectID, userID string) error {
	if strings.TrimSpace(userID) == "" {
		return errx.New("UNAUTHORIZED", "missing user", 401)
	}

	if s.flags != nil {
		if err := s.flags.DeleteByIssueID(ctx, id); err != nil {
			return errx.New("INTERNAL_ERROR", "could not cleanup issue flags", 500)
		}
	}

	if err := s.issues.DeleteByIDAndReporter(ctx, id, userID); err != nil {
		if err == repository.ErrNotFound {
			return errx.New("NOT_FOUND", "issue not found", 404)
		}
		return errx.New("INTERNAL_ERROR", "could not delete issue", 500)
	}

	return nil
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
		domain.StatusAwaitingHeadClose,
		domain.StatusClosed,
	}
}

func filterPublicStatuses(input []domain.IssueStatus) []domain.IssueStatus {
	if len(input) == 0 {
		return nil
	}

	allowed := publicStatuses()
	allowedSet := map[domain.IssueStatus]bool{}
	for _, s := range allowed {
		allowedSet[s] = true
	}

	var filtered []domain.IssueStatus
	for _, s := range input {
		if allowedSet[s] {
			filtered = append(filtered, s)
		}
	}
	return filtered
}

func filterStatsStatuses(input []domain.IssueStatus) []domain.IssueStatus {
	if len(input) == 0 {
		return publicStatuses()
	}

	filtered := filterPublicStatuses(input)
	if len(filtered) == 0 {
		return publicStatuses()
	}
	return filtered
}

func isPublicStatus(status domain.IssueStatus) bool {
	for _, s := range publicStatuses() {
		if s == status {
			return true
		}
	}
	return false
}
