package domain

type Role string

const (
	RoleCitizen   Role = "CITIZEN"
	RoleAdmin     Role = "ADMIN"
	RoleAuthority Role = "AUTHORITY"
)

type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         Role
	DepartmentID string
	Blocked      bool
}
