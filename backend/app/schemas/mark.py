from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.schemas.common import ORMBaseModel


class MarkAssignRequest(BaseModel):
    project_id: int
    innovation: int = Field(ge=0, le=30)
    execution: int = Field(ge=0, le=30)
    presentation: int = Field(ge=0, le=20)
    remarks: str | None = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def validate_total(self):
        total = self.innovation + self.execution + self.presentation
        if total > 80:
            raise ValueError("Total marks cannot exceed 80")
        return self


class MarkResponse(ORMBaseModel):
    id: int
    project_id: int
    project_title: str
    mentor_id: int
    mentor_name: str
    innovation: int
    execution: int
    presentation: int
    total: int
    remarks: str | None
    created_at: datetime
    updated_at: datetime
