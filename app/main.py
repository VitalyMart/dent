"""FastAPI application entry point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.api.routes import tree
from app.api.routes.media import router as media_router

app = FastAPI(title="Dental Materials Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.include_router(media_router)
app.include_router(tree.router, prefix="/api", tags=["api"])

templates = Jinja2Templates(directory="app/templates")


@app.get("/")
async def index(request: Request):
    """Render main page."""
    return templates.TemplateResponse("index.html", {"request": request})