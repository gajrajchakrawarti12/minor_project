# University Timetable System (STMS)

Monorepo for scheduling and managing university timetables: Spring Boot API + React admin UI.

## Repository layout

```
minor_project/
├── backend/          # Spring Boot REST API (port 8081)
├── frontend/         # React + Vite SPA (port 5173)
├── database/         # MySQL schema dump (reference / seed)
├── docs/             # Architecture notes
└── scripts/          # Local dev helpers (run-dev.bat)
```

### Backend (`backend/`)

Java package layout by domain (not a single `models` folder):

| Package | Responsibility |
|---------|----------------|
| `com.backend.auth` | Users, JWT, login/signup |
| `com.backend.config` | Security, CORS |
| `com.backend.common.exception` | API errors, `@RestControllerAdvice` |
| `com.backend.department` | Departments |
| `com.backend.batch` | Student batches |
| `com.backend.subject` | Subjects |
| `com.backend.teacher` | Teachers |
| `com.backend.room` | Rooms / labs |
| `com.backend.timeslot` | Time slots |
| `com.backend.timetable` | Timetable CRUD |
| `com.backend.scheduling` | Auto-generation (`GenerationService`) |

### Frontend (`frontend/src/`)

| Path | Responsibility |
|------|----------------|
| `app/` | Routes and auth guard |
| `features/*/` | One folder per screen/domain; `api/` holds HTTP clients |
| `shared/` | UI kit, axios client, hooks |

## Prerequisites

- Java 25+, Maven (wrapper included)
- Node.js 20+, npm
- MySQL 8+

## Quick start

1. Create database `minor_project` (or set `DB_NAME`).
2. Configure env vars (optional; defaults in `application.properties`):

   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET`
   - `APP_TIMETABLE_MAX_GENERATION_MS` (timetable generation timeout)

3. From repo root:

   ```bat
   run.bat
   ```

   Or: `scripts\run-dev.bat`

4. Copy `frontend/.env.example` to `frontend/.env.local` if you need a custom API URL.

5. Open http://localhost:5173 — API at http://localhost:8081/api

### Main routes

| Path | Purpose |
|------|---------|
| `/departments` | Department CRUD |
| `/teachers` | Faculty per department |
| `/batches` | Batches per department |
| `/subjects` | Subjects |
| `/rooms` | Rooms and labs |
| `/timeslots` | Time slots |
| `/timetable` | View and auto-generate timetables |

## Develop separately

```bat
cd backend && mvnw spring-boot:run
cd frontend && npm install && npm run dev
```

## Database

- JPA `ddl-auto=update` applies schema at runtime in dev.
- `database/schema.sql` is a reference dump; prefer migrations for production.
