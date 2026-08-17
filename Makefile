SHELL := /bin/bash
.PHONY: dev build test lint generate \
	db-up db-down db-migrate db-seed db-reset \
	backup restore \
	api-test api-vet api-build \
	web-lint web-typecheck web-test web-build \
	mcp-lint mcp-test mcp-build \
	docker-build docker-up docker-down

COMPOSE := docker compose
COMPOSE_DEV := docker compose -f docker-compose.dev.yml
API_DIR := apps/api
MIGRATIONS := db/migrations
BACKUP_DIR ?= backups

dev: ## Start local Postgres and print next steps
	$(COMPOSE_DEV) up -d postgres
	@echo ""
	@echo "Postgres is up."
	@echo "  1. cp -n .env.example .env"
	@echo "  2. make db-migrate && make db-seed"
	@echo "  3. (terminal A) make api-dev"
	@echo "  4. (terminal B) npm install && npm run dev -w @team-ops/web"
	@echo "  5. Open http://localhost:3000"
	@echo ""

api-dev:
	cd $(API_DIR) && go run ./cmd/server

build: api-build
	npm run build

test: api-test
	npm run test

lint: api-vet
	npm run lint

db-up:
	$(COMPOSE_DEV) up -d postgres

db-down:
	$(COMPOSE_DEV) down

db-migrate:
	cd $(API_DIR) && go run ./cmd/migrate up

db-seed:
	cd $(API_DIR) && go run ./cmd/seed

db-reset: db-down
	$(COMPOSE_DEV) down -v
	$(COMPOSE_DEV) up -d postgres
	@echo "Waiting for Postgres..."
	@sleep 3
	$(MAKE) db-migrate
	$(MAKE) db-seed

generate:
	sqlc generate
	npm run generate -w @team-ops/api-client

api-test:
	cd $(API_DIR) && go test ./...

api-vet:
	cd $(API_DIR) && go vet ./...

api-build:
	cd $(API_DIR) && go build -o bin/server ./cmd/server

web-lint:
	npm run lint -w @team-ops/web

web-typecheck:
	npm run typecheck -w @team-ops/web

web-test:
	npm run test -w @team-ops/web

web-build:
	npm run build -w @team-ops/web

mcp-lint:
	npm run lint -w @team-ops/mcp

mcp-test:
	npm run test -w @team-ops/mcp

mcp-build:
	npm run build -w @team-ops/mcp

docker-build:
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

backup:
	@mkdir -p $(BACKUP_DIR)
	@ts=$$(date +%Y%m%d-%H%M%S); \
	file="$(BACKUP_DIR)/teamops-$$ts.dump"; \
	echo "Writing $$file"; \
	$(COMPOSE) exec -T postgres pg_dump -U teamops -d teamops -Fc > "$$file"; \
	echo "Backup written to $$file"

restore:
	@test -n "$(FILE)" || (echo "Usage: make restore FILE=backups/teamops-YYYYMMDD.dump" && exit 1)
	$(COMPOSE) exec -T postgres pg_restore -U teamops -d teamops --clean --if-exists < "$(FILE)"
