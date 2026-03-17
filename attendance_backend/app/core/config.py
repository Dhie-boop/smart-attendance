import os

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore[import-untyped]


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/attendance_db"
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    QR_TOKEN_EXPIRE_SECONDS: int = 300  # 5 minutes (kept for backward compat)
    SESSION_DURATION_SECONDS: int = 7200  # 2 hours — how long a live session stays active
    LATE_THRESHOLD_SECONDS: int = 600   # 10 min after session start → marked "late"
    FRONTEND_URL: str = "http://localhost:5173"  # Where the React frontend runs

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if isinstance(value, str) and value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql://", 1)
        return value

    @model_validator(mode="after")
    def validate_render_database_url(self) -> "Settings":
        if os.getenv("RENDER") == "true" and "localhost" in self.DATABASE_URL:
            raise ValueError(
                "DATABASE_URL is pointing to localhost on Render. Set the DATABASE_URL environment variable to the Render Postgres internal connection string."
            )
        return self

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
