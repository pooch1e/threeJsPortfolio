# Three.js Portfolio

A portfolio website showcasing interactive Three.js visualizations and graphics experiments built with React and Vite.

## Features

- **Home Page**: Project gallery displaying various Three.js experiments
- **Point Cloud Visualization**: Interactive 3D point cloud rendering
- **Animal Render**: 3D animal model rendering
- **Shader Experiments**: Custom WebGL shader demonstrations with switchable effects
- **Debug Mode**: Built-in debug panel for development (access via `/?debug=true`)

## Tech Stack

- **Frontend Framework**: React 19
- **3D Graphics**: Three.js
- **Animation**: GSAP
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Shader Support**: GLSL via vite-plugin-glsl

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Build

```bash
# Create production build
npm run build
```

### Preview

```bash
# Preview production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Debug Mode

To enable debug controls for Three.js scenes:

### <http://localhost:5173/?debug=true>

This activates the lil-gui debug panel for real-time parameter adjustments.

## Project Structure

```md
threejsPortfolio/
├── src/
│   ├── assets/          # Static assets (images, models, etc.)
│   ├── components/      # Reusable React components
│   ├── config/          # Configuration files
│   ├── hooks/           # Custom React hooks
│   ├── layout/          # Layout components
│   ├── pages/           # Page components (routes)
│   ├── ui/              # UI components (Header, Footer)
│   ├── App.jsx          # Main App component
│   └── main.jsx         # Application entry point
├── public/              # Public assets
├── static/              # Static resources
└── world/               # World/scene related files

```

## Available Routes

- `/` - Home page with project gallery
- `/pointCloud` - Point cloud visualization
- `/animalPage` - Animal 3D rendering
- `/shaders` - Shader experiments

## Go Server

The `server/` directory contains a Go backend that handles authentication via GitHub OAuth and manages user sessions with PostgreSQL.

### Tech Stack

- **Framework**: Gin
- **Database**: PostgreSQL (via Docker)
- **Auth**: GitHub OAuth2
- **Driver**: `lib/pq`
- **Env loading**: `godotenv`

### Prerequisites

- Go 1.21+
- Docker + Docker Compose

### Environment variables

Add the following to `.env.local` in the repo root (create it if it doesn't exist):

```
PORT=8080
DATABASE_URL=postgres://threejs_user:threejs_password@localhost:5433/threejs_database?sslmode=disable
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=replace_this_with_a_long_random_string
```

`GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` come from a GitHub OAuth App:

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Set **Homepage URL** to `http://localhost:5173`
3. Set **Authorization callback URL** to `http://localhost:8080/auth/github/callback`
4. Copy the client ID and generated secret into `.env.local`

### Database (Docker)

Postgres runs in a Docker container. The `db/seed/seed.sql` schema is applied automatically on the first start.

```bash
# Start Postgres in the background
cd server
make docker-up

# Stop Postgres (data is preserved in the Docker volume)
make docker-down

# Wipe all data and start fresh
docker compose down -v
make docker-up
```

The container exposes Postgres on port `5433` (to avoid conflicts with any system Postgres on `5432`).

### Running the server

```bash
cd server
make docker-up   # ensure Postgres is running first
make dev         # runs: go run cmd/main.go
```

The server will be available at `http://localhost:8080`.

### Server structure

```
server/
├── cmd/
│   └── main.go              # Entry point — loads env, wires config, defines routes
├── db/
│   └── seed/
│       ├── create-db.sql    # DROP/CREATE DATABASE (manual use only)
│       └── seed.sql         # Creates users + sessions tables (auto-run by Docker)
├── internal/
│   ├── config/              # Opens DB connection pool, reads env vars into Config struct
│   ├── handlers/            # Gin handler functions — one file per domain (auth.go etc.)
│   ├── middleware/          # Gin middleware (e.g. RequireAuth session validation)
│   ├── models/              # Plain Go structs matching DB tables (User, Session)
│   └── repos/               # All SQL queries — handlers call repos, repos call the DB
├── go.mod
├── go.sum
└── Makefile
```

### Auth flow

```
Browser                     Go Server                  GitHub
  |                             |                          |
  |-- GET /auth/github -------->|                          |
  |                             |-- redirect ------------->|
  |                             |    (OAuth consent page)  |
  |<----------------------------+<-- redirect + code ------|
  |-- GET /auth/github/callback?code=... -->               |
  |                             |-- POST /access_token --->|
  |                             |<-- access token ---------|
  |                             |-- GET /user ------------>|
  |                             |<-- user profile ---------|
  |                             | upsert user in DB        |
  |                             | create session in DB     |
  |<-- set session_token cookie + redirect to frontend     |
```

### API routes

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| `GET` | `/auth/github` | No | Redirect to GitHub OAuth consent page |
| `GET` | `/auth/github/callback` | No | Handle GitHub callback, create session |
| `POST` | `/auth/logout` | Yes | Delete session, clear cookie |
| `GET` | `/api/me` | Yes | Return current user profile |

## License

Private project

---

Built with Three.js and React
