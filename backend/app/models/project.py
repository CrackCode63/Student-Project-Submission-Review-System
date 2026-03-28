from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.enums import SubmissionStatus, enum_values


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=True, index=True)
    individual_owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    mentor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    repository_url: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    team = relationship("Team", back_populates="projects")
    individual_owner = relationship("User", back_populates="owned_projects", foreign_keys=[individual_owner_id])
    assigned_mentor = relationship("User", back_populates="mentored_projects", foreign_keys=[mentor_id])
    creator = relationship("User", back_populates="created_projects", foreign_keys=[created_by_id])
    submissions = relationship("Submission", back_populates="project", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="project", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False, index=True)
    submitted_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    version_label: Mapped[str] = mapped_column(String(24), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    repository_url: Mapped[str] = mapped_column(String(500), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str] = mapped_column(String(500), nullable=True)
    video_file_path: Mapped[str] = mapped_column(String(500), nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, values_callable=enum_values),
        nullable=False,
        default=SubmissionStatus.PENDING,
        server_default=SubmissionStatus.PENDING.value,
    )
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    project = relationship("Project", back_populates="submissions")
    submitter = relationship("User", back_populates="submissions")
    feedback_items = relationship("Feedback", back_populates="submission", cascade="all, delete-orphan")
