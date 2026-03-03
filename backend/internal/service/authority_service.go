package service

import (
	"context"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const authorityDefaultLimit int64 = 100

type AuthorityService struct {
	issues repository.IssueRepository
}

func NewAuthorityService(issues repository.IssueRepository) *AuthorityService {
	return &AuthorityService{issues: issues}
}

func (s *AuthorityService) ListByDepartment(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error) {
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if limit <= 0 {
		limit = authorityDefaultLimit
	}

	statuses := []domain.IssueStatus{
		domain.StatusApproved,
		domain.StatusAssigned,
		domain.StatusInProgress,
	}
	issues, err := s.issues.ListAuthorityByDepartment(ctx, departmentID, statuses, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list authority issues", 500)
	}
	return issues, nil
}

func (s *AuthorityService) Assign(ctx context.Context, id primitive.ObjectID, authorityID, departmentID string) (*domain.Issue, error) {
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
	if issue.Status != domain.StatusApproved {
		return nil, errx.New("INVALID_TRANSITION", "issue not in approved status", 409)
	}

	if err := s.issues.AssignIssue(ctx, id, departmentID, authorityID, time.Now()); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not assign issue", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return updated, nil
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
