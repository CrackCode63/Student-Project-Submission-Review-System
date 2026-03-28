from enum import Enum


def enum_values(enum_cls: type[Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class UserRole(str, Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    ADMIN = "admin"


class SubmissionStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    CHANGES_REQUIRED = "Changes Required"


class ProjectOwnerType(str, Enum):
    TEAM = "team"
    INDIVIDUAL = "individual"
