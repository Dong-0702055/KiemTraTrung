# Topic Management Backend

Django REST API for topic, academic catalog, approval, document, and similarity workflows. The API owns application data; title similarity is delegated to the separate FastAPI AI service.

## Run locally

From this directory:

```powershell
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The backend is available at `http://localhost:8000/api/v1/`. Most domain models map to existing PostgreSQL tables (`users`, `topics`, `students`, and related tables), so their migrations are state-only. `topic_approvals` is Django-managed and is created by `approvals.0002_create_topic_approvals`; if that table is missing, restore it with `python manage.py migrate approvals 0002_create_topic_approvals`. The migration leaves an existing table untouched. SQLite remains the fallback when `DB_ENGINE` is omitted. Never commit real credentials.

Create the first API administrator after configuring PostgreSQL:

```powershell
python manage.py createsuperuser
```

This writes the administrator to the existing `users` table. The database currently has no user rows, so create this account before requesting a JWT.

Run the AI service from the AI project directory in a separate terminal:

```powershell
uvicorn src.inference.api:app --host 127.0.0.1 --port 8001
```

Set `AI_SERVICE_URL` to the service origin if it is not running at `http://localhost:8001`. Django sends approved topic titles and cached embeddings to the AI service, and requests embeddings for uncached titles. The AI service does not need direct access to Django's database.

## API contract

All routes are under `/api/v1/`. Except for health and token issuance, requests require `Authorization: Bearer <access-token>`. JWT login accepts the Django `username` and `password`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health/` | Health check |
| POST | `/auth/token/` | Obtain access and refresh tokens |
| POST | `/auth/token/refresh/` | Refresh an access token |
| GET | `/auth/me/` | Current account and role |
| GET/POST | `/departments/`, `/majors/`, `/academic-years/`, `/semesters/` | Read catalogs; admins create/update/delete |
| GET/POST | `/cohorts/` | Read cohorts; admins create/update/delete |
| GET/POST/PATCH | `/users/`, `/students/`, `/lecturers/` | Admin account/profile management |
| GET/POST | `/topics/` | List and create topics |
| GET/PATCH/DELETE | `/topics/{id}/` | Read or edit an allowed topic |
| POST | `/topics/{id}/submit/` | Send a draft or revised topic for approval |
| POST | `/topics/{id}/review/` | Department head/admin approves, rejects, or requests changes |
| GET/POST | `/topic-groups/`, `/topic-group-members/`, `/topic-lecturers/` | Manage topic group and lecturer assignments |
| GET/POST | `/technologies/` | Read or manage the technology catalog |
| GET/POST | `/topic-technologies/` | Read or assign technologies to topics; DELETE `/topic-technologies/remove/` removes an assignment |
| GET/POST/PATCH/DELETE | `/topic-functions/` | Manage functions described for a topic |
| GET/POST/PATCH/DELETE | `/topic-documents/` | Manage metadata and paths for topic documents |
| GET | `/topics/{id}/resources/` | Read a topic's technologies, functions, documents, and AI embedding status |
| GET | `/approvals/` | Approval history visible to reviewer or topic owner |
| POST | `/similarity/checks/check/` | Check title against approved topics and store history |
| POST multipart | `/similarity/checks/extract-file/` | Extract title suggestions and preview text from a PDF/DOCX upload |
| GET | `/similarity/checks/` | View permitted similarity-check history |
| GET/POST | `/documents/` | Read or write extracted-document metadata |
| GET | `/document-sections/` | Read extracted document sections |

`POST /auth/token/` returns `access`, `refresh`, and the signed-in `user`.
Department heads can create and edit student academic profiles at
`/students/` without creating or linking a login account. Student code, name,
major, and cohort are required; academic year and other profile details are
optional.
For lecturer and department-head accounts, `user.lecturer_profile` contains
the lecturer record linked through `lecturers.user_id`, including department,
degree, and specialization. For other roles, `lecturer_profile` is `null`.
Approval history items include `topic_title`, `topic_code`, `approver_name`,
`action`, `comment`, and `created_at` so the dashboard can identify the affected
topic and show the decision with its corresponding status icon.

These routes map to the existing unmanaged PostgreSQL tables; they do not create
replacement tables. Similarity checking caches candidate title vectors in
`topic_embeddings` and reuses them on subsequent checks. The cache is invalidated
when a topic title is changed through the topic API. Set `AI_MODEL_NAME` to the
checkpoint filename used by the AI service (default `tier1_best.pt`). The AI
service exposes `POST /api/v1/encode-titles` for backend cache generation.
`topic-documents` stores document metadata/path only; it does not upload file
contents. Actual extracted document content and sections remain in
`documents`/`document_sections`.

The file-title extraction endpoint accepts a multipart field named `file`,
supports text-based PDF and DOCX files up to 10 MB, and returns up to five
title suggestions plus an extracted-text preview. Uploaded files are processed
in memory and are not retained. The user must confirm/edit the suggested title
before submitting it to `/similarity/checks/check/`. Scanned/image-only PDFs
require OCR and are rejected with an actionable validation message; OCR is not
included in the current implementation.

Review body uses the database's supported actions:

```json
{
  "decision": "APPROVE",
  "comment": "Đề tài phù hợp"
}
```

Allowed decisions are `APPROVE`, `REJECT`, and `REQUEST_REVISION`. Topic states follow the existing database constraint: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `REVISION_REQUIRED`, and `CANCELLED`.

Example similarity request:

```json
{
  "title": "Xây dựng hệ thống quản lý bãi đỗ xe thông minh",
  "top_k": 10
}
```

The response includes `check_ids`, `query`, `count`, and ranked `results` with `topic_id`, `title`, `similarity`, `percent`, and `warning`. PostgreSQL calculates the stored `similarity_percent` from `similarity_score`. Pass `source_topic_id` when checking an existing proposal to associate history with it; the existing schema has no separate user column on similarity checks.

CORS permits `http://localhost:3000` and `http://localhost:5173` by default. Set `CORS_ALLOWED_ORIGINS` to comma-separated frontend origins for other environments. `DEBUG` must be disabled and `DJANGO_SECRET_KEY` replaced before deployment.

## API access roles

Authenticated accounts with the `HEAD_DEPARTMENT` role have full access to the
registered `/api/v1/` endpoints and all records, including create, update, and
delete actions wherever the endpoint supports them. This includes managing user
accounts and role assignments. Protect Trưởng bộ môn credentials accordingly.
