from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.auth import decode_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        public_paths = [
            "/auth/login",
            "/auth/logout",
            "/auth/check",
            "/static",
            "/auth.html",
            "/favicon.ico"
        ]
        
        if request.url.path in public_paths:
            return await call_next(request)
        
        if request.url.path.startswith("/static/"):
            return await call_next(request)
        
        if request.url.path == "/" or request.url.path == "/auth.html":
            token = request.cookies.get("token")
            
            if not token:
                return RedirectResponse(url="/auth.html", status_code=303)
            
            try:
                payload = decode_token(token)
                request.state.user_id = payload.get("sub")
                request.state.user_role = payload.get("role")
            except Exception:
                return RedirectResponse(url="/auth.html", status_code=303)
            
            return await call_next(request)
        
        token = request.cookies.get("token")
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        try:
            payload = decode_token(token)
            request.state.user_id = payload.get("sub")
            request.state.user_role = payload.get("role")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return await call_next(request)