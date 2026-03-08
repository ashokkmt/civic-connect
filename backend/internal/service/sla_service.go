package service

import (
	"context"
	"time"

	"civic/internal/domain"
	"civic/internal/repository"
)

type SLAWindows struct {
	Approval time.Duration
	Start    time.Duration
	Resolve  time.Duration
	Confirm  time.Duration
	Close    time.Duration
}

type SLAService struct {
	issues  repository.IssueRepository
	windows SLAWindows
}

func NewSLAService(issues repository.IssueRepository, windows SLAWindows) *SLAService {
	return &SLAService{issues: issues, windows: windows}
}

func (s *SLAService) EvaluateIssue(issue *domain.Issue, now time.Time) (bool, int, string) {
	if issue == nil || issue.IsMerged || issue.Status == domain.StatusClosed {
		return false, 0, ""
	}

	stage, overBy := s.stageOverdue(issue, now)
	if stage == "" || overBy <= 0 {
		return false, 0, ""
	}

	level := 1
	hoursOver := overBy.Hours()
	if hoursOver >= 48 {
		level = 3
	} else if hoursOver >= 24 {
		level = 2
	}

	return true, level, stage
}

func (s *SLAService) stageOverdue(issue *domain.Issue, now time.Time) (string, time.Duration) {
	switch issue.Status {
	case domain.StatusPendingApproval:
		if s.windows.Approval <= 0 {
			return "", 0
		}
		return "APPROVAL", now.Sub(issue.CreatedAt) - s.windows.Approval
	case domain.StatusAssigned:
		if s.windows.Start <= 0 {
			return "", 0
		}
		base := issue.Lifecycle.AssignedAt
		if base == nil {
			base = &issue.StatusUpdatedAt
		}
		return "WORK_START", now.Sub(*base) - s.windows.Start
	case domain.StatusInProgress:
		if s.windows.Resolve <= 0 {
			return "", 0
		}
		base := issue.Lifecycle.StartedAt
		if base == nil {
			base = &issue.StatusUpdatedAt
		}
		return "RESOLUTION", now.Sub(*base) - s.windows.Resolve
	case domain.StatusResolved:
		if s.windows.Confirm <= 0 {
			return "", 0
		}
		base := issue.Lifecycle.ResolvedAt
		if base == nil {
			base = &issue.StatusUpdatedAt
		}
		return "CITIZEN_CONFIRMATION", now.Sub(*base) - s.windows.Confirm
	case domain.StatusAwaitingHeadClose:
		if s.windows.Close <= 0 {
			return "", 0
		}
		base := issue.Lifecycle.ConfirmedAt
		if base == nil {
			base = &issue.StatusUpdatedAt
		}
		return "HEAD_CLOSURE", now.Sub(*base) - s.windows.Close
	default:
		return "", 0
	}
}

func (s *SLAService) RefreshIssue(ctx context.Context, issue *domain.Issue, now time.Time) error {
	if issue == nil {
		return nil
	}

	violation, level, stage := s.EvaluateIssue(issue, now)

	var escalatedAt *time.Time
	if violation {
		if issue.EscalatedAt != nil {
			escalatedAt = issue.EscalatedAt
		} else {
			n := now
			escalatedAt = &n
		}
	}

	if err := s.issues.UpdateEscalation(ctx, issue.ID, violation, level, stage, escalatedAt, now); err != nil {
		return err
	}

	issue.SlaViolation = violation
	issue.EscalationLevel = level
	issue.SlaStage = stage
	issue.EscalatedAt = escalatedAt
	return nil
}

func (s *SLAService) RefreshBatch(ctx context.Context, issues []*domain.Issue, now time.Time) {
	for _, issue := range issues {
		_ = s.RefreshIssue(ctx, issue, now)
	}
}
