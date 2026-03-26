package service

import (
	"context"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
	"civic/internal/util/priority"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

const pendingDefaultLimit int64 = 100

type ModerationService struct {
	issues  repository.IssueRepository
	users   repository.UserRepository
	weights priority.Weights
	sla     *SLAService
}

func NewModerationService(issues repository.IssueRepository, users repository.UserRepository, weights priority.Weights, sla *SLAService) *ModerationService {
	return &ModerationService{issues: issues, users: users, weights: weights, sla: sla}
}

func (s *ModerationService) ListPending(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error) {
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if limit <= 0 {
		limit = pendingDefaultLimit
	}
	issues, err := s.issues.ListPending(ctx, departmentID, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list pending issues", 500)
	}
	if s.sla != nil {
		s.sla.RefreshBatch(ctx, issues, time.Now())
	}
	return issues, nil
}

func (s *ModerationService) ListEscalated(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error) {
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if limit <= 0 {
		limit = pendingDefaultLimit
	}
	issues, err := s.issues.ListEscalated(ctx, departmentID, limit)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not list escalations", 500)
	}
	if s.sla != nil {
		s.sla.RefreshBatch(ctx, issues, time.Now())
	}
	return issues, nil
}

func (s *ModerationService) Approve(ctx context.Context, id primitive.ObjectID, headID, departmentID, severity, workerID string) (*domain.Issue, error) {
	if strings.TrimSpace(headID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority head", 401)
	}
	if strings.TrimSpace(departmentID) == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if strings.TrimSpace(severity) == "" {
		return nil, errx.New("INVALID_INPUT", "severity is required", 400)
	}
	if strings.TrimSpace(workerID) == "" {
		return nil, errx.New("INVALID_INPUT", "workerId is required", 400)
	}

	worker, err := s.users.GetByID(ctx, workerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("INVALID_INPUT", "invalid workerId", 400)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not validate worker", 500)
	}
	if worker.Blocked {
		return nil, errx.New("INVALID_INPUT", "invalid workerId", 400)
	}
	if worker.Role != domain.RoleAuthority || worker.AuthoritySubRole != domain.AuthorityWorker {
		return nil, errx.New("INVALID_INPUT", "invalid workerId", 400)
	}
	if strings.TrimSpace(worker.DepartmentID) == "" || worker.DepartmentID != departmentID {
		return nil, errx.New("FORBIDDEN", "worker does not belong to head department", 403)
	}

	reviewedAt := time.Now()
	if err := s.issues.ApproveIssue(ctx, id, headID, departmentID, severity, workerID, reviewedAt); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not approve issue", 500)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusAssigned {
		return nil, errx.New("INVALID_TRANSITION", "issue not assigned", 409)
	}

	now := time.Now()
	priorityScore := priority.Score(issue, now, s.weights)
	if err := s.issues.UpdatePriorityScore(ctx, issue.ID, priorityScore, now); err == nil {
		issue.PriorityScore = priorityScore
		issue.PriorityUpdatedAt = &now
	}
	return issue, nil
}

func (s *ModerationService) Reject(ctx context.Context, id primitive.ObjectID, headID, departmentID, reason string) (*domain.Issue, error) {
	if strings.TrimSpace(headID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority head", 401)
	}
	if strings.TrimSpace(departmentID) == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if strings.TrimSpace(reason) == "" {
		return nil, errx.New("INVALID_INPUT", "rejection reason is required", 400)
	}

	reviewedAt := time.Now()
	if err := s.issues.RejectIssue(ctx, id, headID, departmentID, reason, reviewedAt); err != nil {
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

func (s *ModerationService) Close(ctx context.Context, id primitive.ObjectID, headID, departmentID string) (*domain.Issue, error) {
	if strings.TrimSpace(headID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority head", 401)
	}
	departmentID = strings.TrimSpace(departmentID)
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}

	issue, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.IsMerged {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if issue.Status != domain.StatusAwaitingHeadClose {
		return nil, errx.New("INVALID_TRANSITION", "issue not awaiting head closure", 409)
	}
	if issue.DepartmentID != departmentID {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}

	closedAt := time.Now()
	if err := s.issues.CloseIssue(ctx, id, departmentID, closedAt); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not close issue", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	if updated.Status != domain.StatusClosed {
		return nil, errx.New("INVALID_TRANSITION", "issue not closed", 409)
	}
	return updated, nil
}

func (s *ModerationService) ReassignEscalated(ctx context.Context, id primitive.ObjectID, headID, departmentID, workerID string) (*domain.Issue, error) {
	if strings.TrimSpace(headID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority head", 401)
	}
	if strings.TrimSpace(departmentID) == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	if strings.TrimSpace(workerID) == "" {
		return nil, errx.New("INVALID_INPUT", "workerId is required", 400)
	}

	worker, err := s.users.GetByID(ctx, workerID)
	if err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("INVALID_INPUT", "invalid workerId", 400)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not validate worker", 500)
	}
	if worker.Blocked || worker.Role != domain.RoleAuthority || worker.AuthoritySubRole != domain.AuthorityWorker || worker.DepartmentID != departmentID {
		return nil, errx.New("INVALID_INPUT", "invalid workerId", 400)
	}

	now := time.Now()
	if err := s.issues.ReassignWorker(ctx, id, departmentID, workerID, now); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found or not eligible for reassignment", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not reassign issue", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return updated, nil
}

func (s *ModerationService) Escalate(ctx context.Context, id primitive.ObjectID, headID, departmentID, reason string) (*domain.Issue, error) {
	if strings.TrimSpace(headID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing authority head", 401)
	}
	if strings.TrimSpace(departmentID) == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}
	reason = strings.TrimSpace(reason)
	if reason == "" {
		return nil, errx.New("INVALID_INPUT", "escalation reason is required", 400)
	}

	now := time.Now()
	if err := s.issues.EscalateByHead(ctx, id, departmentID, reason, now); err != nil {
		if err == repository.ErrNotFound {
			return nil, errx.New("NOT_FOUND", "issue not found or not eligible for escalation", 404)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not escalate issue", 500)
	}

	updated, err := s.issues.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "issue not found", 404)
	}
	return updated, nil
}
