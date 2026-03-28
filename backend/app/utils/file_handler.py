import mimetypes
import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.utils.settings import settings


ALLOWED_UPLOAD_SUFFIXES = {".zip"}
ALLOWED_VIDEO_SUFFIXES = {".mp4", ".mov", ".avi", ".webm", ".mkv"}


def ensure_upload_directory() -> Path:
    upload_root = settings.resolved_upload_dir
    (upload_root / "submissions").mkdir(parents=True, exist_ok=True)
    (upload_root / "videos").mkdir(parents=True, exist_ok=True)
    return upload_root


def validate_zip_file(upload_file: UploadFile | None) -> None:
    if upload_file is None:
        return

    suffix = Path(upload_file.filename or "").suffix.lower()
    if suffix not in ALLOWED_UPLOAD_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only ZIP files are supported",
        )


def validate_video_file(upload_file: UploadFile | None) -> None:
    if upload_file is None:
        return

    suffix = Path(upload_file.filename or "").suffix.lower()
    if suffix not in ALLOWED_VIDEO_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported video format",
        )


def validate_submission_assets(
    upload_file: UploadFile | None,
    repository_url: str | None,
    video_url: str | None,
    video_file: UploadFile | None,
) -> None:
    validate_zip_file(upload_file)
    validate_video_file(video_file)

    if not any([upload_file is not None, repository_url, video_url, video_file is not None]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one of zip file, repository_url, video_url, or video_file",
        )


def _build_target_dir(category: str, owner_scope: str, project_id: int, version_label: str) -> Path:
    upload_root = ensure_upload_directory() / category
    target_dir = upload_root / owner_scope / f"project-{project_id}" / version_label.lower()
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir


def _save_upload(upload_file: UploadFile, target_dir: Path, fallback_name: str) -> str:
    safe_name = f"{uuid.uuid4().hex}-{Path(upload_file.filename or fallback_name).name}"
    target_path = target_dir / safe_name

    with target_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return str(target_path.as_posix())


def save_submission_file(
    upload_file: UploadFile | None,
    owner_scope: str,
    project_id: int,
    version_label: str,
) -> str | None:
    if upload_file is None:
        return None
    validate_zip_file(upload_file)
    target_dir = _build_target_dir("submissions", owner_scope, project_id, version_label)
    return _save_upload(upload_file, target_dir, "submission.zip")


def save_video_file(
    upload_file: UploadFile | None,
    owner_scope: str,
    project_id: int,
    version_label: str,
) -> str | None:
    if upload_file is None:
        return None
    validate_video_file(upload_file)
    target_dir = _build_target_dir("videos", owner_scope, project_id, version_label)
    return _save_upload(upload_file, target_dir, "submission-video.mp4")


def guess_media_type(file_path: str | None) -> str:
    if not file_path:
        return "application/octet-stream"
    return mimetypes.guess_type(file_path)[0] or "application/octet-stream"
