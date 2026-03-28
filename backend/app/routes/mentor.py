from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.feedback import Feedback
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.mentor import MentorStudentAnalysisResponse
from app.schemas.project import SubmissionDetailResponse
from app.utils.dependencies import require_roles
from app.utils.serializers import serialize_project, serialize_submission, serialize_team, serialize_user

router = APIRouter(prefix="/mentor", tags=["Mentor"])


TEAM_LOAD_OPTIONS = (
    selectinload(Team.assigned_mentor),
    selectinload(Team.members).selectinload(TeamMember.user).selectinload(User.assigned_mentor),
    selectinload(Team.projects).selectinload(Project.assigned_mentor),
)

PROJECT_LOAD_OPTIONS = (
    selectinload(Project.team).selectinload(Team.assigned_mentor),
    selectinload(Project.team)
    .selectinload(Team.members)
    .selectinload(TeamMember.user)
    .selectinload(User.assigned_mentor),
    selectinload(Project.individual_owner).selectinload(User.assigned_mentor),
    selectinload(Project.assigned_mentor),
    selectinload(Project.submissions)
    .selectinload(Submission.feedback_items)
    .selectinload(Feedback.mentor),
    selectinload(Project.submissions).selectinload(Submission.submitter),
)


@router.get("/students", response_model=list[MentorStudentAnalysisResponse])
def get_assigned_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MENTOR)),
) -> list[MentorStudentAnalysisResponse]:
    students = db.execute(
        select(User)
        .where(User.role == UserRole.STUDENT, User.mentor_id == current_user.id)
        .options(
            selectinload(User.assigned_mentor),
            selectinload(User.team_memberships)
            .selectinload(TeamMember.team)
            .selectinload(Team.assigned_mentor),
            selectinload(User.team_memberships)
            .selectinload(TeamMember.team)
            .selectinload(Team.members)
            .selectinload(TeamMember.user)
            .selectinload(User.assigned_mentor),
            selectinload(User.team_memberships).selectinload(TeamMember.team).selectinload(Team.projects),
        )
        .order_by(User.name.asc())
    ).scalars().all()

    analysis: list[MentorStudentAnalysisResponse] = []
    for student in students:
        team = student.team_memberships[0].team if student.team_memberships else None
        team_ids = [membership.team_id for membership in student.team_memberships]
        project_filters = [Project.individual_owner_id == student.id]
        if team_ids:
            project_filters.append(Project.team_id.in_(team_ids))
        projects = db.execute(
            select(Project)
            .where(or_(*project_filters))
            .order_by(Project.created_at.desc())
            .options(*PROJECT_LOAD_OPTIONS)
        ).scalars().all()

        analysis.append(
            MentorStudentAnalysisResponse(
                **serialize_user(student).model_dump(),
                team=serialize_team(team) if team else None,
                projects=[
                    SubmissionDetailResponse(
                        project=serialize_project(project),
                        submissions=[serialize_submission(submission) for submission in sorted(project.submissions, key=lambda item: item.version_number, reverse=True)],
                    )
                    for project in projects
                ],
            )
        )

    return analysis
