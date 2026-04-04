SHELL := /bin/bash

.DEFAULT_GOAL := help

BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_BIN := $(BACKEND_DIR)/bin/api

.PHONY: help deps deps-backend deps-frontend update update-backend update-frontend build build-backend build-frontend run run-backend run-frontend test test-backend lint lint-backend lint-frontend fmt fmt-backend clean

help:
	@echo "CivicConnect Make targets"
	@echo "  make deps              Install/download dependencies for backend and frontend"
	@echo "  make update            Update dependencies for backend and frontend"
	@echo "  make build             Build backend and frontend"
	@echo "  make build-backend     Build backend binary -> $(BACKEND_BIN)"
	@echo "  make run               Run backend and frontend together (Ctrl+C to stop both)"
	@echo "  make run-backend       Run backend API server"
	@echo "  make run-frontend      Run frontend dev server"
	@echo "  make test              Run backend tests"
	@echo "  make lint              Run backend vet + frontend lint"
	@echo "  make fmt               Format backend code"
	@echo "  make clean             Remove backend build artifacts and frontend .next output"

deps: deps-backend deps-frontend

deps-backend:
	cd $(BACKEND_DIR) && go mod download

deps-frontend:
	cd $(FRONTEND_DIR) && npm install

update: update-backend update-frontend

update-backend:
	cd $(BACKEND_DIR) && go get -u ./... && go mod tidy

update-frontend:
	cd $(FRONTEND_DIR) && npm update

build: build-backend build-frontend

build-backend:
	mkdir -p $(BACKEND_DIR)/bin
	cd $(BACKEND_DIR) && go build -o bin/api ./cmd/api

build-frontend:
	cd $(FRONTEND_DIR) && npm run build

run:
	@trap 'kill 0' INT TERM EXIT; \
	(cd $(BACKEND_DIR) && go run ./cmd/api) & \
	(cd $(FRONTEND_DIR) && npm run dev) & \
	wait

run-backend:
	cd $(BACKEND_DIR) && go run ./cmd/api

run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

test: test-backend

test-backend:
	cd $(BACKEND_DIR) && go test ./...

lint: lint-backend lint-frontend

lint-backend:
	cd $(BACKEND_DIR) && go vet ./...

lint-frontend:
	cd $(FRONTEND_DIR) && npm run lint

fmt: fmt-backend

fmt-backend:
	cd $(BACKEND_DIR) && go fmt ./...

clean:
	rm -rf $(BACKEND_DIR)/bin $(FRONTEND_DIR)/.next
