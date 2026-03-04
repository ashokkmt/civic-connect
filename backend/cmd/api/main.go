package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"civic/internal/config"
	"civic/internal/domain"
	"civic/internal/https"
	"civic/internal/https/handlers"
	"civic/internal/https/middleware"
	"civic/internal/repository"
	"civic/internal/service"
	"civic/internal/storage"
	"civic/internal/util/jwt"
	"civic/internal/util/priority"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	ctx := context.Background()
	client, db, err := storage.Connect(ctx, storage.MongoConfig{
		URI:      cfg.MongoURI,
		Database: cfg.MongoDatabase,
		Timeout:  10 * time.Second,
	})
	if err != nil {
		log.Fatalf("mongo connect error: %v", err)
	}
	log.Printf("Mongo connected successfully (db=%s)", cfg.MongoDatabase)

	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := client.Disconnect(ctx); err != nil {
			log.Printf("mongo disconnect error: %v", err)
		}
	}()

	jwtManager, err := jwt.NewManager(cfg.JWTSecret, time.Duration(cfg.JWTTTLMinutes)*time.Minute)
	if err != nil {
		log.Fatalf("jwt error: %v", err)
	}

	userRepo := repository.NewMongoUserRepository(db)
	if err := userRepo.EnsureIndexes(ctx); err != nil {
		log.Fatalf("mongo user index error: %v", err)
	}
	if modified, err := userRepo.BackfillAuthoritySubRole(ctx, domain.AuthorityWorker); err != nil {
		log.Printf("authority sub-role backfill error: %v", err)
	} else if modified > 0 {
		log.Printf("authority sub-role backfill: updated %d users", modified)
	}
	authService := service.NewAuthService(userRepo, jwtManager)
	authHandler := handlers.AuthHandler{Auth: authService, AdminRegistrationSecret: cfg.AdminRegistrationSecret}

	issueRepo := repository.NewMongoIssueRepository(db)
	if err := issueRepo.EnsureIndexes(ctx); err != nil {
		log.Fatalf("mongo index error: %v", err)
	}

	deptRepo := repository.NewMongoDepartmentRepository(db)
	if err := deptRepo.EnsureIndexes(ctx); err != nil {
		log.Fatalf("mongo department index error: %v", err)
	}
	deptService := service.NewDepartmentService(deptRepo)
	adminProvisioning := service.NewAdminProvisioningService(userRepo, deptRepo)
	adminHandler := handlers.AdminHandler{Departments: deptService, Provision: adminProvisioning}
	headProvisioning := service.NewHeadProvisioningService(userRepo, deptRepo)
	headHandler := handlers.HeadHandler{Provision: headProvisioning}

	priorityWeights := priority.Weights{
		Supporter: cfg.PrioritySupporterWeight,
		DaysOpen:  cfg.PriorityDaysOpenWeight,
		Severity:  cfg.PrioritySeverityWeight,
		SlaBoost:  cfg.PrioritySlaWeight,
	}

	issueService := service.NewIssueService(issueRepo, priorityWeights)
	issueHandler := handlers.IssueHandler{Issues: issueService}
	moderationService := service.NewModerationService(issueRepo, userRepo, priorityWeights)
	moderationHandler := handlers.ModerationHandler{Moderation: moderationService}
	authorityService := service.NewAuthorityService(issueRepo, priorityWeights)
	authorityHandler := handlers.AuthorityHandler{Authority: authorityService}

	router := https.NewRouter(https.RouterConfig{
		RequestIDHeader: cfg.RequestIDHeader,
		AuthHandler:     authHandler,
		AuthMiddleware:  middleware.AuthHydrated(jwtManager, userRepo),
		IssueHandler:    issueHandler,
		Moderation:      moderationHandler,
		AdminHandler:    adminHandler,
		Authority:       authorityHandler,
		HeadHandler:     headHandler,
	})

	srv := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s", cfg.HTTPPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)
	<-shutdown

	ctxShutdown, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.ShutdownTimeoutSec)*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctxShutdown); err != nil {
		log.Printf("server shutdown error: %v", err)
	}
}
