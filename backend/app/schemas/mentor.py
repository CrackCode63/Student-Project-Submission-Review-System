from pydantic import Field

from app.schemas.auth import UserResponse
from app.schemas.project import SubmissionDetailResponse
from app.schemas.team import TeamResponse


class MentorStudentAnalysisResponse(UserResponse):
    team: TeamResponse | None = None
    projects: list[SubmissionDetailResponse] = Field(default_factory=list)
