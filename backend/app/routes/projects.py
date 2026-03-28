from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import ProjectOwnerType, SubmissionStatus, UserRole
from app.models.feedback import Feedback
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.project import (
    ProjectResponse,
    ReviewQueueItem,
    SubmissionDetailResponse,
    SubmissionResponse,
    SubmissionStatusUpdateRequest,
)
from app.utils.access import (
    ensure_student_has_mentor,
    ensure_user_can_access_project,
    get_project_owner_display_name,
    get_project_owner_student_ids,
    get_project_owner_type,
    get_student_team_ids,
    get_team_membership,
)
from app.utils.dependencies import get_current_user, require_roles
from app.utils.file_handler import (
    guess_media_type,
    save_submission_file,
    save_video_file,
    validate_submission_assets,
)
from app.utils.notifications import create_notifications, queue_notification_delivery
from app.utils.serializers import serialize_project, serialize_submission

router = APIRouter(prefix="/projects", tags=["Projects"])


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

SUBMISSION_LOAD_OPTIONS = (
    selectinload(Submission.project).selectinload(Project.team).selectinload(Team.assigned_mentor),
    selectinload(Submission.project)
    .selectinload(Project.team)
    .selectinload(Team.members)
    .selectinload(TeamMember.user)
    .selectinload(User.assigned_mentor),
    selectinload(Submission.project).selectinload(Project.individual_owner).selectinload(User.assigned_mentor),
    selectinload(Submission.project).selectinload(Project.assigned_mentor),
    selectinload(Submission.project)
    .selectinload(Project.submissions)
    .selectinload(Submission.feedback_items)
    .selectinload(Feedback.mentor),
    selectinload(Submission.project).selectinload(Project.submissions).selectinload(Submission.submitter),
    selectinload(Submission.feedback_items).selectinload(Feedback.mentor),
    selectinload(Submission.submitter),
)


def load_project_or_404(db: Session, project_id: int) -> Project:
    project = db.execute(
        select(Project).where(Project.id == project_id).options(*PROJECT_LOAD_OPTIONS)
    ).scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def load_submission_or_404(db: Session, submission_id: int) -> Submission:
    submission = db.execute(
        select(Submission).where(Submission.id == submission_id).options(*SUBMISSION_LOAD_OPTIONS)
    ).scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission


def resolve_owner_mode(owner_mode: str | None, has_team: bool) -> ProjectOwnerType:
    normalized_mode = (owner_mode or "").strip().lower()
    if normalized_mode and normalized_mode not in {ProjectOwnerType.TEAM.value, ProjectOwnerType.INDIVIDUAL.value}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="owner_mode must be team or individual")

    if normalized_mode == ProjectOwnerType.TEAM.value:
        if not has_team:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Join a team before team submission")
        return ProjectOwnerType.TEAM

    if normalized_mode == ProjectOwnerType.INDIVIDUAL.value:
        return ProjectOwnerType.INDIVIDUAL

    return ProjectOwnerType.TEAM if has_team else ProjectOwnerType.INDIVIDUAL


def resolve_project_context(
    db: Session,
    current_user: User,
    owner_mode: str | None,
) -> dict[str, int | str | None]:
    ensure_student_has_mentor(current_user)
    membership = get_team_membership(db, current_user.id)
    resolved_mode = resolve_owner_mode(owner_mode, membership is not None)

    if resolved_mode == ProjectOwnerType.TEAM:
        if membership is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Join a team before team submission")
        team = db.execute(select(Team).where(Team.id == membership.team_id)).scalar_one()
        if team.mentor_id is None:
            team.mentor_id = current_user.mentor_id
            db.add(team)
        return {
            "owner_type": resolved_mode,
            "team_id": team.id,
            "individual_owner_id": None,
            "mentor_id": team.mentor_id or current_user.mentor_id,
            "owner_scope": f"team-{team.id}",
        }

    return {
        "owner_type": resolved_mode,
        "team_id": None,
        "individual_owner_id": current_user.id,
        "mentor_id": current_user.mentor_id,
        "owner_scope": f"student-{current_user.id}",
    }


