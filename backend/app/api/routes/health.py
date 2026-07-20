from fastapi import APIRouter

from app.core.config import settings
from app.core.response import success


router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return success({"status": "ok"})


@router.get("/version")
async def version():
    return success({"version": settings.VERSION, "app": settings.APP_NAME})


