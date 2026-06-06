# HelpDesk Pro

A modern, full-stack customer support ticketing system built as a professional replacement for osTicket. Features a clean enterprise UI, real-time notifications, SLA tracking, and role-based access control.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development (without Docker)](#local-development-without-docker)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
- [Default Credentials](#default-credentials)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Roles & Permissions](#roles--permissions)
- [Database Migrations](#database-migrations)
- [Architecture Overview](#architecture-overview)

---

## Overview

HelpDesk Pro is a SaaS-ready support ticket management system with three distinct portals:

- **Customer Portal** — Submit tickets, track status, reply to support threads
- **Agent Dashboard** — Manage ticket queues, add internal notes, update statuses
- **Admin Panel** — Full control over users, departments, SLA policies, and settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.2, Spring Security 6, Spring Data JPA |
| Database | PostgreSQL 16 + Flyway migrations |
| Authentication | JWT (access token + refresh token) |
| Real-time | WebSocket (STOMP over SockJS) |
| Email | JavaMailSender (SMTP) |
| Frontend | Angular 18 (standalone components) |
| UI Library | Angular Material (custom-themed) + TailwindCSS |
| State | Angular Signals |
| Build | Maven (backend), Angular CLI (frontend) |
| Container | Docker + Docker Compose |
| Proxy | Nginx |

---

## Features

### Core Ticketing
- Auto-generated ticket numbers (`TKT-YYYYMMDD-XXXXX`)
- Full ticket lifecycle: NEW → OPEN → PENDING → ON_HOLD → RESOLVED → CLOSED
- Enforced status transition rules (e.g. CLOSED tickets reopen on customer reply)
- Ticket priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Department-based routing and auto-assignment (least-loaded agent)
- Tags and custom categories

### SLA Management
- Per-priority SLA policies (response time + resolution time)
- Background scheduler checks SLA breaches every 5 minutes
- Automatic escalation notifications to team leads and admins on breach

### Communication
- Public replies visible to customer and agents
- Internal notes visible to agents only (never shown to customers)
- First response time tracking
- File attachments (up to 20MB per file)
- Real-time in-app notifications via WebSocket

### Admin Controls
- Full CRUD for users, departments, and SLA policies
- Role assignment (CUSTOMER / AGENT / TEAM_LEAD / ADMIN)
- Activate/deactivate users
- Dashboard KPIs: open tickets, pending, resolved today, SLA breached
- Status breakdown chart

### Security
- JWT access tokens (1 hour) + refresh tokens (7 days)
- BCrypt password hashing
- Role-based endpoint protection (`@PreAuthorize`)
- Soft delete on all entities (no permanent data loss)
- Optimistic locking on tickets (prevent concurrent update conflicts)
- CORS configured per environment

---

## Project Structure

```
helpdesk-pro/
├── backend/                        # Spring Boot application
│   ├── src/main/java/com/helpdesk/
│   │   ├── config/                 # Security, WebSocket, JPA config
│   │   ├── domain/
│   │   │   ├── user/               # entity, repo, service, controller, dto
│   │   │   ├── ticket/             # entity, repo, service, controller, dto
│   │   │   ├── comment/
│   │   │   ├── attachment/
│   │   │   ├── department/
│   │   │   ├── sla/
│   │   │   └── notification/
│   │   ├── security/               # JWT provider, filter, UserDetailsService
│   │   └── shared/                 # ApiResponse, AuditableEntity, exceptions
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/           # Flyway SQL migrations V1–V6
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                       # Angular 18 application
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── auth/               # AuthService, guards
│   │   │   ├── interceptors/       # JWT interceptor with auto-refresh
│   │   │   ├── models/             # TypeScript interfaces
│   │   │   └── services/           # TicketService, UserService, etc.
│   │   ├── shared/
│   │   │   ├── components/         # status-badge, priority-badge, skeleton-loader
│   │   │   └── pipes/              # timeAgo
│   │   ├── features/
│   │   │   ├── auth/               # login, register
│   │   │   ├── customer/           # portal, submit-ticket, my-tickets, ticket-detail
│   │   │   ├── agent/              # dashboard, ticket-queue, ticket-detail
│   │   │   └── admin/              # overview, tickets, users, departments, sla, settings
│   │   └── layout/
│   │       ├── customer-shell/     # Top nav layout
│   │       ├── agent-shell/        # Collapsible sidebar layout
│   │       └── admin-shell/        # Full admin sidebar layout
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── angular.json
│   ├── tailwind.config.js
│   └── package.json
│
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Maven 3.9+
- Angular CLI 18+

---

### Local Development (without Docker)

#### 1. Start PostgreSQL

```bash
# Using Docker just for the DB:
docker run -d \
  --name helpdesk-db \
  -e POSTGRES_DB=helpdesk \
  -e POSTGRES_USER=helpdesk \
  -e POSTGRES_PASSWORD=helpdesk \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Start MailHog (local email testing)

```bash
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

#### 3. Run the Backend

```bash
cd helpdesk-pro/backend

# Set environment variables (or export them)
export JWT_SECRET="dev-secret-key-change-in-production-min-32-chars"
export DB_USER=helpdesk
export DB_PASS=helpdesk

./mvnw spring-boot:run
```

Backend starts at: `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui.html`

#### 4. Run the Frontend

```bash
cd helpdesk-pro/frontend

npm install
ng serve
```

Frontend starts at: `http://localhost:4200`

---

### Docker Setup (Recommended)

Runs everything — database, mail server, backend, and frontend — in one command.

```bash
cd helpdesk-pro

docker compose up -d
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| MailHog (email UI) | http://localhost:8025 |
| pgAdmin | http://localhost:5050 |

To stop:
```bash
docker compose down
```

To wipe data and start fresh:
```bash
docker compose down -v
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@helpdesk.com | Admin@123 |
| Agent | agent@helpdesk.com | Agent@123 |
| Customer | customer@helpdesk.com | Customer@123 |

> pgAdmin login: `admin@helpdesk.com` / `admin`

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `DB_USER` | `helpdesk` | PostgreSQL username |
| `DB_PASS` | `helpdesk` | PostgreSQL password |
| `JWT_SECRET` | *(required)* | Min 32-character secret key for JWT signing |
| `JWT_ACCESS_EXPIRY` | `3600000` | Access token TTL in milliseconds (1 hour) |
| `JWT_REFRESH_EXPIRY` | `604800000` | Refresh token TTL in milliseconds (7 days) |
| `MAIL_HOST` | `mailhog` | SMTP host |
| `MAIL_PORT` | `1025` | SMTP port |
| `MAIL_USER` | *(empty)* | SMTP username |
| `MAIL_PASS` | *(empty)* | SMTP password |
| `UPLOAD_PATH` | `./uploads` | File attachment storage path |
| `FRONTEND_URL` | `http://localhost:4200` | Allowed CORS origin |

### Frontend

| Variable | File | Description |
|---|---|---|
| `apiUrl` | `environment.ts` | Backend API base URL |
| `wsUrl` | `environment.ts` | WebSocket endpoint URL |

---

## API Documentation

Interactive Swagger UI is available at:
```
http://localhost:8080/swagger-ui.html
```

### Key Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/tickets              # filter by status, priority, department, agent, date
POST   /api/v1/tickets
GET    /api/v1/tickets/{id}
PATCH  /api/v1/tickets/{id}
PATCH  /api/v1/tickets/{id}/assign
PATCH  /api/v1/tickets/{id}/status
DELETE /api/v1/tickets/{id}

GET    /api/v1/tickets/{id}/comments
POST   /api/v1/tickets/{id}/comments
PATCH  /api/v1/tickets/{ticketId}/comments/{id}
DELETE /api/v1/tickets/{ticketId}/comments/{id}

POST   /api/v1/tickets/{id}/attachments
GET    /api/v1/attachments/{id}/download

GET    /api/v1/departments
POST   /api/v1/departments
PUT    /api/v1/departments/{id}
DELETE /api/v1/departments/{id}

GET    /api/v1/sla
POST   /api/v1/sla
PUT    /api/v1/sla/{id}
DELETE /api/v1/sla/{id}

GET    /api/v1/users
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

GET    /api/v1/stats/dashboard
GET    /api/v1/stats/agent/{agentId}

GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
POST   /api/v1/notifications/mark-all-read

WS     /ws  (STOMP endpoint)
Topic  /user/{userId}/queue/notifications
```

All responses use a standard wrapper:
```json
{
  "success": true,
  "message": "string",
  "data": {},
  "errors": [],
  "timestamp": "2024-12-15T10:30:00Z"
}
```

---

## Roles & Permissions

| Action | CUSTOMER | AGENT | TEAM_LEAD | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Submit ticket | ✅ | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ✅ | ✅ | ✅ |
| Reply to ticket | ✅ | ✅ | ✅ | ✅ |
| Add internal note | ❌ | ✅ | ✅ | ✅ |
| Change ticket status | ❌ | ✅ | ✅ | ✅ |
| Assign ticket | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage departments | ❌ | ❌ | ❌ | ✅ |
| Manage SLA policies | ❌ | ❌ | ❌ | ✅ |
| View dashboard stats | ❌ | ✅ | ✅ | ✅ |

---

## Database Migrations

Flyway runs automatically on startup. Migration files are in:
```
backend/src/main/resources/db/migration/
```

| File | Contents |
|---|---|
| `V1__create_users.sql` | Users table with indexes |
| `V2__create_departments_and_sla.sql` | Departments and SLA policy tables |
| `V3__create_tickets.sql` | Tickets table with tags, sequence |
| `V4__create_comments_and_attachments.sql` | Comments and attachments tables |
| `V5__create_notifications_and_audit.sql` | Notifications and audit log tables |
| `V6__seed_initial_data.sql` | Default admin/agent/customer users, 3 departments, 4 SLA policies |

---

## Architecture Overview

```
Browser
  │
  ├── Angular 18 (Standalone Components)
  │     ├── Lazy-loaded feature modules per role
  │     ├── JWT interceptor (auto-refresh on 401)
  │     ├── Angular Signals for state
  │     └── STOMP/SockJS WebSocket client
  │
Nginx (port 80)
  ├── /           → Angular app
  ├── /api/*      → proxy → Spring Boot :8080
  └── /ws/*       → proxy → Spring Boot :8080 (WebSocket upgrade)
  │
Spring Boot 3 (port 8080)
  ├── Spring Security 6 (stateless JWT)
  ├── REST Controllers (versioned /api/v1/*)
  ├── Spring Data JPA → PostgreSQL
  ├── Flyway (schema migrations)
  ├── STOMP WebSocket (real-time notifications)
  ├── JavaMailSender (email notifications)
  └── @Scheduled SLA checker (every 5 min)
  │
PostgreSQL 16
  └── 8 tables: users, departments, sla_policies, tickets,
                ticket_tags, comments, attachments,
                notifications, audit_logs
```
