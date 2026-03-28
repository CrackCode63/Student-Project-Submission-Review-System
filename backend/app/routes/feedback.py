from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.feedback import Feedback
from app.models.project import Project, Submission
from app.models.team import Team
from app.models.user import User
from app.schemas.feedback import FeedbackCreateRequest, FeedbackResponse
from app.utils.access import get_project_owner_student_ids, get_student_team_ids
from app.utils.dependencies import get_current_user, require_roles
from app.utils.notifications import create_notifications, queue_notification_delivery
from app.utils.serializers import serialize_feedback

router = APIRouter(prefix="/feedback", tags=["Feedback"])


FEEDBACK_LOAD_OPTIONS = (
    selectinload(Feedback.mentor),
    selectinload(Feedback.submission).selectinload(Submission.project),
)


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def add_feedback(
    payload: FeedbackCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MENTOR)),
) -> FeedbackResponse:
    submission = db.execute(
        select(Submission)
        .where(Submission.id == payload.submission_id)
        .options(selectinload(Submission.project).selectinload(Project.team).selectinload(Team.members))
    ).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    if submission.project.mentor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this project")

    feedback = Feedback(
        submission_id=submission.id,
        mentor_id=current_user.id,
        comment=payload.comment,
    )
    db.add(feedback)
    db.flush()

    notifications = create_notifications(
        db,
        get_project_owner_student_ids(submission.project),
        f"{current_user.name} added feedback on {submission.project.title} ({submission.version_label}).",
        "feedback_added",
    )

    db.commit()
    queue_notification_delivery(background_tasks, notifications)

    created_feedback = db.execute(
        select(Feedback).where(Feedback.id == feedback.id).options(*FEEDBACK_LOAD_OPTIONS)
    ).scalar_one()
    return serialize_feedback(created_feedback)


@router.get("", response_model=list[FeedbackResponse])
def list_feedback(
    submission_id: int | None = Query(default=None),
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FeedbackResponse]:
    query = (
        select(Feedback)
        .join(Feedback.submission)
        .join(Submission.project)
        .options(*FEEDBACK_LOAD_OPTIONS)
        .order_by(Feedback.created_at.desc())
    )

    if submission_id is not None:
        query = query.where(Feedback.submission_id == submission_id)
    if project_id is not None:
        query = query.where(Project.id == project_id)

    if current_user.role == UserRole.STUDENT:
        team_ids = get_student_team_ids(db, current_user.id)
        filters = [Project.individual_owner_id == current_user.id]
        if team_ids:
            filters.append(Project.team_id.in_(team_ids))
        query = query.where(or_(*filters))
    elif current_user.role == UserRole.MENTOR:
        query = query.where(Project.mentor_id == current_user.id)

    feedback_items = db.execute(query).scalars().all()
    return [serialize_feedback(item) for item in feedback_items]
