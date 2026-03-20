"""Pydantic models for file tree structure."""

from typing import List, Optional

from pydantic import BaseModel


class TreeNode(BaseModel):
    """Represents a file or directory node in the tree."""

    name: str
    path: str
    type: str
    children: Optional[List["TreeNode"]] = None