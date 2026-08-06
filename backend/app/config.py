from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://jobpilot:jobpilot@127.0.0.1:5432/jobpilot"
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    admin_email: str = "admin@example.com"
    admin_password: str = "changeme"

    allow_register: bool = False

    cors_origins: str = "http://localhost:5173"

    secure_cookies: bool = False


settings = Settings()
