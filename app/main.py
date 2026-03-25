from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
import os
import subprocess

from app.api.routes import tree, media, search
from app.config import settings

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Dental Materials Portal", version="1.0.0")

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return _rate_limit_exceeded_handler(request, exc)


class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/static/"):
            response.headers["Cache-Control"] = "public, max-age=86400"
        return response


app.add_middleware(CacheControlMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(media.router)
app.include_router(tree.router, prefix="/api", tags=["api"])
app.include_router(search.router, prefix="/api", tags=["search"])

templates = Jinja2Templates(directory="app/templates")


@app.on_event("startup")
async def startup_event():
    files_dir = settings.files_dir
    if not files_dir.exists():
        files_dir.mkdir(parents=True, exist_ok=True)
        print(f"Created files directory: {files_dir}")
    else:
        print(f"Files directory exists: {files_dir}")
    
    print(f"FILES_DIR from env: {os.getenv('FILES_DIR')}")
    print(f"files_dir in settings: {files_dir}")
    
    if files_dir.exists():
        print(f"Contents of {files_dir}:")
        try:
            for item in files_dir.iterdir():
                print(f"  - {item.name}")
        except Exception as e:
            print(f"  Error reading: {e}")


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/debug")
async def debug_info():
    files_dir = settings.files_dir
    parent_dir = files_dir.parent
    
    files_dir_contents = []
    if files_dir.exists() and files_dir.is_dir():
        try:
            files_dir_contents = [p.name for p in files_dir.iterdir()]
        except Exception as e:
            files_dir_contents = [f"Error: {e}"]
    
    parent_dir_contents = []
    if parent_dir.exists():
        try:
            parent_dir_contents = [p.name for p in parent_dir.iterdir()]
        except Exception as e:
            parent_dir_contents = [f"Error: {e}"]
    
    cwd_contents = []
    try:
        cwd_contents = [p.name for p in Path(os.getcwd()).iterdir()][:30]
    except Exception as e:
        cwd_contents = [f"Error: {e}"]
    
    return {
        "files_dir": str(files_dir),
        "files_dir_exists": files_dir.exists(),
        "files_dir_is_dir": files_dir.is_dir() if files_dir.exists() else False,
        "files_dir_contents": files_dir_contents,
        "parent_dir": str(parent_dir),
        "parent_dir_contents": parent_dir_contents,
        "env_FILES_DIR": os.getenv("FILES_DIR"),
        "cwd": os.getcwd(),
        "cwd_contents": cwd_contents
    }


@app.get("/debug-fs")
async def debug_fs():
    try:
        result = subprocess.run(['ls', '-la', '/app/files'], capture_output=True, text=True, timeout=5)
        return {
            "ls_output": result.stdout,
            "ls_error": result.stderr
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug-find")
async def debug_find():
    try:
        result = subprocess.run(['find', '/app', '-name', '3 курс', '-type', 'd', '2>/dev/null'], 
                                capture_output=True, text=True, timeout=10, shell=True)
        return {
            "find_result": result.stdout,
            "error": result.stderr
        }
    except Exception as e:
        return {"error": str(e)}