from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.mark import Mark
from app.models.project import Project
from app.models.team import Team
from app.models.user import User
from app.schemas.mark import MarkAssignRequest, MarkResponse
from app.utils.access import get_project_owner_student_ids, get_student_team_ids
from app.utils.dependencies import get_current_user, require_roles
from app.utils.notifications import create_notifications, queue_notification_delivery
from app.utils.serializers import serialize_mark

router = APIRouter(prefix="/marks", tags=["Marks"])


MARK_LOAD_OPTIONS = (
    selectinload(Mark.project),
    selectinload(Mark.mentor),
)


@router.post("", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
def assign_marks(
    payload: MarkAssignRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MENTOR)),
) -> MarkResponse:
    project = db.execute(
        select(Project)
        .where(Project.id == payload.project_id)
        .options(selectinload(Project.team).selectinload(Team.members))
    ).scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.mentor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this project")

    total = payload.innovation + payload.execution + payload.presentation
    existing_mark = db.execute(
        select(Mark).where(Mark.project_id == payload.project_id, Mark.mentor_id == current_user.id)
    ).scalar_one_or_none()

    if existing_mark:
        existing_mark.innovation = payload.innovation
        existing_mark.execution = payload.execution
        existing_mark.presentation = payload.presentation
        existing_mark.total = total
        existing_mark.remarks = payload.remarks
        db.add(existing_mark)
        created_or_updated_mark = existing_mark
    else:
        created_or_updated_mark = Mark(
            project_id=payload.project_id,
            mentor_id=current_user.id,
            innovation=payload.innovation,
            execution=payload.execution,
            presentation=payload.presentation,
            total=total,
            remarks=payload.remarks,
        )
        db.add(created_or_updated_mark)

    db.flush()
    notifications = create_notifications(
        db,
        get_project_owner_student_ids(project),
        f"{current_user.name} published marks for {project.title}.",
        "marks_assigned",
    )

    db.commit()
    queue_notification_delivery(background_tasks, notifications)

    created_mark = db.execute(
        select(Mark).where(Mark.id == created_or_updated_mark.id).options(*MARK_LOAD_OPTIONS)
    ).scalar_one()
    return serialize_mark(created_mark)


@router.get("", response_model=list[MarkResponse])
def list_marks(
    project_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MarkResponse]:
    query = select(Mark).join(Mark.project).options(*MARK_LOAD_OPTIONS).order_by(Mark.updated_at.desc())

    if project_id is not None:
        query = query.where(Mark.project_id == project_id)

    if current_user.role == UserRole.STUDENT:
        team_ids = get_student_team_ids(db, current_user.id)
        filters = [Project.individual_owner_id == current_user.id]
        if team_ids:
            filters.append(Project.team_id.in_(team_ids))
        query = query.where(or_(*filters))
    elif current_user.role == UserRole.MENTOR:
        query = query.where(Project.mentor_id == current_user.id)

    marks = db.execute(query).scalars().all()
    return [serialize_mark(mark) for mark in marks]
