# AI Attendance Tracker

AI Attendance Tracker is a full-stack demo application that uses webcam captures and server-side face analysis to run classroom attendance sessions with liveness checks and simple analytics. This repository contains a React + Vite frontend (in `frontend/`) and a FastAPI backend (in `backend/`) that uses Supabase for authentication and persistent storage.

This README is written for developers who want to run, extend, or present the project.

---

## Table of contents

- Project summary
- Tech stack
- Architecture & data flow
- Data model (Supabase tables)
- Getting started (PowerShell-oriented)
  - Environment variables
  - Frontend: install & run
  - Backend: install & run
- API summary (quick reference)
- Development notes & common issues
- Deployment & production considerations
- Security & privacy
- Contributing
- License

---

## Project summary

The app allows instructors to:

- Register students with webcam photos (face encodings stored on the server)
- Organize students into batches/classes
- Run live attendance sessions: the frontend posts repeated frames to the backend which performs face matching, liveness checks (blink heuristics), and optional emotion analytics
- View past session records and download PDF reports

The frontend interacts with the backend using the user's Supabase access token (Bearer auth). The backend validates tokens against Supabase and performs ownership checks when accessing data.

## Tech stack

- Frontend: React, Vite, Material-UI
- Backend: FastAPI, Uvicorn
- Database & Auth: Supabase (Postgres + Auth)
- Face processing (optional/advanced): face_recognition (dlib), OpenCV, DeepFace (emotion)
- PDF/Reporting: FPDF, Matplotlib (for charts)

## Architecture & data flow

1. Instructor signs in via Supabase (frontend uses the public anon key).
2. Instructor registers students (the frontend captures an image and sends it to the backend). The backend computes and stores face encodings.
3. Instructor starts a session (frontend calls `/session/start`). Backend creates an in-memory session object with known encodings for that batch and persists a `sessions` row.
4. The frontend repeatedly captures frames and POSTs them to `/session/frame`. Backend matches faces, updates per-student attentive time and liveness, and keeps state in-memory.
5. When the session ends, frontend calls `/session/end`. Backend aggregates attendance and writes `attendance_records` to the DB.
6. Instructor can view sessions (`/sessions`), view attendance detail, and download a PDF report (`/report/{id}`).

Note: keeping session state in-memory is simple but not resilient to process restarts or multi-instance deployments — a production deployment should use Redis or another shared store.

## Data model (Supabase tables)

Suggested minimal schema (table names used by the backend):

- `users` — (managed by Supabase Auth)
- `students` — id (uuid), name (text), face_encodings (json/array), user_id (text), created_at
- `batches` — id (uuid), batch_name (text), subject (text), user_id, created_at
- `batch_students` — join table connecting batches & students
- `sessions` — id (uuid), class_name, batch_id, duration_minutes, user_id, session_date, session_time, created_at
- `attendance_records` — id, session_id, student_id, status (Present/Absent), attentive_seconds, liveness_verified (bool), emotion_summary (json)

When creating tables in Supabase, add Row-Level Security (RLS) policies so users only access their own rows (for example: `user_id = auth.uid()`). The backend should run with a server key for operations that require broader access.

## Getting started (PowerShell)

Prerequisites

- Node.js (LTS 18+ recommended)
- npm or pnpm
- Python 3.10+ (for backend)
- (Optional) For face_recognition/dlib: Visual Studio Build Tools, CMake on Windows or use a Linux container

1) Clone the repo

```powershell
cd c:\Projects
git clone <your-repo-url> ai-attendance-tracker
cd ai-attendance-tracker
```

2) Setup environment variables

Create `.env` files in `frontend/` and `backend/` as shown below.

frontend/.env (Vite uses `VITE_` prefix for public vars)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

backend/.env

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=service-role-or-server-key
```

Important: keep `SUPABASE_KEY` private; do NOT commit `.env` files.

3) Run the frontend

```powershell
cd c:\Projects\ai-attendance-tracker\frontend
npm install
npm run dev
# Open the URL printed by Vite (usually http://localhost:5173)
```

4) Run the backend (recommended: virtual environment)

```powershell
cd c:\Projects\ai-attendance-tracker\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
# If repo has requirements.txt, use it. Otherwise install minimal deps:
pip install fastapi uvicorn python-dotenv supabase fpdf matplotlib pillow numpy opencv-python-headless
# Optional advanced packages (may be hard to install on Windows): face_recognition deepface

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If you need help installing `face_recognition` on Windows, consider running the backend in WSL2 or a Linux container/VM where compiling `dlib` and its dependencies is simpler.

## API summary (quick reference)

All requests from the frontend must include the user's Supabase access token in `Authorization: Bearer <token>` (the frontend uses `supabase.auth.getSession()` to obtain it).

Important endpoints (see `backend/main.py` for full implementations and Pydantic models):

- POST `/student` — register student (image + name + batch ids)
- GET `/students` — list students for current user
- PUT `/student/{id}/batches` — update student batches
- DELETE `/student/{id}`

- POST `/batch` — create batch
- GET `/batches` — list batches
- DELETE `/batch/{id}`

- POST `/session/start` — start session (returns session_id)
- POST `/session/frame` — submit base64 frame while session in progress
- POST `/session/end` — end session and persist results
- GET `/sessions` — list sessions
- GET `/session/{id}` — session metadata
- GET `/session/{id}/attendance` — attendance records for session
- GET `/report/{id}` — PDF report for session

Refer to backend code to see required request fields (Pydantic models enforce shapes).

## Development notes & common issues

- If camera capture fails: develop using `localhost` in Chrome/Edge (camera permission required). Some browsers require HTTPS for camera access.
- 401/403 from backend: ensure frontend includes the Supabase access token and the token is valid for the Supabase project in `backend/.env`.
- face_recognition/dlib on Windows: either install dependencies (Visual C++ Build Tools, CMake) or use WSL2 / Docker.
- In-memory session storage: active sessions are kept in process memory; if the server restarts, active session state is lost. For resilient deployments use Redis or a DB-backed checkpoint.

## Deployment & production considerations

- Frontend: deploy to Vercel, Netlify, or static hosting; set environment variables in the hosting provider (use anon/public key only).
- Backend: deploy as a container or server (Heroku, DigitalOcean App Platform, GCP Cloud Run). Use secrets management for `SUPABASE_KEY`.
- Use HTTPS in production and restrict CORS to the frontend origin.
- Replace in-memory session store with Redis for horizontal scaling.

## Security & privacy

- Face data is sensitive. Before deploying, ensure you have consent to capture and store student images and encodings.
- Store face encodings securely. Consider encrypting sensitive columns at rest or restrict access via RLS and server-side checks.
- Never expose service-role keys or admin keys to the frontend. Use only anon/public keys on the client.

## Contributing

1. Fork the repository and create a branch.
2. Add tests and keep changes small.
3. Open a pull request describing the change.

If you'd like, we can also add:

- `backend/requirements.txt` (minimal + optional extras) — I can generate this.
- `backend/README.md` with platform-specific (Windows/Linux) install instructions for `dlib` and `face_recognition`.

---

If you want, I can now:

- Create a `backend/requirements.txt` listing core and optional packages.
- Create a `backend/README.md` with step-by-step instructions for installing `dlib` and face libraries on Windows and Linux.
- Produce a one-slide architecture summary or speaker notes for your presentation.

Tell me which one you'd like next and I'll add it.
