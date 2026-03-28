import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.project import Project
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.team import JoinTeamRequest, TeamCreateRequest, TeamResponse
from app.utils.access import ensure_student_has_mentor
from app.utils.dependencies import get_current_user, require_roles
from app.utils.serializers import serialize_team

router = APIRouter(prefix="/teams", tags=["Teams"])


TEAM_LOAD_OPTIONS = (
    selectinload(Team.assigned_mentor),
    selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.assigned_mentor),
    selectinload(Team.projects).selectinload(Project.assigned_mentor),
)


def generate_join_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def get_existing_membership(db: Session, user_id: int) -> TeamMember | None:
    query = (
        select(TeamMember)
        .where(TeamMember.user_id == user_id)
        .options(
            selectinload(TeamMember.team)
            .selectinload(Team.members)
            .selectinload(TeamMember.user)
            .selectinload(User.assigned_mentor),
            selectinload(TeamMember.team).selectinload(Team.projects).selectinload(Project.assigned_mentor),
            selectinload(TeamMember.team).selectinload(Team.assigned_mentor),
        )
    )
    return db.execute(query).scalar_one_or_none()


def sync_team_mentor(team: Team) -> None:
    mentor_ids = {
        member.user.mentor_id
        for member in team.members
        if member.user.role == UserRole.STUDENT and member.user.mentor_id is not None
    }
    if len(mentor_ids) == 1:
        team.mentor_id = next(iter(mentor_ids))
        for project in team.projects:
            project.mentor_id = team.mentor_id
    elif not mentor_ids:
        team.mentor_id = None


def get_team_by_id(db: Session, team_id: int) -> Team:
    query = select(Team).where(Team.id == team_id).options(*TEAM_LOAD_OPTIONS)
    team = db.execute(query).scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
) -> TeamResponse:
    ensure_student_has_mentor(current_user)
    membership = get_existing_membership(db, current_user.id)
    if membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already part of a team",
        )

    existing_team = db.execute(select(Team).where(Team.name == payload.name)).scalar_one_or_none()
    if existing_team:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name is already taken")

    join_code = generate_join_code()
    while db.execute(select(Team).where(Team.join_code == join_code)).scalar_one_or_none():
        join_code = generate_join_code()

    team = Team(
        name=payload.name,
        description=payload.description,
        join_code=join_code,
        created_by_id=current_user.id,
        mentor_id=current_user.mentor_id,
    )
    db.add(team)
    db.flush()

    member = TeamMember(team_id=team.id, user_id=current_user.id, is_lead=True)
    db.add(member)
    db.commit()

    return serialize_team(get_team_by_id(db, team.id))


@router.post("/join", response_model=TeamResponse)
def join_team(
    payload: JoinTeamRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
) -> TeamResponse:
    ensure_student_has_mentor(current_user)
    membership = get_existing_membership(db, current_user.id)
    if membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already part of a team",
        )

    team = db.execute(
        select(Team)
        .where(Team.join_code == payload.join_code.upper())
        .options(*TEAM_LOAD_OPTIONS)
    ).scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid team code")

    if team.mentor_id is not None and team.mentor_id != current_user.mentor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only join teams assigned to your mentor",
        )

    member = TeamMember(team_id=team.id, user_id=current_user.id, is_lead=False)
    db.add(member)
    db.flush()

    reloaded_team = get_team_by_id(db, team.id)
    sync_team_mentor(reloaded_team)
    db.add(reloaded_team)
    db.commit()

    return serialize_team(get_team_by_id(db, team.id))


@router.get("", response_model=list[TeamResponse])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TeamResponse]:
    query = select(Team).order_by(Team.created_at.desc()).options(*TEAM_LOAD_OPTIONS)

    if current_user.role == UserRole.ADMIN:
        teams = db.execute(query).scalars().all()
        return [serialize_team(team) for team in teams]

    if current_user.role == UserRole.MENTOR:
        teams = db.execute(query.where(Team.mentor_id == current_user.id)).scalars().all()
        return [serialize_team(team) for team in teams]

    membership = get_existing_membership(db, current_user.id)
    if membership is None:
        return []
    return [serialize_team(get_team_by_id(db, membership.team_id))]
