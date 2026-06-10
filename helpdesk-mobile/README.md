# HelpDesk Mobile

A full-featured Flutter mobile application for the HelpDesk Pro system. Provides native mobile access to all three portals — Customer, Agent, and Admin — with side-drawer navigation, real-time notifications, and full feature parity with the web app.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running on Chrome (Web)](#running-on-chrome-web)
  - [Running on Android Emulator](#running-on-android-emulator)
- [Default Credentials](#default-credentials)
- [Navigation Structure](#navigation-structure)
- [Screen Reference](#screen-reference)
- [Architecture Overview](#architecture-overview)
- [Environment / Configuration](#environment--configuration)

---

## Overview

HelpDesk Mobile is the Flutter front-end companion to HelpDesk Pro's Spring Boot backend. It targets the same REST API (`/api/v1`) and supports all three user roles:

- **Customer Portal** — Submit tickets, track status, reply to threads, rate support via CSAT
- **Agent Dashboard** — Manage queues, handle tickets, add internal notes, manage tasks and watchers
- **Admin Panel** — Full control over users, departments, SLA, knowledge base, canned responses, webhooks, API keys, and more

All portals share a consistent side-drawer navigation pattern matching the web app experience.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Flutter 3.16.9 (Dart 3.2.6) |
| State Management | Riverpod 2 (StateNotifier + ConsumerWidget) |
| Navigation | go_router 14 (ShellRoute per portal) |
| HTTP Client | Dio 5 (JWT Bearer interceptor + auto-refresh) |
| Token Storage | shared_preferences (web-compatible) |
| Backend | HelpDesk Pro Spring Boot 3 API (`http://localhost:8080/api/v1`) |

> **Flutter version note:** Flutter 3.16.9 is the last version supporting macOS 12 Monterey. If you are on macOS 13+ or Windows/Linux you can use any recent Flutter 3.x release.

---

## Features

### Customer Portal
- Submit new tickets (subject, description, department, priority, help topic, custom fields)
- View all personal tickets with status and priority badges
- Ticket detail: full reply thread, file attachments, task checklist (read-only)
- Knowledge base: browse categories and articles with search
- CSAT rating form after ticket resolution
- Saved view filters on ticket list
- Real-time notification badge in app bar

### Agent Dashboard
- Stats overview: assigned tickets, open, breached SLA, resolved today
- Ticket queue with search, status/priority filters, multi-select bulk actions (close, resolve)
- Full ticket detail:
  - Reply (public) and internal notes
  - Status and priority changes
  - Agent assignment
  - **Watchers** tab — add/remove watchers by email
  - **Tasks** tab — add, toggle, and delete checklist tasks
  - **Merge** action — merge duplicate ticket into another
  - File attachments
- Saved Views — create and manage named filter presets
- Notifications screen

### Admin Panel
| Section | Capabilities |
|---|---|
| Overview | KPI cards (new, open, pending, SLA breached, avg CSAT), tickets-by-status chart, recent tickets |
| Tickets | All tickets with status/priority filters, bulk close/resolve |
| Users | List, create, edit role/department, activate/deactivate, delete |
| Departments | Full CRUD |
| SLA Policies | Full CRUD (name, response time, resolution time, priority) |
| SLA Rules | Full CRUD (escalation rules) |
| Canned Responses | Full CRUD (title, content, category) |
| Templates | Full CRUD (name, subject, body, department) |
| Knowledge Base | Manage categories and articles (CRUD, two-tab view) |
| Custom Fields | Full CRUD (name, field type, required flag, options) |
| Webhooks | Full CRUD (URL, secret, event list, active toggle) |
| API Keys | Create, list, revoke (key shown once on creation) |
| Help Topics | Full CRUD |
| Email Inboxes | Full CRUD (email, protocol, host, port, active toggle) |
| Organizations | Full CRUD |
| Issues | Full CRUD + view linked tickets |
| Audit Log | Read-only log with entity-type filter |
| Analytics | Charts: tickets over time, by priority, by department, by agent, resolution times |
| Settings | System-wide settings management |

---

## Project Structure

```
helpdesk-mobile/
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart          # Dio client, JWT interceptor, token refresh
│   │   │   └── api_endpoints.dart       # All backend endpoint strings
│   │   ├── auth/
│   │   │   ├── auth_provider.dart       # Login, register, 2FA, logout
│   │   │   └── auth_state.dart          # AuthState, AuthStatus enum
│   │   ├── models/
│   │   │   ├── user_model.dart
│   │   │   ├── ticket_model.dart
│   │   │   ├── comment_model.dart
│   │   │   ├── notification_model.dart
│   │   │   ├── department_model.dart
│   │   │   ├── kb_article_model.dart
│   │   │   ├── sla_policy_model.dart
│   │   │   ├── canned_response_model.dart
│   │   │   ├── template_model.dart
│   │   │   ├── custom_field_model.dart
│   │   │   ├── webhook_model.dart
│   │   │   ├── api_key_model.dart
│   │   │   ├── help_topic_model.dart
│   │   │   ├── email_inbox_model.dart
│   │   │   ├── organization_model.dart
│   │   │   ├── issue_model.dart
│   │   │   ├── audit_log_model.dart
│   │   │   ├── sla_rule_model.dart
│   │   │   ├── saved_view_model.dart
│   │   │   └── task_model.dart
│   │   ├── services/
│   │   │   ├── ticket_service.dart
│   │   │   ├── user_service.dart
│   │   │   ├── department_service.dart
│   │   │   ├── notification_service.dart
│   │   │   ├── analytics_service.dart
│   │   │   ├── kb_service.dart
│   │   │   ├── sla_service.dart
│   │   │   ├── canned_response_service.dart
│   │   │   ├── template_service.dart
│   │   │   ├── custom_field_service.dart
│   │   │   ├── webhook_service.dart
│   │   │   ├── api_key_service.dart
│   │   │   ├── help_topic_service.dart
│   │   │   ├── email_inbox_service.dart
│   │   │   ├── organization_service.dart
│   │   │   ├── issue_service.dart
│   │   │   ├── audit_service.dart
│   │   │   ├── saved_view_service.dart
│   │   │   └── task_service.dart
│   │   ├── router/
│   │   │   └── app_router.dart          # go_router config, role-based redirects
│   │   └── theme/
│   │       ├── app_colors.dart
│   │       └── app_theme.dart
│   │
│   └── features/
│       ├── auth/
│       │   ├── login_screen.dart
│       │   ├── register_screen.dart
│       │   └── two_fa_screen.dart
│       ├── customer/
│       │   ├── shell/customer_shell.dart
│       │   ├── home/customer_home_screen.dart
│       │   ├── tickets/my_tickets_screen.dart
│       │   ├── tickets/ticket_detail_screen.dart
│       │   ├── submit/submit_ticket_screen.dart
│       │   ├── kb/knowledge_base_screen.dart
│       │   └── csat/csat_rating_screen.dart
│       ├── agent/
│       │   ├── shell/agent_shell.dart
│       │   ├── dashboard/agent_dashboard_screen.dart
│       │   ├── queue/ticket_queue_screen.dart
│       │   ├── tickets/agent_ticket_detail_screen.dart
│       │   └── saved_views/saved_views_screen.dart
│       ├── admin/
│       │   ├── shell/admin_shell.dart
│       │   ├── overview/admin_overview_screen.dart
│       │   ├── tickets/admin_tickets_screen.dart
│       │   ├── users/users_screen.dart
│       │   ├── departments/departments_screen.dart
│       │   ├── sla/sla_policies_screen.dart
│       │   ├── sla_rules/sla_rules_screen.dart
│       │   ├── canned_responses/canned_responses_screen.dart
│       │   ├── templates/templates_screen.dart
│       │   ├── kb/admin_kb_screen.dart
│       │   ├── custom_fields/custom_fields_screen.dart
│       │   ├── webhooks/webhooks_screen.dart
│       │   ├── api_keys/api_keys_screen.dart
│       │   ├── help_topics/help_topics_screen.dart
│       │   ├── email_inboxes/email_inboxes_screen.dart
│       │   ├── organizations/organizations_screen.dart
│       │   ├── issues/issues_screen.dart
│       │   ├── audit_log/audit_log_screen.dart
│       │   ├── analytics/analytics_screen.dart
│       │   └── settings/settings_screen.dart
│       └── shared/
│           ├── profile/profile_screen.dart
│           ├── notifications/notifications_screen.dart
│           └── widgets/
│               ├── status_badge.dart
│               ├── priority_badge.dart
│               └── utils/time_ago.dart
│
├── pubspec.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Flutter SDK | 3.16.9 | Install via `git clone` — see note below |
| Dart | 3.2.6 | Bundled with Flutter 3.16.9 |
| Chrome | Any recent | Required for web target |
| HelpDesk Pro backend | Running on `:8080` | See `helpdesk-pro/README.md` |

**Installing Flutter 3.16.9 (macOS 12 Monterey):**
```bash
cd ~/development
git clone https://github.com/flutter/flutter.git -b 3.16.9
export PATH="$HOME/development/flutter/bin:$PATH"
flutter doctor
```

For macOS 13+ or other platforms, any Flutter 3.x release works fine.

---

### Running on Chrome (Web)

**Step 1 — Start the backend** (Terminal 1)
```bash
cd helpdesk-pro/backend
/opt/maven/bin/mvn spring-boot:run
# Wait for: Started HelpdeskApplication
```

**Step 2 — Install dependencies** (first time only)
```bash
cd helpdesk-mobile
~/development/flutter/bin/flutter pub get
```

**Step 3 — Run in Chrome** (Terminal 2)
```bash
cd helpdesk-mobile
~/development/flutter/bin/flutter run -d chrome
```

Chrome opens automatically. The app connects to `http://localhost:8080/api/v1`.

**Verify Chrome is detected:**
```bash
~/development/flutter/bin/flutter devices
# Should list: Chrome (web)
```

---

### Running on Android Emulator

> Requires Android Studio with an AVD configured (API 21+).

```bash
# Start your emulator first, then:
cd helpdesk-mobile
~/development/flutter/bin/flutter run -d android

# NOTE: The Android emulator maps localhost to 10.0.2.2.
# Update lib/core/api/api_endpoints.dart:
#   static const String _baseUrl = 'http://10.0.2.2:8080/api/v1';
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@helpdesk.com | Admin@123 |
| Agent | agent@helpdesk.com | Agent@123 |
| Customer | customer@helpdesk.com | Customer@123 |

> Passwords are seeded by Flyway migration `V29__fix_seed_user_password_hashes.sql` using BCrypt strength 10.

---

## Navigation Structure

All three portals use a **side drawer** navigation pattern. Tap the hamburger icon (☰) in the top-left to open/close the drawer.

### Customer Drawer
Home · My Tickets · Submit Ticket · Knowledge Base · Notifications · Profile

### Agent Drawer
Dashboard · Ticket Queue · Saved Views · Notifications · Profile

### Admin Drawer
Overview · Tickets · Users · Departments · SLA Policies · Canned Responses · Analytics · Knowledge Base · Audit Log · Custom Fields · SLA Rules · Templates · Webhooks · API Keys · Help Topics · Email Inboxes · Organizations · Issues · Settings

---

## Screen Reference

### Authentication
| Route | Screen |
|---|---|
| `/login` | Email + password login with animation |
| `/register` | Self-registration form |
| `/2fa?tempToken=...` | TOTP 6-digit code entry |

### Customer
| Route | Screen |
|---|---|
| `/customer` | Home dashboard with stats and recent tickets |
| `/customer/tickets` | My tickets list with saved view filters |
| `/customer/tickets/:id` | Ticket detail: thread, tasks (read-only), attachments |
| `/customer/submit` | Submit new ticket form |
| `/customer/kb` | Knowledge base categories and article browser |
| `/rate/:ticketId` | CSAT rating (1–5 stars + comment) |

### Agent
| Route | Screen |
|---|---|
| `/agent` | Dashboard with KPI cards |
| `/agent/queue` | Ticket queue with bulk actions |
| `/agent/tickets/:id` | Full ticket detail: replies, notes, watchers, tasks, merge |
| `/agent/saved-views` | Manage named filter presets |

### Admin
| Route | Screen |
|---|---|
| `/admin` | Overview KPIs and recent activity |
| `/admin/tickets` | All tickets with filters and bulk actions |
| `/admin/users` | User management (CRUD + role assignment) |
| `/admin/departments` | Department management |
| `/admin/sla` | SLA policy management |
| `/admin/sla-rules` | SLA escalation rules |
| `/admin/canned` | Canned response library |
| `/admin/templates` | Ticket templates |
| `/admin/kb` | Knowledge base admin (categories + articles tabs) |
| `/admin/custom-fields` | Custom field definitions |
| `/admin/webhooks` | Webhook endpoints |
| `/admin/api-keys` | API key management |
| `/admin/help-topics` | Help topic management |
| `/admin/email-inboxes` | Email inbox configuration |
| `/admin/organizations` | Organization management |
| `/admin/issues` | Issue tracker with linked tickets |
| `/admin/audit` | Audit log viewer |
| `/admin/analytics` | Charts and performance metrics |
| `/admin/settings` | System settings |

### Shared
| Route | Screen |
|---|---|
| `/profile` | Profile info, password change, 2FA setup/enable |
| `/notifications` | Notification list with mark-read and swipe-to-dismiss |

---

## Architecture Overview

```
Flutter App (Dart)
  │
  ├── go_router
  │     ├── Role-based redirect on auth state change
  │     ├── ShellRoute per portal (Customer / Agent / Admin)
  │     └── Standalone routes: /login, /register, /2fa, /rate/:id
  │
  ├── Riverpod
  │     ├── authProvider (StateNotifier) — login, logout, token refresh
  │     ├── apiClientProvider — Dio singleton with JWT interceptor
  │     └── Feature providers — per-screen state (loading, data, error)
  │
  ├── ApiClient (Dio)
  │     ├── Authorization: Bearer <accessToken> on every request
  │     ├── 401 interceptor → POST /auth/refresh → retry original request
  │     └── Token storage via shared_preferences (web-compatible)
  │
  └── Backend
        Spring Boot 3 REST API
        http://localhost:8080/api/v1
```

### State pattern (per screen)
Every screen follows this pattern:
```dart
class _MyScreenState extends ConsumerState<MyScreen> {
  bool _loading = true;
  List<dynamic> _items = [];
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final api = ref.read(apiClientProvider);
    final res = await api.get(ApiEndpoints.something);
    setState(() { _items = res.data['data'] ?? []; _loading = false; });
  }
}
```

---

## Environment / Configuration

The backend base URL is set in one place:

```dart
// lib/core/api/api_endpoints.dart
static const String _baseUrl = 'http://localhost:8080/api/v1';
```

| Target | URL to use |
|---|---|
| Chrome (web) | `http://localhost:8080/api/v1` |
| Android emulator | `http://10.0.2.2:8080/api/v1` |
| Physical device | `http://<your-machine-ip>:8080/api/v1` |

CORS on the backend is configured to allow `http://localhost:*` so any Flutter web port works without changes.
