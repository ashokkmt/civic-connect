package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	HTTPPort           string
	MongoURI           string
	MongoDatabase      string
	RequestIDHeader    string
	ShutdownTimeoutSec int
}

func Load() (Config, error) {
	cfg := Config{
		HTTPPort:           getEnv("HTTP_PORT", "8080"),
		MongoURI:           getEnv("MONGODB_URI", ""),
		MongoDatabase:      getEnv("MONGODB_DATABASE", ""),
		RequestIDHeader:    getEnv("REQUEST_ID_HEADER", "X-Request-Id"),
		ShutdownTimeoutSec: getEnvInt("SHUTDOWN_TIMEOUT_SEC", 15),
	}

	if strings.TrimSpace(cfg.MongoURI) == "" {
		return Config{}, errors.New("MONGODB_URI is required")
	}
	if strings.TrimSpace(cfg.MongoDatabase) == "" {
		return Config{}, errors.New("MONGODB_DATABASE is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return parsed
}
