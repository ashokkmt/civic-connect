package repository

import (
	"context"
	"strings"
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

func (r *MongoIssueRepository) ListPublicNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, limit int64, offset int64, filters PublicIssueFilters) ([]*domain.Issue, error) {
	filter := buildPublicFilter(location, radiusMeters, statuses, filters)

	opts := options.Find().SetLimit(limit).SetSkip(offset).SetSort(bson.D{{Key: "createdAt", Value: -1}})
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

func (r *MongoIssueRepository) StatsPublicNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, filters PublicIssueFilters) (PublicIssueStats, error) {
	filter := buildPublicFilter(location, radiusMeters, statuses, filters)
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$status",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil {
		return PublicIssueStats{}, err
	}
	defer cur.Close(ctx)

	stats := PublicIssueStats{}
	for cur.Next(ctx) {
		var row struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := cur.Decode(&row); err != nil {
			return PublicIssueStats{}, err
		}
		stats.Total += row.Count
		switch row.ID {
		case string(domain.StatusPendingApproval):
			stats.PendingApprovals += row.Count
		case string(domain.StatusInProgress):
			stats.InProgress += row.Count
		case string(domain.StatusResolved), string(domain.StatusClosed):
			stats.Resolved += row.Count
		}
	}
	if err := cur.Err(); err != nil {
		return PublicIssueStats{}, err
	}
	return stats, nil
}

func buildPublicFilter(location domain.GeoPoint, radiusMeters int64, statuses []domain.IssueStatus, filters PublicIssueFilters) bson.M {
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

	if len(filters.Severities) > 0 {
		filter["severity"] = bson.M{"$in": filters.Severities}
	}
	if len(filters.Categories) > 0 {
		filter["category"] = bson.M{"$in": filters.Categories}
	}
	if filters.DateFrom != nil || filters.DateTo != nil {
		rangeFilter := bson.M{}
		if filters.DateFrom != nil {
			rangeFilter["$gte"] = *filters.DateFrom
		}
		if filters.DateTo != nil {
			rangeFilter["$lte"] = *filters.DateTo
		}
		filter["createdAt"] = rangeFilter
	}

	return filter
}

