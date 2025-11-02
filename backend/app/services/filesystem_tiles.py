from __future__ import annotations

import sqlite3
from functools import lru_cache
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException


class FilesystemTileService:
    """
    Provides XYZ tile access for MapTiler-style SQLite chunk caches.
    Expected structure:
      <root>/z{zoom}/{x_group}/{y_group}/{x_chunk}.{y_chunk}.sqlitedb
    Each sqlite file contains table `t` with columns including x, y, b (tile blob).
    """

    def __init__(self, root: Path) -> None:
        self.root = root

    def _chunk_path(self, z: int, x: int, y: int) -> Path:
        if z < 0 or x < 0 or y < 0:
            raise HTTPException(status_code=400, detail="مختصات کاشی نامعتبر است")

        # تبدیل zoom level: OpenLayers از z0 شروع می‌شود، اما نقشه‌ها از z1 شروع می‌شوند
        z_filesystem = z + 1

        chunk = (
            self.root
            / f"z{z_filesystem}"
            / str(x // 1024)
            / str(y // 1024)
            / f"{x // 256}.{y // 256}.sqlitedb"
        )

        if not chunk.exists():
            raise HTTPException(status_code=404, detail="فایل کاشی یافت نشد")
        return chunk

    def _detect_media_type(self, payload: bytes) -> str:
        if payload.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if payload.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if payload.startswith(b"RIFF") and b"WEBP" in payload[:12]:
            return "image/webp"
        return "application/octet-stream"

    def _fetch_tile(self, z: int, x: int, y: int) -> Tuple[bytes, str]:
        db_path = self._chunk_path(z, x, y)
        conn: sqlite3.Connection | None = None
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.execute("SELECT b FROM t WHERE x = ? AND y = ? LIMIT 1", (x, y))
            row = cursor.fetchone()
        except sqlite3.Error as exc:  # pragma: no cover
            raise HTTPException(status_code=500, detail=f"SQLite error: {exc}")
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:  # pragma: no cover
                    pass

        if not row:
            raise HTTPException(status_code=404, detail="کاشی یافت نشد")

        blob: bytes = row[0]
        media_type = self._detect_media_type(blob)
        return blob, media_type


    def get_tile(self, z: int, x: int, y: int) -> Tuple[bytes, str]:
        # تبدیل zoom level: OpenLayers از z0 شروع می‌شود، اما نقشه‌ها از z1 شروع می‌شوند
        z_filesystem = z + 1
        max_index = (1 << z_filesystem) - 1
        
        if y < 0 or y > max_index:
            raise HTTPException(status_code=404, detail="کاشی یافت نشد")

        candidates = [y]
        # تبدیل TMS به XYZ (اگر نیاز باشد)
        tms_y = max_index - y
        if tms_y != y:
            candidates.append(tms_y)

        last_not_found: HTTPException | None = None
        for candidate in candidates:
            try:
                return self._fetch_tile(z, x, candidate)
            except HTTPException as exc:
                if exc.status_code == 404:
                    last_not_found = exc
                    continue
                raise

        if last_not_found is not None:
            raise last_not_found
        raise HTTPException(status_code=404, detail="کاشی یافت نشد")


@lru_cache(maxsize=32)
def get_tile_service(root: Path) -> FilesystemTileService:
    if not root.exists():
        raise HTTPException(status_code=404, detail="پوشه کاشی یافت نشد")
    return FilesystemTileService(root)
