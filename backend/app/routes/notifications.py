from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket
from starlette.websockets import WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, get_db
from app.models.notification import Notification
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.utils.dependencies import get_current_user
from app.utils.notifications import notification_manager, serialize_notification_payload
from app.utils.security import decode_token

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NotificationResponse]:
    notifications = db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.timestamp.desc())
    ).scalars().all()
    return [NotificationResponse.model_validate(notification) for notification in notifications]


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationResponse:
    notification = db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id)
    ).scalar_one_or_none()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)


@router.websocket("/ws/notifications/{user_id}")
async def notification_socket(websocket: WebSocket, user_id: int, token: str = Query(...)):
    try:
        payload = decode_token(token)
        token_user_id = int(payload.get("sub"))
        token_role = payload.get("role")
    except Exception:
        await websocket.close(code=1008)
        return

    if token_user_id != user_id and token_role != UserRole.ADMIN.value:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    try:
        user = db.get(User, token_user_id)
        if user is None:
            await websocket.close(code=1008)
            return

        await notification_manager.connect(user_id, websocket)
        recent_notifications = db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.timestamp.desc())
            .limit(20)
        ).scalars().all()
        for notification in reversed(recent_notifications):
            await websocket.send_json(serialize_notification_payload(notification))

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)
    finally:
        db.close()
