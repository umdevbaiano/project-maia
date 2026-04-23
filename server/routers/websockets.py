import logging
from typing import Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["WebSockets"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: str, user_id: str):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = {}
        self.active_connections[workspace_id][user_id] = websocket

    def disconnect(self, workspace_id: str, user_id: str):
        if workspace_id in self.active_connections:
            self.active_connections[workspace_id].pop(user_id, None)
            if not self.active_connections[workspace_id]:
                self.active_connections.pop(workspace_id)

    async def send_personal_message(self, message: dict, workspace_id: str, user_id: str):
        if ws := self.active_connections.get(workspace_id, {}).get(user_id):
            await ws.send_json(message)

    async def broadcast_to_workspace(self, message: dict, workspace_id: str):
        if connections := self.active_connections.get(workspace_id):
            for ws in connections.values():
                await ws.send_json(message)


manager = ConnectionManager()


@router.websocket("/notifications/{workspace_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: str, user_id: str):
    await manager.connect(websocket, workspace_id, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(workspace_id, user_id)
