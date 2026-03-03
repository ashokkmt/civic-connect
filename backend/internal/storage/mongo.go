package storage

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoConfig struct {
	URI      string
	Database string
	Timeout  time.Duration
}

func Connect(ctx context.Context, cfg MongoConfig) (*mongo.Client, *mongo.Database, error) {
	ctx, cancel := context.WithTimeout(ctx, cfg.Timeout)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.URI))
	if err != nil {
		return nil, nil, err
	}

	// 🔥 Important: actually verify connection
	if err := client.Ping(ctx, nil); err != nil {
		return nil, nil, err
	}

	return client, client.Database(cfg.Database), nil
}