@router.post("/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_project(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    category: str = Form(...),
    summary: str = Form(...),
    repository_url: str | None = Form(None),
    owner_mode: str | None = Form(None),
    video_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    video_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
) -> SubmissionResponse:
    validate_submission_assets(file, repository_url, video_url, video_file)
    context = resolve_project_context(db, current_user, owner_mode)

    if context["team_id"] is not None:
        existing_project = db.execute(
            select(Project)
            .where(Project.team_id == context["team_id"], Project.title == title)
            .options(*PROJECT_LOAD_OPTIONS)
        ).scalar_one_or_none()
    else:
        existing_project = db.execute(
            select(Project)
            .where(Project.individual_owner_id == current_user.id, Project.title == title)
            .options(*PROJECT_LOAD_OPTIONS)
        ).scalar_one_or_none()

    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project already exists for this owner. Use the resubmit endpoint instead.",
        )

    project = Project(
        team_id=context["team_id"],
        individual_owner_id=context["individual_owner_id"],
        mentor_id=context["mentor_id"],
        created_by_id=current_user.id,
        title=title,
        category=category,
        repository_url=repository_url,
    )
    db.add(project)
    db.flush()

    version_label = "v1"
    owner_scope = str(context["owner_scope"])
    file_path = save_submission_file(file, owner_scope, project.id, version_label)
    video_file_path = save_video_file(video_file, owner_scope, project.id, version_label)
    submission = Submission(
        project_id=project.id,
        submitted_by_id=current_user.id,
        version_number=1,
        version_label=version_label,
        summary=summary,
        repository_url=repository_url,
        file_path=file_path,
        video_url=video_url,
        video_file_path=video_file_path,
        status=SubmissionStatus.PENDING,
    )
    db.add(submission)
    db.flush()

    notifications = []
    if project.mentor_id is not None:
        notifications = create_notifications(
            db,
            [project.mentor_id],
            f"{current_user.name} submitted {project.title} ({submission.version_label}) for review.",
            "submission_created",
        )

    db.commit()
    queue_notification_delivery(background_tasks, notifications)

    return serialize_submission(load_submission_or_404(db, submission.id))


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectResponse]:
    query = select(Project).order_by(Project.created_at.desc()).options(*PROJECT_LOAD_OPTIONS)

    if current_user.role == UserRole.STUDENT:
        team_ids = get_student_team_ids(db, current_user.id)
        filters = [Project.individual_owner_id == current_user.id]
        if team_ids:
            filters.append(Project.team_id.in_(team_ids))
        query = query.where(or_(*filters))
    elif current_user.role == UserRole.MENTOR:
        query = query.where(Project.mentor_id == current_user.id)

    projects = db.execute(query).scalars().all()
    return [serialize_project(project) for project in projects]


@router.get("/review-queue", response_model=list[ReviewQueueItem])
def get_review_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MENTOR)),
) -> list[ReviewQueueItem]:
    projects = db.execute(
        select(Project).where(Project.mentor_id == current_user.id).options(*PROJECT_LOAD_OPTIONS)
    ).scalars().all()
    queue_items: list[ReviewQueueItem] = []

    for project in projects:
        if not project.submissions:
            continue
        latest_submission = max(project.submissions, key=lambda item: item.version_number)
        owner_display_name = get_project_owner_display_name(project)
        queue_items.append(
            ReviewQueueItem(
                submission_id=latest_submission.id,
                project_id=project.id,
                project_title=project.title,
                owner_type=get_project_owner_type(project),
                owner_display_name=owner_display_name,
                team_id=project.team_id,
                team_name=project.team.name if project.team else owner_display_name,
                individual_owner_id=project.individual_owner_id,
                individual_owner_name=project.individual_owner.name if project.individual_owner else None,
                mentor_id=project.mentor_id,
                mentor_name=project.assigned_mentor.name if project.assigned_mentor else None,
                version_label=latest_submission.version_label,
                submitted_at=latest_submission.submitted_at,
                status=latest_submission.status,
                repository_url=latest_submission.repository_url,
                file_path=latest_submission.file_path,
                video_url=latest_submission.video_url,
                video_file_path=latest_submission.video_file_path,
            )
        )

    return sorted(queue_items, key=lambda item: item.submitted_at, reverse=True)


