package repository

import (
	"context"
	"strings"
	"time"

	"civic/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoUserRepository struct {
	col *mongo.Collection
}

func NewMongoUserRepository(db *mongo.Database) *MongoUserRepository {
	return &MongoUserRepository{col: db.Collection("users")}
}

func (r *MongoUserRepository) EnsureIndexes(ctx context.Context) error {
	models := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetName("email_unique").SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "createdAt", Value: -1}},
			Options: options.Index().SetName("createdAt_desc"),
		},
	}

	_, err := r.col.Indexes().CreateMany(ctx, models)
	return err
}

func (r *MongoUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	key := normalizeEmail(email)
	if key == "" {
		return nil, ErrNotFound
	}

	var user domain.User
	err := r.col.FindOne(ctx, bson.M{"email": key}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *MongoUserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return nil, ErrNotFound
	}

	var user domain.User
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *MongoUserRepository) Create(ctx context.Context, user *domain.User) error {
	if user == nil {
		return nil
	}

	user.ID = strings.TrimSpace(user.ID)
	user.Email = normalizeEmail(user.Email)

	if user.ID == "" || user.Email == "" {
		return nil
	}

	now := time.Now().UTC()
	if user.CreatedAt.IsZero() {
		user.CreatedAt = now
	}
	user.UpdatedAt = now

	_, err := r.col.InsertOne(ctx, user)
	if mongo.IsDuplicateKeyError(err) {
		return ErrAlreadyExists
	}
	return err
}

func (r *MongoUserRepository) UpdateProfile(ctx context.Context, id, name, email string) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return ErrNotFound
	}

	update := bson.M{"updatedAt": time.Now().UTC()}
	if strings.TrimSpace(name) != "" {
		update["name"] = strings.TrimSpace(name)
	}
	if strings.TrimSpace(email) != "" {
		update["email"] = normalizeEmail(email)
	}
	if len(update) == 1 {
		return nil
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": update})
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return ErrAlreadyExists
		}
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoUserRepository) UpdatePassword(ctx context.Context, id, passwordHash string) error {
	id = strings.TrimSpace(id)
	if id == "" || strings.TrimSpace(passwordHash) == "" {
		return ErrNotFound
	}

	update := bson.M{
		"$set": bson.M{
			"passwordHash": passwordHash,
			"updatedAt":    time.Now().UTC(),
		},
	}

	res, err := r.col.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoUserRepository) DeleteByID(ctx context.Context, id string) error {
	id = strings.TrimSpace(id)
	if id == "" {
		return ErrNotFound
	}

	res, err := r.col.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *MongoUserRepository) BackfillAuthoritySubRole(ctx context.Context, subRole domain.AuthoritySubRole) (int64, error) {
	filter := bson.M{
		"role": string(domain.RoleAuthority),
		"$or": []bson.M{
			{"authoritySubRole": bson.M{"$exists": false}},
			{"authoritySubRole": ""},
		},
	}
	update := bson.M{
		"$set": bson.M{
			"authoritySubRole": string(subRole),
			"updatedAt":        time.Now().UTC(),
		},
	}
	result, err := r.col.UpdateMany(ctx, filter, update)
	if err != nil {
		return 0, err
	}
	return result.ModifiedCount, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
