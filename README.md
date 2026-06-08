# 🎫 HelpDesk Pro

> A full-featured, production-ready customer support ticketing system built with **Angular 18** and **Spring Boot 3.2**.

![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-007396?style=for-the-badge&logo=openjdk&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## ✨ Features Overview

| Category | Highlights |
|---|---|
| 🎫 **Ticket Management** | Create, assign, prioritize, tag, and track tickets through full lifecycle |
| 👥 **Role-Based Access** | ADMIN, AGENT, and CUSTOMER roles with fine-grained permissions |
| 🏢 **Departments & SLA** | Multi-department routing with automated SLA policies and escalation rules |
| 💬 **Real-Time Communication** | WebSocket/STOMP live notifications, ticket updates, and chat |
| 📧 **Email Integration** | Inbound email inboxes, outbound notifications, and MailHog for local dev |
| 📚 **Knowledge Base** | Self-service article management with categories and search |
| 📊 **Reporting & Analytics** | CSAT surveys, SLA reports, agent performance dashboards with Chart.js |
| 🔒 **Security** | JWT authentication, TOTP two-factor authentication, API keys, webhooks |
| ⚙️ **Admin Configuration** | Custom fields, ticket templates, canned responses, business hours, saved views |
| 🏗️ **Organization Support** | Link customers to organizations for B2B ticket management |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Angular | 18 | SPA framework |
| PrimeNG | 18 | UI component library |
| Angular Material | 18 | Additional UI components |
| TailwindCSS | 3.4 | Utility-first styling |
| Chart.js / ng2-charts | 4.4 / 6.0 | Data visualization |
| RxStomp + SockJS | 2.0 / 1.6 | WebSocket real-time comms |
| marked | 12 | Markdown rendering |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.2.5 | Application framework |
| Spring Security 6 | (included) | Authentication & authorization |
| Spring Data JPA | (included) | ORM / database access |
| Spring WebSocket | (included) | Real-time messaging |
| Spring Mail | (included) | Email sending |
| Flyway | (included) | Database migrations |
| jjwt | 0.12.5 | JWT token generation/validation |
| MapStruct | 1.5.5 | DTO mapping |
| Lombok | 1.18.32 | Boilerplate reduction |
| springdoc-openapi | 2.5.0 | Swagger / OpenAPI docs |
| TOTP (samstevens) | 1.7.1 | Two-factor authentication |

### Infrastructure
| Component | Technology |
|---|---|
| Database | PostgreSQL 16 |
| Dev mail server | MailHog |
| DB admin UI | pgAdmin 4 |
| Containerization | Docker + Docker Compose |
| Frontend serving | nginx (Docker) |

---

## 🔑 Default Credentials

> These users are seeded automatically by Flyway migration `V6`.

| Role | Name | Email | Password |
|---|---|---|---|
| **ADMIN** | System Admin | `admin@helpdesk.com` | `Admin@123` |
| **AGENT** | IT Agent | `agent@helpdesk.com` | `Agent@123` |
| **CUSTOMER** | Jane Customer | `customer@helpdesk.com` | `Customer@123` |

> ⚠️ **Change all default passwords immediately in any non-local environment.**

---

## 📋 Prerequisites

Make sure the following are installed on your machine:

| Tool | Minimum Version | Check |
|---|---|---|
| Java (JDK) | 17+ | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Angular CLI | 18+ | `ng version` |
| PostgreSQL | 15+ | `psql --version` |
| Docker *(optional)* | 24+ | `docker --version` |

---

## 🖥️ Running Locally

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd helpdesk-pro
```

### 2. Database Setup

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE helpdesk;
CREATE USER helpdesk WITH PASSWORD 'helpdesk';
GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;
\q
```

> Flyway will automatically create all tables and seed data on first startup.

### 3. Start the Backend

```bash
cd helpdesk-pro/backend

# Run with default settings (uses helpdesk/helpdesk credentials)
mvn spring-boot:run

# Or override with environment variables
DB_USER=helpdesk \
DB_PASS=helpdesk \
JWT_SECRET=my-super-secret-key-at-least-32-characters-long \
mvn spring-boot:run
```

### 4. Start the Frontend

```bash
cd helpdesk-pro/frontend

npm install
ng serve
# or: npm start
```

### 5. Access the Application

| Service | URL |
|---|---|
| Frontend (Angular) | http://localhost:4200 |
| Backend API | http://localhost:8080 |
| Swagger / OpenAPI UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api-docs |
| Actuator Health | http://localhost:8080/actuator/health |

---

### 🔧 Backend Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_USER` | `helpdesk` | PostgreSQL username |
| `DB_PASS` | `helpdesk` | PostgreSQL password |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/helpdesk` | Full JDBC URL (overrides host/port) |
| `JWT_SECRET` | `change-me-in-production-must-be-at-least-32-characters-long` | JWT signing secret (**change in prod!**) |
| `MAIL_HOST` | `mailhog` | SMTP server hostname |
| `MAIL_PORT` | `1025` | SMTP server port |
| `MAIL_USER` | *(empty)* | SMTP username |
| `MAIL_PASS` | *(empty)* | SMTP password |
| `FRONTEND_URL` | `http://localhost:4200` | Allowed CORS origin and frontend base URL |
| `UPLOAD_PATH` | `./uploads` | Directory for file attachment storage |

---

## 🐳 Running with Docker Compose (Local Full Stack)

The included `docker-compose.yml` starts **PostgreSQL, MailHog, pgAdmin, backend, and frontend** together.

```bash
cd helpdesk-pro

# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop everything
docker compose down
```

| Service | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8080 |
| pgAdmin | http://localhost:5050 (admin@helpdesk.com / admin) |
| MailHog Web UI | http://localhost:8025 |
| MailHog SMTP | localhost:1025 |

---

## ☁️ Hosting on Cloud

### Option A: Docker Compose on a VPS (DigitalOcean, Linode, AWS EC2)

This is the easiest path for self-hosting. A $6/month DigitalOcean Droplet (1 vCPU, 1 GB RAM) works for low traffic.

#### Step 1 — Provision your server

```bash
# SSH into your new VPS
ssh root@your-server-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin
```

#### Step 2 — Clone and configure

```bash
git clone <your-repo-url> /opt/helpdesk-pro
cd /opt/helpdesk-pro/helpdesk-pro
```

Create a `.env` file in the same directory as `docker-compose.yml`:

```env
# .env — DO NOT commit this file

# Database
POSTGRES_USER=helpdesk
POSTGRES_PASSWORD=a_strong_random_password_here
POSTGRES_DB=helpdesk

# Backend
DB_USER=helpdesk
DB_PASS=a_strong_random_password_here
JWT_SECRET=a-very-long-random-secret-at-least-64-characters-for-production-use
MAIL_HOST=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USER=noreply@yourdomain.com
MAIL_PASS=your_smtp_password
FRONTEND_URL=https://yourdomain.com
UPLOAD_PATH=/app/uploads
```

#### Step 3 — Update `docker-compose.yml` for production

For a production VPS deployment, use this `docker-compose.yml` (replaces the dev version):

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
      DB_USER: ${DB_USER}
      DB_PASS: ${DB_PASS}
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT}
      MAIL_USER: ${MAIL_USER}
      MAIL_PASS: ${MAIL_PASS}
      FRONTEND_URL: ${FRONTEND_URL}
      UPLOAD_PATH: ${UPLOAD_PATH}
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

