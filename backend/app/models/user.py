from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import UserRole, enum_values


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    roll_no: Mapped[str] = mapped_column(String(40), unique=True, nullable=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=enum_values),
        nullable=False,
        index=True,
    )
    mentor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    assigned_mentor = relationship(
        "User",
        remote_side=[id],
        back_populates="assigned_students",
        foreign_keys=[mentor_id],
    )
    assigned_students = relationship(
        "User",
        back_populates="assigned_mentor",
        foreign_keys=[mentor_id],
    )
    created_teams = relationship("Team", back_populates="creator", foreign_keys="Team.created_by_id")
    mentored_teams = relationship("Team", back_populates="assigned_mentor", foreign_keys="Team.mentor_id")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    created_projects = relationship("Project", back_populates="creator", foreign_keys="Project.created_by_id")
    owned_projects = relationship(
        "Project",
        back_populates="individual_owner",
        foreign_keys="Project.individual_owner_id",
    )
    mentored_projects = relationship(
        "Project",
        back_populates="assigned_mentor",
        foreign_keys="Project.mentor_id",
    )
    submissions = relationship("Submission", back_populates="submitter")
    authored_feedback = relationship("Feedback", back_populates="mentor")
    assigned_marks = relationship("Mark", back_populates="mentor")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
