from fastapi import APIRouter, HTTPException, Query, Request
from pathlib import Path
import os
import logging
from typing import List, Dict
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def search_files_by_name(
    search_path: Path,
    query: str,
    max_results: int = 50,
    current_depth: int = 0,
    max_depth: int = 5
) -> List[Dict]:
    results = []
    query_lower = query.lower()
    
    if current_depth > max_depth:
        return results
    
    try:
        for item in search_path.iterdir():
            if item.name.startswith('.'):
                continue
            
            if query_lower in item.name.lower():
                try:
                    files_dir_resolved = settings.files_dir.resolve()
                    rel_path = str(item.resolve().relative_to(files_dir_resolved))
                except (ValueError, OSError):
                    rel_path = item.name
                
                file_type = "directory" if item.is_dir() else "file"
                file_extension = item.suffix.lower() if item.is_file() else ""
                
                results.append({
                    "name": item.name,
                    "path": rel_path,
                    "type": file_type,
                    "extension": file_extension,
                    "is_dir": item.is_dir(),
                    "size": item.stat().st_size if item.is_file() else 0
                })
                
                if len(results) >= max_results:
                    return results
            
            if item.is_dir():
                sub_results = search_files_by_name(
                    item, query, max_results - len(results),
                    current_depth + 1, max_depth
                )
                results.extend(sub_results)
                if len(results) >= max_results:
                    return results
                    
    except (PermissionError, OSError) as e:
        logger.warning(f"Error accessing {search_path}: {e}")
    
    return results

@router.get("/search")
@limiter.limit("30/minute")
async def search_files(
    request: Request,
    q: str = Query(..., min_length=1, max_length=100),
    max_results: int = Query(50, ge=1, le=100)
):
    logger.info(f"Search query: {q}")
    
    query = q.strip()
    if not query:
        logger.warning("Empty search query")
        raise HTTPException(status_code=400, detail="Empty search query")
    
    files_dir_resolved = settings.files_dir.resolve()
    if not files_dir_resolved.exists():
        try:
            files_dir_resolved.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created files directory: {files_dir_resolved}")
        except Exception as e:
            logger.error(f"Failed to create files directory: {e}")
            raise HTTPException(status_code=500, detail="Files directory not found and cannot be created")
    
    results = search_files_by_name(
        files_dir_resolved,
        query,
        max_results,
        max_depth=5
    )
    
    logger.info(f"Search for '{query}' returned {len(results)} results")
    
    return {
        "query": query,
        "total": len(results),
        "results": results
    }