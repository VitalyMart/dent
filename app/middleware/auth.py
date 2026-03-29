from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.auth import decode_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/static/"):
            return await call_next(request)
        
        if request.url.path == "/favicon.ico" or request.url.path.startswith("/.well-known/"):
            return await call_next(request)
        
        if request.url.path.startswith("/auth/"):
            return await call_next(request)
        
        if request.url.path == "/auth.html":
            return await call_next(request)
        
        token = request.cookies.get("token")
        
        if not token:
            if request.url.path.startswith("/api/") or request.url.path.startswith("/media/") or request.url.path.startswith("/admin/"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )
            return RedirectResponse(url="/auth.html", status_code=303)
        
        try:
            payload = decode_token(token)
            user_role = payload.get("role")
            user_id = payload.get("sub")
            request.state.user_id = user_id
            request.state.user_role = user_role
            
            if request.url.path.startswith("/admin/") and user_role != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
            
            return await call_next(request)
        except Exception:
            if request.url.path.startswith("/api/") or request.url.path.startswith("/media/") or request.url.path.startswith("/admin/"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
            return RedirectResponse(url="/auth.html", status_code=303)