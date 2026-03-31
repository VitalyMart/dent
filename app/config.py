from pathlib import Path
from pydantic_settings import BaseSettings
import os
import secrets
from typing import List


class Settings(BaseSettings):
    base_dir: Path = Path(__file__).parent.parent.resolve()
    files_dir: Path = Path(os.getenv("FILES_DIR", str(base_dir / "files"))).resolve()
    app_static_dir: Path = base_dir / "static"
    templates_dir: Path = base_dir / "templates"
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/dentistry")
    secret_key: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:8000")
    
    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()