# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# AI Attendance Tracker — Frontend

This repository contains the frontend for an AI-driven attendance tracker built with React + Vite and Material UI. The full project pairs this frontend with a FastAPI backend (located at `../backend`) and Supabase as the primary data + auth layer.

This README explains the application's purpose, architecture, data models, local developer setup (PowerShell-friendly), and a concise API summary so developers can run and extend the project.

Table of contents
- Project overview
- Key features
- Architecture & data flow
- Important files (frontend)
- Environment variables
- Local setup (PowerShell)
- Supabase / database setup notes
- Backend API summary (endpoints & auth)
- Security & production notes
- Troubleshooting
- Contributing

## Project overview

AI Attendance Tracker is a classroom attendance system that uses webcam captures and on-server face analysis to: register students, run live attendance sessions, verify liveness, and produce session reports (PDF). The frontend provides UI for authentication, student/batch management, running a live session, and reviewing past sessions.

Users: instructors (owners of batches/students/sessions). Authentication is handled by Supabase.

## Key features

- Instructor authentication via Supabase
- Register students with webcam photos (face encodings stored server-side)
- Organize students into batches (classes)
- Start / stop live attendance sessions — repeated frames sent to backend for face matching
- Liveness detection (blink-based heuristics) and emotion analytics (optional)
- Persisted session records and downloadable PDF reports

## Architecture & data flow

- Frontend (React + Vite)
	- Captures images with the user's webcam, manages session UI, and calls backend APIs.
- Backend (FastAPI — in `../backend/main.py`)
	- Verifies Supabase JWT tokens, processes frames (face detection, encoding, matching), aggregates attendance, and persists final results into Supabase. Generates PDF reports on demand.

- Database/Auth (Supabase)
	- Stores students, batches, sessions, and attendance records; provides user authentication.

Flow (live session): instructor starts session → frontend repeatedly posts frames to backend → backend performs face matching & liveness checks and updates in-memory session state → instructor ends session → backend aggregates & writes attendance records to DB → instructor can view/download reports.

## Important frontend files

- `src/main.jsx` — app bootstrap
- `src/App.jsx` — routing + top-level session handling
- `src/supabaseClient.js` — Supabase client used across the frontend
- `src/Auth.jsx` — login / signup UI
- `src/ManageStudents.jsx` — create batches, register students with webcam capture
- `src/MarkAttendance.jsx` — UI for running a live attendance session (camera loop)
- `src/PastRecords.jsx` — list past sessions
- `src/SessionDetails.jsx` — view session metrics and download PDF report

## Environment variables

Create a `.env` file in the `frontend/` directory (Vite uses `VITE_` prefix for variables exposed to the client). Example:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI... (anon/public key)
```

Important: Do NOT expose service role keys in the frontend. Only use the anon/public key on the client. Server (backend) requires service keys (see backend README/.env).

## Local development setup (Windows PowerShell)

Prerequisites
- Node.js (LTS) — recommended 18+.
- npm or pnpm
- Python 3.10+ for the backend (and extra native deps if you run face_recognition/dlib locally).

Step 1 — Frontend

1. Open PowerShell in `frontend/`.
2. Install dependencies:

```powershell
cd c:\Projects\ai-attendance-tracker\frontend
npm install
```

3. Start dev server (Vite):

```powershell
npm run dev
# or if package.json uses `dev: vite`: npm run dev -- --host
```

Open http://localhost:5173 (or the address printed by Vite).

Step 2 — Backend (quick guide)

1. Create and activate a virtual environment (from `backend/`):

```powershell
cd c:\Projects\ai-attendance-tracker\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

2. Install dependencies. The repo might not include a pinned `requirements.txt`; here's a recommended list (installing face-recognition/dlib on Windows may require extra steps):

```powershell
pip install fastapi uvicorn python-dotenv supabase pyjwt requests fpdf matplotlib pillow numpy opencv-python-headless
# Optional / advanced: face-recognition (depends on dlib) and deepface (optional)
# pip install face_recognition deepface
```