#### Step 4 — Build and launch

```bash
docker compose --env-file .env up -d --build

# Verify services are running
docker compose ps
```

#### Step 5 — Configure a reverse proxy (recommended)

Use **nginx** or **Caddy** on the host as a reverse proxy for TLS termination:

```bash
# Install Caddy (handles Let's Encrypt automatically)
apt install -y caddy

# /etc/caddy/Caddyfile
cat > /etc/caddy/Caddyfile <<EOF
yourdomain.com {
    reverse_proxy localhost:80
}

api.yourdomain.com {
    reverse_proxy localhost:8080
}
EOF

systemctl restart caddy
```

---

### Option B: Railway / Render (PaaS — Free Tier Friendly)

Railway and Render are zero-ops platforms ideal for demos and small deployments.

#### Deploying on Railway

1. **Create a Railway account** at [railway.app](https://railway.app) and create a new **Project**.

2. **Add a PostgreSQL database:**
   - Click **+ New** → **Database** → **PostgreSQL**
   - Railway auto-generates `DATABASE_URL` — note it for later.

3. **Deploy the Backend:**
   - Click **+ New** → **GitHub Repo** → select your repository
   - Set the **Root Directory** to `helpdesk-pro/backend`
   - Railway detects the `Dockerfile` automatically
   - Add environment variables in the **Variables** tab:

   | Variable | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | Paste the `DATABASE_URL` from the PostgreSQL plugin (convert from `postgres://` to `jdbc:postgresql://`) |
   | `DB_USER` | From Railway PostgreSQL plugin |
   | `DB_PASS` | From Railway PostgreSQL plugin |
   | `JWT_SECRET` | A long random string (64+ chars) |
   | `MAIL_HOST` | Your SMTP provider (e.g., `smtp.sendgrid.net`) |
   | `MAIL_PORT` | `587` |
   | `MAIL_USER` | SMTP username |
   | `MAIL_PASS` | SMTP API key / password |
   | `FRONTEND_URL` | Your frontend Railway URL (set after deploying frontend) |

4. **Deploy the Frontend:**
   - Add another service → **GitHub Repo** → same repo
   - Set **Root Directory** to `helpdesk-pro/frontend`
   - Railway builds via the `Dockerfile` and serves via nginx

5. **Custom Domain:**
   - In each service's **Settings** → **Domains**, add your custom domain
   - Railway provisions TLS automatically via Let's Encrypt

#### Deploying on Render

1. Create a **PostgreSQL** instance at [render.com](https://render.com) (free tier available)
2. Create a **Web Service** for the backend — point to `helpdesk-pro/backend`, select **Docker** environment
3. Create a **Static Site** for the frontend — point to `helpdesk-pro/frontend`, build command: `npm run build:prod`, publish directory: `dist/helpdesk-pro/browser`
4. Set all environment variables in the Render dashboard under each service's **Environment** tab

---

### Option C: AWS (ECS + RDS — Production Scale)

For enterprise-grade deployments with auto-scaling and high availability.

#### Architecture Overview

```
Internet → Route 53 → CloudFront (CDN) → S3 (frontend static files)
                   ↓
              Application Load Balancer
                   ↓
         ECS Fargate (backend containers)
                   ↓
         RDS PostgreSQL (Multi-AZ)
                   ↓
         S3 (file uploads / attachments)
```

#### High-Level Steps

1. **Database — RDS PostgreSQL**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier helpdesk-prod \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --engine-version 16 \
     --allocated-storage 20 \
     --master-username helpdesk \
     --master-user-password <strong-password> \
     --db-name helpdesk \
     --multi-az
   ```

2. **Container Registry — ECR**
   ```bash
   # Create repos
   aws ecr create-repository --repository-name helpdesk-backend
   aws ecr create-repository --repository-name helpdesk-frontend

   # Build and push
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t helpdesk-backend ./helpdesk-pro/backend
   docker tag helpdesk-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/helpdesk-backend:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/helpdesk-backend:latest
   ```

3. **Compute — ECS Fargate**
   - Create an ECS Cluster (Fargate launch type)
   - Define a **Task Definition** with the backend container, injecting environment variables from **AWS Secrets Manager** or **Parameter Store**
   - Create an **ECS Service** with desired count = 2 for high availability
   - Attach an **Application Load Balancer** (ALB) to the service

4. **Frontend — S3 + CloudFront**
   ```bash
   npm run build:prod
   aws s3 sync dist/helpdesk-pro/browser/ s3://your-frontend-bucket/ --delete
   aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
   ```

5. **Secrets — AWS Secrets Manager**
   Store `JWT_SECRET`, `DB_PASS`, `MAIL_PASS` in Secrets Manager and reference them in your ECS task definition via `secrets:` entries.

---

## 🔧 Configuration Reference

Complete list of all supported environment variables:

| Variable | Default Value | Required in Prod | Description |
|---|---|---|---|
| `DB_USER` | `helpdesk` | Yes | PostgreSQL username |
| `DB_PASS` | `helpdesk` | Yes | PostgreSQL password |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/helpdesk` | Yes (Docker) | Full JDBC connection URL |
| `JWT_SECRET` | `change-me-in-production-...` | **Yes** | JWT HMAC signing key — min 32 chars, use 64+ in prod |
| `MAIL_HOST` | `mailhog` | Yes | SMTP server hostname |
| `MAIL_PORT` | `1025` | Yes | SMTP server port |
| `MAIL_USER` | *(empty)* | Depends | SMTP authentication username |
| `MAIL_PASS` | *(empty)* | Depends | SMTP authentication password |
| `FRONTEND_URL` | `http://localhost:4200` | Yes | Frontend origin for CORS and email links |
| `UPLOAD_PATH` | `./uploads` | Yes | Filesystem path for uploaded attachments |

---

## 📁 Project Structure

```
helpdesk-pro/
├── backend/                        # Spring Boot API
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/helpdesk/
│           │   ├── auth/           # JWT, 2FA, security config
│           │   ├── ticket/         # Ticket CRUD, workflow
│           │   ├── user/           # User management
│           │   ├── department/     # Departments & routing
│           │   ├── sla/            # SLA policies & escalation
│           │   ├── notification/   # WebSocket & email notifications
│           │   ├── knowledge/      # Knowledge base articles
│           │   ├── report/         # Analytics & CSAT
│           │   ├── webhook/        # Outbound webhooks
│           │   ├── apikey/         # API key management
│           │   └── config/         # Spring configuration beans
│           └── resources/
│               ├── application.yml
│               └── db/migration/   # Flyway SQL migrations (V1–V26)
│
├── frontend/                       # Angular 18 SPA
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       └── app/
│           ├── core/               # Auth guards, interceptors, services
│           ├── shared/             # Reusable components & pipes
│           ├── features/
│           │   ├── tickets/        # Ticket list, detail, create
│           │   ├── admin/          # Admin panel pages
│           │   ├── knowledge-base/ # KB browsing & authoring
│           │   ├── reports/        # Charts & analytics
│           │   └── profile/        # User profile & 2FA setup
│           └── layout/             # App shell, sidebar, navbar
│
└── docker-compose.yml              # Local full-stack development
```

---

## 🗄️ Database Migrations

HelpDesk Pro uses **Flyway** for database schema management. All migrations run automatically on application startup — no manual SQL needed.

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
| `V17` | Auto-assign settings |
| `V18` | Webhooks |
| `V19` | API keys |
| `V20` | Help topics |
| `V21` | Ticket tasks |
| `V22` | Email inboxes |
| `V23` | Organizations |
| `V24` | Issues tracker |
| `V25` | Due dates on tickets |
| `V26` | Two-factor authentication (2FA) for users |

> Flyway tracks migration state in the `flyway_schema_history` table. Never edit applied migrations — add new versioned scripts instead.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss your proposed change, then submit a pull request against the `main` branch.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
