package service

import (
	"context"
	"log"
	"time"

	"civic/internal/repository"
)

const deadlineOverdueStage = "DEADLINE_OVERDUE"

type DeadlineEscalationService struct {
	issues    repository.IssueRepository
	batchSize int64
}

func NewDeadlineEscalationService(issues repository.IssueRepository, batchSize int64) *DeadlineEscalationService {
	if batchSize <= 0 {
		batchSize = 200
	}
	return &DeadlineEscalationService{issues: issues, batchSize: batchSize}
}

func (s *DeadlineEscalationService) RunOnce(ctx context.Context, now time.Time) (int, error) {
	issues, err := s.issues.ListDeadlineOverdueActive(ctx, now, s.batchSize)
	if err != nil {
		return 0, err
	}

	escalated := 0
	for _, issue := range issues {
		if issue == nil {
			continue
		}
		if issue.SlaViolation && issue.SlaStage == deadlineOverdueStage {
			continue
		}

		escalatedAt := issue.EscalatedAt
		if escalatedAt == nil {
			t := now
			escalatedAt = &t
		}

		if err := s.issues.UpdateEscalation(ctx, issue.ID, true, 1, deadlineOverdueStage, escalatedAt, now); err != nil {
			return escalated, err
		}
		escalated++
	}

	return escalated, nil
}

func (s *DeadlineEscalationService) Start(ctx context.Context, interval time.Duration) {
	if interval <= 0 {
		interval = time.Minute
	}

	run := func() {
		count, err := s.RunOnce(ctx, time.Now())
		if err != nil {
			log.Printf("deadline escalation sweep failed: %v", err)
			return
		}
		if count > 0 {
			log.Printf("deadline escalation sweep escalated %d overdue issues", count)
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
