package repository

import (
	"context"
	"time"

	"civic/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoIssueRepository struct {
	col *mongo.Collection
}

func NewMongoIssueRepository(db *mongo.Database) *MongoIssueRepository {
	return &MongoIssueRepository{col: db.Collection("issues")}
}

func (r *MongoIssueRepository) EnsureIndexes(ctx context.Context) error {
	models := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "location", Value: "2dsphere"}},
			Options: options.Index().SetName("location_2dsphere"),
		},
		{
			Keys:    bson.D{{Key: "status", Value: 1}},
			Options: options.Index().SetName("status_idx"),
		},
		{
			Keys:    bson.D{{Key: "departmentId", Value: 1}, {Key: "status", Value: 1}, {Key: "priorityScore", Value: -1}},
			Options: options.Index().SetName("dept_status_priority"),
		},
		{
			Keys:    bson.D{{Key: "createdAt", Value: -1}},
			Options: options.Index().SetName("createdAt_desc"),
		},
	}

	_, err := r.col.Indexes().CreateMany(ctx, models)
	return err
}

func (r *MongoIssueRepository) FindNearbyActive(ctx context.Context, location domain.GeoPoint, departmentID string, radiusMeters int64, statuses []domain.IssueStatus) (*domain.Issue, error) {
	filter := bson.M{
		"location": bson.M{
			"$nearSphere": bson.M{
				"$geometry":    bson.M{"type": "Point", "coordinates": location.Coordinates},
				"$maxDistance": radiusMeters,
			},
		},
		"status":   bson.M{"$in": statuses},
		"isMerged": bson.M{"$ne": true},
	}
	if departmentID != "" {
		filter["departmentId"] = departmentID
	}

	var issue domain.Issue
	err := r.col.FindOne(ctx, filter).Decode(&issue)
	if err == mongo.ErrNoDocuments {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &issue, nil
}

func (r *MongoIssueRepository) Create(ctx context.Context, issue *domain.Issue) error {
	if issue == nil {
		return nil
	}

	res, err := r.col.InsertOne(ctx, issue)
	if err != nil {
		return err
	}
	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		issue.ID = oid
	}
	return nil
}

func (r *MongoIssueRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Issue, error) {
	var issue domain.Issue
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&issue)
	if err == mongo.ErrNoDocuments {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &issue, nil
}