func (r *MongoIssueRepository) ListCitizenNearby(ctx context.Context, location domain.GeoPoint, radiusMeters int64, userID string, publicStatuses []domain.IssueStatus, limit int64) ([]*domain.Issue, error) {
	_ = userID

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
				"status": domain.StatusPendingApproval,
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

func (r *MongoIssueRepository) ListByReporter(ctx context.Context, reporterID string, limit int64) ([]*domain.Issue, error) {
	if strings.TrimSpace(reporterID) == "" {
		return nil, nil
	}
	if limit <= 0 {
		limit = 100
	}

	filter := bson.M{
		"createdByUserId": reporterID,
		"isMerged":        bson.M{"$ne": true},
	}

	cur, err := r.col.Find(ctx, filter, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]*domain.Issue, 0)
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
		"departmentId": departmentID,
		"status":       bson.M{"$in": statuses},
		"isMerged":     bson.M{"$ne": true},
	}
	if strings.TrimSpace(authorityID) != "" {
		filter["authority.assignedToWorkerId"] = authorityID
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
			"lifecycle.approvedAt":         reviewedAt,
			"lifecycle.assignedAt":         reviewedAt,
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

func (r *MongoIssueRepository) StartIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID string, startedAt time.Time, deadlineAt *time.Time) error {
	filter := bson.M{
		"_id":                          id,
		"status":                       domain.StatusAssigned,
		"departmentId":                 departmentID,
		"authority.assignedToWorkerId": authorityID,
		"isMerged":                     bson.M{"$ne": true},
	}
	set := bson.M{
		"status":              domain.StatusInProgress,
		"statusUpdatedAt":     startedAt,
		"authority.startedAt": startedAt,
		"lifecycle.startedAt": startedAt,
		"updatedAt":           startedAt,
	}
	if deadlineAt != nil {
		set["authority.deadlineAt"] = *deadlineAt
	}
	update := bson.M{"$set": set}

	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}
	if res.ModifiedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) ResolveIssue(ctx context.Context, id primitive.ObjectID, departmentID, authorityID, notes string, resolutionImageURLs []string, resolvedAt time.Time) error {
	filter := bson.M{
		"_id":                          id,
		"status":                       domain.StatusInProgress,
		"departmentId":                 departmentID,
		"authority.assignedToWorkerId": authorityID,
		"isMerged":                     bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"status":                        domain.StatusResolved,
			"statusUpdatedAt":               resolvedAt,
			"authority.resolutionNotes":     notes,
			"authority.resolutionImageUrls": resolutionImageURLs,
			"authority.resolvedAt":          resolvedAt,
			"lifecycle.resolvedAt":          resolvedAt,
			"updatedAt":                     resolvedAt,
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
			"lifecycle.confirmedAt":                  confirmedAt,
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
			"status":             domain.StatusClosed,
			"statusUpdatedAt":    closedAt,
			"closedAt":           closedAt,
			"lifecycle.closedAt": closedAt,
			"updatedAt":          closedAt,
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

func (r *MongoIssueRepository) HasSupporter(ctx context.Context, id primitive.ObjectID, userID string) (bool, error) {
	count, err := r.col.CountDocuments(ctx, bson.M{
		"_id":              id,
		"supporterUserIds": userID,
		"isMerged":         bson.M{"$ne": true},
	})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *MongoIssueRepository) DeleteByIDAndReporter(ctx context.Context, id primitive.ObjectID, reporterID string) error {
	res, err := r.col.DeleteOne(ctx, bson.M{
		"_id":             id,
		"createdByUserId": reporterID,
		"isMerged":        bson.M{"$ne": true},
	})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
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

func (r *MongoIssueRepository) UpdatePriorityScore(ctx context.Context, id primitive.ObjectID, score float64, updatedAt time.Time) error {
	filter := bson.M{
		"_id":      id,
		"isMerged": bson.M{"$ne": true},
	}
	update := bson.M{
		"$set": bson.M{
			"priorityScore":     score,
			"priorityUpdatedAt": updatedAt,
			"updatedAt":         updatedAt,
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

func (r *MongoIssueRepository) AdjustFlagsCount(ctx context.Context, id primitive.ObjectID, delta int, updatedAt time.Time) error {
	if delta == 0 {
		return nil
	}
	if delta > 0 {
		res, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "isMerged": bson.M{"$ne": true}}, bson.M{
			"$inc": bson.M{"flagsCount": delta},
			"$set": bson.M{"updatedAt": updatedAt},
		})
		if err != nil {
			return err
		}
		if res.MatchedCount == 0 {
			return ErrNotFound
		}
		return nil
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "isMerged": bson.M{"$ne": true}}, bson.M{
		"$inc": bson.M{"flagsCount": delta},
		"$set": bson.M{"updatedAt": updatedAt},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	_, _ = r.col.UpdateOne(ctx, bson.M{"_id": id, "flagsCount": bson.M{"$lt": 0}}, bson.M{"$set": bson.M{"flagsCount": 0}})
	return nil
}

func (r *MongoIssueRepository) ListFlagged(ctx context.Context, limit int64) ([]*domain.Issue, error) {
	if limit <= 0 {
		limit = 100
	}
	cur, err := r.col.Find(ctx, bson.M{
		"isMerged":   bson.M{"$ne": true},
		"flagsCount": bson.M{"$gt": 0},
	}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "flagsCount", Value: -1}, {Key: "updatedAt", Value: -1}}))
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

func (r *MongoIssueRepository) ListEscalated(ctx context.Context, departmentID string, limit int64) ([]*domain.Issue, error) {
	if limit <= 0 {
		limit = 100
	}
	filter := bson.M{
		"isMerged":        bson.M{"$ne": true},
		"slaViolation":    true,
		"status":          bson.M{"$ne": domain.StatusClosed},
		"escalationLevel": bson.M{"$gt": 0},
	}
	if strings.TrimSpace(departmentID) != "" {
		filter["departmentId"] = departmentID
	}
	cur, err := r.col.Find(ctx, filter, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "escalationLevel", Value: -1}, {Key: "escalatedAt", Value: -1}}))
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

func (r *MongoIssueRepository) ListDeadlineOverdueActive(ctx context.Context, now time.Time, limit int64) ([]*domain.Issue, error) {
	if limit <= 0 {
		limit = 200
	}

	filter := bson.M{
		"isMerged":             bson.M{"$ne": true},
		"status":               bson.M{"$in": []domain.IssueStatus{domain.StatusAssigned, domain.StatusInProgress}},
		"authority.deadlineAt": bson.M{"$lte": now, "$ne": nil},
		"escalationLevel":      bson.M{"$lt": 1},
	}

	cur, err := r.col.Find(ctx, filter, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "authority.deadlineAt", Value: 1}}))
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

