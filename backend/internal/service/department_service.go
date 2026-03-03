package service

import (
	"context"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
)

type DepartmentService struct {
	depts repository.DepartmentRepository
}

func NewDepartmentService(depts repository.DepartmentRepository) *DepartmentService {
	return &DepartmentService{depts: depts}
}

func (s *DepartmentService) Create(ctx context.Context, name string) (*domain.Department, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, errx.New("INVALID_INPUT", "name is required", 400)
	}

	dept := &domain.Department{
		Name:      name,
		Key:       normalizeDepartmentKey(name),
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if err := s.depts.Create(ctx, dept); err != nil {
		if err == repository.ErrAlreadyExists {
			return nil, errx.New("ALREADY_EXISTS", "department already exists", 409)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not create department", 500)
	}

	return dept, nil
}

func normalizeDepartmentKey(name string) string {
	key := strings.ToLower(strings.TrimSpace(name))
	key = strings.Join(strings.Fields(key), "-")
	return key
}