func (r *MongoIssueRepository) ListPublicNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error) {
	filter := bson.M{
		"location": bson.M{
			"$nearSphere": bson.M{
				"$geometry":    bson.M{"type": "Point", "coordinates": location.Coordinates},
				"$maxDistance": radiusMeters,
			},
		},
		"status":   bson.M{"$in": statuses},
		"isMerged": bson.M{"$ne": true},
	}

	opts := options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []*domain.Issue
	for cur.Next(ctx) {
		var issue domain.Issue
		if err := cur.Decode(&issue); err != nil {
			return nil, err
		}
		out = append(out, &issue)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MongoIssueRepository) ListCitizenNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, userID string, publicStatuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error) {
	filter := bson.M{
		"location": bson.M{
			"$nearSphere": bson.M{
				"$geometry":    bson.M{"type": "Point", "coordinates": location.Coordinates},
				"$maxDistance": radiusMeters,
			},
		},
		"isMerged": bson.M{"$ne": true},
		"$or": []bson.M{
			{
				"status": bson.M{"$in": publicStatuses},
			},
			{
				"status":          domain.StatusPendingApproval,
				"createdByUserId": userID,
			},
		},
	}

	opts := options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []*domain.Issue
	for cur.Next(ctx) {
		var issue domain.Issue
		if err := cur.Decode(&issue); err != nil {
			return nil, err
		}
		out = append(out, &issue)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MongoIssueRepository) ListAuthorityByDepartment(ctx context.Context, departmentID, authorityID string, statuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error) {
	filter := bson.M{
		"departmentId":                 departmentID,
		"authority.assignedToWorkerId": authorityID,
		"status":                       bson.M{"$in": statuses},
		"isMerged":                     bson.M{"$ne": true},
	}

	opts := options.Find().SetLimit(limit).SetSort(bson.D{{Key: "priorityScore", Value: -1}, {Key: "createdAt", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []*domain.Issue
	for cur.Next(ctx) {
		var issue domain.Issue
		if err := cur.Decode(&issue); err != nil {
			return nil, err
		}
		out = append(out, &issue)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MongoIssueRepository) ListPending(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error) {
	filter := bson.M{
		"status":       domain.StatusPendingApproval,
		"departmentId": departmentID,
		"isMerged":     bson.M{"$ne": true},
	}
	opts := options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []*domain.Issue
	for cur.Next(ctx) {
		var issue domain.Issue
		if err := cur.Decode(&issue); err != nil {
			return nil, err
		}
		out = append(out, &issue)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MongoIssueRepository) ApproveIssue(ctx context.Context, id primitive.ObjectID, adminID, departmentID, severity, workerID string, reviewedAt time.Time) error {
	filter := bson.M{
		"_id":          id,
		"status":       domain.StatusPendingApproval,
		"departmentId": departmentID,
		"isMerged":     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":                       domain.StatusAssigned,
			"statusUpdatedAt":              reviewedAt,
			"departmentId":                 departmentID,
			"severity":                     severity,
			"moderation.reviewedByHeadId":  adminID,
			"moderation.reviewedAt":        reviewedAt,
			"authority.assignedToWorkerId": workerID,
			"updatedAt":                    reviewedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) RejectIssue(ctx context.Context, id primitive.ObjectID, adminID, departmentID, reason string, reviewedAt time.Time) error {
	filter := bson.M{
		"_id":          id,
		"status":       domain.StatusPendingApproval,
		"departmentId": departmentID,
		"isMerged":     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":                      domain.StatusRejected,
			"statusUpdatedAt":             reviewedAt,
			"moderation.reviewedByHeadId": adminID,
			"moderation.reviewedAt":       reviewedAt,
			"moderation.rejectionReason":  reason,
			"updatedAt":                   reviewedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) AssignIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID string, assignedAt time.Time) error {
	filter := bson.M{
		"_id":          id,
		"status":       domain.StatusApproved,
		"departmentId": departmentID,
		"isMerged":     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":                       domain.StatusAssigned,
			"statusUpdatedAt":              assignedAt,
			"authority.assignedToWorkerId": authorityID,
			"updatedAt":                    assignedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) StartIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID string, startedAt time.Time) error {
	filter := bson.M{
		"_id":                          id,
		"status":                       domain.StatusAssigned,
		"departmentId":                 departmentID,
		"authority.assignedToWorkerId": authorityID,
		"isMerged":                     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":              domain.StatusInProgress,
			"statusUpdatedAt":     startedAt,
			"authority.startedAt": startedAt,
			"updatedAt":           startedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) ResolveIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID, notes string, resolvedAt time.Time) error {
	filter := bson.M{
		"_id":                          id,
		"status":                       domain.StatusInProgress,
		"departmentId":                 departmentID,
		"authority.assignedToWorkerId": authorityID,
		"isMerged":                     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":                    domain.StatusResolved,
			"statusUpdatedAt":           resolvedAt,
			"authority.resolutionNotes": notes,
			"authority.resolvedAt":      resolvedAt,
			"updatedAt":                 resolvedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) ConfirmResolution(ctx context.Context, id primitive.ObjectID, reporterID string, confirmedAt time.Time) error {
	filter := bson.M{
		"_id":             id,
		"status":          domain.StatusResolved,
		"createdByUserId": reporterID,
		"isMerged":        bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":                                 domain.StatusAwaitingHeadClose,
			"statusUpdatedAt":                        confirmedAt,
			"reporterConfirmation.confirmedAt":       confirmedAt,
			"reporterConfirmation.confirmedByUserId": reporterID,
			"updatedAt":                              confirmedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) CloseIssue(ctx context.Context, id primitive.ObjectID, departmentID string, closedAt time.Time) error {
	filter := bson.M{
		"_id":          id,
		"status":       domain.StatusAwaitingHeadClose,
		"departmentId": departmentID,
		"isMerged":     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":          domain.StatusClosed,
			"statusUpdatedAt": closedAt,
			"closedAt":        closedAt,
			"updatedAt":       closedAt,
		},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) AddSupporter(ctx context.Context, id primitive.ObjectID, userID string, allowedStatuses []domain.IssueStatus) (bool, error) {
	filter := bson.M{
		"_id":              id,
		"status":           bson.M{"$in": allowedStatuses},
		"supporterUserIds": bson.M{"$ne": userID},
		"isMerged":         bson.M{"$ne": true},
	}
	update := bson.M{
		"$addToSet": bson.M{"supporterUserIds": userID},
		"$inc":      bson.M{"supporterCount": 1},
		"$set":      bson.M{"updatedAt": time.Now()},
	}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return false, err
	}
	return res.ModifiedCount > 0, nil
}

func (r *MongoIssueRepository) MarkMerged(ctx context.Context, id, canonicalID primitive.ObjectID) error {
	update := bson.M{
		"$set": bson.M{
			"isMerged":          true,
			"mergedIntoIssueId": canonicalID,
			"updatedAt":         time.Now(),
		},
	}

	_, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, update)
	return err
}
