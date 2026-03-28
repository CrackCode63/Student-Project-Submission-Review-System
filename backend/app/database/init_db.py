from sqlalchemy import inspect, text

from app.database.session import Base, engine
from app.models import Feedback, Mark, Notification, Project, Submission, Team, TeamMember, User


SQLITE_PATCHES = {
    "users": {
        "roll_no": "VARCHAR(40)",
        "mentor_id": "INTEGER",
    },
    "teams": {
        "mentor_id": "INTEGER",
    },
    "projects": {
        "individual_owner_id": "INTEGER",
        "mentor_id": "INTEGER",
    },
    "submissions": {
        "video_url": "VARCHAR(500)",
        "video_file_path": "VARCHAR(500)",
    },
}

MYSQL_PATCHES = {
    "users": {
        "roll_no": "VARCHAR(40) NULL",
        "mentor_id": "INT NULL",
    },
    "teams": {
        "mentor_id": "INT NULL",
    },
    "projects": {
        "individual_owner_id": "INT NULL",
        "mentor_id": "INT NULL",
    },
    "submissions": {
        "video_url": "VARCHAR(500) NULL",
        "video_file_path": "VARCHAR(500) NULL",
    },
}


def _apply_column_patches() -> None:
    with engine.begin() as connection:
        dialect = connection.dialect.name
        inspector = inspect(connection)
        patches = MYSQL_PATCHES if dialect == "mysql" else SQLITE_PATCHES

        for table_name, columns in patches.items():
            if not inspector.has_table(table_name):
                continue
            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
            for column_name, definition in columns.items():
                if column_name not in existing_columns:
                    connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"))

        if dialect == "mysql" and inspector.has_table("users"):
            connection.execute(
                text("ALTER TABLE users MODIFY COLUMN role ENUM('student','mentor','admin') NOT NULL")
            )
        if dialect == "mysql" and inspector.has_table("projects"):
            connection.execute(text("ALTER TABLE projects MODIFY COLUMN team_id INT NULL"))

        if inspector.has_table("submissions"):
            # Normalize legacy uppercase status values from older schema/data.
            connection.execute(
                text(
                    "UPDATE submissions SET status = 'Pending' WHERE UPPER(status) = 'PENDING'"
                )
            )
            connection.execute(
                text(
                    "UPDATE submissions SET status = 'Approved' WHERE UPPER(status) = 'APPROVED'"
                )
            )
            connection.execute(
                text(
                    "UPDATE submissions "
                    "SET status = 'Changes Required' "
                    "WHERE REPLACE(UPPER(status), ' ', '_') IN ('CHANGES_REQUIRED', 'CHANGES_REQUESTED')"
                )
            )

        if dialect == "mysql" and inspector.has_table("submissions"):
            connection.execute(
                text(
                    "ALTER TABLE submissions MODIFY COLUMN status "
                    "ENUM('Pending','Approved','Changes Required') "
                    "NOT NULL DEFAULT 'Pending'"
                )
            )


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    _apply_column_patches()
