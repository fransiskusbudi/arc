from sqlalchemy import text

from app.db import engine
from app.migrations import run_startup_migrations
from app.models import Application


def _admin_user_id(db_session) -> int:
    from app.models import User

    return db_session.query(User).first().id


def test_backfill_splits_polluted_source(client, db_session):
    user_id = _admin_user_id(db_session)
    app_row = Application(
        user_id=user_id,
        company="Global FS org (TBC)",
        role="Applied AI Engineer",
        source="LinkedIn - recruiter Daniel Neaves",
    )
    db_session.add(app_row)
    db_session.commit()

    run_startup_migrations(engine)

    db_session.refresh(app_row)
    assert app_row.source == "LinkedIn"
    assert app_row.recruiter == "Daniel Neaves"


def test_backfill_is_idempotent(client, db_session):
    user_id = _admin_user_id(db_session)
    app_row = Application(
        user_id=user_id,
        company="Acme",
        role="Engineer",
        source="LinkedIn - recruiter Daniel Neaves",
    )
    db_session.add(app_row)
    db_session.commit()

    run_startup_migrations(engine)
    run_startup_migrations(engine)

    db_session.refresh(app_row)
    assert app_row.source == "LinkedIn"
    assert app_row.recruiter == "Daniel Neaves"


def test_backfill_skips_rows_without_separator(client, db_session):
    user_id = _admin_user_id(db_session)
    app_row = Application(user_id=user_id, company="Acme", role="Engineer", source="LinkedIn")
    db_session.add(app_row)
    db_session.commit()

    run_startup_migrations(engine)

    db_session.refresh(app_row)
    assert app_row.source == "LinkedIn"
    assert app_row.recruiter is None


def test_migration_adds_missing_recruiter_column(client, db_session):
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE applications DROP COLUMN recruiter"))

    user_id = _admin_user_id(db_session)
    with engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO applications (user_id, company, role, source, status) "
                "VALUES (:user_id, 'Acme', 'Engineer', 'LinkedIn - recruiter Jane Doe', 'lead')"
            ),
            {"user_id": user_id},
        )

    run_startup_migrations(engine)

    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT source, recruiter FROM applications WHERE company = 'Acme'")
        ).first()
    assert row.source == "LinkedIn"
    assert row.recruiter == "Jane Doe"
