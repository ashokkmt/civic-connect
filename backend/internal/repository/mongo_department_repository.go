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

type MongoDepartmentRepository struct {
	col *mongo.Collection
}

func NewMongoDepartmentRepository(db *mongo.Database) *MongoDepartmentRepository {
	return &MongoDepartmentRepository{col: db.Collection("departments")}
}

func (r *MongoDepartmentRepository) EnsureIndexes(ctx context.Context) error {
	models := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "key", Value: 1}},
			Options: options.Index().SetName("key_unique").SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "createdAt", Value: -1}},
			Options: options.Index().SetName("createdAt_desc"),
		},
	}

	_, err := r.col.Indexes().CreateMany(ctx, models)
	return err
}

func (r *MongoDepartmentRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.Department, error) {
	var dept domain.Department
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&dept)
	if err == mongo.ErrNoDocuments {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *MongoDepartmentRepository) Create(ctx context.Context, dept *domain.Department) error {
	if dept == nil {
		return nil
	}

	now := time.Now().UTC()
	if dept.CreatedAt.IsZero() {
		dept.CreatedAt = now
	}
	dept.UpdatedAt = now

	res, err := r.col.InsertOne(ctx, dept)
	if mongo.IsDuplicateKeyError(err) {
		return ErrAlreadyExists
	}
	if err != nil {
		return err
	}
	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		dept.ID = oid
	}
	return nil
}
