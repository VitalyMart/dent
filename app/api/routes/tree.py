from fastapi import APIRouter, HTTPException, Query, Request
from pathlib import Path
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.models.tree import TreeNode

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/tree")
@limiter.limit("30/minute")
async def get_tree(request: Request, path: str = Query("", description="Relative path from files root")):
    try:
        safe_path = os.path.normpath(path).lstrip('/')
        
        if safe_path.startswith('..') or '..' in safe_path.split(os.sep):
            raise HTTPException(status_code=403, detail="Access denied")
        
        files_dir_resolved = settings.files_dir.resolve()
        target_path = files_dir_resolved / safe_path
        target_path = target_path.resolve()
        
        if not str(target_path).startswith(str(files_dir_resolved)):
            raise HTTPException(status_code=403, detail="Access denied")
            
    except Exception:
        raise HTTPException(status_code=403, detail="Access denied")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {path}")
    if not target_path.is_dir():
        raise HTTPException(status_code=400, detail="Not a directory")

    items = []
    for item in sorted(target_path.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
        try:
            rel_path = str(item.resolve().relative_to(files_dir_resolved))
        except ValueError:
            continue
            
        if item.is_dir():
            items.append(TreeNode(
                name=item.name,
                path=rel_path,
                type="directory",
                children=[]
            ))
        else:
            items.append(TreeNode(
                name=item.name,
                path=rel_path,
                type="file",
                children=[]
            ))

    return items