package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"

	"civic/internal/domain"
	"civic/internal/errx"
	"civic/internal/repository"
	"civic/internal/util/jwt"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	users repository.UserRepository
	jwt   *jwt.Manager
}

type AuthResult struct {
	Token string
	User  *domain.User
}

func NewAuthService(users repository.UserRepository, jwtManager *jwt.Manager) *AuthService {
	return &AuthService{users: users, jwt: jwtManager}
}

func (s *AuthService) Register(ctx context.Context, email, password string, role domain.Role, departmentID string) (*AuthResult, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, errx.New("INVALID_INPUT", "email and password are required", 400)
	}
	if role == "" {
		role = domain.RoleCitizen
	}

	_, err := s.users.GetByEmail(ctx, email)
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

	user := &domain.User{
		ID:           newID(),
		Email:        email,
		PasswordHash: string(hash),
		Role:         role,
		DepartmentID: departmentID,
		Blocked:      false,
	}

	if err := s.users.Create(ctx, user); err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not create user", 500)
	}

	token, err := s.jwt.Generate(user.ID, string(user.Role), user.DepartmentID)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not create token", 500)
	}

	return &AuthResult{Token: token, User: sanitizeUser(user)}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*AuthResult, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, errx.New("INVALID_INPUT", "email and password are required", 400)
	}

	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return nil, errx.New("INVALID_CREDENTIALS", "invalid credentials", 401)
	}
	if user.Blocked {
		return nil, errx.New("BLOCKED_USER", "user is blocked", 403)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errx.New("INVALID_CREDENTIALS", "invalid credentials", 401)
	}

	token, err := s.jwt.Generate(user.ID, string(user.Role), user.DepartmentID)
	if err != nil {
		return nil, errx.New("INTERNAL_ERROR", "could not create token", 500)
	}

	return &AuthResult{Token: token, User: sanitizeUser(user)}, nil
}

func (s *AuthService) GetByID(ctx context.Context, id string) (*domain.User, error) {
	user, err := s.users.GetByID(ctx, id)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "user not found", 404)
	}
	return sanitizeUser(user), nil
}

func sanitizeUser(user *domain.User) *domain.User {
	if user == nil {
		return nil
	}
	copy := *user
	copy.PasswordHash = ""
	return &copy
}

func newID() string {
	buf := make([]byte, 12)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}
