from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session  # unused in test mode
from typing import List
import os
import shutil
import uuid
from pathlib import Path

# NOTE: کد پروژه از session async استفاده می‌کند. برای سادگی تستی این ماژول
# به session سینک نیاز ندارد، بنابراین وابستگی DB را حذف می‌کنیم یا از get_session
# فقط برای تایپ استفاده می‌کنیم. در این نسخه، وابستگی DB برای اندپوینت‌های تستی حذف شده است.
from app.models.map import OfflineMap
from app.schemas.map import (
    OfflineMapCreate, 
    OfflineMapUpdate, 
    OfflineMapResponse,
    OfflineMapListResponse
)
try:
    from app.deps import get_current_user
except Exception:  # fallback in test/dev container if deps not ready
    def get_current_user():
        return None

router = APIRouter(prefix="/maps", tags=["maps"])

# مسیر پوشه ذخیره فایل‌ها
MAPS_DIR = Path("static/maps")
MAPS_DIR.mkdir(exist_ok=True)


@router.get("", response_model=OfflineMapListResponse)
def get_offline_maps(
    skip: int = 0,
    limit: int = 100,
):
    """دریافت لیست نقشه‌های آفلاین"""
    # داده‌های نمونه برای تست
    sample_maps = [
        {
            "id": 1,
            "name": "نقشه جهانی",
            "filename": "world_map.mbtiles",
            "file_path": "/data/world_map.mbtiles",
            "description": "نقشه کامل جهان",
            "is_active": True,
            "file_size": 31465472,
            "created_at": "2025-01-08T10:00:00Z",
            "updated_at": "2025-01-08T10:00:00Z"
        },
        {
            "id": 2,
            "name": "نقشه ایران",
            "filename": "iran_map.mbtiles",
            "file_path": "/data/iran_map.mbtiles",
            "description": "نقشه تفصیلی ایران",
            "is_active": False,
            "file_size": 15728640,
            "created_at": "2025-01-08T09:30:00Z",
            "updated_at": "2025-01-08T09:30:00Z"
        },
        {
            "id": 3,
            "name": "نقشه خاورمیانه",
            "filename": "middle_east_map.mbtiles",
            "file_path": "/data/middle_east_map.mbtiles",
            "description": "نقشه منطقه خاورمیانه",
            "is_active": False,
            "file_size": 20971520,
            "created_at": "2025-01-08T09:00:00Z",
            "updated_at": "2025-01-08T09:00:00Z"
        }
    ]
    
    return OfflineMapListResponse(
        maps=sample_maps,
        total=len(sample_maps)
    )


@router.post("/upload", response_model=OfflineMapResponse)
def upload_offline_map(
    name: str,
    description: str = "",
    file: UploadFile = File(...),
):
    """آپلود فایل نقشه آفلاین"""
    
    # بررسی فرمت فایل
    if not file.filename.endswith('.mbtiles'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="فقط فایل‌های .mbtiles قابل آپلود هستند"
        )
    
    # بررسی وجود نام تکراری
    # حالت تستی: از دیسک صرفاً ذخیره می‌کنیم و پاسخ برمی‌گردانیم (بدون DB)
    
    # تولید نام فایل منحصر به فرد
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = MAPS_DIR / unique_filename
    
    try:
        # ذخیره فایل
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # محاسبه اندازه فایل
        file_size = file_path.stat().st_size
        
        return {
            "id": 999,
            "name": name,
            "filename": unique_filename,
            "file_path": str(file_path),
            "description": description,
            "is_active": False,
            "file_size": file_size,
            "created_at": "2025-01-08T10:00:00Z",
            "updated_at": "2025-01-08T10:00:00Z",
        }
        
    except Exception as e:
        # حذف فایل در صورت خطا
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در آپلود فایل: {str(e)}"
        )


@router.put("/{map_id}", response_model=OfflineMapResponse)
def update_offline_map(
    map_id: int,
    map_update: OfflineMapUpdate,
):
    """ویرایش نقشه آفلاین"""
    
    # داده‌های نمونه برای تست
    sample_maps = {
        1: {
            "id": 1,
            "name": "نقشه جهانی",
            "filename": "world_map.mbtiles",
            "file_path": "/data/world_map.mbtiles",
            "description": "نقشه کامل جهان",
            "is_active": True,
            "file_size": 31465472,
            "created_at": "2025-01-08T10:00:00Z",
            "updated_at": "2025-01-08T10:00:00Z"
        },
        2: {
            "id": 2,
            "name": "نقشه ایران",
            "filename": "iran_map.mbtiles",
            "file_path": "/data/iran_map.mbtiles",
            "description": "نقشه تفصیلی ایران",
            "is_active": False,
            "file_size": 15728640,
            "created_at": "2025-01-08T09:30:00Z",
            "updated_at": "2025-01-08T09:30:00Z"
        },
        3: {
            "id": 3,
            "name": "نقشه خاورمیانه",
            "filename": "middle_east_map.mbtiles",
            "file_path": "/data/middle_east_map.mbtiles",
            "description": "نقشه منطقه خاورمیانه",
            "is_active": False,
            "file_size": 20971520,
            "created_at": "2025-01-08T09:00:00Z",
            "updated_at": "2025-01-08T09:00:00Z"
        }
    }
    
    if map_id not in sample_maps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="نقشه مورد نظر یافت نشد"
        )
    
    # شبیه‌سازی تغییر وضعیت
    updated_map = sample_maps[map_id].copy()
    if map_update.is_active is not None:
        updated_map["is_active"] = map_update.is_active
        updated_map["updated_at"] = "2025-01-08T11:00:00Z"
    
    return updated_map


@router.delete("/{map_id}")
def delete_offline_map(
    map_id: int,
):
    """حذف نقشه آفلاین (حالت تستی بدون DB)"""
    return {"message": "حذف تستی انجام شد", "id": map_id}


@router.get("/{map_id}/download")
def download_offline_map(
    map_id: int,
):
    """دانلود فایل نقشه آفلاین (فعلاً پیاده‌سازی نشده در حالت تست)"""
    raise HTTPException(status_code=404, detail="در حالت تست در دسترس نیست")


@router.get("/active", response_model=OfflineMapResponse)
def get_active_map():
    """دریافت نقشه فعال (حالت تستی: همان اولی را برمی‌گرداند)"""
    return OfflineMapResponse(
        id=1,
        name="نقشه جهانی",
        filename="world_map.mbtiles",
        file_path="/data/world_map.mbtiles",
        is_active=True,
        file_size=31465472,
        created_at="2025-01-08T10:00:00Z",
        updated_at="2025-01-08T10:00:00Z",
        description="نقشه کامل جهان",
    )
