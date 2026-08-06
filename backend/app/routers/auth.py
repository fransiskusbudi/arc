import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.auth import (
    clear_auth_cookie,
    create_access_token,
    get_current_user,
    hash_token,
    set_auth_cookie,
    verify_password,
)
from app.db import get_db
from app.models import ApiToken, User
from app.schemas import (
    ApiTokenCreateRequest,
    ApiTokenCreateResponse,
    ApiTokenResponse,
    LoginRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id)
    set_auth_cookie(response, token)
    return TokenResponse(access_token=token)


@router.post("/logout")
def logout(response: Response) -> dict[str, bool]:
    clear_auth_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/tokens", response_model=ApiTokenCreateResponse, status_code=status.HTTP_201_CREATED)
def create_token(
    payload: ApiTokenCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApiTokenCreateResponse:
    raw_token = f"arc_{secrets.token_hex(24)}"
    api_token = ApiToken(user_id=current_user.id, name=payload.name, token_hash=hash_token(raw_token))
    db.add(api_token)
    db.commit()
    db.refresh(api_token)
    return ApiTokenCreateResponse(
        id=api_token.id, name=api_token.name, token=raw_token, created_at=api_token.created_at
    )


@router.get("/tokens", response_model=list[ApiTokenResponse])
def list_tokens(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ApiToken]:
    return (
        db.query(ApiToken)
        .filter(ApiToken.user_id == current_user.id)
        .order_by(ApiToken.created_at.desc())
        .all()
    )


@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_token(
    token_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    api_token = (
        db.query(ApiToken)
        .filter(ApiToken.id == token_id, ApiToken.user_id == current_user.id)
        .first()
    )
    if api_token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    db.delete(api_token)
    db.commit()
