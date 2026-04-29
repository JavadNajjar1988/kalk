"""Direct MBTiles tile serving – no TileServer-GL required.

Reads tiles straight from .mbtiles SQLite databases so the map
viewer can display them even when TileServer-GL is down or absent.
"""

from __future__ import annotations

import sqlite3
from functools import lru_cache
from pathlib import Path
from typing import Tuple

from fastapi import HTTPException


class MBTilesTileService:
    """Serves individual tiles from a standard MBTiles file.

    MBTiles stores tiles in a `tiles` table with columns:
        zoom_level, tile_column (x), tile_row (y_tms), tile_data
    The Y axis follows TMS convention (origin at bottom-left).
    """

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.scheme = "tms"
        if not db_path.exists():
            raise HTTPException(status_code=404, detail="فایل MBTiles یافت نشد")

        self.scheme = self._read_scheme()

    def _read_scheme(self) -> str:
        conn: sqlite3.Connection | None = None
        try:
            conn = sqlite3.connect(str(self.db_path))
            row = conn.execute(
                "SELECT value FROM metadata WHERE LOWER(name) = 'scheme' LIMIT 1"
            ).fetchone()
        except sqlite3.Error:
            return "tms"
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        scheme = str(row[0]).strip().lower() if row and row[0] else ""
        return "xyz" if scheme == "xyz" else "tms"

    def _detect_media_type(self, payload: bytes) -> str:
        if payload.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if payload.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if payload.startswith(b"RIFF") and b"WEBP" in payload[:12]:
            return "image/webp"
        # PBF / vector tiles
        if len(payload) > 2 and payload[0:2] in (b"\x1f\x8b", b"\x78\x9c"):
            return "application/x-protobuf"
        return "application/octet-stream"

    def get_tile(self, z: int, x: int, y: int) -> Tuple[bytes, str]:
        """Return (tile_bytes, media_type) for the given XYZ coordinate.

        MBTiles defaults to TMS rows, but some generators mark files as
        scheme=xyz. Respect that metadata so rows are not flipped twice.
        """
        if z < 0 or x < 0 or y < 0:
            raise HTTPException(status_code=400, detail="مختصات کاشی نامعتبر است")

        # XYZ → TMS conversion: y_tms = (2^z - 1) - y_xyz
        tile_row = self._tile_row_for_scheme(self.scheme, z, y)

        conn: sqlite3.Connection | None = None
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.execute(
                "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ? LIMIT 1",
                (z, x, tile_row),
            )
            row = cursor.fetchone()
        except sqlite3.Error as exc:
            raise HTTPException(status_code=500, detail=f"SQLite error: {exc}")
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass

        if not row or not row[0]:
            raise HTTPException(status_code=404, detail="کاشی یافت نشد")

        blob: bytes = row[0]
        media_type = self._detect_media_type(blob)
        return blob, media_type

    @staticmethod
    def _tile_row_for_scheme(scheme: str, z: int, y: int) -> int:
        if scheme == "xyz":
            return y
        return (1 << z) - 1 - y


# Cache service instances per file path (up to 32 files)
@lru_cache(maxsize=32)
def get_mbtiles_service(db_path: Path) -> MBTilesTileService:
    return MBTilesTileService(db_path)
