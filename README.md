# Arc

A job application tracker: pipeline management, follow-up tracking, and an analytics dashboard.

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.x, Pydantic v2, PostgreSQL, JWT auth
- **Frontend**: React 18 + Vite + TypeScript, Tailwind CSS, react-router, recharts

## Local development

### Backend

Requires Python 3.12 and a running PostgreSQL instance.

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt

cp ../.env.example .env   # edit DATABASE_URL / JWT_SECRET / ADMIN_EMAIL / ADMIN_PASSWORD
.venv/bin/uvicorn app.main:app --reload --port 8000
```

On startup the backend creates its tables and seeds an admin user from
`ADMIN_EMAIL` / `ADMIN_PASSWORD` if one doesn't already exist.

Run tests (uses an in-memory SQLite database, no Postgres required):

```bash
cd backend
.venv/bin/python -m pytest
```

### Frontend

Requires Node 20+.

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api to http://localhost:8000
```

Build for production:

```bash
npm run build
```

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable          | Description                                             |
|--------------------|----------------------------------------------------------|
| `DATABASE_URL`     | SQLAlchemy/psycopg connection string for PostgreSQL       |
| `JWT_SECRET`       | Secret used to sign JWT access tokens                     |
| `ADMIN_EMAIL`      | Seeded admin user email (created on first boot)            |
| `ADMIN_PASSWORD`   | Seeded admin user password                                  |
| `ALLOW_REGISTER`   | Set `true` to allow open registration (default: disabled)   |
| `CORS_ORIGINS`     | Comma-separated list of allowed CORS origins                |

## Deployment (atoue-main)

Deployment target: `jobs.atoue.io` on `atoue-main`, reusing the existing `taliu-postgres`
container. This repo does not perform deployment itself — the steps below are for
whoever runs the deploy.

1. Clone this repo to `/opt/jobpilot` on the server.
2. Create the `jobpilot` database and role in the existing Postgres instance, using the
   admin credentials in `/opt/taliu/.env` (read-only reference — never modify that file).
3. Copy `.env.example` to `.env` in `/opt/jobpilot` and fill in real values
   (`DATABASE_URL` pointing at the new `jobpilot` database/role, a generated `JWT_SECRET`,
   and the real admin credentials).
4. `docker compose up -d --build`
   - Backend binds `127.0.0.1:8200` (container port 8000)
   - Frontend (nginx serving the built static app + proxying `/api` to the backend)
     binds `127.0.0.1:8201` (container port 80)
5. Add host nginx config at `/etc/nginx/sites-enabled/jobpilot.atoue.io.conf`, modeled on
   `api.atoue.io.conf`: port 80 → 301 redirect to https, port 443 ssl → `proxy_pass
   http://127.0.0.1:8201`, with `client_max_body_size 5m`.
6. TLS: `certbot --nginx -d jobs.atoue.io`, once the Cloudflare DNS-only A record
   `jobs → 204.168.190.33` has propagated (check with `dig +short jobs.atoue.io`). If DNS
   hasn't propagated yet, leave an HTTP-only server block proxying to `127.0.0.1:8201` so
   the app works immediately, and run the certbot command above once it has.
7. Verify:
   ```bash
   curl localhost:8200/health
   docker compose ps
   # login flow
   curl -X POST localhost:8200/api/auth/login -H 'content-type: application/json' \
     -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
   ```

All application ports bind to `127.0.0.1` only; external exposure is via host nginx.
Never modify the `taliu`, `ouvai`, or `n8n` services or their configs.

## Project layout

```
backend/    FastAPI app (app/main.py, models.py, schemas.py, db.py, routers/*.py) + pytest suite
frontend/   React + Vite + TypeScript SPA
nginx/      nginx.conf used inside the frontend container (static files + /api proxy)
docker-compose.yml
.env.example
```
