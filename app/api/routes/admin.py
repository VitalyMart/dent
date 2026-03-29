import os
import shutil
import secrets
import string
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.auth import get_current_admin_user, hash_password
from app.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])

def generate_password(length=10):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

class CreateUserRequest(BaseModel):
    username: str
    password: Optional[str] = None
    role: str = "user"

class MassUserCreate(BaseModel):
    count: int
    prefix: str
    role: str = "user"
    common_password: Optional[str] = None

class RenameRequest(BaseModel):
    path: str
    new_name: str
    is_dir: bool = False

class MoveRequest(BaseModel):
    path: str
    new_path: str

class DeleteRequest(BaseModel):
    path: str
    is_dir: bool = False

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [UserResponse.model_validate(user) for user in users]

@router.post("/users")
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    password = user_data.password if user_data.password else generate_password()
    hashed = hash_password(password)
    
    db_user = User(
        username=user_data.username,
        hashed_password=hashed,
        role=user_data.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "role": db_user.role,
        "is_active": db_user.is_active,
        "created_at": db_user.created_at,
        "password": password
    }

@router.post("/users/mass")
async def mass_create_users(
    data: MassUserCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    if data.count < 1 or data.count > 15:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 15")
    
    created = 0
    errors = []
    created_users = []
    
    for i in range(1, data.count + 1):
        username = f"{data.prefix}{i}"
        
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            errors.append(f"User {username} already exists")
            continue
        
        password = data.common_password if data.common_password else generate_password()
        hashed = hash_password(password)
        
        db_user = User(
            username=username,
            hashed_password=hashed,
            role=data.role,
            is_active=True
        )
        db.add(db_user)
        created += 1
        created_users.append({"username": username, "password": password})
    
    db.commit()
    return {"created": created, "errors": errors, "users": created_users}

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_password = generate_password()
    user.hashed_password = hash_password(new_password)
    db.commit()
    
    return {"username": user.username, "password": new_password}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} deleted"}

@router.get("/files")
async def list_files(
    path: str = "",
    current_user: User = Depends(get_current_admin_user)
):
    files_dir = settings.files_dir.resolve()
    target_path = files_dir / path if path else files_dir
    target_path = target_path.resolve()
    
    if not str(target_path).startswith(str(files_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    
    items = []
    try:
        for item in sorted(target_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
            rel_path = str(item.relative_to(files_dir))
            items.append({
                "name": item.name,
                "path": rel_path,
                "is_dir": item.is_dir(),
                "size": item.stat().st_size if item.is_file() else 0
            })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"path": path, "items": items}

@router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    path: str = Form(""),
    current_user: User = Depends(get_current_admin_user)
):
    files_dir = settings.files_dir.resolve()
    target_dir = files_dir / path if path else files_dir
    target_dir = target_dir.resolve()
    
    if not str(target_dir).startswith(str(files_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    target_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = target_dir / file.filename
    if file_path.exists():
        raise HTTPException(status_code=400, detail="File already exists")
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        return {"message": f"File {file.filename} uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/files/rename")
async def rename_file(
    data: RenameRequest,
    current_user: User = Depends(get_current_admin_user)
):
    files_dir = settings.files_dir.resolve()
    old_path = files_dir / data.path
    old_path = old_path.resolve()
    
    if not str(old_path).startswith(str(files_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not old_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    parent = old_path.parent
    new_path = parent / data.new_name
    
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Target already exists")
    
    try:
        old_path.rename(new_path)
        return {"message": "Renamed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/files/move")
async def move_file(
    data: MoveRequest,
    current_user: User = Depends(get_current_admin_user)
):
    files_dir = settings.files_dir.resolve()
    old_path = files_dir / data.path
    old_path = old_path.resolve()
    
    if not str(old_path).startswith(str(files_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not old_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    new_path = files_dir / data.new_path / old_path.name if data.new_path else files_dir / old_path.name
    new_path = new_path.resolve()
    
    if not str(new_path).startswith(str(files_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    new_path.parent.mkdir(parents=True, exist_ok=True)
    
    if new_path.exists():
        raise HTTPException(status_code=400, detail="Target already exists")
    
    try:
        shutil.move(str(old_path), str(new_path))
        return {"message": "Moved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/delete")
async def delete_file(
    data: DeleteRequest,
    current_user: User = Depends(get_current_admin_user)
):
    files_dir = settings.files_dir.resolve()
    target_path = files_dir / data.path
    target_path = target_path.resolve()
    
    if not str(target_path).startswith(str(files_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not target_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        if data.is_dir:
            shutil.rmtree(target_path)
        else:
            target_path.unlink()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))