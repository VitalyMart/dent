from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
import os
import logging

from app.logging_config import logger
from app.middleware.logging import LoggingMiddleware

from app.config import settings
from app.database import engine, Base
from app.api.routes import tree, media, search, auth, admin
from app.middleware.auth import AuthMiddleware

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Dental Materials Portal", version="1.0.0")

app.state.limiter = limiter

Base.metadata.create_all(bind=engine)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit exceeded for {request.client.host}")
    return _rate_limit_exceeded_handler(request, exc)

class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/"):
            response.headers["Cache-Control"] = "public, max-age=86400"
        return response

app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(CacheControlMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(media.router)
app.include_router(tree.router, prefix="/api", tags=["api"])
app.include_router(search.router, prefix="/api", tags=["search"])

templates = Jinja2Templates(directory="app/templates")

@app.on_event("startup")
async def startup_event():
    files_dir = settings.files_dir
    if not files_dir.exists():
        files_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Started with FILES_DIR: {files_dir}")
    logger.info(f"DATABASE_URL: {settings.database_url}")
    logger.info(f"CORS_ORIGINS: {settings.cors_origins}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/auth.html")
async def auth_page(request: Request):
    return templates.TemplateResponse("auth.html", {"request": request})

@app.get("/admin.html")
async def admin_page(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

@app.get("/health")
async def health():
    logger.debug("Health check called")
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}