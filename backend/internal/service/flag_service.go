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

type FlagService struct {
	flags  repository.FlagRepository
	issues repository.IssueRepository
}

func NewFlagService(flags repository.FlagRepository, issues repository.IssueRepository) *FlagService {
	return &FlagService{flags: flags, issues: issues}
}

func (s *FlagService) Create(ctx context.Context, issueID primitive.ObjectID, reporterID, reason string) (*domain.IssueFlag, error) {
	if strings.TrimSpace(reporterID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing reporter", 401)
	}
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, errx.New("INVALID_INPUT", "reason is required", 400)
	}

	issue, err := s.issues.GetByID(ctx, issueID)
	if err != nil || issue == nil || issue.IsMerged {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}

	now := time.Now().UTC()
	flag := &domain.IssueFlag{
		IssueID:    issueID,
		ReporterID: reporterID,
		Reason:     reason,
		CreatedAt:  now,
		Resolved:   false,
	}
	if err := s.flags.Create(ctx, flag); err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not create flag", 500)
	}
	if err := s.issues.AdjustFlagsCount(ctx, issueID, 1, now); err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not update issue flag count", 500)
	}
	return flag, nil
}

func (s *FlagService) ListOpen(ctx context.Context, limit int64) ([]*domain.IssueFlag, error) {
	items, err := s.flags.ListOpen(ctx, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list flags", 500)
	}
	return items, nil
}

func (s *FlagService) Resolve(ctx context.Context, flagID primitive.ObjectID, resolverID, resolution string) (*domain.IssueFlag, error) {
	if strings.TrimSpace(resolverID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing resolver", 401)
	}
	resolvedAt := time.Now().UTC()
	flag, err := s.flags.Resolve(ctx, flagID, resolverID, strings.TrimSpace(resolution), resolvedAt)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "flag not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not resolve flag", 500)
	}
	if flag == nil {
		return nil, errx.New("NOT_FOUND", "flag not found", 404)
	}
	if err := s.issues.AdjustFlagsCount(ctx, flag.IssueID, -1, resolvedAt); err != nil && err != repository.ErrNotFound {
		return nil, errx.New("INTERNAL_ERROR", "could not update issue flag count", 500)
	}
	return flag, nil
}
