"""Media file serving endpoints."""

import urllib.parse

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

from app.config import settings

router = APIRouter()

_MIME_TYPES = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.mp3': 'audio/mpeg',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}


@router.get("/media/{file_path:path}")
async def serve_media(request: Request, file_path: str):
    """
    Serve media files for inline viewing.

    Args:
        request: FastAPI request object.
        file_path: Relative path to the file.

    Returns:
        FileResponse with appropriate MIME type.

    Raises:
        HTTPException: If file not found or access denied.
    """
    decoded_path = urllib.parse.unquote(file_path)
    full_path = settings.files_dir / decoded_path

    try:
        full_path = full_path.resolve()
        if not str(full_path).startswith(str(settings.files_dir.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied")

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if full_path.is_dir():
        raise HTTPException(status_code=400, detail="Cannot serve directory")

    ext = full_path.suffix.lower()
    media_type = _MIME_TYPES.get(ext, 'application/octet-stream')

    return FileResponse(
        path=full_path,
        media_type=media_type,
        headers={"Content-Disposition": "inline"}
    )