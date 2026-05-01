"""Rate limiting middleware for free tier enforcement."""
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting.

    For MVP: Track requests by IP, limit free tier to N scans per day.
    In production: Use Redis or similar for distributed rate limiting.
    """

    def __init__(self, app, limit: int = 10, window_seconds: int = 86400):
        """
        Initialize rate limiter.

        Args:
            limit: Max requests per window
            window_seconds: Time window in seconds (default: 1 day)
        """
        super().__init__(app)
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}  # IP -> list of timestamps
        self._cleanup_interval = 3600  # Clean up old entries every hour
        self._last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next):
        # Periodic cleanup
        if time.time() - self._last_cleanup > self._cleanup_interval:
            self._cleanup()

        # Only rate limit scan endpoints
        if not request.url.path.startswith("/api/scan"):
            return await call_next(request)

        # Get client IP
        client_ip = self._get_client_ip(request)

        # Check rate limit
        now = time.time()
        window_start = now - self.window_seconds

        # Get client's request history
        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Filter to requests within window
        client_requests = [ts for ts in self.requests[client_ip] if ts > window_start]

        if len(client_requests) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Free tier limited to {self.limit} scans per day",
                    "code": "rate_limit_exceeded"
                }
            )

        # Record this request
        client_requests.append(now)
        self.requests[client_ip] = client_requests

        return await call_next(request)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _cleanup(self):
        """Remove stale entries."""
        now = time.time()
        cutoff = now - self.window_seconds * 2
        self.requests = {
            ip: [ts for ts in timestamps if ts > cutoff]
            for ip, timestamps in self.requests.items()
        }
        self._last_cleanup = now


def create_rate_limit_middleware(limit: int = 10):
    """Factory for rate limit middleware."""
    return RateLimitMiddleware, {"limit": limit}
