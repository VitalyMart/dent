from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserResponse
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
async def login(
    login_data: UserLogin, 
    db: Session = Depends(get_db),
    response: Response = None
):
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is disabled"
        )
    
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/"
    )
    
    return {
        "message": "Login successful",
        "user": UserResponse.model_validate(user)
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("token", path="/")
    return JSONResponse(content={"message": "Successfully logged out"})

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.get("/check")
async def check_auth(current_user: User = Depends(get_current_user)):
    return {"authenticated": True, "user": UserResponse.model_validate(current_user)}