package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type HeadProvisioningService struct {
	users repository.UserRepository
	depts repository.DepartmentRepository
}

func NewHeadProvisioningService(users repository.UserRepository, depts repository.DepartmentRepository) *HeadProvisioningService {
	return &HeadProvisioningService{users: users, depts: depts}
}

func (s *HeadProvisioningService) RegisterWorker(ctx context.Context, email, password, departmentID string) (*domain.User, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	departmentID = strings.TrimSpace(departmentID)
	if email == "" || password == "" {
		return nil, errx.New("INVALID_INPUT", "email and password are required", 400)
	}
	if len(password) < 12 {
		return nil, errx.New("INVALID_INPUT", "authority password must be at least 12 characters", 400)
	}
	if departmentID == "" {
		return nil, errx.New("INVALID_INPUT", "departmentId is required", 400)
	}

	deptOID, err := primitive.ObjectIDFromHex(departmentID)
	if err != nil {
		return nil, errx.New("INVALID_INPUT", "invalid departmentId", 400)
	}
	if _, err := s.depts.GetByID(ctx, deptOID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, errx.New("INVALID_INPUT", "department not found", 400)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not validate department", 500)
	}

	_, err = s.users.GetByEmail(ctx, email)
	if err == nil {
		return nil, errx.New("ALREADY_EXISTS", "user already exists", 409)
	}
	if !errors.Is(err, repository.ErrNotFound) {
		return nil, errx.New("INTERNAL_ERROR", "could not check user", 500)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not hash password", 500)
	}

	now := time.Now().UTC()
	user := &domain.User{
		ID:               newProvisionedID(),
		Email:            email,
		PasswordHash:     string(hash),
		Role:             domain.RoleAuthority,
		AuthoritySubRole: domain.AuthorityWorker,
		DepartmentID:     departmentID,
		Blocked:          false,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := s.users.Create(ctx, user); err != nil {
		if errors.Is(err, repository.ErrAlreadyExists) {
			return nil, errx.New("ALREADY_EXISTS", "user already exists", 409)
		}
		return nil, errx.New("INTERNAL_ERROR", "could not create authority user", 500)
	}

	copy := *user
	copy.PasswordHash = ""
	return &copy, nil
}
