from datetime import datetime

from app.schemas.common import ORMBaseModel


class NotificationResponse(ORMBaseModel):
    id: int
    user_id: int
    message: str
    type: str
    is_read: bool
    timestamp: datetime
