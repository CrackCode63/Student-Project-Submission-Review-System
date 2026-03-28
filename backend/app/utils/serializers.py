from app.models.feedback import Feedback
from app.models.mark import Mark
from app.models.notification import Notification
from app.models.project import Project, Submission
from app.models.team import Team, TeamMember
from app.models.user import User
from app.schemas.auth import MentorOptionResponse, UserResponse
from app.schemas.feedback import FeedbackResponse
from app.schemas.mark import MarkResponse
from app.schemas.notification import NotificationResponse
from app.schemas.project import ProjectResponse, SubmissionResponse
from app.schemas.team import TeamMemberResponse, TeamResponse
from app.utils.access import get_project_owner_display_name, get_project_owner_type


def serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        roll_no=user.roll_no,
        mentor_id=user.mentor_id,
        mentor_name=user.assigned_mentor.name if user.assigned_mentor else None,
        created_at=user.created_at,
    )


def serialize_mentor_option(user: User) -> MentorOptionResponse:
    return MentorOptionResponse(id=user.id, name=user.name, email=user.email)


def serialize_feedback(feedback: Feedback) -> FeedbackResponse:
    return FeedbackResponse(
        id=feedback.id,
        submission_id=feedback.submission_id,
        project_id=feedback.submission.project_id,
        project_title=feedback.submission.project.title,
        version_label=feedback.submission.version_label,
        mentor_id=feedback.mentor_id,
        mentor_name=feedback.mentor.name,
        comment=feedback.comment,
        created_at=feedback.created_at,
    )


def serialize_submission(submission: Submission) -> SubmissionResponse:
    feedback_items = sorted(submission.feedback_items, key=lambda item: item.created_at, reverse=True)
    project = submission.project
    owner_display_name = get_project_owner_display_name(project)

    return SubmissionResponse(
        id=submission.id,
        project_id=submission.project_id,
        project_title=project.title,
        owner_type=get_project_owner_type(project),
        owner_display_name=owner_display_name,
        team_id=project.team_id,
        team_name=project.team.name if project.team else owner_display_name,
        individual_owner_id=project.individual_owner_id,
        individual_owner_name=project.individual_owner.name if project.individual_owner else None,
        mentor_id=project.mentor_id,
        mentor_name=project.assigned_mentor.name if project.assigned_mentor else None,
        submitted_by_id=submission.submitted_by_id,
        submitted_by_name=submission.submitter.name,
        version_number=submission.version_number,
        version_label=submission.version_label,
        summary=submission.summary,
        repository_url=submission.repository_url,
        file_path=submission.file_path,
        video_url=submission.video_url,
        video_file_path=submission.video_file_path,
        status=submission.status,
        submitted_at=submission.submitted_at,
        updated_at=submission.updated_at,
        feedback=[serialize_feedback(item) for item in feedback_items],
    )


def serialize_project(project: Project) -> ProjectResponse:
    ordered_submissions = sorted(project.submissions, key=lambda item: item.version_number, reverse=True)
    latest_submission = serialize_submission(ordered_submissions[0]) if ordered_submissions else None
    owner_display_name = get_project_owner_display_name(project)

    return ProjectResponse(
        id=project.id,
        title=project.title,
        category=project.category,
        repository_url=project.repository_url,
        owner_type=get_project_owner_type(project),
        owner_display_name=owner_display_name,
        team_id=project.team_id,
        team_name=project.team.name if project.team else owner_display_name,
        individual_owner_id=project.individual_owner_id,
        individual_owner_name=project.individual_owner.name if project.individual_owner else None,
        mentor_id=project.mentor_id,
        mentor_name=project.assigned_mentor.name if project.assigned_mentor else None,
        created_by_id=project.created_by_id,
        created_at=project.created_at,
        latest_submission=latest_submission,
        total_submissions=len(project.submissions),
    )


def serialize_team_member(member: TeamMember) -> TeamMemberResponse:
    return TeamMemberResponse(
        user_id=member.user_id,
        name=member.user.name,
        email=member.user.email,
        role=member.user.role.value,
        roll_no=member.user.roll_no,
        mentor_id=member.user.mentor_id,
        mentor_name=member.user.assigned_mentor.name if member.user.assigned_mentor else None,
        is_lead=member.is_lead,
        joined_at=member.joined_at,
    )


def serialize_team(team: Team) -> TeamResponse:
    ordered_members = sorted(team.members, key=lambda item: (not item.is_lead, item.joined_at))
    return TeamResponse(
        id=team.id,
        name=team.name,
        description=team.description,
        join_code=team.join_code,
        created_by_id=team.created_by_id,
        mentor_id=team.mentor_id,
        mentor_name=team.assigned_mentor.name if team.assigned_mentor else None,
        created_at=team.created_at,
        member_count=len(team.members),
        project_count=len(team.projects),
        members=[serialize_team_member(member) for member in ordered_members],
    )


def serialize_mark(mark: Mark) -> MarkResponse:
    return MarkResponse(
        id=mark.id,
        project_id=mark.project_id,
        project_title=mark.project.title,
        mentor_id=mark.mentor_id,
        mentor_name=mark.mentor.name,
        innovation=mark.innovation,
        execution=mark.execution,
        presentation=mark.presentation,
        total=mark.total,
        remarks=mark.remarks,
        created_at=mark.created_at,
        updated_at=mark.updated_at,
    )


def serialize_notification(notification: Notification) -> NotificationResponse:
    return NotificationResponse.model_validate(notification)
