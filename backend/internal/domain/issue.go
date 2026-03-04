package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type IssueStatus string

const (
	StatusPendingApproval   IssueStatus = "PENDING_APPROVAL"
	StatusRejected          IssueStatus = "REJECTED"
	StatusApproved          IssueStatus = "APPROVED"
	StatusAssigned          IssueStatus = "ASSIGNED"
	StatusInProgress        IssueStatus = "IN_PROGRESS"
	StatusResolved          IssueStatus = "RESOLVED"
	StatusAwaitingHeadClose IssueStatus = "AWAITING_HEAD_CLOSURE"
	StatusClosed            IssueStatus = "CLOSED"
)

type GeoPoint struct {
	Type        string     `bson:"type" json:"type"`
	Coordinates [2]float64 `bson:"coordinates" json:"coordinates"`
}

type Issue struct {
	ID                primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Title             string               `bson:"title" json:"title"`
	Description       string               `bson:"description" json:"description"`
	ImageURLs         []string             `bson:"imageUrls,omitempty" json:"imageUrls,omitempty"`
	CreatedByUserID   string               `bson:"createdByUserId" json:"createdByUserId"`
	Location          GeoPoint             `bson:"location" json:"location"`
	Status            IssueStatus          `bson:"status" json:"status"`
	StatusUpdatedAt   time.Time            `bson:"statusUpdatedAt" json:"statusUpdatedAt"`
	Moderation        ModerationInfo       `bson:"moderation,omitempty" json:"moderation,omitempty"`
	DepartmentID      string               `bson:"departmentId,omitempty" json:"departmentId,omitempty"`
	Authority         AuthorityInfo        `bson:"authority,omitempty" json:"authority,omitempty"`
	ReporterConfirm   ReporterConfirmation `bson:"reporterConfirmation,omitempty" json:"reporterConfirmation,omitempty"`
	ClosedAt          *time.Time           `bson:"closedAt,omitempty" json:"closedAt,omitempty"`
	SupporterUserIDs  []string             `bson:"supporterUserIds" json:"supporterUserIds,omitempty"`
	SupporterCount    int                  `bson:"supporterCount" json:"supporterCount"`
	Severity          string               `bson:"severity,omitempty" json:"severity,omitempty"`
	Exif              ExifInfo             `bson:"exif,omitempty" json:"exif,omitempty"`
	PriorityScore     float64              `bson:"priorityScore,omitempty" json:"priorityScore,omitempty"`
	PriorityUpdatedAt *time.Time           `bson:"priorityUpdatedAt,omitempty" json:"priorityUpdatedAt,omitempty"`
	FlagsCount        int                  `bson:"flagsCount,omitempty" json:"flagsCount,omitempty"`
	IsHidden          bool                 `bson:"isHidden,omitempty" json:"isHidden,omitempty"`
	IsMerged          bool                 `bson:"isMerged,omitempty" json:"isMerged,omitempty"`
	MergedIntoIssueID *primitive.ObjectID  `bson:"mergedIntoIssueId,omitempty" json:"mergedIntoIssueId,omitempty"`
	CreatedAt         time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time            `bson:"updatedAt" json:"updatedAt"`
}

type ModerationInfo struct {
	ReviewedByAdminID string     `bson:"reviewedByAdminId,omitempty" json:"reviewedByAdminId,omitempty"`
	ReviewedAt        *time.Time `bson:"reviewedAt,omitempty" json:"reviewedAt,omitempty"`
	RejectionReason   string     `bson:"rejectionReason,omitempty" json:"rejectionReason,omitempty"`
}

type AuthorityInfo struct {
	AssignedByAdminID     string     `bson:"assignedByAdminId,omitempty" json:"assignedByAdminId,omitempty"`
	ResolvedByAuthorityID string     `bson:"resolvedByAuthorityId,omitempty" json:"resolvedByAuthorityId,omitempty"`
	ResolutionNotes       string     `bson:"resolutionNotes,omitempty" json:"resolutionNotes,omitempty"`
	ResolvedAt            *time.Time `bson:"resolvedAt,omitempty" json:"resolvedAt,omitempty"`
}

type ReporterConfirmation struct {
	ConfirmedAt       *time.Time `bson:"confirmedAt,omitempty" json:"confirmedAt,omitempty"`
	ConfirmedByUserID string     `bson:"confirmedByUserId,omitempty" json:"confirmedByUserId,omitempty"`
}

type ExifInfo struct {
	HasGPS         bool       `bson:"hasGps,omitempty" json:"hasGps,omitempty"`
	Coordinates    [2]float64 `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
	MismatchMeters float64    `bson:"mismatchMeters,omitempty" json:"mismatchMeters,omitempty"`
	Flagged        bool       `bson:"flagged,omitempty" json:"flagged,omitempty"`
}

type IssueFlag struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	IssueID    primitive.ObjectID `bson:"issueId" json:"issueId"`
	ReporterID string             `bson:"reporterId" json:"reporterId"`
	Reason     string             `bson:"reason" json:"reason"`
	CreatedAt  time.Time          `bson:"createdAt" json:"createdAt"`
	Resolved   bool               `bson:"resolved" json:"resolved"`
}

type IssueEvent struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	IssueID   primitive.ObjectID `bson:"issueId" json:"issueId"`
	ActorID   string             `bson:"actorId" json:"actorId"`
	Action    string             `bson:"action" json:"action"`
	Notes     string             `bson:"notes,omitempty" json:"notes,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
