from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.enums import UserRole
from app.schemas.common import ORMBaseModel


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: UserRole
    roll_no: str | None = Field(default=None, min_length=2, max_length=40)
    mentor_id: int | None = None

    @model_validator(mode="after")
    def validate_student_fields(self):
        if self.role == UserRole.STUDENT:
            if not self.roll_no:
                raise ValueError("roll_no is required for students")
            if self.mentor_id is None:
                raise ValueError("mentor_id is required for students")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class MentorOptionResponse(ORMBaseModel):
    id: int
    name: str
    email: EmailStr


class UserResponse(ORMBaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    roll_no: str | None
    mentor_id: int | None
    mentor_name: str | None
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
