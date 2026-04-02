import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        request_id = f"{time.time_ns()}"
        request.state.request_id = request_id
        
        logger.info(f"REQUEST: {request.method} {request.url.path} - ID: {request_id}")
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            logger.info(f"RESPONSE: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}ms - ID: {request_id}")
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"ERROR: {request.method} {request.url.path} - {str(e)} - Time: {process_time:.2f}ms - ID: {request_id}", exc_info=True)
            raise