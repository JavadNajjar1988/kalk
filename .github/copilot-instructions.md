# Copilot Instructions for Kalk Project

## Project Overview

**Kalk** is a military operations management system with three primary components:
- **Backend**: FastAPI (Python 3.11+) with PostgreSQL + PostGIS for geographic data
- **Dashboard**: React 18 + TypeScript (Material-UI) on port 3000
- **KalkNegar**: Vue 3 + TypeScript (military mapping tool) on port 5180

All components support Persian/Farsi and run via Docker Compose locally.

## Critical Architecture Patterns

### Backend (FastAPI)

**Database & ORM**:
- SQLAlchemy 2.0 with typed models using `Mapped` declarations (see [scenario.py](backend/app/models/scenario.py))
- All models inherit from `Base` (DeclarativeBase)
- Async-first: `AsyncSession` via dependency injection
- Dep injection pattern: `DbSession = Annotated[AsyncSession, Depends(get_session)]` in [deps.py](backend/app/deps.py)

**API Structure**:
- Routes mounted under `/api` prefix via FastAPI sub-app (see [main.py](backend/app/main.py))
- Modular route organization: [auth.py](backend/app/api/routes/auth.py), scenarios.py, maps.py, realtime.py, sdi.py, users.py, etc.
- Exception handlers centralized in [core/response.py](backend/app/core/response.py)
- Settings via Pydantic in [core/config.py](backend/app/core/config.py) with env-based configuration

**Authentication & Security**:
- JWT tokens with OAuth2 + rate limiting in [auth.py](backend/app/api/routes/auth.py)
- Account lockout on failed login attempts (configurable max attempts)
- Built-in admin bootstrap via `ADMIN_BOOTSTRAP_PASSWORD` env var

### Frontend (Dashboard)

**State Management**: Redux Toolkit slices in [store/slices/](front_dashboard/src/store/slices/)
**Module Architecture**: Feature-based modules in [modules/](front_dashboard/src/modules/) (auth, dashboard, definition-editor, orbat-integration, map-viewer, etc.)
**Build**: Vite with TypeScript strict mode + Tailwind CSS
**Maps**: OpenLayers integration for displaying units and scenarios

### Frontend (KalkNegar)

**Vue 3 + TypeScript** with offline-first design
**Maps**: Military symbology rendering, ORBAT visualization
**Build**: Vite, Vue 3 composition API

## Developer Workflows

### Initial Setup
```powershell
# Check prerequisites (Node.js, Python, Docker)
.\check-prerequisites.ps1

# Start everything (creates .env from .env.example, spins up Docker)
.\start.ps1
```

### Backend Development
```powershell
# Terminal 1: Database (via Docker)
docker compose up db

# Terminal 2: Backend API
cd backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Swagger docs: http://localhost:8000/api/docs
```

**Database Migrations** (using Alembic):
```powershell
alembic -c alembic.ini upgrade head  # Applies migrations + creates admin user
alembic -c alembic.ini revision --autogenerate -m "describe changes"
```

### Frontend (Dashboard) Development
```powershell
cd front_dashboard
npm install
npm run dev  # Runs on http://localhost:3000
# TypeScript: npm run type-check | ESLint: npm run lint | Tests: npm test
```

### Frontend (KalkNegar) Development
```powershell
cd front_kalknegar
npm install
npm run dev  # Runs on http://localhost:5180
```

### Testing
- **Backend**: `pytest -q` from [backend/](backend/) root
- **Dashboard**: `npm test` or `npm run test:watch`
- **KalkNegar**: `npm run test:unit`

## Project-Specific Conventions

### Naming & File Organization
- Backend models (ORM classes) in [models/](backend/app/models/) - one entity type per file
- Backend services **not** in a dedicated services folder—logic embedded in route handlers or utility functions
- Frontend Redux slices in [store/slices/](front_dashboard/src/store/)
- Frontend modules self-contained: components/, hooks/, types/ alongside routes/

### Environment Configuration
- `.env` must exist locally; copy from `.env.example` if missing
- Critical vars: `DB_URL`, `CORS_ORIGINS`, `JWT_SECRET`, `ADMIN_BOOTSTRAP_PASSWORD`, `TILESERVER_URL`, `FILESYSTEM_TILE_ROOT`
- `DISABLE_AUTH=true` for testing (bypasses JWT checks)
- Port overrides via env (e.g., `DASHBOARD_PORT=3000`)

### TypeScript/Frontend
- Strict mode enabled in [tsconfig.json](front_dashboard/tsconfig.json)
- Emotion + Tailwind for styling (no plain CSS files except globals)
- i18next for Persian/Farsi; import locale strings from [locales/](front_dashboard/src/locales/)

### Backend Dependencies
- Key packages: FastAPI, SQLAlchemy 2.0+, Pydantic v2, asyncpg, Python-Jose (JWT), Alembic
- PostGIS support via GeoAlchemy2 for map/geographic features
- pytest + pytest-asyncio for testing
- Real-time via WebSocket routes (see [realtime.py](backend/app/api/routes/realtime.py))

## Cross-Component Integration Points

**Backend → Frontend API calls**:
- Base URL configured in frontend via `import { api } from 'src/api'`
- CORS origins validated in [core/config.py](backend/app/core/config.py)

**Maps & Tiles**:
- Filesystem tiles served from [filesystem_tiles.py](backend/app/api/routes/filesystem_tiles.py)
- TileServer integration via `TILESERVER_URL` (e.g., http://127.0.0.1:8480)
- External maps path configurable via `EXTERNAL_MAPS_PATH`

**Database**:
- PostGIS extensions for geographic queries
- Replicated via Docker volume in [docker-compose.yml](docker-compose.yml)
- Migrations auto-create admin user on first bootstrap

**Real-time Features**:
- WebSocket endpoints in [realtime.py](backend/app/api/routes/realtime.py)
- Used for live scenario updates and unit positioning

## Testing & Debugging Tips

- **Backend swagger**: http://localhost:8000/api/docs (when running locally)
- **Database logs**: `docker compose logs db`
- **API test failures**: Check `DISABLE_AUTH` in .env for unit tests
- **Port conflicts**: `netstat -ano | findstr :8000` (Windows) to find PID using port
- **Frontend Vite issues**: Delete `node_modules` and `dist`, reinstall if HMR stalls
- **Type errors**: Run `npm run type-check` before pushing—strict mode catches most issues

## Key Directories Reference

| Path | Purpose |
|------|---------|
| [backend/app/api/routes/](backend/app/api/routes/) | All HTTP endpoints |
| [backend/app/models/](backend/app/models/) | SQLAlchemy ORM models |
| [backend/app/core/](backend/app/core/) | Config, security, response handlers |
| [front_dashboard/src/modules/](front_dashboard/src/modules/) | Feature-based React modules |
| [front_dashboard/src/store/](front_dashboard/src/store/) | Redux state slices |
| [front_kalknegar/src/modules/](front_kalknegar/src/modules/) | Vue mapping modules |
| [backend/migrations/](backend/migrations/) | Alembic migration scripts |