@router.get("/{project_id}/submissions", response_model=SubmissionDetailResponse)
def get_project_submissions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubmissionDetailResponse:
    project = load_project_or_404(db, project_id)
    ensure_user_can_access_project(db, current_user, project)

    submissions = sorted(project.submissions, key=lambda item: item.version_number, reverse=True)
    return SubmissionDetailResponse(
        project=serialize_project(project),
        submissions=[serialize_submission(submission) for submission in submissions],
    )


@router.post("/{project_id}/resubmit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def resubmit_project(
    project_id: int,
    background_tasks: BackgroundTasks,
    summary: str = Form(...),
    repository_url: str | None = Form(None),
    video_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    video_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
) -> SubmissionResponse:
    validate_submission_assets(file, repository_url, video_url, video_file)
    project = load_project_or_404(db, project_id)
    ensure_user_can_access_project(db, current_user, project)

    next_version_number = max((submission.version_number for submission in project.submissions), default=0) + 1
    version_label = f"v{next_version_number}"
    owner_scope = f"team-{project.team_id}" if project.team_id is not None else f"student-{project.individual_owner_id}"
    file_path = save_submission_file(file, owner_scope, project.id, version_label)
    video_file_path = save_video_file(video_file, owner_scope, project.id, version_label)

    project.repository_url = repository_url or project.repository_url
    submission = Submission(
        project_id=project.id,
        submitted_by_id=current_user.id,
        version_number=next_version_number,
        version_label=version_label,
        summary=summary,
        repository_url=repository_url or project.repository_url,
        file_path=file_path,
        video_url=video_url,
        video_file_path=video_file_path,
        status=SubmissionStatus.PENDING,
    )
    db.add(submission)
    db.flush()

    notifications = []
    if project.mentor_id is not None:
        notifications = create_notifications(
            db,
            [project.mentor_id],
            f"{current_user.name} submitted a new version of {project.title} ({submission.version_label}).",
            "submission_resubmitted",
        )

    db.commit()
    queue_notification_delivery(background_tasks, notifications)

    return serialize_submission(load_submission_or_404(db, submission.id))


@router.patch("/submissions/{submission_id}/status", response_model=SubmissionResponse)
def update_submission_status(
    submission_id: int,
    payload: SubmissionStatusUpdateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MENTOR)),
) -> SubmissionResponse:
    submission = load_submission_or_404(db, submission_id)
    if submission.project.mentor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this project")

    submission.status = payload.status
    db.add(submission)

    owner_student_ids = get_project_owner_student_ids(submission.project)
    notifications = create_notifications(
        db,
        owner_student_ids,
        f"{current_user.name} updated {submission.project.title} to {payload.status.value}.",
        "submission_reviewed",
    )

    db.commit()
    queue_notification_delivery(background_tasks, notifications)

    return serialize_submission(load_submission_or_404(db, submission_id))


@router.get("/submissions/{submission_id}/video")
def stream_submission_video(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    submission = load_submission_or_404(db, submission_id)
    ensure_user_can_access_project(db, current_user, submission.project)

    if not submission.video_file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No uploaded video found for this submission")

    video_path = Path(submission.video_file_path)
    if not video_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file is missing")

    return FileResponse(video_path, media_type=guess_media_type(submission.video_file_path), filename=video_path.name)
