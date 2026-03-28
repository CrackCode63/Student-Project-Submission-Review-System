from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBaseModel


class FeedbackCreateRequest(BaseModel):
    submission_id: int
    comment: str = Field(min_length=3, max_length=4000)


class FeedbackResponse(ORMBaseModel):
    id: int
    submission_id: int
    project_id: int
    project_title: str
    version_label: str
    mentor_id: int
    mentor_name: str
    comment: str
    created_at: datetime
