package priority

import (
	"math"
	"strconv"
	"strings"
	"time"

	"civic/internal/domain"
)

type Weights struct {
	Supporter float64
	DaysOpen  float64
	Severity  float64
	SlaBoost  float64
}

func Score(issue *domain.Issue, now time.Time, weights Weights) float64 {
	if issue == nil {
		return 0
	}
	supporters := float64(issue.SupporterCount)
	ageDays := daysOpen(issue.CreatedAt, now)
	severity := severityValue(issue.Severity)

	slaBoost := 0.0
	if issue.SlaViolation {
		slaBoost = weights.SlaBoost
	}

	return (supporters * weights.Supporter) + (ageDays * weights.DaysOpen) + (severity * weights.Severity) + slaBoost
}

func daysOpen(createdAt, now time.Time) float64 {
	if now.Before(createdAt) {
		return 0
	}
	return math.Floor(now.Sub(createdAt).Hours() / 24)
}

func severityValue(severity string) float64 {
	clean := strings.TrimSpace(strings.ToLower(severity))
	if clean == "" {
		return 0
	}
	if num, err := strconv.ParseFloat(clean, 64); err == nil {
		return num
	}

	switch clean {
	case "low":
		return 1
	case "medium", "med":
		return 2
	case "high":
		return 3
	case "critical", "crit":
		return 4
	default:
		return 0
	}
}
