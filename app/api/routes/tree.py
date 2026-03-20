"""File tree API endpoints."""

from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import os

from app.config import settings
from app.models.tree import TreeNode

router = APIRouter()


@router.get("/tree")
async def get_tree(path: str = Query("", description="Relative path from files root")):
    """
    Retrieve directory structure.

    Args:
        path: Relative path from the configured files directory.

    Returns:
        List of TreeNode objects representing files and subdirectories.

    Raises:
        HTTPException: If path doesn't exist or is not a directory.
    """
    target_path = settings.files_dir / path

    if not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {target_path}")
    if not target_path.is_dir():
        raise HTTPException(status_code=400, detail="Not a directory")

    items = []
    for item in sorted(target_path.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
        rel_path = str(item.relative_to(settings.files_dir))

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