package domain

import "time"

type Role string

const (
	RoleCitizen   Role = "CITIZEN"
	RoleAdmin     Role = "ADMIN"
	RoleAuthority Role = "AUTHORITY"
)

type User struct {
	ID           string    `bson:"_id" json:"id"`
	Email        string    `bson:"email" json:"email"`
	PasswordHash string    `bson:"passwordHash" json:"-"`
	Role         Role      `bson:"role" json:"role"`
	DepartmentID string    `bson:"departmentId,omitempty" json:"departmentId,omitempty"`
	Blocked      bool      `bson:"blocked" json:"blocked"`
	CreatedAt    time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time `bson:"updatedAt" json:"updatedAt"`
}
