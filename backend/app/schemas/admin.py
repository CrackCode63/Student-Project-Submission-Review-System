from pydantic import BaseModel


class MentorAssignmentRequest(BaseModel):
    mentor_id: int
