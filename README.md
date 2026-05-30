# Blog Admin

A fullstack blog administration app built with **React + Vite** on the frontend and **Express + SQLite** on the backend.

## Features

- View all posts in a paginated table with thumbnail previews
- Create, edit, and delete posts
- Upload a cover image per post
- Filter posts by status (draft / published) and category
- Post detail page with full-width cover image
- Success toasts on delete

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite, CSS Modules |
| Backend | Node.js, Express, SQLite (via `sqlite`/`sqlite3`) |
| File uploads | Multer |
| Dev tooling | Nodemon, Concurrently |

## Project Structure

```
blog-project/
├── backend/
│   ├── server.js          # Express entry point
│   ├── database.js        # SQLite connection & migrations
│   └── routes/
│       ├── posts.js       # CRUD routes for posts
│       └── upload.js      # Image upload route
├── frontend/
│   └── src/
│       ├── App.jsx        # Router setup
│       ├── api/posts.js   # All backend calls
│       └── pages/
│           ├── PostList.jsx
│           ├── PostDetail.jsx
│           ├── CreatePost.jsx
│           └── EditPost.jsx
└── package.json           # Root — runs both servers together
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
# From the project root
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Run in development

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend** → `http://localhost:4000`
- **Frontend** → `http://localhost:5173`

### Run individually

```bash
# Backend only
cd backend && npm run dev    # nodemon (auto-reload)
cd backend && npm start      # plain node

# Frontend only
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run preview
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts` | List posts. Supports `?status=`, `?category=`, `?limit=`, `?offset=` |
| `GET` | `/api/posts/:id` | Get a single post |
| `POST` | `/api/posts` | Create a post |
| `PUT` | `/api/posts/:id` | Update a post |
| `DELETE` | `/api/posts/:id` | Delete a post |
| `POST` | `/api/upload` | Upload an image, returns `{ path }` |
| `GET` | `/uploads/:filename` | Serve uploaded images |
| `GET` | `/health` | Health check |

### Post fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `content` | string | yes | |
| `author` | string | yes | |
| `category` | string | no | Default: `General` |
| `status` | string | no | `draft` or `published`, default `draft` |
| `cover_image` | string | no | Path returned by `/api/upload` |

## Data Storage

- Database file: `backend/blog.db` (SQLite, created automatically on first run, git-ignored)
- Uploaded images: `backend/uploads/` (git-ignored)
