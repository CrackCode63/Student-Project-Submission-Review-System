# Student Project Submission & Review System Backend

A FastAPI backend for a student project submission and mentor review workflow.

## Structure

```text
backend/
  app/
    main.py
    database/
    models/
    routes/
    schemas/
    utils/
  uploads/
  requirements.txt
  .env.example
```

## Features

- FastAPI + modular routers
- MySQL-ready SQLAlchemy setup
- JWT authentication with role-based protection
- Team creation and join-code flow
- Project submissions with versioning
- Mentor feedback and marks APIs
- ZIP upload handling with local storage
- CORS enabled for `http://localhost:5173`

## Setup

1. Create a MySQL database.
2. Copy `.env.example` to `.env` inside `backend/` and update credentials.
3. Create and activate a virtual environment.
4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Run the API from the `backend/` directory:

```bash
uvicorn app.main:app --reload
```

## Swagger Docs

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Frontend Connection

Set the Vite frontend API URL:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The frontend should then call:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /teams`
- `POST /teams`
- `POST /teams/join`
- `POST /projects/submit`
- `GET /projects`
- `GET /projects/review-queue`
- `GET /projects/{project_id}/submissions`
- `POST /projects/{project_id}/resubmit`
- `PATCH /projects/submissions/{submission_id}/status`
- `POST /feedback`
- `GET /feedback`
- `POST /marks`
- `GET /marks`
