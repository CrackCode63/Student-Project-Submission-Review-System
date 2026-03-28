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

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            normalized = value.strip().replace("-", " ").replace("_", " ").lower()
            aliases = {
                "pending": cls.PENDING,
                "approved": cls.APPROVED,
                "changes required": cls.CHANGES_REQUIRED,
                "changesrequested": cls.CHANGES_REQUIRED,
            }
            if normalized in aliases:
                return aliases[normalized]
        return None


class ProjectOwnerType(str, Enum):
    TEAM = "team"
    INDIVIDUAL = "individual"
