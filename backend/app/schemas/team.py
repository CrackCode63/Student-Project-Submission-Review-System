from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBaseModel


class TeamCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=1000)


class JoinTeamRequest(BaseModel):
    join_code: str = Field(min_length=4, max_length=16)


class TeamMemberResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    roll_no: str | None
    mentor_id: int | None
    mentor_name: str | None
    is_lead: bool
    joined_at: datetime


class TeamResponse(ORMBaseModel):
    id: int
    name: str
    description: str | None
    join_code: str
    created_by_id: int
    mentor_id: int | None
    mentor_name: str | None
    created_at: datetime
    member_count: int
    project_count: int
    members: list[TeamMemberResponse]
