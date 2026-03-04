package service

import (
	"context"
	"math"
	"sort"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
	"civic/internal/util/priority"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const authorityDefaultLimit int64 = 100

type AuthorityService struct {
	issues  repository.IssueRepository
	weights priority.Weights
}

func NewAuthorityService(issues repository.IssueRepository, weights priority.Weights) *AuthorityService {
	return &AuthorityService{issues: issues, weights: weights}
}

func (s *AuthorityService) ListByDepartment(ctx context.Context, departmentID, authorityID string, limit int64) ([]*domain.Issue, error) {
	departmentID = strings.TrimSpace(departmentID)
	authorityID = strings.TrimSpace(authorityID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if authorityID == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority", 401)
	}
	if limit <= 0 {
		limit = authorityDefaultLimit
	}

	statuses := []domain.IssueStatus{
		domain.StatusAssigned,
		domain.StatusInProgress,
	}
	issues, err := s.issues.ListAuthorityByDepartment(ctx, departmentID, authorityID, statuses, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list authority issues", 500)
	}

	now := time.Now()
	for _, issue := range issues {
		if issue == nil {
			continue
		}
		newScore := priority.Score(issue, now, s.weights)
		if math.Abs(issue.PriorityScore-newScore) > 0.0001 {
			if err := s.issues.UpdatePriorityScore(ctx, issue.ID, newScore, now); err == nil {
				issue.PriorityScore = newScore
				issue.PriorityUpdatedAt = &now
			}
		}
	}

	sort.SliceStable(issues, func(i, j int) bool {
		if issues[i] == nil || issues[j] == nil {
			return issues[i] != nil
		}
		if issues[i].PriorityScore == issues[j].PriorityScore {
			return issues[i].CreatedAt.After(issues[j].CreatedAt)
		}
		return issues[i].PriorityScore > issues[j].PriorityScore
	})
	return issues, nil
}

func (s *AuthorityService) Assign(ctx context.Context, id primitive.ObjectID, authorityID, departmentID string) (*domain.Issue, error) {
	return nil, errx.New("FORBIDDEN", "assignment occurs during head approval", 403)
}

func (s *AuthorityService) Start(ctx context.Context, id primitive.ObjectID, authorityID, departmentID string) (*domain.Issue, error) {
	if strings.TrimSpace(authorityID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority", 401)
	}
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.IsMerged || issue.DepartmentID != departmentID {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusAssigned {
		return nil, errx.New("INVALID_TRANSITION", "issue not in assigned status", 409)
	}
	if issue.Authority.AssignedToWorkerID != authorityID {
		return nil, errx.New("FORBIDDEN", "issue not assigned to authority", 403)
	}

	if err := s.issues.StartIssue(ctx, id, departmentID, authorityID, time.Now()); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not start issue", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return updated, nil
}

func (s *AuthorityService) Resolve(ctx context.Context, id primitive.ObjectID, authorityID, departmentID, notes string) (*domain.Issue, error) {
	if strings.TrimSpace(authorityID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority", 401)
	}
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if strings.TrimSpace(notes) == "" {
		return nil, errx.New("INVALID_INPUT", "resolution notes are required", 400)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.IsMerged || issue.DepartmentID != departmentID {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusInProgress {
		return nil, errx.New("INVALID_TRANSITION", "issue not in progress", 409)
	}
	if issue.Authority.AssignedToWorkerID != authorityID {
		return nil, errx.New("FORBIDDEN", "issue not assigned to authority", 403)
	}

	if err := s.issues.ResolveIssue(ctx, id, departmentID, authorityID, notes, time.Now()); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not resolve issue", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return updated, nil
}
