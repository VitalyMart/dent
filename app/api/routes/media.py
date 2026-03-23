"""Media file serving endpoints."""

import urllib.parse
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

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
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
}


@router.get("/media/{file_path:path}")
@limiter.limit("60/minute")
async def serve_media(request: Request, file_path: str):
    decoded_path = urllib.parse.unquote(file_path)
    
    try:
        safe_path = os.path.normpath(decoded_path).lstrip('/')
        
        if safe_path.startswith('..') or '..' in safe_path.split(os.sep):
            raise HTTPException(status_code=403, detail="Access denied")
        
        full_path = settings.files_dir / safe_path
        full_path = full_path.resolve()
        files_dir_resolved = settings.files_dir.resolve()
        
        if not str(full_path).startswith(str(files_dir_resolved)):
            raise HTTPException(status_code=403, detail="Access denied")
            
        file_size = full_path.stat().st_size
        if file_size > 500 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large")
            
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied")

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    if full_path.is_dir():
        raise HTTPException(status_code=400, detail="Cannot serve directory")

    ext = full_path.suffix.lower()
    media_type = _MIME_TYPES.get(ext, 'application/octet-stream')
    
    if ext in ['.mp4', '.webm', '.mov', '.avi', '.mkv']:
        range_header = request.headers.get('range')
        
        if range_header:
            try:
                byte_range = range_header.replace('bytes=', '').split('-')
                start = int(byte_range[0]) if byte_range[0] else 0
                end = int(byte_range[1]) if byte_range[1] else file_size - 1
                
                if start >= file_size or end >= file_size or start > end:
                    raise HTTPException(status_code=416, detail="Range not satisfiable")
                
                chunk_size = end - start + 1
                
                def generate_chunk():
                    with open(full_path, 'rb') as video_file:
                        video_file.seek(start)
                        yield video_file.read(chunk_size)
                
                return StreamingResponse(
                    generate_chunk(),
                    media_type=media_type,
                    status_code=206,
                    headers={
                        "Content-Disposition": "inline",
                        "Content-Range": f"bytes {start}-{end}/{file_size}",
                        "Accept-Ranges": "bytes",
                        "Content-Length": str(chunk_size),
                        "Cache-Control": "public, max-age=86400"
                    }
                )
            except Exception:
                pass
        
        return StreamingResponse(
            open(full_path, "rb"),
            media_type=media_type,
            headers={
                "Content-Disposition": "inline",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400"
            }
        )
    
    return FileResponse(
        path=full_path,
        media_type=media_type,
        headers={
            "Content-Disposition": "inline",
            "Cache-Control": "public, max-age=86400"
        }
    )