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

The `server/` directory contains a Go backend REST API utilizing PostgreSQL and Docker. The architecture follows a modular approach for scalability and clear separation of concerns.

### Tech Stack

- **Framework**: Go 1.22+
- **Router**: [Chi v5](https://github.com/go-chi/chi)
- **Database**: PostgreSQL 16 (via Docker)
- **Driver**: `lib/pq`
- **Auth**: JWT (JSON Web Tokens)
- **Env loading**: `godotenv`

### Prerequisites

- Go 1.22+
- Docker + Docker Compose

### Environment variables

Add the following to `.env.local` in the repo root (create it if it doesn't exist):

```
PORT=8080
DATABASE_URL=postgres://threejs_user:threejs_password@localhost:5433/threejs_database?sslmode=disable
JWT_SECRET=replace_this_with_a_long_random_string
FRONTEND_URL=http://localhost:5173
```

### Database (Docker)

Postgres runs in a Docker container.

```bash
# Start Postgres in the background
cd server
make docker-up

# Stop Postgres (data is preserved in the Docker volume)
make docker-down

# Wipe all data and start fresh
docker compose down -v
make docker-up

# Run seeding scripts
make db-create
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
│   ├── main.go              # Application initialization (config, DB connection)
│   └── api.go               # Router setup (Chi) and server configuration
├── db/
│   └── seed/
│       ├── create-db.sql    # DROP/CREATE DATABASE
│       └── seed.sql         # Creates users + sessions tables
├── internal/
│   ├── config/              # Opens DB connection pool, reads env vars
│   ├── handlers/            # HTTP request handlers (Signup, Login, Me)
│   ├── middleware/          # HTTP middlewares (Auth, Admin, Logging)
│   ├── models/              # Go structs representing database entities
│   ├── repos/               # Data access layer (SQL queries)
│   └── utils/               # Reusable helpers (JWT, validation, JSON)
├── go.mod
├── go.sum
└── Makefile
```

### Auth flow

1. **Login**: User submits credentials to `/api/login`.
2. **JWT**: On success, the server generates a JWT and sets it as an **HttpOnly cookie** named `session`.
3. **Session Verification**: The frontend calls `/api/me` on mount. The `RequireAuth` middleware validates the cookie and attaches the `userID` to the request context.
4. **CORS**: Configured to allow specific frontend origins with credentials (cookies) enabled.

### API routes

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| `GET` | `/health` | No | System health check |
| `POST` | `/api/signup` | No | Create new user |
| `POST` | `/api/login` | No | Authenticate and set cookie |
| `GET` | `/api/me` | Yes | Get current user profile |
| `POST` | `/api/logout` | Yes | Clear session cookie |

## License

Private project

**See task-CLI tool for admin epic**

---

Built with Three.js and React
