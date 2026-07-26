from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jwt import InvalidTokenError

from app.core.security import decode_access_token
from app.db.session import AsyncSessionLocal
from app.realtime.manager import manager
from app.services.notifications import resolve_current_user


router = APIRouter(prefix="/ws", tags=["realtime"])


@router.websocket("/scenarios/{scenario_id}")
async def ws_scenarios(websocket: WebSocket, scenario_id: str):
    room = f"scenario:{scenario_id}"
    await manager.connect(room, websocket)
    try:
        while True:
            # Echo ping/pong or ignore client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)


@router.websocket("/notifications")
async def ws_notifications(websocket: WebSocket):
    protocols = [
        value.strip()
        for value in websocket.headers.get("sec-websocket-protocol", "").split(",")
        if value.strip()
    ]
    if len(protocols) < 2 or protocols[0] != "access-token":
        await websocket.close(code=4401)
        return
    try:
        payload = decode_access_token(protocols[1])
    except InvalidTokenError:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        user = await resolve_current_user(
            db,
            {
                "user_id": payload.get("uid"),
                "username": payload.get("sub"),
                "roles": payload.get("roles", []),
            },
        )
    if not user:
        await websocket.close(code=4401)
        return

    room = f"notifications:{user.id}"
    await manager.connect(room, websocket, subprotocol="access-token")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)


