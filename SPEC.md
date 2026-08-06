# JobPilot — Job Application Tracker (v1)

## Overview
A web app to track job applications: pipeline management, follow-up tracking, and an analytics dashboard.
Deployed at `jobs.atoue.io` on atoue-main (production server, Ubuntu 24.04).
Single-user v1 with auth (seeded admin user), designed to scale to multi-user.
Portfolio piece for a Data & AI Lead candidate — quality matters: clean UI, meaningful analytics.

## Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.x, Pydantic v2, psycopg, PyJWT + bcrypt (passlib), uvicorn
- **DB**: PostgreSQL 16 — reuse the existing `taliu-postgres` container (host `127.0.0.1:5432`). Create a dedicated database `jobpilot` + role `jobpilot`. Admin credentials: read from `/opt/taliu/.env` on the server (READ-ONLY — never modify).
- **Frontend**: React 18 + Vite + TypeScript, Tailwind CSS, react-router, plain fetch API client. Charts: recharts (acceptable) or hand-rolled SVG — keep deps minimal.
- **Auth**: JWT (access token ~24h), bcrypt hashing. Seed admin user from env vars `ADMIN_EMAIL` / `ADMIN_PASSWORD` on first boot. Open registration DISABLED unless `ALLOW_REGISTER=true`.

## Data model
- `users`: id PK, email UNIQUE, password_hash, created_at
- `applications`: id PK, user_id FK, company, role, source, recruiter, location, salary, cv_variant, url, status, date_applied (date), next_action, next_followup (date), notes, created_at, updated_at
- `status_history`: id PK, application_id FK, status, changed_at — powers analytics + detail timeline
- `api_tokens`: id PK, user_id FK (cascade delete), name, token_hash (sha256), created_at, last_used_at

Status values: `lead, applied, interviewing, offer, rejected, withdrawn, declined`

`source` holds ONLY the platform name (e.g. `LinkedIn`, `Indeed`) — never append detail text. Recruiter names, referral notes, etc. go in the separate `recruiter` field. No alembic — schema changes are applied as idempotent startup migrations in `app/migrations.py` (`ALTER TABLE` guarded by an inspector column check), run on every boot after `create_all`. The `recruiter` migration also backfills legacy rows: any row with `recruiter IS NULL` and `source` matching `"X - Y"` is split on the first `" - "` into `source=X`, `recruiter=Y` (a leading `recruiter`/`recruiter:` label on the right-hand side is stripped).

## API (prefix /api)
- `POST /auth/login` → `{access_token}` (Bearer JSON, for extension/CLI clients) and sets an HttpOnly `arc_access_token` cookie (SameSite=Lax; `Secure` only when `SECURE_COOKIES=true`)
- `POST /auth/logout` → clears the cookie, returns `{ok: true}`
- `GET /auth/me` — accepts Bearer header, cookie, or a personal access token (PAT), in that order; 401 with `WWW-Authenticate: Bearer` if none validate
- `POST /auth/tokens` `{name}` → creates a PAT (`arc_<48 hex chars>`), returns the plaintext token ONCE; only the sha256 hash is stored
- `GET /auth/tokens` — list PATs (id, name, created_at, last_used_at — never the token/hash)
- `DELETE /auth/tokens/{id}` — revoke a PAT
- CRUD `/applications`: list (filters: `status`, search `q`, `due: bool` — see below), get, create, update, delete
- `GET /applications/{id}/history`
- `POST /import/link` `{url}` or `{url, extracted: {...}}` → `{company, role, location, salary, description, source, url}`. Server-fetches the URL and parses schema.org `JobPosting` JSON-LD (falling back to OpenGraph/`<title>`) when `extracted` is omitted; otherwise uses the client-supplied fields as-is. `source` is always derived from the URL hostname (LinkedIn, Indeed, Greenhouse, Lever, Workable, iCIMS, Workday, SmartRecruiters, else the raw hostname). Does not create an application — the frontend POSTs the returned payload to `/applications` separately. 422 if the URL can't be fetched/parsed.
- `GET /analytics/summary` — counts by status, active count
- `GET /analytics/funnel` — conversion across lead→applied→interviewing→offer
- `GET /analytics/sources` — applications + conversion rate by source
- `GET /analytics/timeline` — weekly application volume, last 12 weeks
- `GET /analytics/response-times` — avg days per stage transition
- `GET /analytics/cv-variants` — performance by cv_variant
- `GET /health` — health check (used by deployment verification)

### Follow-up due filter
`GET /applications?due=true` returns only applications with status in `[lead, applied, interviewing]`, a non-null `next_followup` within the next 7 days, ordered by `next_followup` ascending. Combines with `status`/`q` filters.

### Login rate limit
Host nginx (`/etc/nginx/sites-enabled/jobpilot.atoue.io.conf`) rate-limits `POST /api/auth/login` to 5 requests/minute per client IP (burst 5, nodelay) via a dedicated `location = /api/auth/login` block.

## Frontend pages
- `/login`
- `/` — Dashboard: stat cards (total, active, interviewing, offers), funnel chart, weekly volume chart, source table
- `/applications` — table with status filter + search; create/edit modal
- `/applications/:id` — detail page + status history timeline
- Status as colored badges; clean, modern UI (Tailwind)

## Quality bar (must pass before deploy)
- Backend: pytest suite covering auth, applications CRUD, analytics happy paths — all green
- Type hints throughout; structure: `app/main.py`, `app/models.py`, `app/schemas.py`, `app/db.py`, `app/routers/*.py`
- Frontend: `npm run build` clean, no console errors
- `.env.example` committed; real `.env` gitignored; no secrets in git
- README.md: local dev + deployment instructions

## Deployment (atoue-main — PRODUCTION. Do NOT touch taliu, ouvai, or n8n)
Follow the `/opt/taliu` house convention:
- Repo: `fransiskusbudi/jobpilot` on GitHub (create via `gh repo create` — PUBLIC, it's a portfolio piece). Commit + push main.
- On server: clone to `/opt/jobpilot`
- Layout: `/opt/jobpilot/{backend,frontend,nginx,docker-compose.yml}`
- Ports: backend binds `127.0.0.1:8200`, frontend (nginx container serving built static + proxying /api → backend) binds `127.0.0.1:8201`. Localhost-only binding — external exposure is via host nginx.
- DB: create `jobpilot` database/role via the postgres admin creds found in `/opt/taliu/.env`
- Host nginx: `/etc/nginx/sites-enabled/jobpilot.atoue.io.conf` — style copied from `api.atoue.io.conf`: port 80 → 301 https, port 443 ssl → proxy_pass `http://127.0.0.1:8201`. Also add `client_max_body_size 5m`.
- TLS: `certbot --nginx -d jobs.atoue.io`. NOTE: requires a Cloudflare A record (`jobs` → `204.168.190.33`, DNS-only) that only the USER can add. If `dig +short jobs.atoue.io` is empty, skip certbot, leave an HTTP-only config (server block listening 80, proxying to 8201) so the app works immediately once DNS propagates, and document the exact certbot command for after DNS.
- Verify: `curl localhost:8200/health` on the server, `docker compose ps`, login flow via curl (login → create application → fetch analytics summary)

## Constraints
- Never modify existing services or their configs (taliu, ouvai, n8n, postgres data of other apps)
- No secrets in git; use `.env` on the server
- Bind all app ports to 127.0.0.1
