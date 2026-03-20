"""Application configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    files_dir: Path = Path("./files").resolve()
    app_static_dir: Path = Path("./app/static").resolve()
    templates_dir: Path = Path("./app/templates").resolve()

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()