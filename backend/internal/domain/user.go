package domain

import "time"

type Role string

const (
	RoleCitizen   Role = "CITIZEN"
	RoleAdmin     Role = "ADMIN"
	RoleAuthority Role = "AUTHORITY"
)

type AuthoritySubRole string

const (
	AuthorityHead   AuthoritySubRole = "HEAD"
	AuthorityWorker AuthoritySubRole = "WORKER"
)

type User struct {
	ID               string           `bson:"_id" json:"id"`
	Name             string           `bson:"name,omitempty" json:"name,omitempty"`
	Email            string           `bson:"email" json:"email"`
	Location         *UserLocation    `bson:"location,omitempty" json:"location,omitempty"`
	PasswordHash     string           `bson:"passwordHash" json:"-"`
	Role             Role             `bson:"role" json:"role"`
	AuthoritySubRole AuthoritySubRole `bson:"authoritySubRole,omitempty" json:"authoritySubRole,omitempty"`
	DepartmentID     string           `bson:"departmentId,omitempty" json:"departmentId,omitempty"`
	Blocked          bool             `bson:"blocked" json:"blocked"`
	CreatedAt        time.Time        `bson:"createdAt" json:"createdAt"`
	UpdatedAt        time.Time        `bson:"updatedAt" json:"updatedAt"`
}

type UserLocation struct {
	Lat float64 `bson:"lat" json:"lat"`
	Lng float64 `bson:"lng" json:"lng"`
}
