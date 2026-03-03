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

const pendingDefaultLimit int64 = 100

type ModerationService struct {
	issues repository.IssueRepository
}

func NewModerationService(issues repository.IssueRepository) *ModerationService {
	return &ModerationService{issues: issues}
}

func (s *ModerationService) ListPending(ctx context.Context, limit int64) ([]*domain.Issue, error) {
	if limit <= 0 {
		limit = pendingDefaultLimit
	}
	issues, err := s.issues.ListPending(ctx, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list pending issues", 500)
	}
	return issues, nil
}

func (s *ModerationService) Approve(ctx context.Context, id primitive.ObjectID, adminID, departmentID, severity string) (*domain.Issue, error) {
	if strings.TrimSpace(adminID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing admin", 401)
	}
	if strings.TrimSpace(departmentID) == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if strings.TrimSpace(severity) == "" {
		return nil, errx.New("INVALID_INPUT", "severity is required", 400)
	}

	reviewedAt := time.Now()
	if err := s.issues.ApproveIssue(ctx, id, adminID, departmentID, severity, reviewedAt); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not approve issue", 500)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusApproved {
		return nil, errx.New("INVALID_TRANSITION", "issue not approved", 409)
	}
	return issue, nil
}

func (s *ModerationService) Reject(ctx context.Context, id primitive.ObjectID, adminID, reason string) (*domain.Issue, error) {
	if strings.TrimSpace(adminID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing admin", 401)
	}
	if strings.TrimSpace(reason) == "" {
		return nil, errx.New("INVALID_INPUT", "rejection reason is required", 400)
	}

	reviewedAt := time.Now()
	if err := s.issues.RejectIssue(ctx, id, adminID, reason, reviewedAt); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not reject issue", 500)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusRejected {
		return nil, errx.New("INVALID_TRANSITION", "issue not rejected", 409)
	}
	return issue, nil
}