func (r *MongoIssueRepository) AutoTransitionResolvedToAwaitingHeadClose(ctx context.Context, resolvedBefore time.Time, transitionedAt time.Time, limit int64) (int64, error) {
	if limit <= 0 {
		limit = 200
	}

	filter := bson.M{
		"isMerged": bson.M{"$ne": true},
		"status":   domain.StatusResolved,
		"$or": []bson.M{
			{"lifecycle.resolvedAt": bson.M{"$lte": resolvedBefore, "$ne": nil}},
			{"statusUpdatedAt": bson.M{"$lte": resolvedBefore}},
		},
	}

	cur, err := r.col.Find(ctx, filter, options.Find().SetLimit(limit).SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return 0, err
	}
	defer cur.Close(ctx)

	ids := make([]primitive.ObjectID, 0, limit)
	for cur.Next(ctx) {
		var row struct {
			ID primitive.ObjectID `bson:"_id"`
		}
		if err := cur.Decode(&row); err != nil {
			return 0, err
		}
		ids = append(ids, row.ID)
	}
	if err := cur.Err(); err != nil {
		return 0, err
	}
	if len(ids) == 0 {
		return 0, nil
	}

	res, err := r.col.UpdateMany(ctx, bson.M{
		"_id":      bson.M{"$in": ids},
		"status":   domain.StatusResolved,
		"isMerged": bson.M{"$ne": true},
	}, bson.M{
		"$set": bson.M{
			"status":                                 domain.StatusAwaitingHeadClose,
			"statusUpdatedAt":                        transitionedAt,
			"reporterConfirmation.confirmedAt":       transitionedAt,
			"reporterConfirmation.confirmedByUserId": "SYSTEM_AUTO_FALLBACK",
			"lifecycle.confirmedAt":                  transitionedAt,
			"updatedAt":                              transitionedAt,
		},
	})
	if err != nil {
		return 0, err
	}

	return res.ModifiedCount, nil
}

func (r *MongoIssueRepository) UpdateEscalation(ctx context.Context, id primitive.ObjectID, violation bool, level int, stage string, escalatedAt *time.Time, updatedAt time.Time) error {
	set := bson.M{
		"slaViolation":    violation,
		"escalationLevel": level,
		"slaStage":        stage,
		"updatedAt":       updatedAt,
	}
	if escalatedAt != nil {
		set["escalatedAt"] = *escalatedAt
	} else {
		set["escalatedAt"] = nil
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "isMerged": bson.M{"$ne": true}}, bson.M{"$set": set})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) ResolveEscalation(ctx context.Context, id primitive.ObjectID, updatedAt time.Time) error {
	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "isMerged": bson.M{"$ne": true}}, bson.M{
		"$set": bson.M{
			"slaViolation":    false,
			"escalationLevel": 0,
			"slaStage":        "",
			"escalatedAt":     nil,
			"updatedAt":       updatedAt,
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) ReassignWorker(ctx context.Context, id primitive.ObjectID, departmentID, workerID string, updatedAt time.Time) error {
	res, err := r.col.UpdateOne(ctx, bson.M{
		"_id":          id,
		"departmentId": departmentID,
		"status":       bson.M{"$in": []domain.IssueStatus{domain.StatusAssigned, domain.StatusInProgress}},
		"slaViolation": true,
		"isMerged":     bson.M{"$ne": true},
	}, bson.M{
		"$set": bson.M{
			"authority.assignedToWorkerId": workerID,
			"updatedAt":                    updatedAt,
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) EscalateByHead(ctx context.Context, id primitive.ObjectID, departmentID, reason string, escalatedAt time.Time) error {
	res, err := r.col.UpdateOne(ctx, bson.M{
		"_id":          id,
		"departmentId": departmentID,
		"status":       bson.M{"$nin": []domain.IssueStatus{domain.StatusClosed, domain.StatusRejected}},
		"isMerged":     bson.M{"$ne": true},
	}, bson.M{
		"$set": bson.M{
			"slaViolation":     true,
			"escalationLevel":  2,
			"slaStage":         "HEAD_ESCALATED",
			"escalatedAt":      escalatedAt,
			"escalationReason": reason,
			"updatedAt":        escalatedAt,
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) ReassignDepartment(ctx context.Context, id primitive.ObjectID, newDepartmentID, reason string, updatedAt time.Time) error {
	set := bson.M{
		"departmentId":         newDepartmentID,
		"escalationReason":     reason,
		"updatedAt":            updatedAt,
		"authority.startedAt":  nil,
		"authority.resolvedAt": nil,
	}

	res, err := r.col.UpdateOne(ctx, bson.M{
		"_id":             id,
		"isMerged":        bson.M{"$ne": true},
		"escalationLevel": bson.M{"$gt": 0},
		"slaViolation":    true,
	}, bson.M{
		"$set": set,
		"$unset": bson.M{
			"authority.assignedToWorkerId": "",
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) MarkNotifiedHead(ctx context.Context, id primitive.ObjectID, actorID string, notifiedAt time.Time) error {
	res, err := r.col.UpdateOne(ctx, bson.M{
		"_id":             id,
		"isMerged":        bson.M{"$ne": true},
		"escalationLevel": bson.M{"$gt": 0},
	}, bson.M{
		"$set": bson.M{
			"notifiedHeadAt": notifiedAt,
			"notifiedHeadBy": actorID,
			"updatedAt":      notifiedAt,
		},
	})
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoIssueRepository) CountByDepartment(ctx context.Context, departmentID string, statuses []domain.IssueStatus) (int64, error) {
	filter := bson.M{
		"departmentId": departmentID,
		"isMerged":     bson.M{"$ne": true},
	}
	if len(statuses) > 0 {
		filter["status"] = bson.M{"$in": statuses}
	}
	count, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return 0, err
	}
	return count, nil
}
