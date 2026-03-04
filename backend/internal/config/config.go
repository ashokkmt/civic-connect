package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	HTTPPort                string
	MongoURI                string
	MongoDatabase           string
	RequestIDHeader         string
	ShutdownTimeoutSec      int
	JWTSecret               string
	JWTTTLMinutes           int
	AdminRegistrationSecret string
	PrioritySupporterWeight float64
	PriorityDaysOpenWeight  float64
	PrioritySeverityWeight  float64
	PrioritySlaWeight       float64
}

func Load() (Config, error) {
	cfg := Config{
		HTTPPort:                getEnv("HTTP_PORT", "8080"),
		MongoURI:                getEnv("MONGODB_URI", ""),
		MongoDatabase:           getEnv("MONGODB_DATABASE", ""),
		RequestIDHeader:         getEnv("REQUEST_ID_HEADER", "X-Request-Id"),
		ShutdownTimeoutSec:      getEnvInt("SHUTDOWN_TIMEOUT_SEC", 15),
		JWTSecret:               getEnv("JWT_SECRET", ""),
		JWTTTLMinutes:           getEnvInt("JWT_TTL_MINUTES", 60),
		AdminRegistrationSecret: getEnv("ADMIN_REGISTRATION_SECRET", ""),
		PrioritySupporterWeight: getEnvFloat("PRIORITY_SUPPORTER_WEIGHT", 1),
		PriorityDaysOpenWeight:  getEnvFloat("PRIORITY_DAYS_OPEN_WEIGHT", 1),
		PrioritySeverityWeight:  getEnvFloat("PRIORITY_SEVERITY_WEIGHT", 1),
		PrioritySlaWeight:       getEnvFloat("PRIORITY_SLA_VIOLATION_WEIGHT", 1),
	}

	if strings.TrimSpace(cfg.MongoURI) == "" {
		return Config{}, errors.New("MONGODB_URI is required")
	}
	if strings.TrimSpace(cfg.MongoDatabase) == "" {
		return Config{}, errors.New("MONGODB_DATABASE is required")
	}
	if strings.TrimSpace(cfg.JWTSecret) == "" {
		return Config{}, errors.New("JWT_SECRET is required")
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

func getEnvFloat(key string, fallback float64) float64 {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return fallback
	}
	return parsed
}
