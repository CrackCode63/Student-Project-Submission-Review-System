from collections import defaultdict
from collections.abc import Iterable

from fastapi import BackgroundTasks, WebSocket
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationResponse


class NotificationConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(user_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and user_id in self.active_connections:
            self.active_connections.pop(user_id, None)

    async def send_notification(self, user_id: int, payload: dict) -> None:
        for websocket in list(self.active_connections.get(user_id, [])):
            await websocket.send_json(payload)


notification_manager = NotificationConnectionManager()


def serialize_notification_payload(notification: Notification) -> dict:
    return NotificationResponse.model_validate(notification).model_dump(mode="json")


def create_notifications(
    db: Session,
    user_ids: Iterable[int],
    message: str,
    notification_type: str,
) -> list[Notification]:
    notifications: list[Notification] = []
    seen: set[int] = set()

    for user_id in user_ids:
        if user_id in seen:
            continue
        seen.add(user_id)
        notification = Notification(user_id=user_id, message=message, type=notification_type)
        db.add(notification)
        notifications.append(notification)

    db.flush()
    for notification in notifications:
        db.refresh(notification)
    return notifications


def queue_notification_delivery(background_tasks: BackgroundTasks | None, notifications: list[Notification]) -> None:
    if background_tasks is None:
        return

    for notification in notifications:
        background_tasks.add_task(
            notification_manager.send_notification,
            notification.user_id,
            serialize_notification_payload(notification),
        )
