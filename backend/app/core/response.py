from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = ""
    timestamp: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def success(data: Any = None, message: str = "") -> dict:
    return {"success": True, "data": data, "message": message, "timestamp": _now_iso()}


def error(message: str, data: Any = None, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "data": data,
            "message": message,
            "timestamp": _now_iso(),
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else "HTTP error"
    return error(detail, status_code=exc.status_code)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error("Validation error", data={"errors": exc.errors()}, status_code=422)


async def unhandled_exception_handler(request: Request, exc: Exception):
    return error(f"Internal server error: {exc}", status_code=500)


