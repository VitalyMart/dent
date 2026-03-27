from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.auth import decode_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Пропускаем статические файлы
        if request.url.path.startswith("/static/"):
            return await call_next(request)
        
        # Пропускаем favicon и другие системные запросы
        if request.url.path == "/favicon.ico" or request.url.path.startswith("/.well-known/"):
            return await call_next(request)
        
        # Пропускаем auth эндпоинты
        if request.url.path.startswith("/auth/"):
            return await call_next(request)
        
        # Страница авторизации
        if request.url.path == "/auth.html":
            return await call_next(request)
        
        # API эндпоинты (включая /admin/*)
        if request.url.path.startswith("/api/") or request.url.path.startswith("/admin/"):
            token = request.cookies.get("token")
            
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated"
                )
            
            try:
                payload = decode_token(token)
                user_role = payload.get("role")
                user_id = payload.get("sub")
                request.state.user_id = user_id
                request.state.user_role = user_role
                
                # Логирование для отладки
                print(f"[AUTH] API path: {request.url.path}, user_id: {user_id}, role: {user_role}")
                
                # Для админ API проверяем роль
                if request.url.path.startswith("/admin/") and user_role != "admin":
                    print(f"[AUTH] Forbidden: user {user_id} with role {user_role} tried to access admin API")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not enough permissions"
                    )
                
                return await call_next(request)
            except Exception as e:
                print(f"[AUTH] Token validation error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                )
        
        # Страницы
        if request.url.path == "/" or request.url.path == "/admin.html":
            token = request.cookies.get("token")
            
            if not token:
                return RedirectResponse(url="/auth.html", status_code=303)
            
            try:
                payload = decode_token(token)
                user_role = payload.get("role")
                user_id = payload.get("sub")
                request.state.user_id = user_id
                request.state.user_role = user_role
                
                print(f"[AUTH] Page: {request.url.path}, user_id: {user_id}, role: {user_role}")
                
                # Если это admin.html и пользователь не админ - редирект на главную
                if request.url.path == "/admin.html" and user_role != "admin":
                    return RedirectResponse(url="/", status_code=303)
                
                return await call_next(request)
            except Exception:
                return RedirectResponse(url="/auth.html", status_code=303)
        
        # Все остальные запросы передаем дальше
        return await call_next(request)