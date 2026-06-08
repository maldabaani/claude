# 🎫 HelpDesk Pro

> A full-featured, production-ready customer support platform built with Angular 18 and Spring Boot 3.2.

![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## ✨ Features Overview

| Category | Highlights |
|---|---|
| 🎫 **Ticket Management** | Create, assign, prioritize, watch, and track tickets through full lifecycle |
| 👥 **Multi-Role Access** | Separate portals for Admins, Agents, and Customers with fine-grained permissions |
| 🔔 **Real-Time Notifications** | WebSocket/STOMP push notifications for instant ticket updates |
| 📊 **Analytics & Reporting** | Dashboard charts, agent performance metrics, CSAT scores, SLA compliance |
| ⏱️ **SLA Policies** | Configurable response/resolution deadlines with automated escalation rules |
| 📚 **Knowledge Base** | Searchable self-service articles to deflect tickets and empower customers |
| 💬 **Canned Responses** | Pre-built reply templates for faster agent workflows |
| 🏢 **Organizations** | Group customers by company for B2B support workflows |
| 🔐 **Security** | JWT auth, role-based access control, TOTP two-factor authentication, API keys |
| 🔗 **Integrations** | Outbound webhooks, email inboxes, full REST API with Swagger docs |
| ⚙️ **Admin Controls** | Departments, custom fields, ticket templates, help topics, business hours, saved views |
| 📋 **Ticket Tasks** | Sub-tasks within tickets to track granular work items |
| 🏷️ **Issues Tracker** | Link related tickets to tracked issues |
| 📁 **File Attachments** | Upload attachments up to 20 MB per file |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Angular | 18 | SPA framework |
| PrimeNG | 18 | UI component library |
| Angular Material | 18 | Supplementary UI components |
| TailwindCSS | 3.4 | Utility-first styling |
| Chart.js + ng2-charts | 4.4 / 6.0 | Analytics charts |
| @stomp/rx-stomp + SockJS | 2.0 / 1.6 | WebSocket/STOMP real-time client |
| Marked | 12.0 | Markdown rendering in articles |
| TypeScript | 5.4 | Typed JavaScript |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.2.5 | Application framework |
| Spring Security 6 | (via Boot) | Authentication & authorization |
| Spring Data JPA | (via Boot) | ORM and repository layer |
| Spring WebSocket | (via Boot) | Real-time messaging (STOMP) |
| Spring Mail | (via Boot) | Email notifications |
| Flyway | (via Boot) | Database migrations (V1–V26) |
| JJWT | 0.12.5 | JWT token generation/validation |
| MapStruct | 1.5.5 | DTO ↔ entity mapping |
| Lombok | 1.18.32 | Boilerplate reduction |
| SpringDoc OpenAPI | 2.5.0 | Swagger UI & API documentation |
| TOTP (samstevens) | 1.7.1 | Two-factor authentication |
| Spring Boot Actuator | (via Boot) | Health & info endpoints |

### Infrastructure

| Component | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Dev mail server | MailHog (local email capture & inspection) |
| DB admin UI | pgAdmin 4 |
| Containerization | Docker + Docker Compose |
| Frontend serving | Nginx (Docker production build) |

---

## 🔑 Default Credentials

These users are seeded automatically by Flyway migration `V6`.

| Role | Name | Email | Password |
|---|---|---|---|
| **ADMIN** | System Admin | `admin@helpdesk.com` | `Admin@123` |
| **AGENT** | IT Agent | `agent@helpdesk.com` | `Agent@123` |
| **CUSTOMER** | Jane Customer | `customer@helpdesk.com` | `Customer@123` |

> ⚠️ **Change all default passwords immediately in any non-local environment.**

---

## 📋 Prerequisites

Make sure the following are installed before running locally:

| Tool | Minimum Version | Check command | Notes |
|---|---|---|---|
| **Java (JDK)** | 17+ | `java -version` | [Adoptium](https://adoptium.net) recommended |
| **Maven** | 3.9+ | `mvn -version` | Or use the included `./mvnw` wrapper |
| **Node.js** | 20+ | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | `npm -v` | Bundled with Node.js |
| **Angular CLI** | 18+ | `ng version` | `npm install -g @angular/cli` |
| **PostgreSQL** | 15+ | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |
| **Docker** *(optional)* | 24+ | `docker --version` | Required for full Docker Compose setup |

---

## 🖥️ Running Locally

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd helpdesk-pro
```

### 2. Database setup

```sql
-- Connect as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE helpdesk;
CREATE USER helpdesk WITH PASSWORD 'helpdesk';
GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;
\q
```

> Alternatively, start just the database container:
> ```bash
> docker compose up postgres -d
> ```
>
> Flyway will automatically create all tables and seed the default data on first backend startup.

### 3. Start the backend

```bash
cd helpdesk-pro/backend

# Run with default settings (DB: helpdesk/helpdesk on localhost:5432)
./mvnw spring-boot:run

# Or override credentials via environment variables
DB_USER=helpdesk \
DB_PASS=helpdesk \
JWT_SECRET=my-super-secret-key-at-least-32-characters-long \
./mvnw spring-boot:run
```

Flyway runs all migrations **V1–V26** automatically on startup. Check the logs for `Successfully applied N migrations`.

### 4. Start the frontend

```bash
cd helpdesk-pro/frontend
npm install
ng serve
# or: npm start
```

### 5. Access the application

| Service | URL | Notes |
|---|---|---|
| **Frontend** | http://localhost:4200 | Angular dev server |
| **Backend API** | http://localhost:8080 | Spring Boot |
| **Swagger UI** | http://localhost:8080/swagger-ui.html | Interactive API docs |
| **OpenAPI JSON** | http://localhost:8080/api-docs | Machine-readable spec |
| **Actuator Health** | http://localhost:8080/actuator/health | Liveness check |
| **MailHog UI** *(if running)* | http://localhost:8025 | Captured outbound emails |
| **pgAdmin** *(if running)* | http://localhost:5050 | DB browser (admin@helpdesk.com / admin) |

### 6. Environment variables

| Variable | Default | Description |
|---|---|---|
| `DB_USER` | `helpdesk` | PostgreSQL username |
| `DB_PASS` | `helpdesk` | PostgreSQL password |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/helpdesk` | Full JDBC URL (overrides host/port when set) |
| `JWT_SECRET` | `change-me-in-production-must-be-at-least-32-characters-long` | HMAC-SHA256 signing key — **must be changed in prod** |
| `MAIL_HOST` | `mailhog` | SMTP server hostname |
| `MAIL_PORT` | `1025` | SMTP server port |
| `MAIL_USER` | *(empty)* | SMTP username (if auth required) |
| `MAIL_PASS` | *(empty)* | SMTP password (if auth required) |
| `FRONTEND_URL` | `http://localhost:4200` | Allowed CORS origin and frontend base URL for email links |
| `UPLOAD_PATH` | `./uploads` | Directory for ticket file attachment storage |

---

## 🐳 Docker Compose — Full Local Stack

The included `docker-compose.yml` starts **PostgreSQL, MailHog, pgAdmin, backend, and frontend** together.

```bash
cd helpdesk-pro

# Build and start all services
docker compose up -d --build

# Tail backend logs
docker compose logs -f backend

# Stop everything
docker compose down
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8080 |
| pgAdmin | http://localhost:5050 |
| MailHog Web UI | http://localhost:8025 |

---

## ☁️ Hosting on Cloud

### Option A: Docker Compose on a VPS (DigitalOcean, Linode, AWS EC2)

This is the **fastest path to production** for a self-hosted single-server deployment.

The repository already includes multi-stage `Dockerfile`s for both services. Use the production compose file below for a VPS deployment.

#### Backend `Dockerfile` (`helpdesk-pro/backend/Dockerfile`)

```dockerfile
# Stage 1: Build with JDK
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q
COPY src ./src
RUN ./mvnw package -DskipTests -q

# Stage 2: Slim JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S helpdesk && adduser -S helpdesk -G helpdesk
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads && chown helpdesk:helpdesk /app/uploads
USER helpdesk
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Frontend `Dockerfile` (`helpdesk-pro/frontend/Dockerfile`)

```dockerfile
# Stage 1: Build Angular app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build:prod

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist/helpdesk-pro/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### Production `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DB_USER: ${POSTGRES_USER}
      DB_PASS: ${POSTGRES_PASSWORD}
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT}
      MAIL_USER: ${MAIL_USER}
      MAIL_PASS: ${MAIL_PASS}
      FRONTEND_URL: ${FRONTEND_URL}
      UPLOAD_PATH: /app/uploads
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads_data:
```

#### Sample `.env` file

Create a `.env` file alongside `docker-compose.prod.yml`. **Never commit this file.**

```dotenv
# .env — keep this file secret

# Database
POSTGRES_DB=helpdesk
POSTGRES_USER=helpdesk
POSTGRES_PASSWORD=a_strong_random_password_here

# JWT — generate: openssl rand -base64 64
JWT_SECRET=replace-this-with-a-very-long-random-string-at-least-64-chars-for-production

# Email (e.g. SendGrid, Mailgun, AWS SES, or your own SMTP)
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=SG.xxxxxxxxxxxxxxxxxxxxxx

# Application
FRONTEND_URL=https://yourdomain.com
```

#### Deployment steps

```bash
# 1. SSH into your VPS
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 3. Clone the repository
git clone <your-repo-url> /opt/helpdesk-pro
cd /opt/helpdesk-pro/helpdesk-pro

# 4. Create and fill the .env file
cp .env.example .env
nano .env

# 5. Build and start all services
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# 6. Check service status and logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

> **TLS tip:** Install [Caddy](https://caddyserver.com) on the host as a reverse proxy. It handles Let's Encrypt automatically:
> ```
> # /etc/caddy/Caddyfile
> yourdomain.com {
>     reverse_proxy localhost:80
> }
> api.yourdomain.com {
>     reverse_proxy localhost:8080
> }
> ```

---

### Option B: Railway / Render (PaaS — Free-Tier Friendly)

Zero-ops platforms ideal for demos, staging, or small production apps.

#### Deploying on Railway

1. **Create a Railway account** at [railway.app](https://railway.app) and start a new **Project**.

2. **Add a PostgreSQL database**
   - Click **+ New → Database → PostgreSQL**
   - Railway auto-generates `DATABASE_URL` and injects it into services in the same project.

3. **Deploy the backend**
   - Click **+ New → GitHub Repo**, select your repository
   - Set **Root Directory** to `helpdesk-pro/backend`
   - Railway detects the `Dockerfile` automatically
   - Under the **Variables** tab, add:

   | Variable | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | Convert the Railway `DATABASE_URL` from `postgres://user:pass@host/db` → `jdbc:postgresql://host/db` |
   | `DB_USER` | PostgreSQL plugin username |
   | `DB_PASS` | PostgreSQL plugin password |
   | `JWT_SECRET` | Long random string (64+ chars) |
   | `MAIL_HOST` | Your SMTP provider hostname |
   | `MAIL_PORT` | `587` |
   | `MAIL_USER` | SMTP username |
   | `MAIL_PASS` | SMTP password / API key |
   | `FRONTEND_URL` | Your frontend Railway URL (set after deploying frontend below) |

4. **Deploy the frontend**
   - Add another service → **GitHub Repo** → same repo
   - Set **Root Directory** to `helpdesk-pro/frontend`
   - Railway builds via the `Dockerfile` and serves through nginx on port 80

5. **Custom domain**
   - In each service's **Settings → Domains**, attach a custom domain
   - Railway provisions Let's Encrypt TLS automatically

#### Deploying on Render

1. Create a **PostgreSQL** database on [render.com](https://render.com)
2. Create a **Web Service** for the backend → point to `helpdesk-pro/backend`, select **Docker** environment
3. Create a **Static Site** for the frontend:
   - Root directory: `helpdesk-pro/frontend`
   - Build command: `npm run build:prod`
   - Publish directory: `dist/helpdesk-pro/browser`
4. Add environment variables (same set as Railway above) under each service's **Environment** tab

---

### Option C: AWS (ECS + RDS) — Production Scale

For enterprise-grade deployments with auto-scaling and high availability.

#### Architecture overview

```
Internet
    │
    ▼
Route 53 (DNS)
    ├── yourdomain.com ──► CloudFront CDN ──► S3 Bucket (Angular static files)
    │
    └── api.yourdomain.com ──► Application Load Balancer (ALB)
                                      │
                                      ▼
                             ECS Fargate Service
                             (backend containers, 2+ tasks)
                                      │
                                      ▼
                             RDS PostgreSQL (Multi-AZ)
                                      │
                             Secrets Manager (JWT, DB creds)
```

#### High-level steps

1. **Database — RDS PostgreSQL**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier helpdesk-prod \
     --db-instance-class db.t3.small \
     --engine postgres \
     --engine-version 16 \
     --allocated-storage 20 \
     --master-username helpdesk \
     --master-user-password "<strong-password>" \
     --db-name helpdesk \
     --multi-az
   ```
   Store the master password in **AWS Secrets Manager**.

2. **Container Registry — ECR**
   ```bash
   # Create registries
   aws ecr create-repository --repository-name helpdesk-backend
   aws ecr create-repository --repository-name helpdesk-frontend

   # Authenticate and push images
   aws ecr get-login-password --region <region> \
     | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

   docker build -t helpdesk-backend ./helpdesk-pro/backend
   docker tag helpdesk-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/helpdesk-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/helpdesk-backend:latest
   ```

3. **Compute — ECS Fargate**
   - Create an ECS **Cluster** (Fargate launch type)
   - Define a **Task Definition** referencing the ECR image; inject secrets from Secrets Manager via the `secrets:` field
   - Create an **ECS Service** with `desiredCount: 2` for HA
   - Attach an **ALB** target group on path `/api/*` and `/ws/*`

4. **Frontend — S3 + CloudFront**
   ```bash
   cd helpdesk-pro/frontend
   npm run build:prod
   aws s3 sync dist/helpdesk-pro/browser/ s3://your-frontend-bucket/ --delete
   aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
   ```
   - Set `index.html` as both the default root object and the custom error document (for Angular client-side routing)

5. **Secrets — AWS Secrets Manager**
   Store `JWT_SECRET`, `DB_PASS`, and `MAIL_PASS` in Secrets Manager. Reference them in the ECS task definition:
   ```json
   "secrets": [
     { "name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:...:jwt-secret::" },
     { "name": "DB_PASS",    "valueFrom": "arn:aws:secretsmanager:...:db-pass::" }
   ]
   ```

> **Cost estimate:** ~$50–150/month for a minimal HA setup (RDS `db.t3.micro` + 2× Fargate tasks at 0.5 vCPU/1 GB + CloudFront).

---

## 🔧 Configuration Reference

Complete environment variable reference:

| Variable | Default Value | Required in Prod | Description |
|---|---|---|---|
| `DB_USER` | `helpdesk` | Yes | PostgreSQL username |
| `DB_PASS` | `helpdesk` | Yes | PostgreSQL password |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/helpdesk` | Yes (Docker/cloud) | Full JDBC connection URL |
| `JWT_SECRET` | `change-me-in-production-must-be-at-least-32-characters-long` | **Yes — must change** | HMAC-SHA256 signing key; minimum 32 chars, use 64+ in production |
| `MAIL_HOST` | `mailhog` | Yes | SMTP server hostname |
| `MAIL_PORT` | `1025` | Yes | SMTP server port (587 for TLS SMTP) |
| `MAIL_USER` | *(empty)* | If auth required | SMTP username |
| `MAIL_PASS` | *(empty)* | If auth required | SMTP password or API key |
| `FRONTEND_URL` | `http://localhost:4200` | Yes | Frontend origin for CORS allow-list and email link base URL |
| `UPLOAD_PATH` | `./uploads` | Yes | Filesystem path for uploaded ticket attachments |

---

## 📁 Project Structure

```
helpdesk-pro/
├── docker-compose.yml                  # Local full-stack (postgres, mailhog, pgadmin, backend, frontend)
│
├── backend/                            # Spring Boot 3.2 REST API
│   ├── Dockerfile                      # Multi-stage: JDK build → slim JRE runtime
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/helpdesk/
│       │   ├── config/                 # Security, WebSocket, CORS, MVC configuration
│       │   ├── security/               # JWT filter, UserDetailsService, auth endpoints
│       │   ├── shared/                 # Global exception handler, audit base, pagination
│       │   └── domain/                 # Feature modules (each: entity / repository / service / controller / dto)
│       │       ├── ticket/             # Core ticket lifecycle & workflow
│       │       ├── user/               # User CRUD, profile, avatar
│       │       ├── department/         # Department management & routing
│       │       ├── sla/                # SLA policies, breach tracking
│       │       ├── slaescalation/      # Automated escalation rules
│       │       ├── notification/       # In-app + WebSocket notifications
│       │       ├── kb/                 # Knowledge base articles & categories
│       │       ├── cannedresponse/     # Saved reply templates
│       │       ├── csat/               # Customer satisfaction surveys
│       │       ├── analytics/          # Reports, dashboards, metrics
│       │       ├── audit/              # Immutable audit log
│       │       ├── settings/           # System-wide configuration
│       │       ├── webhook/            # Outbound webhook dispatch
│       │       ├── apikey/             # API key management
│       │       ├── organization/       # Customer organizations (B2B)
│       │       ├── customfield/        # Dynamic ticket fields
│       │       ├── template/           # Ticket creation templates
│       │       ├── task/               # Per-ticket sub-tasks
│       │       ├── emailinbox/         # Inbound email configuration
│       │       ├── helptopic/          # Help topic routing
│       │       ├── twofa/              # TOTP 2FA setup & verification
│       │       ├── savedview/          # Agent saved ticket filters
│       │       └── issue/              # Issue tracker linking
│       └── resources/
│           ├── application.yml
│           └── db/migration/           # Flyway SQL migrations (V1–V26)
│
└── frontend/                           # Angular 18 SPA
    ├── Dockerfile                      # Multi-stage: Node build → nginx serve
    ├── nginx.conf
    ├── package.json
    └── src/app/
        ├── core/                       # Auth guards, HTTP interceptors, services, NgRx store
        ├── shared/                     # Reusable UI components and pipes
        ├── layout/                     # Role-specific app shells
        │   ├── admin-shell/
        │   ├── agent-shell/
        │   └── customer-shell/
        └── features/
            ├── admin/                  # Admin portal pages
            │   ├── analytics/
            │   ├── api-keys/
            │   ├── audit-log/
            │   ├── canned-responses/
            │   ├── custom-fields/
            │   ├── departments/
            │   ├── email-inboxes/
            │   ├── help-topics/
            │   ├── issues/
            │   ├── knowledge-base/
            │   ├── organizations/
            │   ├── overview/
            │   ├── settings/
            │   ├── sla/ & sla-rules/
            │   ├── templates/
            │   ├── users/
            │   └── webhooks/
            ├── agent/                  # Agent portal
            │   ├── dashboard/
            │   ├── ticket-queue/
            │   └── ticket-detail/
            ├── customer/               # Customer portal
            │   ├── portal/
            │   ├── submit-ticket/
            │   ├── my-tickets/
            │   ├── ticket-detail/
            │   └── knowledge-base/
            ├── auth/                   # Login & registration
            ├── csat/                   # CSAT survey
            └── profile/                # User profile & 2FA setup
```

---

## 🗄️ Database Migrations

HelpDesk Pro uses **Flyway** for schema management. Migrations run **automatically on startup** — no manual SQL needed.

| Migration | Description |
|---|---|
| `V1` | Create users table |
| `V2` | Departments and SLA policies |
| `V3` | Tickets table |
| `V4` | Comments and attachments |
| `V5` | Notifications and audit log |
| `V6` | **Seed initial data** (departments, SLA rules, default users) |
| `V7` | System settings |
| `V8` | Canned responses |
| `V9` | Knowledge base |
| `V10` | CSAT surveys |
| `V11` | Saved views |
| `V12` | Ticket watchers |
| `V13` | Business hours settings |
| `V14` | Custom fields |
| `V15` | SLA escalation rules |
| `V16` | Ticket templates |
| `V17` | Auto-assign setting |
| `V18` | Webhooks |
| `V19` | API keys |
| `V20` | Help topics |
| `V21` | Ticket tasks |
| `V22` | Email inboxes |
| `V23` | Organizations |
| `V24` | Issues tracker |
| `V25` | Due dates on tickets |
| `V26` | Two-factor authentication (2FA) for users |

> `spring.jpa.hibernate.ddl-auto` is set to `validate` — Hibernate only validates the schema and will never modify it. All schema changes must go through Flyway versioned migrations. Flyway state is tracked in the `flyway_schema_history` table.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss your proposed change before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request against `main`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
