from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ProjectOwnerType, UserRole
from app.models.project import Project
from app.models.team import TeamMember
from app.models.user import User


def get_student_team_ids(db: Session, user_id: int) -> list[int]:
    memberships = db.execute(select(TeamMember.team_id).where(TeamMember.user_id == user_id)).all()
    return [team_id for team_id, in memberships]


def get_team_membership(db: Session, user_id: int) -> TeamMember | None:
    return db.execute(select(TeamMember).where(TeamMember.user_id == user_id)).scalar_one_or_none()


def get_project_owner_type(project: Project) -> ProjectOwnerType:
    if project.team_id is not None:
        return ProjectOwnerType.TEAM
    return ProjectOwnerType.INDIVIDUAL


def get_project_owner_display_name(project: Project) -> str:
    if project.team is not None:
        return project.team.name
    if project.individual_owner is not None:
        return project.individual_owner.name
    return "Unassigned"


def get_project_owner_student_ids(project: Project) -> list[int]:
    if project.team is not None:
        return [member.user_id for member in project.team.members]
    if project.individual_owner_id is not None:
        return [project.individual_owner_id]
    return []


def student_can_access_project(db: Session, current_user: User, project: Project) -> bool:
    if project.individual_owner_id == current_user.id:
        return True
    if project.team_id is None:
        return False
    team_ids = get_student_team_ids(db, current_user.id)
    return project.team_id in team_ids


def mentor_can_access_project(current_user: User, project: Project) -> bool:
    return project.mentor_id == current_user.id


def user_can_access_project(db: Session, current_user: User, project: Project) -> bool:
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.role == UserRole.MENTOR:
        return mentor_can_access_project(current_user, project)
    return student_can_access_project(db, current_user, project)


def ensure_user_can_access_project(db: Session, current_user: User, project: Project) -> None:
    if not user_can_access_project(db, current_user, project):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project")


def ensure_student_has_mentor(current_user: User) -> None:
    if current_user.role == UserRole.STUDENT and current_user.mentor_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student must be assigned to a mentor before continuing",
        )
