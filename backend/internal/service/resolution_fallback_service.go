package service

import (
	"context"
	"log"
	"time"

	"civic/internal/repository"
)

type ResolutionFallbackService struct {
	issues             repository.IssueRepository
	batchSize          int64
	confirmationWindow time.Duration
}

func NewResolutionFallbackService(issues repository.IssueRepository, batchSize int64, confirmationWindow time.Duration) *ResolutionFallbackService {
	if batchSize <= 0 {
		batchSize = 200
	}
	if confirmationWindow <= 0 {
		confirmationWindow = 72 * time.Hour
	}
	return &ResolutionFallbackService{
		issues:             issues,
		batchSize:          batchSize,
		confirmationWindow: confirmationWindow,
	}
}

func (s *ResolutionFallbackService) RunOnce(ctx context.Context, now time.Time) (int64, error) {
	resolvedBefore := now.Add(-s.confirmationWindow)
	return s.issues.AutoTransitionResolvedToAwaitingHeadClose(ctx, resolvedBefore, now, s.batchSize)
}

func (s *ResolutionFallbackService) Start(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = time.Minute
	}

	run := func() {
		count, err := s.RunOnce(ctx, time.Now())
		if err != nil {
			log.Printf("resolution fallback sweep failed: %v", err)
			return
		}
		if count > 0 {
			log.Printf("resolution fallback sweep advanced %d resolved issues to awaiting head closure", count)
		}
	}

	run()
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			run()
		}
	}
}
