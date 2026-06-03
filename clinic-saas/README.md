# Clinic SaaS — Medical Clinic Management Platform

A production-grade, multi-tenant **Medical Clinic Management SaaS** built with a strict enterprise technology stack. This monorepo contains the backend API, frontend SPA, DevOps configuration, and CI/CD pipeline.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Project Structure](#project-structure)
4. [Quick Start — Running Locally](#quick-start--running-locally)
5. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
6. [Security Model](#security-model)
7. [RBAC — Roles & Permissions](#rbac--roles--permissions)
8. [PII Data Protection](#pii-data-protection)
9. [Environment Variables Reference](#environment-variables-reference)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [API Reference](#api-reference)
12. [Data Model](#data-model)
13. [Development Workflow](#development-workflow)

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
| **Rate Limiting** | Bucket4j | 8.10.x |
| **AOP** | Spring AOP (AspectJ) | — |
| **API Docs** | SpringDoc OpenAPI 3 | 2.5.x |
| **Logging** | Logback + Logstash JSON encoder | Structured JSON in prod |
| **Metrics** | Spring Actuator + Micrometer Prometheus | — |
| **Frontend** | Angular | 17+ (Strict mode, Standalone, Signals) |
| **UI Library** | PrimeNG + PrimeFlex + PrimeIcons | 17.x |
| **Scheduler** | FullCalendar (via PrimeNG) | 6.x |
| **Containerization** | Docker + Docker Compose | — |
| **CI/CD** | GitHub Actions → GHCR | — |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│              Angular 17 SPA (PrimeNG UI)                    │
│   /auth  /dashboard  /patients  /appointments               │
│   /queue  /lab  /radiology  /pharmacy  /billing             │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP  /api/v1/*
                         │  Bearer JWT
┌────────────────────────▼────────────────────────────────────┐
│               Spring Boot 3.x Backend                       │
│                                                             │
│  LoginRateLimitFilter (Bucket4j — per-IP, 10 req/min)      │
│    ↓                                                        │
│  JwtAuthFilter → TenantContext → Controller → Service       │
│    ↓                                                        │
│  @PreAuthorize (per-method permission checks)               │
│    ↓                                                        │
│  PiiAuditAspect (@AfterReturning — INSERT-only audit log)   │
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
│  platform_users      │  │  visits  lab_orders            │
└──────────────────────┘  │  radiology_orders              │
                          │  prescriptions  invoices       │
                          │  audit_logs                    │
                          └────────────────────────────────┘
```

### Multi-Tenancy Model: Separate Database per Tenant

Each onboarded clinic gets its **own isolated PostgreSQL database**. The platform database (`clinic_platform`) is the master registry. On every authenticated request, `JwtAuthFilter` reads the `tenantId` claim from the JWT and sets it on `TenantContext` (a `ThreadLocal`). The `TenantDataSourceRouter` (extends `AbstractRoutingDataSource`) routes all JPA operations to the correct tenant database — **zero cross-tenant data leakage by design**.

---

## Project Structure

```
clinic-saas/
│
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI pipeline
│
├── backend/                           # Spring Boot 3.x application
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/clinicsaas/
│       │   ├── ClinicSaasApplication.java
│       │   ├── config/
│       │   │   ├── DataSourceConfig.java
│       │   │   ├── PlatformJpaConfig.java
│       │   │   ├── TenantJpaConfig.java        # scans repositories.tenant + pii
│       │   │   ├── SecurityConfig.java         # headers, CORS, filters
│       │   │   └── OpenApiConfig.java
│       │   ├── multitenancy/
│       │   │   ├── TenantContext.java
│       │   │   ├── TenantDataSourceRouter.java
│       │   │   ├── TenantDataSourceManager.java
│       │   │   └── TenantFlywayMigrator.java
│       │   ├── security/
│       │   │   ├── JwtTokenProvider.java
│       │   │   ├── JwtAuthFilter.java
│       │   │   ├── AppUserPrincipal.java       # returns ROLE_X + permission authorities
│       │   │   ├── RolePermissions.java        # static Role→Set<Permission> registry
│       │   │   └── LoginRateLimitFilter.java   # Bucket4j per-IP rate limit
│       │   ├── pii/
│       │   │   ├── AuditLog.java               # INSERT-only audit entity
│       │   │   ├── AuditLogRepository.java
│       │   │   ├── AuditAccess.java            # method annotation
│       │   │   ├── PiiAuditAspect.java         # @AfterReturning AOP aspect
│       │   │   ├── EncryptionService.java      # AES-256-GCM
│       │   │   └── EncryptedStringConverter.java # JPA @Converter
│       │   ├── logging/
│       │   │   └── MaskingConverter.java       # redacts email/phone in log lines
│       │   ├── entities/
│       │   │   ├── platform/  Tenant, PlatformUser
│       │   │   ├── tenant/    User, Patient, Appointment, Visit,
│       │   │   │              LabOrder, RadiologyOrder, Prescription, Invoice
│       │   │   └── enums/     Role, Permission, PlatformRole,
│       │   │                  AppointmentStatus, VisitStatus, Gender, BloodType
│       │   ├── repositories/
│       │   │   ├── platform/  TenantRepository, PlatformUserRepository
│       │   │   └── tenant/    UserRepository, PatientRepository,
│       │   │                  AppointmentRepository, VisitRepository,
│       │   │                  LabOrderRepository, RadiologyOrderRepository,
│       │   │                  PrescriptionRepository, InvoiceRepository
│       │   ├── services/
│       │   │   AuthService, TenantService, PatientService,
│       │   │   AppointmentService, VisitService, LabService,
│       │   │   RadiologyService, PrescriptionService, InvoiceService,
│       │   │   UserManagementService
│       │   ├── controllers/
│       │   │   AuthController, TenantController, PatientController,
│       │   │   AppointmentController, VisitController, LabController,
│       │   │   RadiologyController, PrescriptionController,
│       │   │   InvoiceController, UserManagementController, MeController
│       │   ├── dtos/
│       │   │   ├── request/   LoginRequest, CreateTenantRequest,
│       │   │   │              CreatePatientRequest, CreateAppointmentRequest,
│       │   │   │              CreateUserRequest, ChangePasswordRequest
│       │   │   └── response/  AuthResponse (with permissions[]),
│       │   │                  PatientResponse (masked/full PII),
│       │   │                  AppointmentResponse, VisitResponse, ...
│       │   └── exceptions/    GlobalExceptionHandler, ResourceNotFoundException,
│       │                      BadRequestException, TenantProvisioningException
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           ├── application-prod.yml
│           ├── logback-spring.xml             # MaskingConverter for dev logs
│           └── db/
│               ├── platform/migration/
│               │   V1__create_tenants_table.sql
│               │   V2__create_platform_users_table.sql
│               └── tenant/migration/
│                   V1__create_users_table.sql
│                   V2__create_patients_table.sql
│                   V3__create_appointments_table.sql
│                   V4__create_visits_table.sql
│                   V5__create_lab_orders_table.sql
│                   V6__create_radiology_orders_table.sql
│                   V7__create_prescriptions_table.sql
│                   V8__create_invoices_table.sql
│                   V9__create_audit_logs_table.sql
│                   V10__account_lockout.sql
│
├── frontend/                          # Angular 17+ application
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── angular.json
│   ├── tsconfig.json                  # strict: true
│   ├── package.json
│   └── src/app/
│       ├── app.config.ts
│       ├── app.routes.ts              # permission-guarded lazy routes
│       ├── core/
│       │   ├── interceptors/          jwt.interceptor.ts, error.interceptor.ts
│       │   ├── guards/                auth.guard.ts, permission.guard.ts
│       │   ├── directives/            has-permission.directive.ts
│       │   ├── services/              auth.service.ts (hasPermission, hasAnyPermission)
│       │   └── models/                user.model.ts (Permission type, CurrentUser)
│       ├── layouts/
│       │   ├── auth-layout/
│       │   └── dashboard-layout/      # role-aware nav (hides inaccessible items)
│       └── features/
│           ├── auth/                  login/
│           ├── dashboard/             home KPI cards
│           ├── patients/              list, create, detail (masked PII for non-ADMIN/DOCTOR)
│           ├── appointments/          FullCalendar scheduler
│           ├── queue/                 queue-board (Kanban: WAITING→IN_PROGRESS→DONE)
│           ├── lab/                   lab-board (all orders, inline result entry)
│           ├── radiology/             radiology-board (all orders, write reports)
│           ├── pharmacy/              pharmacy-board (all prescriptions, mark dispensed)
│           ├── billing/               invoices list, create invoice
│           └── admin/                 user management
│
├── docker-compose.yml
└── .env.example
```

---

## Quick Start — Running Locally

### Prerequisites

| Tool | Version |
|---|---|
| Docker Desktop | 24.x |
| Java JDK (local backend) | 17 |
| Node.js (local frontend) | 20 |
| Maven | 3.9 |

### Option A — Full Stack via Docker Compose

```bash
cd clinic-saas
cp .env.example .env
# Edit .env: set JWT_SECRET and PII_ENCRYPTION_KEY

docker compose up --build
# postgres → localhost:5432
# backend  → localhost:8080  (Swagger: http://localhost:8080/swagger-ui.html)
# frontend → localhost:80
```

Stop: `docker compose down` (keep data) or `docker compose down -v` (fresh start).

### Option B — Backend Only

```bash
cd clinic-saas
docker compose up postgres -d

cd backend
export PLATFORM_DB_URL=jdbc:postgresql://localhost:5432/clinic_platform
export PLATFORM_DB_USER=clinic_admin
export PLATFORM_DB_PASSWORD=clinic_secret
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_ADMIN_USER=clinic_admin
export POSTGRES_ADMIN_PASSWORD=clinic_secret
export JWT_SECRET=<base64-256bit>
export JWT_EXPIRATION_MS=86400000
export PII_ENCRYPTION_KEY=<base64-256bit>
export SPRING_PROFILES_ACTIVE=dev

mvn spring-boot:run
```

### Option C — Frontend Only

```bash
cd clinic-saas/frontend
npm install
npm start          # dev server at http://localhost:4200, proxies /api → :8080
```

### Generating Secrets

```bash
# JWT secret and PII encryption key (both need a 256-bit base64 value):
openssl rand -base64 32
```

---

## Phase-by-Phase Breakdown

### Phase 1 — DevOps Foundation

`docker-compose.yml`, Dockerfiles, `nginx.conf`, `.github/workflows/ci.yml`

- Multi-stage Dockerfiles (Maven cache layer → JRE 17 Alpine; Node build → Nginx Alpine).
- `nginx.conf` — SPA fallback, `/api` proxy to backend, gzip, 1-year static asset cache.
- CI pipeline: two parallel jobs — *Backend (Testcontainers + PostgreSQL)* and *Frontend (ng build production)* — both must pass before Docker images are built.

### Phase 2 — Backend Project Files

`pom.xml`, `ClinicSaasApplication.java`, `application.yml`, `logback-spring.xml`

- `ClinicSaasApplication` excludes `DataSourceAutoConfiguration`, `HibernateJpaAutoConfiguration`, and `FlywayAutoConfiguration` — required for the dual-datasource setup.
- `logback-spring.xml` uses `<springProfile>` to produce human-readable console logs in `dev` and structured JSON (`LogstashEncoder`) in `prod`. MDC fields `tenantId` and `userId` are set per request.

### Phase 3 — Multi-Tenancy Engine & Entities

`multitenancy/` package, `entities/` package

| Class | Role |
|---|---|
| `TenantContext` | `ThreadLocal<String>` storing the current request's tenant DB name |
| `TenantDataSourceRouter` | `AbstractRoutingDataSource` — routes to the correct HikariCP pool |
| `TenantDataSourceManager` | `ConcurrentHashMap<String, DataSource>` — creates pools on demand |
| `TenantFlywayMigrator` | Runs `db/tenant/migration` against a new tenant DB at provision time |

### Phase 4 — JPA Config, Security & OpenAPI

Two independent JPA stacks:

```
platformDataSource  →  platformEntityManagerFactory  →  platformTransactionManager
                        scans: entities.platform + repositories.platform

tenantDataSource    →  tenantEntityManagerFactory    →  tenantTransactionManager
(routing)               scans: entities.tenant + pii (AuditLog)
                        serves: repositories.tenant + pii (AuditLogRepository)
```

`@Primary` is on the platform beans — bare `@Transactional` uses platform; tenant services must qualify with `@Transactional("tenantTransactionManager")`.

### Phase 5 — Business Layer

Global exception handler returns **RFC 9457 `ProblemDetail`** for all errors. All entities are mapped to `*Response` records — entities are never exposed directly.

Tenant provisioning flow:
```
POST /api/v1/platform/tenants  (PLATFORM_ADMIN)
    1. Validate uniqueness
    2. CREATE DATABASE
    3. Run Flyway V1–V10 against new DB
    4. Seed ADMIN user
    5. Save Tenant record
```

### Phase 6 — Database Migrations (Flyway)

#### Platform (`db/platform/migration/`)

| File | Creates |
|---|---|
| `V1` | `tenants` |
| `V2` | `platform_users` |

#### Tenant (`db/tenant/migration/`)

| File | Creates |
|---|---|
| `V1` | `users` |
| `V2` | `patients` (PII columns encrypted at rest via `EncryptedStringConverter`) |
| `V3` | `appointments` (6-state workflow) |
| `V4` | `visits` (queue / status workflow) |
| `V5` | `lab_orders` |
| `V6` | `radiology_orders` |
| `V7` | `prescriptions` |
| `V8` | `invoices` |
| `V9` | `audit_logs` (INSERT-only PII access log) |
| `V10` | `failed_login_attempts`, `locked_until` columns on `users` |

### Phase 7 — Angular Core Layer

- **Signals**: `signal<T>()` and `computed()` used throughout for reactive state.
- **`jwtInterceptor`** — attaches `Authorization: Bearer <token>` to every request.
- **`errorInterceptor`** — catches 401 globally, logs out and redirects to login.
- **`authGuard`** — protects the `/dashboard` tree.
- **`permissionGuard`** — factory: `canActivate: [permissionGuard('PATIENT_READ')]`; checks that the current user holds the required permission.
- **`*appHasPermission`** — structural directive to conditionally render UI elements: `*appHasPermission="'PATIENT_WRITE'"`.
- **`AuthService`** — `hasPermission(p)`, `hasAnyPermission(...ps)` helpers; permissions stored from `AuthResponse.permissions[]`.

### Phase 8 — Angular Feature Modules

| Feature | Access Control |
|---|---|
| Patients (list/create/edit) | `PATIENT_READ` / `PATIENT_WRITE` |
| Appointments (FullCalendar) | `APPOINTMENT_READ` / `APPOINTMENT_WRITE` |
| Queue Board (Kanban) | `VISIT_READ` / `VISIT_WRITE` |
| Lab Board | `LAB_READ` / `LAB_WRITE` |
| Radiology Board | `RADIOLOGY_READ` / `RADIOLOGY_WRITE` |
| Pharmacy Board | `PRESCRIPTION_READ` / `PRESCRIPTION_WRITE` |
| Billing / Invoices | `BILLING_READ` / `BILLING_WRITE` |
| User Management | `STAFF_READ` / `STAFF_WRITE` |

Each board is role-aware: the sidebar navigation hides tabs the current user has no permission to access. `@PreAuthorize` on every controller method enforces the same rules server-side.

### Phase 9 — Security Hardening

#### Rate Limiting

`LoginRateLimitFilter` (Bucket4j) intercepts only `/auth/login` and `/auth/platform/login`. Each client IP gets a `Bucket` of 10 tokens that refills every minute. On exhaustion: `HTTP 429` with a JSON body.

#### Account Lockout

`AuthService` tracks failed login attempts per user:
- **5 consecutive failures** → account locked for 15 minutes (`locked_until` column).
- Successful login resets the counter.

#### Security Headers (`SecurityConfig`)

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |

#### CORS

Allowed origins are read from the `CORS_ALLOWED_ORIGINS` environment variable (comma-separated). Default: `http://localhost,http://localhost:4200`. Only `GET POST PUT PATCH DELETE OPTIONS` are allowed.

#### Password Policy

`CreateUserRequest` and `ChangePasswordRequest` enforce: minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character via `@Pattern`.

#### Log Sanitization

`MaskingConverter` (Logback `MessageConverter`) replaces email addresses with `[email]` and phone numbers with `[phone]` in all log lines (dev profile). Prevents PII from appearing in log files.

### Phase 10 — PII Data Protection

See [PII Data Protection](#pii-data-protection) section below.

### Phase 11 — RBAC / Permission System

See [RBAC — Roles & Permissions](#rbac--roles--permissions) section below.

---

## Security Model

### Request Filter Chain

```
HTTP Request
    ↓
LoginRateLimitFilter  (Bucket4j — only on /auth/** paths)
    ↓
JwtAuthFilter
    1. Extract Bearer token
    2. Validate signature
    3. Read claims: type, tenantId, role, email, sub
    4. If TENANT → TenantContext.setCurrentTenant(tenantId)
    5. Build AppUserPrincipal (grants: ROLE_X + all Permission names)
    6. Set SecurityContext
    ↓
Spring Security path check
    PUBLIC_PATHS        → permitAll
    /api/v1/platform/** → ROLE_PLATFORM_ADMIN
    anyRequest          → authenticated
    ↓
@PreAuthorize("hasAuthority('PATIENT_READ')") per controller method
    ↓
PiiAuditAspect (@AfterReturning on @AuditAccess methods)
    → INSERT into audit_logs (userId, email, role, action, resourceType, resourceId, ip)
    ↓
TenantContext.clear() + MDC.clear()
```

### JWT Claims

```json
{
  "sub": "<user-uuid>",
  "email": "doctor@clinic.com",
  "role": "DOCTOR",
  "tenantId": "my_clinic_db",
  "type": "TENANT",
  "iat": 1748649600,
  "exp": 1748736000
}
```

Platform admins have `type = "PLATFORM"` and no `tenantId`.

### `GET /api/v1/me`

Returns the currently authenticated user's full profile including their permissions list:

```json
{
  "id": "uuid",
  "email": "doctor@clinic.com",
  "role": "DOCTOR",
  "tenantId": "my_clinic_db",
  "userType": "TENANT",
  "permissions": ["PATIENT_READ", "PATIENT_WRITE", "APPOINTMENT_READ", ...]
}
```

---

## RBAC — Roles & Permissions

### Permission Enum (22 permissions)

| Category | Permissions |
|---|---|
| Patients | `PATIENT_READ`, `PATIENT_WRITE`, `PATIENT_DELETE` |
| Appointments | `APPOINTMENT_READ`, `APPOINTMENT_WRITE`, `APPOINTMENT_DELETE` |
| Visits/Queue | `VISIT_READ`, `VISIT_WRITE` |
| Lab | `LAB_READ`, `LAB_WRITE` |
| Radiology | `RADIOLOGY_READ`, `RADIOLOGY_WRITE` |
| Prescriptions | `PRESCRIPTION_READ`, `PRESCRIPTION_WRITE` |
| Billing | `BILLING_READ`, `BILLING_WRITE` |
| Reports | `REPORTS_READ` |
| Staff | `STAFF_READ`, `STAFF_WRITE` |
| Settings | `SETTINGS_READ`, `SETTINGS_WRITE` |

### Role → Permission Mapping

| Permission | ADMIN | DOCTOR | NURSE | RECEPTIONIST | LAB_TECH | RADIOLOGIST | PHARMACIST | BILLING |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| PATIENT_READ | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| PATIENT_WRITE | ✅ | ✅ | ✅ | ✅ | — | — | — | — |
| PATIENT_DELETE | ✅ | — | — | — | — | — | — | — |
| APPOINTMENT_READ | ✅ | ✅ | — | ✅ | — | — | — | — |
| APPOINTMENT_WRITE | ✅ | ✅ | — | ✅ | — | — | — | — |
| APPOINTMENT_DELETE | ✅ | — | — | — | — | — | — | — |
| VISIT_READ | ✅ | ✅ | ✅ | — | — | — | — | — |
| VISIT_WRITE | ✅ | ✅ | ✅ | — | — | — | — | — |
| LAB_READ | ✅ | ✅ | ✅ | — | ✅ | — | — | — |
| LAB_WRITE | ✅ | ✅ | — | — | ✅ | — | — | — |
| RADIOLOGY_READ | ✅ | ✅ | — | — | — | ✅ | — | — |
| RADIOLOGY_WRITE | ✅ | ✅ | — | — | — | ✅ | — | — |
| PRESCRIPTION_READ | ✅ | ✅ | — | — | — | — | ✅ | — |
| PRESCRIPTION_WRITE | ✅ | ✅ | — | — | — | — | ✅ | — |
| BILLING_READ | ✅ | ✅ | — | ✅ | — | — | — | ✅ |
| BILLING_WRITE | ✅ | — | — | — | — | — | — | ✅ |
| REPORTS_READ | ✅ | ✅ | — | — | — | — | — | — |
| STAFF_READ | ✅ | — | — | — | — | — | — | — |
| STAFF_WRITE | ✅ | — | — | — | — | — | — | — |
| SETTINGS_READ | ✅ | — | — | — | — | — | — | — |
| SETTINGS_WRITE | ✅ | — | — | — | — | — | — | — |

`AppUserPrincipal.getAuthorities()` returns **both** `ROLE_X` and each individual permission name as a `SimpleGrantedAuthority`. Controllers use `@PreAuthorize("hasAuthority('LAB_WRITE')")` per method.

---

## PII Data Protection

### Encryption at Rest (AES-256-GCM)

Sensitive patient fields (`phone`, `email`, `address`, `emergencyContactPhone`) are transparently encrypted in PostgreSQL using `EncryptedStringConverter` — a JPA `@Converter` that encrypts on write and decrypts on read.

- Algorithm: **AES-256-GCM** (authenticated encryption — detects tampering).
- Key source: `PII_ENCRYPTION_KEY` environment variable (Base64-encoded 32-byte key).
- A fresh random 12-byte IV is generated per field per write.
- The stored value format: `base64(iv) + ":" + base64(ciphertext + authTag)`.

### Field-Level Masking

`PatientResponse` has two factory methods:
- `PatientResponse.from(patient)` — full PII (used for ADMIN and DOCTOR).
- `PatientResponse.masked(patient)` — phone shown as `****1234`, email as `j****@domain.com`.

`PatientService.toResponse()` checks the Spring Security context — ADMIN and DOCTOR see full data; all other roles see masked data.

### Audit Log

Every method annotated with `@AuditAccess` is intercepted by `PiiAuditAspect` after it returns. An immutable record is written to `audit_logs`:

```sql
audit_logs
  id, user_id, user_email, user_role,
  action, resource_type, resource_id, patient_id,
  ip_address, details, accessed_at
```

The table has no `UPDATE` or `DELETE` permissions — it is append-only. The `AuditLogRepository` and `AuditLog` entity live in `com.clinicsaas.pii`, which is registered with the tenant JPA context via `TenantJpaConfig`.

---

## Environment Variables Reference

| Variable | Default | Required | Description |
|---|---|---|---|
| `POSTGRES_USER` | `clinic_admin` | Yes | PostgreSQL superuser name |
| `POSTGRES_PASSWORD` | `clinic_secret` | **Change in prod** | PostgreSQL superuser password |
| `POSTGRES_PORT` | `5432` | No | Host port mapped to PostgreSQL |
| `PLATFORM_DB_NAME` | `clinic_platform` | No | Master platform database name |
| `PLATFORM_DB_URL` | — | Yes | Full JDBC URL |
| `PLATFORM_DB_USER` | — | Yes | Platform datasource username |
| `PLATFORM_DB_PASSWORD` | — | Yes | Platform datasource password |
| `POSTGRES_HOST` | `localhost` | Yes | Host for tenant DB provisioning |
| `POSTGRES_ADMIN_USER` | — | Yes | Admin user for `CREATE DATABASE` |
| `POSTGRES_ADMIN_PASSWORD` | — | Yes | Password for the above |
| `JWT_SECRET` | — | **Must change** | Base64-encoded 256-bit HMAC secret |
| `JWT_EXPIRATION_MS` | `86400000` | No | Token lifetime in ms (default 24 h) |
| `PII_ENCRYPTION_KEY` | — | **Must set** | Base64-encoded 256-bit AES key |
| `CORS_ALLOWED_ORIGINS` | `http://localhost,http://localhost:4200` | No | Comma-separated allowed origins |
| `SPRING_PROFILES_ACTIVE` | `dev` | No | `dev` or `prod` |
| `BACKEND_PORT` | `8080` | No | Host port for backend container |
| `FRONTEND_PORT` | `80` | No | Host port for frontend container |

---

## CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push:

```
push
    │
    ├── Backend – Test & Docker build
    │     JDK 17, Testcontainers (PostgreSQL), mvn verify
    │     docker build clinic-backend image
    │
    └── Frontend – Build & Docker build
          Node 20, npm ci, ng build --configuration production
          docker build clinic-frontend image
```

Both jobs run in parallel. The backend job spins up a real PostgreSQL instance via Testcontainers for integration tests.

---

## API Reference

Base URL: `http://localhost:8080/api/v1`
Interactive docs: `http://localhost:8080/swagger-ui.html` (dev profile)

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Clinic staff login. Body: `{ email, password, tenantId }` |
| `POST` | `/auth/platform/login` | Public | Platform admin login. Body: `{ email, password }` |
| `GET` | `/me` | Any authenticated | Current user profile + permissions list |

**Login Response:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "role": "DOCTOR",
  "tenantId": "my_clinic_db",
  "permissions": ["PATIENT_READ", "PATIENT_WRITE", "APPOINTMENT_READ", "VISIT_READ", "VISIT_WRITE", "LAB_READ", "LAB_WRITE", "PRESCRIPTION_READ", "PRESCRIPTION_WRITE", "RADIOLOGY_READ", "RADIOLOGY_WRITE", "BILLING_READ", "REPORTS_READ"]
}
```

### Platform — Tenant Management (`PLATFORM_ADMIN`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/platform/tenants` | Provision new clinic |
| `GET` | `/platform/tenants` | List all tenants |
| `GET` | `/platform/tenants/{id}` | Get tenant by ID |

### Patients (`PATIENT_READ` / `PATIENT_WRITE`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/patients` | `PATIENT_WRITE` | Register patient (MRN auto-generated) |
| `GET` | `/patients?q=&page=&size=` | `PATIENT_READ` | Search / paginate |
| `GET` | `/patients/{id}` | `PATIENT_READ` | Get by ID (masked for non-ADMIN/DOCTOR) |
| `PUT` | `/patients/{id}` | `PATIENT_WRITE` | Update patient |
| `DELETE` | `/patients/{id}` | `PATIENT_DELETE` | Soft-delete |

### Appointments

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/appointments` | `APPOINTMENT_WRITE` | Book appointment |
| `GET` | `/appointments/{id}` | `APPOINTMENT_READ` | Get by ID |
| `GET` | `/appointments/doctor/{doctorId}` | `APPOINTMENT_READ` | Doctor's appointments |
| `GET` | `/appointments/range?from=&to=` | `APPOINTMENT_READ` | Date range |
| `PATCH` | `/appointments/{id}/status?status=` | `APPOINTMENT_WRITE` | Update status |

### Visits / Queue

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/visits` | `VISIT_WRITE` | Check in patient |
| `GET` | `/visits/queue` | `VISIT_READ` | Active queue (all non-COMPLETED visits) |
| `PATCH` | `/visits/{id}/status?status=` | `VISIT_WRITE` | Move through queue |

### Lab Orders

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/lab/orders` | `LAB_WRITE` | Create lab order |
| `GET` | `/lab/orders/all` | `LAB_READ` | All orders (lab board) |
| `GET` | `/lab/orders/visit/{visitId}` | `LAB_READ` | Orders for a visit |
| `PATCH` | `/lab/orders/{id}/result` | `LAB_WRITE` | Enter result |

### Radiology Orders

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/radiology/orders` | `RADIOLOGY_WRITE` | Request scan |
| `GET` | `/radiology/orders/all` | `RADIOLOGY_READ` | All orders (radiology board) |
| `PATCH` | `/radiology/orders/{id}/report` | `RADIOLOGY_WRITE` | Write report |

### Prescriptions

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/prescriptions` | `PRESCRIPTION_WRITE` | Create prescription |
| `GET` | `/prescriptions/all` | `PRESCRIPTION_READ` | All prescriptions (pharmacy board) |
| `GET` | `/prescriptions/visit/{visitId}` | `PRESCRIPTION_READ` | By visit |
| `PATCH` | `/prescriptions/{id}/dispense` | `PRESCRIPTION_WRITE` | Mark dispensed |

### Invoices / Billing

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `POST` | `/invoices` | `BILLING_WRITE` | Create invoice |
| `GET` | `/invoices` | `BILLING_READ` | List all invoices |
| `GET` | `/invoices/{id}` | `BILLING_READ` | Get invoice |
| `PATCH` | `/invoices/{id}/pay` | `BILLING_WRITE` | Record payment |

### User Management (`STAFF_READ` / `STAFF_WRITE`)

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/users` | `STAFF_READ` | List clinic staff |
| `POST` | `/users` | `STAFF_WRITE` | Create staff user |
| `PUT` | `/users/{id}` | `STAFF_WRITE` | Update user |
| `DELETE` | `/users/{id}` | `STAFF_WRITE` | Deactivate user |
| `POST` | `/users/{id}/change-password` | `STAFF_WRITE` | Change password |

---

## Data Model

### Platform Database (`clinic_platform`)

```sql
tenants         id | name | db_name UNIQUE | admin_email | active | created_at
platform_users  id | email UNIQUE | password_hash | role | created_at
```

### Tenant Database (one per clinic)

```sql
users
  id UUID PK | email UNIQUE | password_hash | first_name | last_name
  role (ADMIN|DOCTOR|NURSE|RECEPTIONIST|LAB_TECHNICIAN|RADIOLOGIST|PHARMACIST|BILLING_CLERK)
  active | failed_login_attempts | locked_until | created_at | updated_at

patients
  id UUID PK | mrn UNIQUE | first_name | last_name | date_of_birth | gender
  phone (encrypted) | email (encrypted) | address_line1 (encrypted)
  emergency_contact_name | emergency_contact_phone (encrypted)
  blood_type | allergies TEXT | active | created_at | updated_at

appointments
  id UUID PK | patient_id FK | doctor_id FK
  scheduled_at | duration_minutes | status | appointment_type | notes
  cancellation_reason | created_at | updated_at

visits
  id UUID PK | patient_id FK | appointment_id FK
  status (WAITING|TRIAGE|WITH_DOCTOR|IN_PROCEDURE|PENDING_RESULTS|COMPLETED)
  chief_complaint | notes | checked_in_at | completed_at | created_at

lab_orders
  id UUID PK | visit_id FK | patient_id FK | ordered_by FK
  test_name | status (PENDING|IN_PROGRESS|COMPLETED) | result TEXT
  ordered_at | resulted_at

radiology_orders
  id UUID PK | visit_id FK | patient_id FK | ordered_by FK
  study_type | status (PENDING|SCHEDULED|COMPLETED) | report TEXT
  ordered_at | reported_at

prescriptions
  id UUID PK | visit_id FK | patient_id FK | prescribed_by FK
  medication_name | dosage | frequency | duration_days
  status (ACTIVE|DISPENSED|CANCELLED) | dispensed_at | created_at

invoices
  id UUID PK | patient_id FK | visit_id FK
  amount | status (DRAFT|ISSUED|PAID|VOID)
  issued_at | paid_at | created_at

audit_logs  (INSERT-only — no UPDATE/DELETE)
  id UUID PK | user_id | user_email | user_role
  action | resource_type | resource_id | patient_id
  ip_address | details | accessed_at
```

### Visit / Queue Status Workflow

```
WAITING → TRIAGE → WITH_DOCTOR → IN_PROCEDURE → PENDING_RESULTS → COMPLETED
```

### Appointment Status Workflow

```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
                  ↓
              CANCELLED
SCHEDULED → NO_SHOW
```

---

## Development Workflow

### Adding a New Migration

```bash
# Increment the version number
touch backend/src/main/resources/db/tenant/migration/V11__my_change.sql
# Write the SQL, then restart the backend
```

Never edit an existing migration file — Flyway checksums them and will refuse to start if a previously-applied file is modified.

### Adding a New Feature (example: Imaging Results)

1. **Migration** — `V11__create_imaging_results_table.sql`
2. **Entity** — `ImagingResult.java` in `entities/tenant/`
3. **Repository** — `ImagingResultRepository.java` in `repositories/tenant/`
4. **DTOs** — request + response records
5. **Service** — `@Transactional("tenantTransactionManager")`
6. **Controller** — `@PreAuthorize("hasAuthority('RADIOLOGY_READ')")` per method; add `@AuditAccess` to read methods
7. **Permission** — add to `RolePermissions` map if a new permission is needed
8. **Frontend** — model, service, component, add route with `permissionGuard(...)`, add nav item with `*appHasPermission`

### Adding a New Role

1. Add to `Role.java` enum.
2. Define its permissions in `RolePermissions.java`.
3. Add to the Angular `Role` type in `user.model.ts`.
4. Add to nav items in `dashboard-layout.component.ts` with appropriate `*appHasPermission`.

### Running Tests

```bash
cd clinic-saas/backend
mvn verify      # runs Testcontainers integration tests (needs Docker)
mvn test        # unit tests only
```

### Checking Health & Metrics

```bash
curl http://localhost:8080/actuator/health | jq
curl http://localhost:8080/actuator/prometheus
```
