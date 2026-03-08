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

type MongoFlagRepository struct {
	col *mongo.Collection
}

func NewMongoFlagRepository(db *mongo.Database) *MongoFlagRepository {
	return &MongoFlagRepository{col: db.Collection("issue_flags")}
}

func (r *MongoFlagRepository) EnsureIndexes(ctx context.Context) error {
	models := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "issueId", Value: 1}, {Key: "createdAt", Value: -1}},
			Options: options.Index().SetName("issue_createdAt"),
		},
		{
			Keys:    bson.D{{Key: "resolved", Value: 1}, {Key: "createdAt", Value: -1}},
			Options: options.Index().SetName("resolved_createdAt"),
		},
	}
	_, err := r.col.Indexes().CreateMany(ctx, models)
	return err
}

func (r *MongoFlagRepository) Create(ctx context.Context, flag *domain.IssueFlag) error {
	if flag == nil {
		return nil
	}
	res, err := r.col.InsertOne(ctx, flag)
	if err != nil {
		return err
	}
	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		flag.ID = oid
	}
	return nil
}

func (r *MongoFlagRepository) ListOpen(ctx context.Context, limit int64) ([]*domain.IssueFlag, error) {
	if limit <= 0 {
		limit = 100
	}
	cur, err := r.col.Find(ctx, bson.M{"resolved": false}, options.Find().SetLimit(limit).SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]*domain.IssueFlag, 0)
	for cur.Next(ctx) {
		var flag domain.IssueFlag
		if err := cur.Decode(&flag); err != nil {
			return nil, err
		}
		out = append(out, &flag)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MongoFlagRepository) Resolve(ctx context.Context, id primitive.ObjectID, resolverID, resolution string, resolvedAt time.Time) (*domain.IssueFlag, error) {
	var existing domain.IssueFlag
	if err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&existing); err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if existing.Resolved {
		return &existing, nil
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id, "resolved": false}, bson.M{
		"$set": bson.M{
			"resolved":        true,
			"resolvedAt":      resolvedAt,
			"resolvedBy":      resolverID,
			"resolutionNotes": resolution,
		},
	})
	if err != nil {
		return nil, err
	}
	if res.ModifiedCount == 0 {
		_ = r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&existing)
		return &existing, nil
	}

	existing.Resolved = true
	existing.ResolvedAt = &resolvedAt
	existing.ResolvedBy = resolverID
	existing.Resolution = resolution
	return &existing, nil
}
