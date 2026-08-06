from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import hash_password
from app.config import settings
from app.db import Base, SessionLocal, engine
from app.migrations import run_startup_migrations
from app.models import User
from app.routers import analytics, applications, auth, import_link


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_startup_migrations(engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.admin_email).first()
        if existing is None:
            db.add(User(email=settings.admin_email, password_hash=hash_password(settings.admin_password)))
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(title="JobPilot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(import_link.router, prefix="/api")


@app.get("/api/health")
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
