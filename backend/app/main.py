from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.init_db import create_tables
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.feedback import router as feedback_router
from app.routes.mentor import router as mentor_router
from app.routes.marks import router as marks_router
from app.routes.notifications import router as notifications_router
from app.routes.projects import router as projects_router
from app.routes.teams import router as teams_router
from app.utils.file_handler import ensure_upload_directory
from app.utils.settings import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_upload_directory()
    create_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Student Project Submission & Review System API is running",
        "environment": settings.app_env,
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(projects_router)
app.include_router(feedback_router)
app.include_router(marks_router)
app.include_router(mentor_router)
app.include_router(admin_router)
app.include_router(notifications_router)
