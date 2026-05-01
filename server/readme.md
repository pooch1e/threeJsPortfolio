# Server Architecture - ThreeJS Portfolio Backend

A Go-based REST API utilizing PostgreSQL and Docker. The architecture follows a modular approach for scalability and clear separation of concerns.

## 🏗 Directory Structure

- `cmd/`: Entry points for the application.
  - `main.go`: Application initialization (config, DB connection).
  - `api.go`: Router setup (Chi) and server configuration.
- `internal/`: Private application code.
  - `handlers/`: HTTP request handlers (Signup, Login, Me).
  - `middleware/`: HTTP middlewares (Auth, Admin, Logging).
  - `repos/`: Data access layer (SQL queries).
  - `models/`: Go structs representing database entities.
  - `utils/`: Reusable helpers (JWT, validation, JSON).
- `db/`: Database migrations and seed scripts.
- `docker-compose.yml`: Local environment setup (PostgreSQL).

## 🔐 Authentication Flow

1. **Login**: User submits credentials to `/api/login`.
2. **JWT**: On success, the server generates a JWT and sets it as an **HttpOnly cookie** named `session`.
3. **Session Verification**: The frontend calls `/api/me` on mount. The `RequireAuth` middleware validates the cookie and attaches the `userID` to the request context.
4. **CORS**: Configured to allow specific frontend origins with credentials (cookies) enabled.

## 🛠 Tech Stack

- **Language**: Go 1.22+
- **Router**: [Chi v5](https://github.com/go-chi/chi)
- **Database**: PostgreSQL 16
- **ORM/Driver**: `lib/pq` (Standard SQL)
- **Auth**: JWT (JSON Web Tokens)
- **Containerization**: Docker & Docker Compose

## 🚀 Key Commands

- `make docker-up`: Start PostgreSQL container.
- `make dev`: Run the API server with auto-loading environment variables from `.env.local`.
- `make db-create`: Run the seeding scripts inside the running container.

## 🛣 API Routes

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System health check |
| `POST` | `/api/signup` | Public | Create new user |
| `POST` | `/api/login` | Public | Authenticate and set cookie |
| `GET` | `/api/me` | User | Get current user profile |
| `POST` | `/api/logout` | User | Clear session cookie |
