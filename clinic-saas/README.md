# Clinic SaaS — Medical Clinic Management Platform

A production-grade, multi-tenant **Medical Clinic Management SaaS** built from scratch with a strict enterprise technology stack. This monorepo contains the backend API, frontend SPA, DevOps configuration, and CI/CD pipeline.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Architectural Decisions](#architectural-decisions)
5. [Quick Start — Running Locally](#quick-start--running-locally)
6. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
   - [Phase 1 — DevOps Foundation](#phase-1--devops-foundation)
   - [Phase 2 — Backend Project Files](#phase-2--backend-project-files)
   - [Phase 3 — Multi-Tenancy Engine & Entities](#phase-3--multi-tenancy-engine--entities)
   - [Phase 4 — JPA Config, Security & OpenAPI](#phase-4--jpa-config-security--openapi)
   - [Phase 5 — Business Layer (Exceptions, DTOs, Services, Controllers)](#phase-5--business-layer)
   - [Phase 6 — Database Migrations (Flyway)](#phase-6--database-migrations-flyway)
   - [Phase 7 — Angular Core Layer](#phase-7--angular-core-layer)
   - [Phase 8 — Angular Feature Modules](#phase-8--angular-feature-modules)
7. [Environment Variables Reference](#environment-variables-reference)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [API Reference](#api-reference)
10. [Data Model](#data-model)
11. [Security Model](#security-model)
12. [Development Workflow](#development-workflow)

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend** | Spring Boot | 3.2.x |
| **Language** | Java | 17 (LTS) |
| **Security** | Spring Security + JJWT | 0.12.x |
| **ORM** | Spring Data JPA + Hibernate | 6.x |
| **Database** | PostgreSQL | 16 |
| **Migrations** | Flyway | Auto-run on startup |
| **API Docs** | SpringDoc OpenAPI 3 | 2.5.x |
| **Logging** | Logback + Logstash JSON encoder | Structured JSON in prod |
| **Metrics** | Spring Actuator + Micrometer Prometheus | — |
| **Frontend** | Angular | 17+ (Strict mode, Standalone) |
| **UI Library** | PrimeNG + PrimeFlex + PrimeIcons | 17.x |
| **Scheduler** | FullCalendar (via PrimeNG) | 6.x |
| **Containerization** | Docker + Docker Compose | — |
| **CI/CD** | GitHub Actions → GHCR → VPS SSH deploy | — |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│              Angular 17 SPA (PrimeNG UI)                    │
│   /auth  /dashboard  /patients  /appointments               │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP  /api/v1/*
                         │  Bearer JWT
┌────────────────────────▼────────────────────────────────────┐
│               Spring Boot 3.x Backend                       │
│  JwtAuthFilter → TenantContext → Controller → Service       │
│                                                             │
│  ┌─────────────────┐   ┌─────────────────────────────────┐  │
│  │ Platform EMF    │   │ Tenant Routing EMF              │  │
│  │ (platformEM)    │   │ (tenantEM — routes per request) │  │
│  └────────┬────────┘   └──────────────┬──────────────────┘  │
└───────────┼──────────────────────────┼─────────────────────┘
            │                          │ TenantDataSourceRouter
┌───────────▼──────────┐  ┌───────────▼────────────────────┐
│  clinic_platform DB  │  │  tenant_abc DB  tenant_xyz DB  │
│  (Flyway: platform/) │  │  (Flyway: tenant/ — per tenant)│
│  tenants             │  │  users  patients  appointments │
│  platform_users      │  │                                │
└──────────────────────┘  └────────────────────────────────┘
```

### Multi-Tenancy Model: Separate Database per Tenant

Each onboarded clinic gets its **own isolated PostgreSQL database**. The platform database (`clinic_platform`) is the master registry that stores tenant metadata. When a new tenant is provisioned:

1. Backend creates a new PostgreSQL database dynamically.
2. Flyway runs the tenant migration set against the new database.
3. An initial `ADMIN` user is seeded for the clinic.
4. Tenant metadata is saved to the platform database.

On every authenticated request, the `JwtAuthFilter` reads the `tenantId` claim from the JWT and sets it on `TenantContext` (a `ThreadLocal`). The `TenantDataSourceRouter` (extends `AbstractRoutingDataSource`) then routes all JPA operations for that request to the correct tenant database — **zero cross-tenant data leakage by design**.

---

## Project Structure

```
clinic-saas/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # GitHub Actions pipeline
│
├── backend/                       # Spring Boot 3.x application
│   ├── Dockerfile                 # Multi-stage: Maven cache → JRE 17 Alpine
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/clinicsaas/
│       │   ├── ClinicSaasApplication.java
│       │   ├── config/
│       │   │   ├── DataSourceConfig.java      # Platform + Tenant datasource beans
│       │   │   ├── PlatformJpaConfig.java     # @EnableJpaRepositories for platform
│       │   │   ├── TenantJpaConfig.java       # @EnableJpaRepositories for tenant
│       │   │   ├── SecurityConfig.java        # Spring Security filter chain
│       │   │   └── OpenApiConfig.java         # Swagger UI + JWT scheme
│       │   ├── multitenancy/
│       │   │   ├── TenantContext.java         # ThreadLocal tenant ID
│       │   │   ├── TenantDataSourceRouter.java # AbstractRoutingDataSource
│       │   │   ├── TenantDataSourceManager.java # HikariCP pool manager
│       │   │   └── TenantFlywayMigrator.java  # Per-tenant Flyway runner
│       │   ├── security/
│       │   │   ├── JwtTokenProvider.java      # Token generation & validation
│       │   │   ├── JwtAuthFilter.java         # OncePerRequestFilter
│       │   │   └── AppUserPrincipal.java      # Unified platform+tenant principal
│       │   ├── entities/
│       │   │   ├── platform/  Tenant, PlatformUser
│       │   │   ├── tenant/    User, Patient, Appointment
│       │   │   └── enums/     Role, PlatformRole, AppointmentStatus, Gender, BloodType
│       │   ├── repositories/
│       │   │   ├── platform/  TenantRepository, PlatformUserRepository
│       │   │   └── tenant/    UserRepository, PatientRepository, AppointmentRepository
│       │   ├── services/      AuthService, TenantService, PatientService, AppointmentService
│       │   ├── controllers/   AuthController, TenantController, PatientController, AppointmentController
│       │   ├── dtos/
│       │   │   ├── request/   LoginRequest, CreateTenantRequest, CreatePatientRequest, CreateAppointmentRequest
│       │   │   └── response/  AuthResponse, TenantResponse, PatientResponse, AppointmentResponse
│       │   └── exceptions/    GlobalExceptionHandler, ResourceNotFoundException, BadRequestException, TenantProvisioningException
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           ├── application-prod.yml
│           ├── logback-spring.xml
│           └── db/
│               ├── platform/migration/  V1__create_tenants_table.sql, V2__create_platform_users_table.sql
│               └── tenant/migration/    V1__create_users_table.sql, V2__create_patients_table.sql, V3__create_appointments_table.sql
│
├── frontend/                      # Angular 17+ application
│   ├── Dockerfile                 # Multi-stage: Node 20 build → Nginx Alpine serve
│   ├── nginx.conf                 # SPA fallback + /api proxy + gzip + static caching
│   ├── angular.json
│   ├── tsconfig.json              # strict: true
│   ├── package.json               # PrimeNG, PrimeFlex, FullCalendar
│   └── src/
│       ├── main.ts
│       ├── styles.scss
│       └── app/
│           ├── app.component.ts
│           ├── app.config.ts      # provideRouter, provideHttpClient with interceptors
│           ├── app.routes.ts      # Lazy-loaded route tree
│           ├── core/
│           │   ├── interceptors/  jwt.interceptor.ts, error.interceptor.ts
│           │   ├── guards/        auth.guard.ts, role.guard.ts
│           │   ├── services/      auth.service.ts
│           │   └── models/        user.model.ts, patient.model.ts, appointment.model.ts, api-response.model.ts
│           ├── layouts/
│           │   ├── auth-layout/   Centered card wrapper for public routes
│           │   └── dashboard-layout/ Fixed sidebar + topbar shell
│           └── features/
│               ├── auth/          login/  (+ auth.routes.ts)
│               ├── dashboard/     KPI cards home page
│               ├── patients/      patient-list/, patient-create/, patient.service.ts
│               └── appointments/  appointment-scheduler/ (FullCalendar), appointment.service.ts
│
├── docker-compose.yml
└── .env.example
```

---

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Multi-tenancy** | Separate DB per tenant | Maximum data isolation; clinic data is medical — no row-level leakage risk |
| **Tenant resolution** | JWT `tenantId` claim | Stateless, no header forgery surface; resolved once per request in filter |
| **DB migrations** | Flyway (two paths) | `db/platform/migration` for master DB; `db/tenant/migration` applied to every new tenant DB on provisioning |
| **Migration trigger** | Auto on startup (platform) / on provision (tenant) | Zero-downtime safe; tenant DBs migrated in `TenantService.provision()` |
| **JPA dual config** | Two `EntityManagerFactory` beans, two `TransactionManager` beans | `platform*` for `repositories.platform`, `tenant*` for `repositories.tenant` |
| **JWT strategy** | Stateless only (no refresh token store) | Simpler infra for MVP; swap to Redis-backed rotation later |
| **Roles** | Static enum RBAC | `PLATFORM_ADMIN` (cross-tenant), `ADMIN / DOCTOR / NURSE / RECEPTIONIST` (tenant-scoped) |
| **UI framework** | PrimeNG | Rich component set; `FullCalendar` integration via `p-fullCalendar` for appointment scheduler |
| **API versioning** | `/api/v1/` prefix on all routes | Protects future clients from breaking changes |
| **Error format** | RFC 9457 `ProblemDetail` | Standard, machine-readable; Spring 6 native support |
| **Logging** | Structured JSON (Logstash encoder) in `prod`, human-readable in `dev` | Ready for log aggregators (ELK, Loki) |
| **Metrics** | Micrometer + Prometheus | Actuator endpoints: `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus` |
| **CI/CD registry** | GitHub Container Registry (GHCR) | Native to GitHub Actions, free with `GITHUB_TOKEN` |
| **CD deploy** | SSH to VPS (`appleboy/ssh-action`) | Most portable; swap for ECS/Railway by replacing the `deploy` job |

---

## Quick Start — Running Locally

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Docker Desktop (or Docker Engine + Compose plugin) | 24.x |
| Java JDK (for running backend outside Docker) | 17 |
| Node.js (for running frontend outside Docker) | 20 |
| Maven (for backend outside Docker) | 3.9 |

---

### Option A — Full Stack via Docker Compose (Recommended)

This is the fastest way to get everything running:

```bash
# 1. Navigate to the project root
cd clinic-saas

# 2. Copy the example env file and review it
cp .env.example .env
# Edit .env — change JWT_SECRET to a real 256-bit value (see below)

# 3. Build and start all services
docker compose up --build

# Services started:
#   postgres   → localhost:5432
#   backend    → localhost:8080
#   frontend   → localhost:80
```

Docker Compose health checks ensure PostgreSQL is fully ready before Spring Boot starts. The backend will:
1. Run platform Flyway migrations automatically.
2. Expose the Swagger UI at `http://localhost:8080/swagger-ui.html`.

The frontend Angular app will be at `http://localhost:80`.

> **Stop everything:**
> ```bash
> docker compose down          # keep the data volume
> docker compose down -v       # also delete the postgres volume (fresh start)
> ```

---

### Option B — Backend Only (for API development)

```bash
# Start only the database
cd clinic-saas
docker compose up postgres -d

# Run the Spring Boot backend locally
cd backend

# Export required environment variables
export PLATFORM_DB_URL=jdbc:postgresql://localhost:5432/clinic_platform
export PLATFORM_DB_USER=clinic_admin
export PLATFORM_DB_PASSWORD=clinic_secret
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_ADMIN_USER=clinic_admin
export POSTGRES_ADMIN_PASSWORD=clinic_secret
export JWT_SECRET=<base64-encoded-256bit-secret>
export JWT_EXPIRATION_MS=86400000
export SPRING_PROFILES_ACTIVE=dev

mvn spring-boot:run
```

Backend runs on `http://localhost:8080`. Swagger UI: `http://localhost:8080/swagger-ui.html`.

---

### Option C — Frontend Only (for UI development)

```bash
# Assumes the backend is already running on :8080
cd clinic-saas/frontend
npm install
npm start
# → Angular dev server at http://localhost:4200
# → Vite proxy routes /api → http://localhost:8080 (via proxy.conf.json)
```

---

### Generating a Valid JWT Secret

The JWT secret must be a **Base64-encoded string of at least 32 random bytes (256 bits)**.

```bash
# Generate one with OpenSSL:
openssl rand -base64 32
# Example output: k8F3mZ9pQrT2vX5wY7aN1cD4eG6hJ0lM8nO+B/iK2qE=
# Paste this value into JWT_SECRET in your .env file.
```

---

## Phase-by-Phase Breakdown

### Phase 1 — DevOps Foundation

**Files:** `docker-compose.yml`, `.env.example`, `.gitignore`, `backend/Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf`, `.github/workflows/ci-cd.yml`

**What it sets up:**

- **`docker-compose.yml`** — Single file driving the full stack. Services: `postgres`, `backend`, `frontend`. Uses `condition: service_healthy` so Spring Boot never starts until PostgreSQL passes `pg_isready`. All credentials are injected via `.env` — no hardcoded values.
- **`backend/Dockerfile`** — Two stages:
  1. `maven:3.9.6-eclipse-temurin-17-alpine` — downloads dependencies in a separate layer (cached between builds as long as `pom.xml` doesn't change), then compiles.
  2. `eclipse-temurin:17-jre-alpine` — copies only the fat JAR, runs as a non-root `spring` user.
- **`frontend/Dockerfile`** — Two stages:
  1. `node:20-alpine` — `npm ci` (cached), `ng build --configuration production`.
  2. `nginx:1.25-alpine` — copies `dist/` to Nginx HTML root; uses custom `nginx.conf`.
- **`nginx.conf`** — Handles the Angular SPA fallback (`try_files $uri /index.html`), proxies `/api/` to the backend container, enables gzip, sets 1-year cache on static assets.
- **`ci-cd.yml`** — Four jobs:
  1. `test-backend` — spins up a Postgres service container, runs `mvn verify`.
  2. `test-frontend` — runs `npm ci` + `ng build --configuration production`.
  3. `build-and-push` — builds both Docker images (GitHub Actions cache via `type=gha`), pushes to GHCR with `latest` and `$SHA` tags.
  4. `deploy` — SSHs into your VPS, pulls the new images, runs `docker compose up -d`.

**Configure it:**

```bash
# Copy and customise before first run:
cp .env.example .env
```

| Variable | What to change |
|---|---|
| `POSTGRES_PASSWORD` | Use a strong password in any non-local environment |
| `JWT_SECRET` | **Must** be changed — see the generation command above |
| `SPRING_PROFILES_ACTIVE` | `dev` locally, `prod` on server |

---

### Phase 2 — Backend Project Files

**Files:** `backend/pom.xml`, `ClinicSaasApplication.java`, `application.yml`, `application-dev.yml`, `application-prod.yml`, `logback-spring.xml`

**Key decisions:**

- `ClinicSaasApplication` explicitly **excludes** `DataSourceAutoConfiguration`, `HibernateJpaAutoConfiguration`, and `FlywayAutoConfiguration`. This is required because we manually configure two separate datasources — Spring Boot's autoconfiguration would conflict.
- **`application.yml`** is the base config. It reads all secrets from environment variables (never hardcoded). Profile-specific files override only what changes:
  - `application-dev.yml` — enables `DEBUG` logging, SQL printing, Swagger UI.
  - `application-prod.yml` — disables Swagger, raises logging threshold to `WARN`, restricts Actuator endpoints.
- **`logback-spring.xml`** uses `<springProfile>` to switch between human-readable console output (`dev`) and structured JSON via `LogstashEncoder` (`prod`). The JSON output includes MDC fields `tenantId` and `userId` — automatically populated by `JwtAuthFilter` on every request.

**Configure it:**

All configuration is driven by environment variables. See the [Environment Variables Reference](#environment-variables-reference) section.

To run against a custom Postgres instance:
```bash
export PLATFORM_DB_URL=jdbc:postgresql://my-host:5432/clinic_platform
export PLATFORM_DB_USER=my_user
export PLATFORM_DB_PASSWORD=my_pass
```

---

### Phase 3 — Multi-Tenancy Engine & Entities

**Files:** `multitenancy/` package, `entities/` package

#### Multi-Tenancy Components

| Class | Role |
|---|---|
| `TenantContext` | `ThreadLocal<String>` storing the current request's tenant DB name. Set in `JwtAuthFilter`, cleared in `finally` block. |
| `TenantDataSourceRouter` | Extends `AbstractRoutingDataSource`. Overrides `determineTargetDataSource()` to delegate directly to `TenantDataSourceManager` — bypasses the static target map so new tenants are routed without restart. |
| `TenantDataSourceManager` | Maintains a `ConcurrentHashMap<String, DataSource>` of HikariCP pools (one per tenant DB). Creates a new pool on first access via `computeIfAbsent`. Also exposes `provisionDatabase(dbName)` which issues `CREATE DATABASE` using a raw JDBC connection. |
| `TenantFlywayMigrator` | Runs `classpath:db/tenant/migration` against a given tenant datasource. Called by `TenantService` during tenant provisioning. |

#### Entities

**Platform entities** (live in `clinic_platform` DB — managed by `platformEntityManagerFactory`):
- `Tenant` — name, dbName (the PostgreSQL database name), adminEmail, active flag.
- `PlatformUser` — email, passwordHash, role (`PLATFORM_ADMIN`).

**Tenant entities** (live in each tenant DB — managed by `tenantEntityManagerFactory`):
- `User` — email, passwordHash, firstName, lastName, role (ADMIN/DOCTOR/NURSE/RECEPTIONIST), active.
- `Patient` — MRN (auto-generated `MRN-XXXXXXXX`), full demographics, blood type, allergies.
- `Appointment` — patientId, doctorId, scheduledAt, durationMinutes, status (6-state workflow), notes.

---

### Phase 4 — JPA Config, Security & OpenAPI

**Files:** `config/` package, `security/` package

#### Dual JPA Configuration

Two completely independent JPA stacks are configured:

```
platformDataSource  →  platformEntityManagerFactory  →  platformTransactionManager
                        scans: entities.platform
                        serves: repositories.platform

tenantDataSource    →  tenantEntityManagerFactory    →  tenantTransactionManager
(routing)               scans: entities.tenant
                        serves: repositories.tenant
```

- **`@Primary`** is placed on `platformEntityManagerFactory` and `platformTransactionManager`. This means `@Transactional` with no qualifier uses the platform transaction manager — safe for platform operations.
- Tenant services **must** explicitly annotate `@Transactional("tenantTransactionManager")` or `@Transactional(value = "tenantTransactionManager", readOnly = true)`.

#### Security Filter Chain

```
HTTP Request
    ↓
JwtAuthFilter (OncePerRequestFilter)
    │  1. Extract Bearer token from Authorization header
    │  2. Validate JWT signature
    │  3. Read claims: type, tenantId, role, email, sub
    │  4. If type=TENANT → TenantContext.setCurrentTenant(tenantId)
    │  5. Build AppUserPrincipal and set SecurityContext
    ↓
Spring Security authorization check
    │  - PUBLIC_PATHS → permitAll
    │  - /api/v1/platform/** → ROLE_PLATFORM_ADMIN
    │  - /api/v1/patients/** → ROLE_ADMIN / DOCTOR / NURSE / RECEPTIONIST
    │  - /api/v1/appointments/** → all authenticated roles
    ↓
Controller → Service → Repository → TenantDataSourceRouter → Correct tenant DB
    ↓
TenantContext.clear() + MDC.clear()  (in finally block)
```

#### OpenAPI / Swagger

Available at `http://localhost:8080/swagger-ui.html` (dev profile only; disabled in prod).

All endpoints require a JWT — use the **Authorize** button at the top of the Swagger UI and paste a `Bearer <token>` value obtained from `POST /api/v1/auth/login`.

---

### Phase 5 — Business Layer

**Files:** `exceptions/`, `dtos/`, `services/`, `controllers/`

#### Global Exception Handler

All exceptions are converted to **RFC 9457 `ProblemDetail`** JSON responses:

```json
{
  "type": "/errors/validation",
  "title": "Validation Failed",
  "status": 422,
  "timestamp": "2025-05-31T12:00:00Z",
  "errors": {
    "email": "must be a valid email address",
    "firstName": "must not be blank"
  }
}
```

| Exception | HTTP Status |
|---|---|
| `MethodArgumentNotValidException` | `422 Unprocessable Entity` |
| `ResourceNotFoundException` | `404 Not Found` |
| `BadRequestException` | `400 Bad Request` |
| `BadCredentialsException` | `401 Unauthorized` |
| `AccessDeniedException` | `403 Forbidden` |
| Any unhandled `Exception` | `500 Internal Server Error` |

#### DTOs

All API contracts use Java records (immutable, no Lombok needed for DTOs). Entities are **never** exposed directly — controllers always return `*Response` record types.

#### Tenant Provisioning Flow

```
POST /api/v1/platform/tenants  (PLATFORM_ADMIN only)
    ↓
TenantService.provision(req)
    1. Validate dbName + adminEmail uniqueness
    2. TenantDataSourceManager.provisionDatabase(dbName)  → CREATE DATABASE
    3. TenantFlywayMigrator.migrate(dbName)               → run V1, V2, V3 migrations
    4. Create ADMIN user in new tenant DB                 → seed credentials
    5. Save Tenant record in platform DB
    6. Return TenantResponse
```

---

### Phase 6 — Database Migrations (Flyway)

**Files:** `src/main/resources/db/`

Two completely independent Flyway migration paths:

#### Platform Migrations (`db/platform/migration/`)

| File | Creates |
|---|---|
| `V1__create_tenants_table.sql` | `tenants` table with indexes on `db_name` and `active` |
| `V2__create_platform_users_table.sql` | `platform_users` table with index on `email` |

These run **automatically on backend startup** against `clinic_platform`.

#### Tenant Migrations (`db/tenant/migration/`)

| File | Creates |
|---|---|
| `V1__create_users_table.sql` | `users` table (clinic staff) |
| `V2__create_patients_table.sql` | `patients` table with MRN uniqueness and search indexes |
| `V3__create_appointments_table.sql` | `appointments` table with FK to patients + users, status CHECK constraint, composite indexes |

These run **when a new tenant is provisioned** via `TenantFlywayMigrator`. To add a new column to all tenant databases, create `V4__...sql` in `db/tenant/migration/` — it will be applied to all existing tenant DBs on their next connection (via `baselineOnMigrate=true`) and automatically to all new ones.

**Adding a new migration:**
```bash
# Always increment the version number
touch backend/src/main/resources/db/tenant/migration/V4__add_notes_to_patients.sql
# Edit the SQL, then restart or re-provision
```

> **Never edit an existing Flyway migration file** — Flyway checksums the files and will refuse to start if a previously-applied migration is modified.

---

### Phase 7 — Angular Core Layer

**Files:** `frontend/src/app/` — config, routes, core interceptors, guards, services, models

#### Bootstrap Chain

```
main.ts
  bootstrapApplication(AppComponent, appConfig)
    appConfig (app.config.ts)
      provideRouter(routes, withComponentInputBinding())
      provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
      provideAnimations()
```

#### HTTP Interceptors

| Interceptor | Behaviour |
|---|---|
| `jwtInterceptor` | Reads token from `localStorage` via `AuthService.getToken()`. Clones every outgoing request and adds `Authorization: Bearer <token>`. No-ops if not logged in. |
| `errorInterceptor` | Catches `401` responses globally, calls `auth.logout()`, redirects to `/auth/login`. All other errors are re-thrown for component-level handling. |

#### Route Guards

| Guard | Behaviour |
|---|---|
| `authGuard` | Checks `AuthService.isLoggedIn()`. Redirects to `/auth/login` if not authenticated. Protects the entire `/dashboard` tree. |
| `roleGuard` | Reads `route.data['roles']` array. Checks current user role against allowed roles. Redirects to `/dashboard/home` if unauthorized. Usage: `{ canActivate: [roleGuard], data: { roles: ['ADMIN', 'DOCTOR'] } }` |

#### AuthService

Uses Angular **Signals** for reactive current-user state (`currentUser = signal<CurrentUser | null>(...)`). Stores the JWT and decoded user in `localStorage`. Decodes the JWT payload client-side (no extra HTTP call needed) to extract `id`, `email`, `role`, `tenantId`, `type`.

---

### Phase 8 — Angular Feature Modules

**Files:** `layouts/`, `features/`

#### Layout System

```
app.routes.ts
  /                      → AuthLayoutComponent (centered card)
    /auth/login          → LoginComponent
  /dashboard             → DashboardLayoutComponent (sidebar + topbar)
    /dashboard/home      → DashboardComponent
    /dashboard/patients  → PatientListComponent / PatientCreateComponent
    /dashboard/appointments → AppointmentSchedulerComponent
```

All routes use **lazy loading** (`loadComponent` / `loadChildren`) — the auth bundle and each feature bundle are separate JS chunks, loaded on demand.

#### Features

| Feature | Components | Notes |
|---|---|---|
| **Auth** | `LoginComponent` | Dual-mode login: provide `tenantId` for clinic staff; leave blank for platform admin. Reactive form with PrimeNG Password + InputText. |
| **Dashboard** | `DashboardComponent` | KPI card grid (placeholder values — wire up to API calls in next sprint). |
| **Patients** | `PatientListComponent`, `PatientCreateComponent` | Server-side paginated PrimeNG table with live search. Create form with calendar picker, gender + blood type dropdowns. |
| **Appointments** | `AppointmentSchedulerComponent` | `FullCalendar` weekly view. Events colour-coded by status. Click an event to open a PrimeNG dialog with details. `select` callback is wired for creating new appointments from a clicked slot. |

---

## Environment Variables Reference

All variables are read from `.env` (Docker Compose) or exported to the shell (local dev). Set **all** of these before running.

| Variable | Default | Required | Description |
|---|---|---|---|
| `POSTGRES_USER` | `clinic_admin` | Yes | PostgreSQL superuser name |
| `POSTGRES_PASSWORD` | `clinic_secret` | **Change in prod** | PostgreSQL superuser password |
| `POSTGRES_PORT` | `5432` | No | Host port mapped to PostgreSQL |
| `PLATFORM_DB_NAME` | `clinic_platform` | No | Name of the master platform database |
| `PLATFORM_DB_URL` | — | Yes | Full JDBC URL (auto-set by Compose) |
| `PLATFORM_DB_USER` | — | Yes | DB username for platform datasource |
| `PLATFORM_DB_PASSWORD` | — | Yes | DB password for platform datasource |
| `POSTGRES_HOST` | `localhost` | Yes | Hostname where Postgres runs (used by tenant provisioning) |
| `POSTGRES_ADMIN_USER` | — | Yes | Postgres admin for `CREATE DATABASE` calls |
| `POSTGRES_ADMIN_PASSWORD` | — | Yes | Password for the above |
| `JWT_SECRET` | — | **Must change** | Base64-encoded 256-bit HMAC secret |
| `JWT_EXPIRATION_MS` | `86400000` | No | Token lifetime in ms (default 24 h) |
| `SPRING_PROFILES_ACTIVE` | `dev` | No | `dev` or `prod` |
| `BACKEND_PORT` | `8080` | No | Host port for the backend container |
| `FRONTEND_PORT` | `80` | No | Host port for the frontend container |

---

## CI/CD Pipeline

The pipeline in `.github/workflows/ci-cd.yml` has four jobs that run on push to `main`:

```
push to main
    │
    ├── test-backend  (JDK 17, Maven verify, Postgres service container)
    │
    ├── test-frontend  (Node 20, npm ci, ng build production)
    │
    └── build-and-push  (after both tests pass)
            │  Builds backend + frontend Docker images
            │  Pushes to GHCR:
            │    ghcr.io/<owner>/<repo>/clinic-backend:latest
            │    ghcr.io/<owner>/<repo>/clinic-backend:<git-sha>
            │    ghcr.io/<owner>/<repo>/clinic-frontend:latest
            │    ghcr.io/<owner>/<repo>/clinic-frontend:<git-sha>
            │
            └── deploy  (SSH into VPS)
                    cd /opt/clinic-saas
                    docker compose pull
                    docker compose up -d --no-build
                    docker image prune -f
```

### Setting up CI/CD Secrets

In your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `DEPLOY_HOST` | IP address or hostname of your VPS |
| `DEPLOY_USER` | SSH username (e.g. `ubuntu`, `deploy`) |
| `DEPLOY_SSH_KEY` | Contents of your SSH **private key** (`cat ~/.ssh/id_rsa`) |

### Setting up the VPS

```bash
# On your VPS:
mkdir -p /opt/clinic-saas
cd /opt/clinic-saas

# Copy your .env file with production values
nano .env   # paste production env vars here

# Copy docker-compose.yml
# (or pull it from your repo)

# First run (images are pulled from GHCR on deploy)
docker compose up -d
```

Make sure the VPS user has Docker permissions:
```bash
sudo usermod -aG docker $USER
```

---

## API Reference

Base URL: `http://localhost:8080/api/v1`  
Full interactive docs: `http://localhost:8080/swagger-ui.html`

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Clinic staff login. Body: `{ email, password, tenantId }` |
| `POST` | `/auth/platform/login` | Public | Platform admin login. Body: `{ email, password }` |

**Login Response:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "role": "DOCTOR",
  "tenantId": "my_clinic_db"
}
```

### Platform — Tenant Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/platform/tenants` | `PLATFORM_ADMIN` | Provision a new clinic (creates DB + runs migrations + seeds admin user) |
| `GET` | `/platform/tenants` | `PLATFORM_ADMIN` | List all tenants |
| `GET` | `/platform/tenants/{id}` | `PLATFORM_ADMIN` | Get tenant by ID |

**Create Tenant Body:**
```json
{
  "name": "City Heart Clinic",
  "dbName": "city_heart_clinic",
  "adminEmail": "admin@cityheartclinic.com",
  "adminPassword": "SecurePass123!"
}
```

### Patients

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/patients` | `ADMIN / DOCTOR / NURSE` | Register a new patient (MRN auto-generated) |
| `GET` | `/patients?q=&page=&size=` | All roles | Search / paginate patients |
| `GET` | `/patients/{id}` | All roles | Get patient by ID |
| `DELETE` | `/patients/{id}` | `ADMIN / DOCTOR / NURSE` | Soft-delete (sets `active = false`) |

### Appointments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/appointments` | All roles | Book a new appointment |
| `GET` | `/appointments/{id}` | All roles | Get appointment by ID |
| `GET` | `/appointments/doctor/{doctorId}` | All roles | Paginated list for a doctor |
| `GET` | `/appointments/range?from=&to=` | All roles | Appointments in date range (ISO date: `2025-06-01`) |
| `PATCH` | `/appointments/{id}/status?status=` | All roles | Update status (`CONFIRMED`, `COMPLETED`, etc.) |

---

## Data Model

### Platform Database (`clinic_platform`)

```sql
tenants
  id UUID PK | name | db_name UNIQUE | admin_email | active | created_at

platform_users
  id UUID PK | email UNIQUE | password_hash | role | created_at
```

### Tenant Database (one per clinic)

```sql
users
  id UUID PK | email UNIQUE | password_hash | first_name | last_name
  role (ADMIN|DOCTOR|NURSE|RECEPTIONIST) | active | created_at | updated_at

patients
  id UUID PK | mrn UNIQUE | first_name | last_name | date_of_birth
  gender | phone | email | address_line1 | city | country
  emergency_contact_name | emergency_contact_phone
  blood_type | allergies TEXT | active | created_at | updated_at

appointments
  id UUID PK | patient_id FK→patients | doctor_id FK→users
  scheduled_at | duration_minutes | status | appointment_type | notes
  cancellation_reason | created_at | updated_at
```

### Appointment Status Workflow

```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
                  ↓
              CANCELLED
SCHEDULED → NO_SHOW
```

---

## Security Model

### JWT Claims

Every token contains:

```json
{
  "sub": "<user-uuid>",
  "email": "user@clinic.com",
  "role": "DOCTOR",
  "tenantId": "my_clinic_db",
  "type": "TENANT",
  "iat": 1748649600,
  "exp": 1748736000
}
```

For platform admins: `type = "PLATFORM"`, `tenantId` is absent.

### Role Permissions Summary

| Endpoint Group | PLATFORM_ADMIN | ADMIN | DOCTOR | NURSE | RECEPTIONIST |
|---|---|---|---|---|---|
| `/platform/**` | ✅ | — | — | — | — |
| `POST /patients` | — | ✅ | ✅ | ✅ | — |
| `GET /patients` | — | ✅ | ✅ | ✅ | ✅ |
| `DELETE /patients` | — | ✅ | ✅ | ✅ | — |
| `POST /appointments` | — | ✅ | ✅ | ✅ | ✅ |
| `GET /appointments` | — | ✅ | ✅ | ✅ | ✅ |
| `PATCH /appointments/status` | — | ✅ | ✅ | ✅ | ✅ |

Fine-grained method-level security is enforced via `@PreAuthorize` on controllers, with the filter chain providing the coarse-grained path-level guard.

---

## Development Workflow

### Adding a New Feature (example: Prescriptions)

1. **Migration** — Add `V4__create_prescriptions_table.sql` in `db/tenant/migration/`.
2. **Entity** — Create `Prescription.java` in `entities/tenant/`.
3. **Repository** — Create `PrescriptionRepository.java` in `repositories/tenant/`.
4. **DTOs** — Add `CreatePrescriptionRequest.java` and `PrescriptionResponse.java`.
5. **Service** — Create `PrescriptionService.java` using `@Transactional("tenantTransactionManager")`.
6. **Controller** — Create `PrescriptionController.java` at `/api/v1/prescriptions`.
7. **Frontend Model** — Add `prescription.model.ts` in `core/models/`.
8. **Frontend Service** — Add `prescription.service.ts` in the feature folder.
9. **Feature Route** — Add to `app.routes.ts` under `/dashboard`.

### Adding a New Tenant Role

1. Add the value to `Role.java` enum.
2. Update `SecurityConfig.java` with the appropriate `hasAnyRole(...)` rule.
3. Update `roleGuard` usages in route definitions.
4. Add the role to the Angular `Role` type in `user.model.ts`.

### Running Backend Tests

```bash
cd clinic-saas/backend
mvn test
# or with a running postgres:
mvn verify
```

### Checking Actuator Health

```bash
curl http://localhost:8080/actuator/health | jq
# { "status": "UP", "components": { "db": { "status": "UP" }, ... } }

curl http://localhost:8080/actuator/prometheus
# Prometheus metrics output
```
