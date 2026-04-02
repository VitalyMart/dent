from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserResponse
from app.auth import verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
async def login(
    login_data: UserLogin, 
    db: Session = Depends(get_db),
    response: Response = None
):
    logger.info(f"Login attempt: {login_data.username}")
    
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        logger.warning(f"Login failed for {login_data.username}: invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        logger.warning(f"Login failed for {login_data.username}: account disabled")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled"
        )
    
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    user_data = {
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None
    }
    
    response = JSONResponse(content={
        "message": "Login successful",
        "user": user_data
    })
    
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    logger.info(f"Login successful: {user.username} (role: {user.role})")
    return response

@router.post("/logout")
async def logout():
    logger.info("Logout")
    response = JSONResponse(content={"message": "Successfully logged out"})
    response.delete_cookie("token", path="/")
    return response

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/check")
async def check_auth(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("token")
    
    if not token:
        return {"authenticated": False}
    
    try:
        from app.auth import decode_token
        payload = decode_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            return {"authenticated": False}
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if user is None or not user.is_active:
            return {"authenticated": False}
        
        user_data = {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }
        
        return {
            "authenticated": True,
            "user": user_data
        }
    except Exception:
        return {"authenticated": False}