3. Create a `backend/.env` (example keys explained below) and run the server:

```powershell
# Activate venv first (if not active)
.venv\Scripts\Activate.ps1
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_KEY = "service_role_key_or_anon_as_needed"
# Instead of exporting env vars manually, create backend/.env and let python-dotenv load it.

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Note about face libraries on Windows: `face_recognition` requires `dlib` which may need Visual Studio Build Tools and CMake. If you cannot install it locally, consider running the backend in a Linux container or skipping face-recognition features.

## Example `.env` values (frontend)

frontend/.env
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

backend/.env (example)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=service-role-or-server-key
```

The backend requires a server key (service role) or a key that can manage data on behalf of the user. Keep this secure.

## Supabase (database) setup notes

You should create the following tables (names reflect the implementation in the backend):

- `students` — { id (uuid), name (text), face_encodings (json/array of floats), user_id (text), created_at }
- `batches` — { id (uuid), batch_name, subject, user_id, created_at }
- `batch_students` — join table { id, batch_id (fk), student_id (fk) }
- `sessions` — { id (uuid), class_name, batch_id, duration_minutes, user_id, session_date, session_time, created_at }
- `attendance_records` — { id, session_id, student_id, status, attentive_seconds, liveness_verified, emotion_summary }

You may implement these via the Supabase dashboard SQL editor. Add row-level security (RLS) policies so users can only access their own rows (e.g., `user_id = auth.uid()`), except for service endpoints that must run with a server key.

Note: The backend enforces ownership on queries by checking the `user_id` returned from Supabase auth.

## Backend API summary

All API requests from the frontend include the Supabase access token in the `Authorization: Bearer <token>` header. The backend validates the token and looks up the user.

Common endpoints (implementations are in `backend/main.py`):

- POST `/student` — register a student (multipart/base64 image + name + batches). Auth required.
- GET `/students` — list students for current user
- PUT `/student/{id}/batches` — update student batches
- DELETE `/student/{id}` — delete a student

- POST `/batch` — create a batch
- GET `/batches` — list batches for user
- DELETE `/batch/{id}` — delete a batch

- POST `/session/start` — start a live session (returns `session_id`)
- POST `/session/frame` — send a single frame (base64) during a live session (updates in-memory trackers)
- POST `/session/end` — end session and persist results
- GET `/sessions` — list past sessions
- GET `/session/{id}` — session metadata
- GET `/session/{id}/attendance` — attendance rows for a session
- GET `/report/{id}` — generate and download a PDF report for a session

Refer to `backend/main.py` for request shapes. The backend uses Pydantic models to validate requests.

## Security & production notes

- Do not use Supabase service-role keys in the frontend. Keep them on the server.
- For production, move in-memory session state to a durable shared store (Redis) so the app can scale horizontally and survive process restarts.
- Use HTTPS and strong CORS policies on the backend.
- Consider rate-limiting `/session/frame` if abused.
- Face data is sensitive: document retention policies and obtain consent from students before capturing/storing data.

## Troubleshooting

- Face recognition installation errors on Windows: install Visual C++ Build Tools, CMake, and follow `dlib` platform instructions or use a prebuilt wheel for your Python version.
- If camera capture fails in the browser: ensure site served over HTTPS (some browsers require it) or use `localhost` in dev; allow camera permissions.
- If API calls return 401/403: verify the frontend is sending the Supabase access token and that the backend `.env` keys match the Supabase project.

## Contributing

1. Fork the repo and create a feature branch.
2. Implement tests where applicable and keep changes small and focused.
3. Open a pull request describing the motivation and design.

## License

Specify your project license here (e.g., MIT) and add a `LICENSE` file at the repository root.

---

If you'd like, I can also:
- Create a short slide (single MD or PPTX) summarizing the architecture for a presentation.
- Draft speaker notes for each file/component to help explain the project in a live demo.

Which of those would you like next?

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
