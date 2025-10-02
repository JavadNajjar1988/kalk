from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime.manager import manager


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


