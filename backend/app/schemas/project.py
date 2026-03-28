from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ProjectOwnerType, SubmissionStatus
from app.schemas.common import ORMBaseModel
from app.schemas.feedback import FeedbackResponse


class ProjectCreateData(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    category: str = Field(min_length=2, max_length=120)
    repository_url: str | None = Field(default=None, max_length=500)
    summary: str = Field(min_length=10, max_length=4000)
    owner_mode: ProjectOwnerType | None = None
    video_url: str | None = Field(default=None, max_length=500)


class SubmissionResponse(ORMBaseModel):
    id: int
    project_id: int
    project_title: str
    owner_type: ProjectOwnerType
    owner_display_name: str
    team_id: int | None
    team_name: str | None
    individual_owner_id: int | None
    individual_owner_name: str | None
    mentor_id: int | None
    mentor_name: str | None
    submitted_by_id: int
    submitted_by_name: str
    version_number: int
    version_label: str
    summary: str
    repository_url: str | None
    file_path: str | None
    video_url: str | None
    video_file_path: str | None
    status: SubmissionStatus
    submitted_at: datetime
    updated_at: datetime
    feedback: list[FeedbackResponse] = Field(default_factory=list)


class ProjectResponse(ORMBaseModel):
    id: int
    title: str
    category: str
    repository_url: str | None
    owner_type: ProjectOwnerType
    owner_display_name: str
    team_id: int | None
    team_name: str | None
    individual_owner_id: int | None
    individual_owner_name: str | None
    mentor_id: int | None
    mentor_name: str | None
    created_by_id: int
    created_at: datetime
    latest_submission: SubmissionResponse | None = None
    total_submissions: int


class SubmissionStatusUpdateRequest(BaseModel):
    status: SubmissionStatus


class SubmissionDetailResponse(BaseModel):
    project: ProjectResponse
    submissions: list[SubmissionResponse]


class ReviewQueueItem(BaseModel):
    submission_id: int
    project_id: int
    project_title: str
    owner_type: ProjectOwnerType
    owner_display_name: str
    team_id: int | None
    team_name: str | None
    individual_owner_id: int | None
    individual_owner_name: str | None
    mentor_id: int | None
    mentor_name: str | None
    version_label: str
    submitted_at: datetime
    status: SubmissionStatus
    repository_url: str | None
    file_path: str | None
    video_url: str | None
    video_file_path: str | None
