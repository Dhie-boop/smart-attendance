from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore[import-untyped]


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/attendance_db"
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    QR_TOKEN_EXPIRE_SECONDS: int = 300  # 5 minutes (kept for backward compat)
    SESSION_DURATION_SECONDS: int = 7200  # 2 hours — how long a live session stays active
    LATE_THRESHOLD_SECONDS: int = 600   # 10 min after session start → marked "late"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
