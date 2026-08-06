import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Application, StatusHistory, User
from app.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    StatusHistoryResponse,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def _get_owned_application(application_id: int, user: User, db: Session) -> Application:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == user.id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


DUE_STATUSES = ["lead", "applied", "interviewing"]


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
    due: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Application]:
    query = db.query(Application).filter(Application.user_id == current_user.id)
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Application.company.ilike(like), Application.role.ilike(like)))
    if due:
        today = dt.date.today()
        query = query.filter(
            Application.status.in_(DUE_STATUSES),
            Application.next_followup.isnot(None),
            Application.next_followup <= today + dt.timedelta(days=7),
        )
        return query.order_by(Application.next_followup.asc()).all()
    return query.order_by(Application.created_at.desc()).all()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    application = Application(user_id=current_user.id, **payload.model_dump())
    db.add(application)
    db.flush()
    db.add(StatusHistory(application_id=application.id, status=application.status))
    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    return _get_owned_application(application_id, current_user, db)


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    application = _get_owned_application(application_id, current_user, db)
    updates = payload.model_dump(exclude_unset=True)
    status_changed = "status" in updates and updates["status"] != application.status
    for field, value in updates.items():
        setattr(application, field, value)
    if status_changed:
        db.add(StatusHistory(application_id=application.id, status=application.status))
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    application = _get_owned_application(application_id, current_user, db)
    db.delete(application)
    db.commit()


@router.get("/{application_id}/history", response_model=list[StatusHistoryResponse])
def get_history(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StatusHistory]:
    application = _get_owned_application(application_id, current_user, db)
    return application.status_history
