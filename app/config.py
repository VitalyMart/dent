from pathlib import Path
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    base_dir: Path = Path(__file__).parent.parent.resolve()
    files_dir: Path = Path(os.getenv("FILES_DIR", str(base_dir / "files"))).resolve()
    app_static_dir: Path = base_dir / "static"
    templates_dir: Path = base_dir / "templates"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()