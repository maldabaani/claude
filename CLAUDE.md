# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run both servers together (recommended for development):**
```bash
npm run dev
```
This uses `concurrently` to start both the backend (port 4000) and frontend (Vite dev server) simultaneously.

**Run individually:**
```bash
# Backend
cd backend && npm run dev    # nodemon, auto-reloads on change
cd backend && npm start      # node, no auto-reload

# Frontend
cd frontend && npm run dev   # Vite dev server
cd frontend && npm run build # Production build
cd frontend && npm run preview # Preview production build
```

There are no tests configured in this project.

## Architecture

This is a fullstack blog admin app: a **React + Vite frontend** and an **Express + SQLite backend**, run together with `concurrently` from the root.

### Backend (`backend/`)

- **`server.js`** — Express entry point. Mounts `/api/posts` and a `/health` endpoint. CORS is restricted to `localhost:*`.
- **`database.js`** — Singleton SQLite connection via the `sqlite`/`sqlite3` packages. Creates the `posts` table on first connect and runs a migration to add `updated_at` if missing (for older DBs). The DB file is `backend/blog.db`.
- **`routes/posts.js`** — REST handlers for posts: `GET /api/posts` (with optional `?status=` and `?category=` filters), `GET /api/posts/:id`, `POST /api/posts`. Required fields for creation: `title`, `content`, `author`. `status` must be `draft` or `published`; defaults to `draft`. `category` defaults to `General`.

### Frontend (`frontend/src/`)

- **`App.jsx`** — Root component; sets up React Router with three routes: `/` (PostList), `/posts/:id` (PostDetail), `/create` (CreatePost).
- **`api/posts.js`** — All backend calls go through here (`getPosts`, `getPost`, `createPost`). Uses `/api/posts` as the base path — Vite proxies this to `http://localhost:4000` in dev.
- **`pages/`** — Page-level components (`PostList`, `PostDetail`, `CreatePost`). Each page fetches data directly using the `api/posts.js` helpers.
- **`components/`** — Shared UI (`Navbar`).
- Each component has a co-located CSS Module (`.module.css`).

### API proxy

The frontend uses a relative `/api/posts` path. Vite's dev server proxies `/api` → `http://localhost:4000`, so the frontend never hardcodes the backend port.

### Data model

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Auto-increment PK |
| `title` | TEXT | Required |
| `content` | TEXT | Required |
| `author` | TEXT | Required |
| `category` | TEXT | Default `General` |
| `status` | TEXT | `draft` or `published`, default `draft` |
| `created_at` | DATETIME | Auto-set |
| `updated_at` | DATETIME | Set on update |
