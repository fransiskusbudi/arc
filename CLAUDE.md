# Arc (formerly JobPilot) — project conventions

## Canonical naming — READ FIRST
- **The product is "Arc".** It was renamed from "JobPilot" (commit `daa0893`).
- ALWAYS refer to it as **Arc**. Never use "JobPilot" in new code, UI copy, docs, or commit messages.
- The GitHub repo is `fransiskusbudi/arc`; the local directory is `~/projects/jobpilot` (legacy name — do not rename the directory).
- Deployment: atoue-main `/opt/jobpilot`, live at https://jobs.atoue.io.
- Product is job-application tracker: add applications, update status, track sources.

## Design workflow (mandatory)
- UI work MUST use the combined Hallmark + Impeccable workflow (see global ~/.claude/CLAUDE.md §5): study → shape/redesign → build → live iterate → audit (Execution ≥4, Hierarchy ≥4) → fix → polish.
- Frontend was Hallmark-redesigned ("Almanac theme, editorial genre", commit `10ab03f`).

## Stack
- Backend: FastAPI · Frontend: React · DB: PostgreSQL
