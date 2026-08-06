import datetime as dt
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Application, StatusHistory, User
from app.schemas import (
    CvVariantStat,
    FunnelStage,
    ResponseTimeStat,
    SourceStat,
    SummaryResponse,
    TimelinePoint,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

FUNNEL_STAGES = ["lead", "applied", "interviewing", "offer"]
STAGE_RANK = {stage: i for i, stage in enumerate(FUNNEL_STAGES)}
TERMINAL_STATUSES = {"rejected", "withdrawn", "declined"}


def _user_applications(db: Session, user: User) -> list[Application]:
    return db.query(Application).filter(Application.user_id == user.id).all()


def _max_funnel_rank_by_application(db: Session, user: User) -> dict[int, int]:
    """Highest funnel stage rank each application reached, based on status history."""
    rows = (
        db.query(StatusHistory.application_id, StatusHistory.status)
        .join(Application, Application.id == StatusHistory.application_id)
        .filter(Application.user_id == user.id)
        .all()
    )
    max_rank: dict[int, int] = defaultdict(lambda: -1)
    for application_id, status_value in rows:
        rank = STAGE_RANK.get(status_value)
        if rank is not None and rank > max_rank[application_id]:
            max_rank[application_id] = rank
    return max_rank


@router.get("/summary", response_model=SummaryResponse)
def summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SummaryResponse:
    applications = _user_applications(db, current_user)
    by_status: dict[str, int] = defaultdict(int)
    for application in applications:
        by_status[application.status] += 1
    active = sum(count for status_value, count in by_status.items() if status_value not in TERMINAL_STATUSES)
    return SummaryResponse(total=len(applications), active=active, by_status=dict(by_status))


@router.get("/funnel", response_model=list[FunnelStage])
def funnel(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FunnelStage]:
    max_rank = _max_funnel_rank_by_application(db, current_user)
    return [
        FunnelStage(
            stage=stage,
            count=sum(1 for rank in max_rank.values() if rank >= STAGE_RANK[stage]),
        )
        for stage in FUNNEL_STAGES
    ]


@router.get("/sources", response_model=list[SourceStat])
def sources(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[SourceStat]:
    applications = _user_applications(db, current_user)
    max_rank = _max_funnel_rank_by_application(db, current_user)
    totals: dict[str, int] = defaultdict(int)
    interviews_or_better: dict[str, int] = defaultdict(int)
    for application in applications:
        source = application.source or "Unknown"
        totals[source] += 1
        if max_rank.get(application.id, -1) >= STAGE_RANK["interviewing"]:
            interviews_or_better[source] += 1
    return [
        SourceStat(
            source=source,
            total=total,
            interviews_or_better=interviews_or_better[source],
            conversion_rate=round(interviews_or_better[source] / total, 4) if total else 0.0,
        )
        for source, total in sorted(totals.items())
    ]


@router.get("/timeline", response_model=list[TimelinePoint])
def timeline(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[TimelinePoint]:
    applications = _user_applications(db, current_user)
    today = dt.date.today()
    current_week_start = today - dt.timedelta(days=today.weekday())
    week_starts = [current_week_start - dt.timedelta(weeks=i) for i in range(11, -1, -1)]
    counts: dict[dt.date, int] = {week_start: 0 for week_start in week_starts}
    earliest = week_starts[0]
    for application in applications:
        created_date = application.created_at.date()
        week_start = created_date - dt.timedelta(days=created_date.weekday())
        if week_start >= earliest:
            counts[week_start] = counts.get(week_start, 0) + 1
    return [TimelinePoint(week_start=week_start, count=counts[week_start]) for week_start in week_starts]


@router.get("/response-times", response_model=list[ResponseTimeStat])
def response_times(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ResponseTimeStat]:
    rows = (
        db.query(StatusHistory.application_id, StatusHistory.status, StatusHistory.changed_at)
        .join(Application, Application.id == StatusHistory.application_id)
        .filter(Application.user_id == current_user.id)
        .order_by(StatusHistory.application_id, StatusHistory.changed_at)
        .all()
    )
    by_application: dict[int, list[tuple[str, dt.datetime]]] = defaultdict(list)
    for application_id, status_value, changed_at in rows:
        by_application[application_id].append((status_value, changed_at))

    transition_days: dict[str, list[float]] = defaultdict(list)
    for history in by_application.values():
        for (from_status, from_time), (to_status, to_time) in zip(history, history[1:]):
            from_rank = STAGE_RANK.get(from_status)
            to_rank = STAGE_RANK.get(to_status)
            if from_rank is not None and to_rank is not None and to_rank == from_rank + 1:
                transition = f"{from_status}_to_{to_status}"
                transition_days[transition].append((to_time - from_time).total_seconds() / 86400)

    stats = []
    for i in range(len(FUNNEL_STAGES) - 1):
        transition = f"{FUNNEL_STAGES[i]}_to_{FUNNEL_STAGES[i + 1]}"
        days = transition_days.get(transition, [])
        avg_days = round(sum(days) / len(days), 2) if days else 0.0
        stats.append(ResponseTimeStat(transition=transition, avg_days=avg_days))
    return stats


@router.get("/cv-variants", response_model=list[CvVariantStat])
def cv_variants(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[CvVariantStat]:
    applications = _user_applications(db, current_user)
    max_rank = _max_funnel_rank_by_application(db, current_user)
    totals: dict[str, int] = defaultdict(int)
    interviews_or_better: dict[str, int] = defaultdict(int)
    for application in applications:
        variant = application.cv_variant or "Unknown"
        totals[variant] += 1
        if max_rank.get(application.id, -1) >= STAGE_RANK["interviewing"]:
            interviews_or_better[variant] += 1
    return [
        CvVariantStat(
            cv_variant=variant,
            total=total,
            interviews_or_better=interviews_or_better[variant],
            conversion_rate=round(interviews_or_better[variant] / total, 4) if total else 0.0,
        )
        for variant, total in sorted(totals.items())
    ]
