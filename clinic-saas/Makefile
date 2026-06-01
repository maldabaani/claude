.PHONY: up down restart logs ps build rebuild \
        restart-backend shell-db backend-test frontend-build

# ── Compose lifecycle ───────────────────────────────────────────────────────
up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

# ── Individual service ops ───────────────────────────────────────────────────
restart-backend:
	docker compose restart backend

shell-db:
	docker compose exec postgres psql -U $${POSTGRES_USER:-clinic_admin}

# ── Build helpers ────────────────────────────────────────────────────────────
build:
	docker compose build

rebuild:
	docker compose build --no-cache

# ── Dev / test helpers ───────────────────────────────────────────────────────
backend-test:
	cd backend && mvn --batch-mode --no-transfer-progress verify

frontend-build:
	cd frontend && npm ci && npm run build -- --configuration production
