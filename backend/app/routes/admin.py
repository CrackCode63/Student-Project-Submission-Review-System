from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.admin import MentorAssignmentRequest
from app.schemas.auth import UserResponse
from app.schemas.project import ProjectResponse
from app.schemas.team import TeamResponse
from app.utils.dependencies import require_roles
from app.utils.serializers import serialize_project, serialize_team, serialize_user

router = APIRouter(prefix="/admin", tags=["Admin"])


TEAM_LOAD_OPTIONS = (
    selectinload(Team.assigned_mentor),
    selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.assigned_mentor),
    selectinload(Team.projects).selectinload(Project.assigned_mentor),
)

PROJECT_LOAD_OPTIONS = (
    selectinload(Project.team).selectinload(Team.assigned_mentor),
    selectinload(Project.team).selectinload(Team.members).selectinload(TeamMember.user),
    selectinload(Project.individual_owner).selectinload(User.assigned_mentor),
    selectinload(Project.assigned_mentor),
    selectinload(Project.submissions).selectinload(Submission.submitter),
)


def sync_team_mentor(team: Team) -> None:
    mentor_ids = {
        member.user.mentor_id
        for member in team.members
        if member.user.role == UserRole.STUDENT and member.user.mentor_id is not None
    }
    team.mentor_id = next(iter(mentor_ids)) if len(mentor_ids) == 1 else None
    for project in team.projects:
        project.mentor_id = team.mentor_id


@router.get("/students", response_model=list[UserResponse])
def get_all_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[UserResponse]:
    students = db.execute(
        select(User)
        .where(User.role == UserRole.STUDENT)
        .options(selectinload(User.assigned_mentor))
        .order_by(User.name.asc())
    ).scalars().all()
    return [serialize_user(student) for student in students]


@router.get("/projects", response_model=list[ProjectResponse])
def get_all_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[ProjectResponse]:
    projects = db.execute(select(Project).order_by(Project.created_at.desc()).options(*PROJECT_LOAD_OPTIONS)).scalars().all()
    return [serialize_project(project) for project in projects]


@router.get("/teams", response_model=list[TeamResponse])
def get_all_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[TeamResponse]:
    teams = db.execute(select(Team).order_by(Team.created_at.desc()).options(*TEAM_LOAD_OPTIONS)).scalars().all()
    return [serialize_team(team) for team in teams]


@router.patch("/students/{student_id}/mentor", response_model=UserResponse)
def assign_mentor_to_student(
    student_id: int,
    payload: MentorAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> UserResponse:
    student = db.execute(
        select(User).where(User.id == student_id).options(selectinload(User.assigned_mentor))
    ).scalar_one_or_none()
    if student is None or student.role != UserRole.STUDENT:
        raise HTTPException(status_code=404, detail="Student not found")

    mentor = db.execute(select(User).where(User.id == payload.mentor_id)).scalar_one_or_none()
    if mentor is None or mentor.role != UserRole.MENTOR:
        raise HTTPException(status_code=400, detail="Selected mentor is invalid")

    student.mentor_id = mentor.id
    db.add(student)

    individual_projects = db.execute(select(Project).where(Project.individual_owner_id == student.id)).scalars().all()
    for project in individual_projects:
        project.mentor_id = mentor.id
        db.add(project)

    memberships = db.execute(
        select(TeamMember)
        .where(TeamMember.user_id == student.id)
        .options(
            selectinload(TeamMember.team)
            .selectinload(Team.members)
            .selectinload(TeamMember.user),
            selectinload(TeamMember.team).selectinload(Team.projects),
        )
    ).scalars().all()
    for membership in memberships:
        sync_team_mentor(membership.team)
        db.add(membership.team)

    db.commit()
    updated_student = db.execute(
        select(User).where(User.id == student.id).options(selectinload(User.assigned_mentor))
    ).scalar_one()
    return serialize_user(updated_student)
