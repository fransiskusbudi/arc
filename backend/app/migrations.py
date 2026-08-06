import re

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.models import Application

_RECRUITER_LABEL_RE = re.compile(r"^recruiter\s*:?\s*", re.IGNORECASE)


def run_startup_migrations(engine: Engine) -> None:
    """Idempotent schema/data fixes applied on every boot (no alembic in this project)."""
    inspector = inspect(engine)
    columns = {col["name"] for col in inspector.get_columns("applications")}
    if "recruiter" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE applications ADD COLUMN recruiter VARCHAR(255)"))

    _backfill_recruiter_from_source(engine)


def _backfill_recruiter_from_source(engine: Engine) -> None:
    """Split legacy `source = "Platform - detail"` rows into source/recruiter."""
    with Session(engine) as session:
        candidates = (
            session.query(Application)
            .filter(Application.recruiter.is_(None))
            .filter(Application.source.isnot(None))
            .filter(Application.source.contains(" - "))
            .all()
        )
        if not candidates:
            return
        for application in candidates:
            source, _, recruiter = application.source.partition(" - ")
            recruiter = _RECRUITER_LABEL_RE.sub("", recruiter.strip())
            application.source = source.strip()
            application.recruiter = recruiter
        session.commit()
