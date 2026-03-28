from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Student Project Submission & Review System API"
    app_env: str = "development"
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 1440
    algorithm: str = "HS256"
    database_url: str = "mysql+pymysql://root:password@localhost:3306/student_project_system"
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    upload_dir: str = "uploads"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def resolved_upload_dir(self) -> Path:
        upload_path = Path(self.upload_dir)
        if upload_path.is_absolute():
            return upload_path

        if upload_path.parts[:1] == ("backend",):
            upload_path = Path(*upload_path.parts[1:])

        return BACKEND_DIR / upload_path


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

