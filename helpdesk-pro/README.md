# HelpDesk Pro

A modern, full-stack enterprise customer support ticketing system built as a professional replacement for osTicket. Features a clean enterprise UI, real-time notifications, SLA tracking, role-based access control, and an extensive enterprise feature pack.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [What's New (Enterprise Feature Pack)](#whats-new-enterprise-feature-pack)
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

- **Customer Portal** — Submit tickets, track status, reply to support threads, rate support via CSAT
- **Agent Dashboard** — Manage ticket queues, add internal notes, use macros, track time, manage watchers and tasks
- **Admin Panel** — Full control over users, departments, SLA policies, business hours, round-robin routing, teams, NPS, agent performance, and system settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.2, Spring Security 6, Spring Data JPA |
| Database | PostgreSQL 16 + Flyway migrations (V1–V52) |
| Authentication | JWT (access token + refresh token) + TOTP 2FA |
| Real-time | WebSocket (STOMP over SockJS) |
| Email | JavaMailSender (SMTP) |
| AI / LLM | Ollama (local, default) or Anthropic API (opt-in) for AI agent automation & smart replies |
| Frontend | Angular 18 (standalone components) |
| UI Library | Hand-rolled `hlm-*` component library (spartan-ng style) on agent screens, PrimeNG elsewhere + TailwindCSS |
| Animation | GSAP |
| State | Angular Signals |
| Build | Maven (backend), Angular CLI (frontend) |
| Container | Docker + Docker Compose |
| Proxy | Nginx |

---

## Features

### Core Ticketing
- Auto-generated ticket numbers (`TKT-YYYYMMDD-XXXXX`)
- Full ticket lifecycle: NEW → OPEN → PENDING → ON_HOLD → RESOLVED → CLOSED → **SNOOZED**
- Enforced status transition rules (e.g. CLOSED tickets reopen on customer reply)
- Ticket priority levels: LOW, MEDIUM, HIGH, CRITICAL
- Department-based routing and auto-assignment (least-loaded or round-robin)
- Tags and custom categories
- **Parent–child ticket hierarchy** — link sub-tickets to a parent ticket
- **Ticket Snooze** — defer a ticket to a future date/time with preset or custom picker
- **Ticket Merging** — merge duplicate tickets into a primary ticket

### SLA Management
- Per-priority SLA policies (response time + resolution time)
- Background scheduler checks SLA breaches every 5 minutes
- Automatic escalation notifications to team leads and admins on breach
- Configurable escalation rules per policy

### Communication
- Public replies visible to customer and agents
- Internal notes visible to agents only (never shown to customers)
- First response time tracking
- File attachments (up to 20MB per file)
- Real-time in-app notifications via WebSocket
- **Canned Responses** — pre-written reply snippets insertable from the reply box
- **Ticket Templates** — pre-filled ticket templates per department

### Agent Productivity
- **Macros** — apply bulk actions (status, priority, assignment, internal note) in one click
- **Ticket Tasks** — per-ticket checklist with add/complete/delete
- **Ticket Watchers** — subscribe additional agents to a ticket's updates
- **Saved Views** — create named filter presets for ticket queues
- **Time Tracking** — log time spent per ticket
- **Agent Availability** — set online/busy/offline status with per-channel toggles (email, chat, phone)
- **AI Agent Engine** — automated agents match incoming tickets by category + keyword list and execute a capability handler (e.g. password reset, hardware troubleshooting), posting the result as a ticket comment and optionally auto-closing the ticket. Smart-reply suggestions and capability execution are powered by a pluggable LLM client (local Ollama by default, Anthropic API as opt-in — see `AI_PROVIDER` below). ⚠️ Capabilities that mutate user state (e.g. `PASSWORD_RESET`) act on any ticket matching their keyword list, including seeded/demo tickets — review agent keyword lists before enabling in an environment with real data.

### Admin Controls
- Full CRUD for users, departments, SLA policies, and all configuration entities
- Role assignment (CUSTOMER / AGENT / TEAM_LEAD / ADMIN)
- Activate/deactivate users
- Dashboard KPIs: open tickets, pending, resolved today, SLA breached
- **Business Hours** — configure support schedule per day of week with timezone support
- **Round Robin Assignment** — per-department auto-assignment toggle
- **Teams** — create agent teams; assign tickets to teams
- **Agent Performance** — per-agent metrics with time-range filtering
- **NPS Dashboard** — Net Promoter Score survey results with promoter/passive/detractor breakdown
- **Macros Admin** — manage the shared macro library
- **Organizations** — group customers into organizations

### Security
- JWT access tokens (1 hour) + refresh tokens (7 days)
- TOTP-based Two-Factor Authentication (QR code setup, enable/disable per user)
- BCrypt password hashing
- Role-based endpoint protection (`@PreAuthorize`)
- Rate limiting (configurable req/min per IP)
- Soft delete on all entities (no permanent data loss)
- Optimistic locking on tickets (prevent concurrent update conflicts)
- CORS configured per environment

---

## What's New (Enterprise Feature Pack)

| # | Feature | Backend | Angular | Flutter |
|---|---|:---:|:---:|:---:|
| F1 | Two-Factor Authentication (TOTP) | ✅ | ✅ | ✅ |
| F2 | Canned Responses | ✅ | ✅ | ✅ |
| F3 | SLA Escalation Rules | ✅ | ✅ | ✅ |
| F4 | Ticket Templates | ✅ | ✅ | ✅ |
| F5 | Knowledge Base | ✅ | ✅ | ✅ |
| F6 | Custom Fields | ✅ | ✅ | ✅ |
| F7 | Webhooks | ✅ | ✅ | ✅ |
| F8 | API Keys | ✅ | ✅ | ✅ |
| F9 | Audit Log | ✅ | ✅ | ✅ |
| F10 | Advanced Analytics | ✅ | ✅ | ✅ |
| F11 | Ticket Watchers | ✅ | ✅ | ✅ |
| F12 | Ticket Tasks | ✅ | ✅ | ✅ |
| F13 | Saved Views | ✅ | ✅ | ✅ |
| F14 | Ticket Merging | ✅ | ✅ | ✅ |
| F15 | Parent–Child Tickets | ✅ | ✅ | ✅ |
| F16 | Ticket Snooze | ✅ | ✅ | ✅ |
| F17 | Agent Availability | ✅ | ✅ | ✅ |
| F18 | Macros | ✅ | ✅ | ✅ |
| F19 | Business Hours | ✅ | ✅ | ✅ |
| F20 | Round Robin Assignment | ✅ | ✅ | ✅ |
| — | Agent Performance Dashboard | ✅ | ✅ | ✅ |
| — | Teams | ✅ | ✅ | ✅ |
| — | NPS Dashboard | ✅ | ✅ | ✅ |

---

## Project Structure

```
helpdesk-pro/
├── backend/                        # Spring Boot application
│   ├── src/main/java/com/helpdesk/
│   │   ├── config/                 # Security, WebSocket, JPA, rate-limit config
│   │   ├── domain/
│   │   │   ├── user/               # entity, repo, service, controller, dto
│   │   │   ├── ticket/             # entity, repo, service, controller, dto
│   │   │   ├── comment/
│   │   │   ├── attachment/
│   │   │   ├── department/
│   │   │   ├── sla/
│   │   │   ├── notification/
│   │   │   ├── canned_response/
│   │   │   ├── template/
│   │   │   ├── kb/                 # Knowledge base categories + articles
│   │   │   ├── custom_field/
│   │   │   ├── webhook/
│   │   │   ├── api_key/
│   │   │   ├── help_topic/
│   │   │   ├── email_inbox/
│   │   │   ├── organization/
│   │   │   ├── issue/
│   │   │   ├── audit/
│   │   │   ├── saved_view/
│   │   │   ├── task/
│   │   │   ├── watcher/
│   │   │   ├── macro/
│   │   │   ├── team/
│   │   │   ├── business_hours/
│   │   │   ├── round_robin/
│   │   │   ├── nps/
│   │   │   ├── time_entry/
│   │   │   └── agent_availability/
│   │   ├── security/               # JWT provider, filter, UserDetailsService, 2FA
│   │   └── shared/                 # ApiResponse, AuditableEntity, exceptions, rate limiter
│   ├── src/main/resources/
│   │   ├── application.yml         # Flyway out-of-order: true enabled
│   │   └── db/migration/           # Flyway SQL migrations V1–V44
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                       # Angular 18 application
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── auth/               # AuthService, 2FA guards
│   │   │   ├── interceptors/       # JWT interceptor with auto-refresh
│   │   │   ├── models/             # TypeScript interfaces (all entities)
│   │   │   └── services/           # All feature services
│   │   ├── shared/
│   │   │   ├── components/         # status-badge, priority-badge, skeleton-loader
│   │   │   ├── ui/                 # hlm-* components (button, card, dialog, table, select, ...)
│   │   │   └── pipes/              # timeAgo
│   │   ├── features/
│   │   │   ├── auth/               # login, register, 2fa
│   │   │   ├── customer/           # portal, submit-ticket, my-tickets, ticket-detail
│   │   │   ├── agent/              # dashboard, ticket-queue, ticket-detail (hlm-* UI, GSAP animations)
│   │   │   └── admin/
│   │   │       ├── overview/
│   │   │       ├── tickets/
│   │   │       ├── users/
│   │   │       ├── departments/
│   │   │       ├── sla/
│   │   │       ├── canned-responses/
│   │   │       ├── templates/
│   │   │       ├── knowledge-base/
│   │   │       ├── custom-fields/
│   │   │       ├── webhooks/
│   │   │       ├── api-keys/
│   │   │       ├── help-topics/
│   │   │       ├── email-inboxes/
│   │   │       ├── organizations/
│   │   │       ├── issues/
│   │   │       ├── audit-log/
│   │   │       ├── analytics/
│   │   │       ├── settings/
│   │   │       ├── business-hours/     # NEW
│   │   │       ├── round-robin/        # NEW
│   │   │       ├── agent-performance/  # NEW
│   │   │       ├── macros/             # NEW
│   │   │       ├── teams/              # NEW
│   │   │       └── nps/                # NEW
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

> **Note:** Flyway runs with `out-of-order: true` so migrations apply correctly even if your local database was created before newer migration files were added.

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
| `ENCRYPTION_KEY` | *(required in prod)* | 32-char key for encrypting sensitive config (e.g. SMTP passwords) |
| `AI_PROVIDER` | `ollama` | LLM backend for AI agent automation & smart replies: `ollama` (local, default) or `anthropic` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Base URL of a locally running Ollama instance |
| `OLLAMA_MODEL` | `qwen2.5:32b` | Ollama model tag to use (must already be pulled, e.g. via `ollama pull qwen2.5:32b`; needs ~32GB RAM, use a smaller tag like `llama3.2:1b` on lighter machines) |
| `ANTHROPIC_API_KEY` | *(empty)* | API key for the Anthropic Claude API; only used when `AI_PROVIDER=anthropic` |

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
POST   /api/v1/auth/2fa/setup
POST   /api/v1/auth/2fa/verify

GET    /api/v1/tickets              # filter by status, priority, department, agent, date
POST   /api/v1/tickets
GET    /api/v1/tickets/{id}
PATCH  /api/v1/tickets/{id}
PATCH  /api/v1/tickets/{id}/assign
PATCH  /api/v1/tickets/{id}/status
PATCH  /api/v1/tickets/{id}/snooze
DELETE /api/v1/tickets/{id}
POST   /api/v1/tickets/{id}/merge
GET    /api/v1/tickets/{id}/children
GET    /api/v1/tickets/{id}/parent

GET    /api/v1/tickets/{id}/comments
POST   /api/v1/tickets/{id}/comments

GET    /api/v1/tickets/{id}/watchers
POST   /api/v1/tickets/{id}/watchers
DELETE /api/v1/tickets/{id}/watchers/{userId}

GET    /api/v1/tickets/{id}/tasks
POST   /api/v1/tickets/{id}/tasks
PATCH  /api/v1/tickets/{id}/tasks/{taskId}
DELETE /api/v1/tickets/{id}/tasks/{taskId}

GET    /api/v1/macros
POST   /api/v1/macros
PUT    /api/v1/macros/{id}
DELETE /api/v1/macros/{id}
POST   /api/v1/macros/{macroId}/apply/{ticketId}

GET    /api/v1/teams
POST   /api/v1/teams
GET    /api/v1/teams/{id}/members
POST   /api/v1/teams/{id}/members
DELETE /api/v1/teams/{id}/members/{userId}

GET    /api/v1/business-hours
PUT    /api/v1/business-hours

GET    /api/v1/round-robin/config
PUT    /api/v1/round-robin/config

GET    /api/v1/analytics/agents     # agent performance metrics
GET    /api/v1/nps/score
GET    /api/v1/nps/responses

GET    /api/v1/agents/availability
GET    /api/v1/agents/availability/me
PUT    /api/v1/agents/availability/me

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
| Snooze ticket | ❌ | ✅ | ✅ | ✅ |
| Merge tickets | ❌ | ✅ | ✅ | ✅ |
| Apply macros | ❌ | ✅ | ✅ | ✅ |
| Manage tasks/watchers | ❌ | ✅ | ✅ | ✅ |
| Assign ticket | ❌ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| Manage departments | ❌ | ❌ | ❌ | ✅ |
| Manage SLA policies | ❌ | ❌ | ❌ | ✅ |
| Manage macros library | ❌ | ❌ | ❌ | ✅ |
| Manage teams | ❌ | ❌ | ❌ | ✅ |
| Configure business hours | ❌ | ❌ | ❌ | ✅ |
| Configure round robin | ❌ | ❌ | ❌ | ✅ |
| View agent performance | ❌ | ❌ | ✅ | ✅ |
| View NPS dashboard | ❌ | ❌ | ✅ | ✅ |
| View dashboard stats | ❌ | ✅ | ✅ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ✅ |

---

## Database Migrations

Flyway runs automatically on startup with `out-of-order: true`. Migration files are in:
```
backend/src/main/resources/db/migration/
```

| Range | Contents |
|---|---|
| V1–V6 | Core tables: users, departments, SLA, tickets, comments, attachments, notifications, audit log, seed data |
| V7–V15 | 2FA, canned responses, SLA rules, templates, knowledge base, custom fields, webhooks, API keys |
| V16–V25 | Help topics, email inboxes, organizations, issues, saved views, tasks, watchers, analytics views |
| V26–V35 | Macros, ticket merging, parent-child tickets, time tracking, agent availability, teams |
| V36–V44 | Business hours, round robin, NPS, agent performance views, SNOOZED status constraint fix |
| V45–V52 | Ticket splitting, automation rules, seed customer tickets, AI agent support, AI agent definitions & capability definitions, hardware agent |

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
  ├── Spring Security 6 (stateless JWT + TOTP 2FA)
  ├── REST Controllers (versioned /api/v1/*)
  ├── Spring Data JPA → PostgreSQL
  ├── Flyway (schema migrations, out-of-order enabled)
  ├── STOMP WebSocket (real-time notifications)
  ├── JavaMailSender (email notifications)
  ├── Bucket4j rate limiting per IP
  └── @Scheduled tasks: SLA checker (5 min), snooze waker (1 min)
  │
PostgreSQL 16
  └── 40+ tables covering all domains above
```
