from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, MentorOptionResponse, RegisterRequest, UserResponse
from app.utils.dependencies import get_current_user
from app.utils.security import create_access_token, get_password_hash, verify_password
from app.utils.serializers import serialize_mentor_option, serialize_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/mentors", response_model=list[MentorOptionResponse])
def list_mentors(db: Session = Depends(get_db)) -> list[MentorOptionResponse]:
    mentors = db.execute(select(User).where(User.role == UserRole.MENTOR).order_by(User.name.asc())).scalars().all()
    return [serialize_mentor_option(mentor) for mentor in mentors]


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    mentor: User | None = None
    if payload.role == UserRole.STUDENT:
        existing_roll_no = db.execute(select(User).where(User.roll_no == payload.roll_no)).scalar_one_or_none()
        if existing_roll_no:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number is already registered")

        mentor = db.execute(select(User).where(User.id == payload.mentor_id)).scalar_one_or_none()
        if mentor is None or mentor.role != UserRole.MENTOR:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected mentor is invalid")

    user = User(
        name=payload.name,
        email=payload.email,
        roll_no=payload.roll_no if payload.role == UserRole.STUDENT else None,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        mentor_id=mentor.id if mentor else None,
    )
    db.add(user)
    db.commit()

    created_user = db.execute(
        select(User).where(User.id == user.id).options(selectinload(User.assigned_mentor))
    ).scalar_one()

    token = create_access_token({"sub": str(created_user.id), "role": created_user.role.value})
    return AuthResponse(access_token=token, user=serialize_user(created_user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.execute(
        select(User).where(User.email == payload.email).options(selectinload(User.assigned_mentor))
    ).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return AuthResponse(access_token=token, user=serialize_user(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return serialize_user(current_user)
