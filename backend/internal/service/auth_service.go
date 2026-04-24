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

type ProfileUpdateInput struct {
	Name        string
	Email       string
	OldPassword string
	NewPassword string
	LocationLat *float64
	LocationLng *float64
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

	token, err := s.jwt.Generate(user.ID, string(user.Role), user.DepartmentID, string(user.AuthoritySubRole))
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

	token, err := s.jwt.Generate(user.ID, string(user.Role), user.DepartmentID, string(user.AuthoritySubRole))
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

func (s *AuthService) UpdateProfile(ctx context.Context, userID string, input ProfileUpdateInput) (*domain.User, error) {
	if strings.TrimSpace(userID) == "" {
		return nil, errx.New("UNAUTHORIZED", "missing user", 401)
	}

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "user not found", 404)
	}

	name := strings.TrimSpace(input.Name)
	email := strings.TrimSpace(strings.ToLower(input.Email))
	var location *domain.UserLocation
	if input.LocationLat != nil || input.LocationLng != nil {
		if input.LocationLat == nil || input.LocationLng == nil {
			return nil, errx.New("INVALID_INPUT", "both location lat and lng are required", 400)
		}
		lat := *input.LocationLat
		lng := *input.LocationLng
		if lat < -90 || lat > 90 || lng < -180 || lng > 180 {
			return nil, errx.New("INVALID_INPUT", "invalid location coordinates", 400)
		}
		location = &domain.UserLocation{Lat: lat, Lng: lng}
	}

	if email != "" && email != user.Email {
		existing, err := s.users.GetByEmail(ctx, email)
		if err == nil && existing != nil && existing.ID != user.ID {
			return nil, errx.New("ALREADY_EXISTS", "email already in use", 409)
		}
		if err != nil && !errors.Is(err, repository.ErrNotFound) {
			return nil, errx.New("INTERNAL_ERROR", "could not check email", 500)
		}
	}

	if input.NewPassword != "" || input.OldPassword != "" {
		if input.OldPassword == "" || input.NewPassword == "" {
			return nil, errx.New("INVALID_INPUT", "old and new password are required", 400)
		}
		if len(input.NewPassword) < 8 {
			return nil, errx.New("INVALID_INPUT", "new password must be at least 8 characters", 400)
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.OldPassword)); err != nil {
			return nil, errx.New("INVALID_CREDENTIALS", "invalid current password", 401)
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			return nil, errx.New("INTERNAL_ERROR", "could not update password", 500)
		}
		if err := s.users.UpdatePassword(ctx, user.ID, string(hash)); err != nil {
			return nil, errx.New("INTERNAL_ERROR", "could not update password", 500)
		}
	}

	if name != "" || email != "" || location != nil {
		if err := s.users.UpdateProfile(ctx, user.ID, name, email, location); err != nil {
			if errors.Is(err, repository.ErrAlreadyExists) {
				return nil, errx.New("ALREADY_EXISTS", "email already in use", 409)
			}
			if errors.Is(err, repository.ErrNotFound) {
				return nil, errx.New("NOT_FOUND", "user not found", 404)
			}
			return nil, errx.New("INTERNAL_ERROR", "could not update profile", 500)
		}
	}

	updated, err := s.users.GetByID(ctx, user.ID)
	if err != nil {
		return nil, errx.New("NOT_FOUND", "user not found", 404)
	}
	return sanitizeUser(updated), nil
}

func (s *AuthService) DeleteAccount(ctx context.Context, userID, password string) error {
	if strings.TrimSpace(userID) == "" {
		return errx.New("UNAUTHORIZED", "missing user", 401)
	}
	if strings.TrimSpace(password) == "" {
		return errx.New("INVALID_INPUT", "password is required", 400)
	}

	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return errx.New("NOT_FOUND", "user not found", 404)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return errx.New("INVALID_CREDENTIALS", "invalid password", 401)
	}

	if err := s.users.DeleteByID(ctx, user.ID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return errx.New("NOT_FOUND", "user not found", 404)
		}
		return errx.New("INTERNAL_ERROR", "could not delete user", 500)
	}
	return nil
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
