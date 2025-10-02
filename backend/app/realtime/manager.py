from __future__ import annotations

from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(room, []).append(websocket)

    def disconnect(self, room: str, websocket: WebSocket) -> None:
        conns = self.active_connections.get(room, [])
        if websocket in conns:
            conns.remove(websocket)

    async def broadcast(self, room: str, message: dict) -> None:
        for connection in list(self.active_connections.get(room, [])):
            try:
                await connection.send_json(message)
            except Exception:
                # Drop broken connections silently
                self.disconnect(room, connection)


manager = ConnectionManager()


