import os
import base64
import cv2
import numpy as np
import face_recognition
import uuid
import io
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend for server
import matplotlib.pyplot as plt
from deepface import DeepFace
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from supabase import create_client, Client
from datetime import datetime
from fpdf import FPDF

# --- Setup & Configuration ---

# Load environment variables
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY") # This MUST be your SERVICE_ROLE_KEY

# Create Supabase client
supabase: Client = create_client(url, key)

# Create FastAPI app
app = FastAPI()

# --- In-Memory Session Storage ---
active_sessions = {}

# --- CORS Middleware ---
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all standard methods
    allow_headers=["*"],
)

# --- Auth Setup ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get the current user from a Supabase token."""
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")


# --- Pydantic Models (Request Bodies) ---

class StudentRegistration(BaseModel):
    name: str
    image_base64: str
    batch_ids: List[int]

class BatchCreate(BaseModel):
    batch_name: str
    subject: str

# NEW: Model for updating student's batch assignments
class StudentBatchUpdate(BaseModel):
    batch_ids: List[int]

class SessionStartRequest(BaseModel):
    batch_id: int
    duration_minutes: float

class FrameProcessRequest(BaseModel):
    session_id: str
    image_base64: str

class SessionEndRequest(BaseModel):
    session_id: str

# --- Helper Function ---

def base64_to_image(base64_string):
    """Converts a base64 string to an OpenCV image."""
    if "," in base64_string:
        base64_string = base64_string.split(',')[1]
    img_bytes = base64.b64decode(base64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "AI Attendance Tracker backend is running!"}


@app.post("/student")
def register_student(student: StudentRegistration, user: dict = Depends(get_current_user)):
    try:
        if not student.image_base64:
            raise HTTPException(status_code=400, detail="No image provided.")

        img = base64_to_image(student.image_base64)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)

        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in the image.")

        encoding = face_recognition.face_encodings(rgb_img, face_locations)[0]
        encoding_list = encoding.tolist()

        student_response = supabase.table('students').insert({
            "name": student.name,
            "face_encodings": encoding_list,
            "user_id": user.id
        }).execute()

        if not student_response.data:
             raise HTTPException(status_code=500, detail="Failed to save student to database.")

        new_student_id = student_response.data[0]['id']

        if student.batch_ids:
            records_to_insert = []
            for batch_id in student.batch_ids:
                records_to_insert.append({
                    "batch_id": batch_id,
                    "student_id": new_student_id
                })

            supabase.table('batch_students').insert(records_to_insert).execute()

        return {
            "message": "Student registered successfully!",
            "data": student_response.data
        }

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

# 🚀 NEW: Get all students for the user, including their assigned batches
@app.get("/students")
async def get_students(user: dict = Depends(get_current_user)):
    try:
        # Fetch students and join with batch_students, then batches to get batch names
        response = supabase.table("students") \
            .select("id, name, created_at, batch_students(batches(id, batch_name))") \
            .eq("user_id", user.id) \
            .order("created_at", desc=True) \
            .execute()
        
        # Reformat the data slightly for easier frontend use
        students_data = []
        for student in response.data:
            assigned_batches = []
            if student.get("batch_students"):
                for link in student["batch_students"]:
                    if link.get("batches"): # Check if batch exists (wasn't deleted)
                        assigned_batches.append(link["batches"]) # {id: ..., batch_name: ...}
            
            students_data.append({
                "id": student["id"],
                "name": student["name"],
                "created_at": student["created_at"],
                "batches": assigned_batches # List of {id, batch_name}
            })
            
        return students_data
    except Exception as e:
        print(f"Error getting students: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 🚀 NEW: Update a student's batch assignments
@app.put("/student/{student_id}/batches")
async def update_student_batches(student_id: int, update_data: StudentBatchUpdate, user: dict = Depends(get_current_user)):
    try:
        # 1. Verify student exists and belongs to the user
        student_check = supabase.table("students").select("id").eq("id", student_id).eq("user_id", user.id).maybe_single().execute()
        if not student_check.data:
            raise HTTPException(status_code=404, detail="Student not found or you don't own it.")

        # 2. Delete existing assignments for this student
        supabase.table("batch_students").delete().eq("student_id", student_id).execute()

        # 3. Insert new assignments
        if update_data.batch_ids:
            records_to_insert = [{"batch_id": b_id, "student_id": student_id} for b_id in update_data.batch_ids]
            supabase.table("batch_students").insert(records_to_insert).execute()
            
        return {"message": "Student batch assignments updated successfully."}
        
    except Exception as e:
        print(f"Error updating student batches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 🚀 NEW: Delete a student
@app.delete("/student/{student_id}")
async def delete_student(student_id: int, user: dict = Depends(get_current_user)):
    try:
        # Delete the student record. Due to "ON DELETE CASCADE",
        # related records in batch_students and attendance_records should also be deleted.
        response = supabase.table("students").delete().eq("id", student_id).eq("user_id", user.id).execute()
        
        # Check if any row was actually deleted
        # Note: Supabase delete response might not clearly indicate rows affected,
        # so we rely on the query executing without error and the RLS policy.
        # A more robust check might involve selecting first.
        
        # Assuming RLS prevents unauthorized deletion, success means it was likely deleted or didn't exist for this user.
        return {"message": "Student deleted successfully (or did not exist for this user)."}

    except Exception as e:
        print(f"Error deleting student: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/batches")
async def get_batches(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("batches").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error getting batches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch")
async def create_batch(batch: BatchCreate, user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("batches").insert({
            "batch_name": batch.batch_name,
            "subject": batch.subject,
            "user_id": user.id
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Could not create batch.")

        return {"message": "Batch created successfully", "data": response.data[0]}
    except Exception as e:
        print(f"Error creating batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 🚀 NEW: Delete a batch
@app.delete("/batch/{batch_id}")
async def delete_batch(batch_id: int, user: dict = Depends(get_current_user)):
    try:
        # Delete the batch record. "ON DELETE CASCADE" should handle related batch_students.
        # We also added "ON DELETE SET NULL" for sessions.batch_id.
        response = supabase.table("batches").delete().eq("id", batch_id).eq("user_id", user.id).execute()

        return {"message": "Batch deleted successfully (or did not exist for this user)."}

    except Exception as e:
        print(f"Error deleting batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/session/start")
async def start_session(req: SessionStartRequest, user: dict = Depends(get_current_user)):
    try:
        # 1. Verify batch exists and user owns it
        batch_res = supabase.table("batches").select("id, batch_name, subject").eq("id", req.batch_id).eq("user_id", user.id).single().execute()
        if not batch_res.data:
            raise HTTPException(status_code=404, detail="Batch not found or you don't own it.")
        batch_info = batch_res.data

        # 2. Fetch ONLY students linked to this batch_id via batch_students
        student_res = supabase.table("students") \
            .select("id, name, face_encodings, batch_students!inner(batch_id)") \
            .eq("batch_students.batch_id", req.batch_id) \
            .execute()

        if not student_res.data:
            raise HTTPException(status_code=404, detail="No students found in this batch.")

        known_faces = {}
        attendance_tracker = {}
        emotion_tracker = {}
        all_student_ids_in_batch = []

        for student in student_res.data:
            student_id = student['id'] # INT
            all_student_ids_in_batch.append(student_id)

            if student.get("face_encodings"):
                known_faces[student_id] = np.array(student['face_encodings'])

            attendance_tracker[student_id] = 0
            emotion_tracker[student_id] = {}

        if not known_faces:
             raise HTTPException(status_code=404, detail="None of the students in this batch have face data registered.")

        # 3. Create the session
        session_id = str(uuid.uuid4()) # In-memory session ID
        duration_seconds = req.duration_minutes * 60

        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M:%S")

        db_session_response = supabase.table("sessions").insert({
            "class_name": batch_info['batch_name'],
            "batch": batch_info['subject'],
            "duration_minutes": req.duration_minutes,
            "user_id": user.id,
            "session_date": current_date,
            "session_time": current_time,
            "batch_id": req.batch_id
        }).execute()

        if not db_session_response.data:
            raise HTTPException(status_code=500, detail="Could not create database session entry.")

        db_session_id = db_session_response.data[0]['id']

        threshold_seconds = duration_seconds * 0.7

        # 4. Store session data in memory
        active_sessions[session_id] = {
            "db_session_id": db_session_id,
            "batch_id": req.batch_id,
            "known_faces": known_faces,
            "all_student_ids": all_student_ids_in_batch,
            "attendance_tracker": attendance_tracker,
            "emotion_tracker": emotion_tracker,
            "last_frame_time": datetime.now(),
            "settings": {
                "duration_seconds": duration_seconds,
                "threshold_seconds": threshold_seconds
            }
        }

        return {"message": "Session started", "session_id": session_id}

    except Exception as e:
        print(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/session/frame")
async def process_frame(req: FrameProcessRequest, user: dict = Depends(get_current_user)):
    try:
        session_id = req.session_id
        if session_id not in active_sessions:
            print("Frame received for an already ended session. Ignoring.")
            return {"message": "Session ended, frame ignored."}

        session_data = active_sessions[session_id]

        now = datetime.now()
        time_since_last_frame = (now - session_data["last_frame_time"]).total_seconds()
        session_data["last_frame_time"] = now

        known_face_encodings = list(session_data["known_faces"].values())
        known_face_ids = list(session_data["known_faces"].keys()) # List of INTS

        img = base64_to_image(req.image_base64)
        rgb_small_frame = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        found_student_ids = []

        for face_encoding, face_location in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)

            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                student_id = known_face_ids[best_match_index] # INT
                found_student_ids.append(student_id)

                top, right, bottom, left = face_location
                face_image = rgb_small_frame[top:bottom, left:right]

                try:
                    analysis = DeepFace.analyze(
                        cv2.cvtColor(face_image, cv2.COLOR_RGB2BGR),
                        actions=['emotion'],
                        enforce_detection=False
                    )
                    emotion = analysis[0]['dominant_emotion']
                    if student_id in session_data["emotion_tracker"]:
                        student_emotion_tracker = session_data["emotion_tracker"][student_id]
                        student_emotion_tracker[emotion] = student_emotion_tracker.get(emotion, 0) + 1
                except Exception as e:
                    emotion = "unknown"

        for student_id in found_student_ids:
             if student_id in session_data["attendance_tracker"]:
                session_data["attendance_tracker"][student_id] += time_since_last_frame

        return {"message": "Frame processed", "found_students": found_student_ids, "time_credited": time_since_last_frame}

    except Exception as e:
        print(f"Error processing frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/session/end")
async def end_session(req: SessionEndRequest, user: dict = Depends(get_current_user)):
    try:
        session_id = req.session_id
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found.")

        session_data = active_sessions.pop(session_id)
        db_session_id = session_data["db_session_id"]
        threshold = session_data["settings"]["threshold_seconds"]
        final_attendance_times = session_data["attendance_tracker"]
        final_emotions = session_data["emotion_tracker"]
        all_student_ids_in_batch = session_data["all_student_ids"]

        records_to_insert = []

        for student_id in all_student_ids_in_batch:
            time_present = final_attendance_times.get(student_id, 0)
            status = "Present" if time_present >= threshold else "Absent"

            records_to_insert.append({
                "session_id": db_session_id,
                "student_id": student_id, # INT
                "status": status,
                "attentive_seconds": round(time_present),
                "emotion_summary": final_emotions.get(student_id, {})
            })

        if records_to_insert:
            supabase.table("attendance_records").insert(records_to_insert).execute()

        return {"message": "Session ended and attendance recorded for all students."}

    except Exception as e:
        print(f"Error ending session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions")
async def get_sessions(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("sessions").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error getting sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/report/{session_id}")
async def get_report(session_id: int, user: dict = Depends(get_current_user)):
    try:
        # 1. Verify user owns this session and get details
        session_res = supabase.table("sessions").select("*").eq("id", session_id).eq("user_id", user.id).single().execute()
        if not session_res.data:
            raise HTTPException(status_code=404, detail="Session not found or you do not have permission.")
        session_data = session_res.data

        # 2. Get Attendance Data
        att_res = supabase.table("attendance_records").select(
            "status, attentive_seconds, students(name), emotion_summary"
        ).eq("session_id", session_id).execute()
        attendance_data = att_res.data

        # 3. Aggregate all emotion summaries
        all_emotion_counts = {}
        if attendance_data:
            for record in attendance_data:
                if record.get('emotion_summary'):
                    for emotion, count in record['emotion_summary'].items():
                        all_emotion_counts[emotion] = all_emotion_counts.get(emotion, 0) + count

        # 4. Generate Emotion Pie Chart
        img_buffer = None
        if all_emotion_counts:
            labels = list(all_emotion_counts.keys())
            sizes = list(all_emotion_counts.values())

            plt.figure(figsize=(8, 6))
            plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, pctdistance=0.85)
            plt.title("Overall Class Emotional Engagement", pad=20)
            plt.axis('equal')

            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', bbox_inches='tight')
            plt.close()
            img_buffer.seek(0)

        # 5. Generate PDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", 'B', 18)

        class_name = session_data.get('class_name') or 'N/A'
        batch = str(session_data.get('batch') or 'N/A')
        date = str(session_data.get('session_date') or 'N/A')
        time = str(session_data.get('session_time') or 'N/A')

        pdf.cell(0, 10, "Attendance Report", 0, 1, 'C')
        pdf.set_font("Arial", '', 12)

        pdf.cell(0, 8, f"Class: {class_name} ({batch})", 0, 1, 'C')
        pdf.cell(0, 8, f"Date: {date} at {time}", 0, 1, 'C')
        pdf.ln(10)

        pdf.set_font("Arial", 'B', 12)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(90, 10, "Student Name", 1, 0, 'C', fill=True)
        pdf.cell(45, 10, "Status", 1, 0, 'C', fill=True)
        pdf.cell(45, 10, "Time (sec)", 1, 1, 'C', fill=True)

        pdf.set_font("Arial", '', 12)

        if attendance_data:
            for record in attendance_data:
                student_record = record.get('students')
                student_name = 'Unknown Student' # Default

                if student_record and student_record.get('name'):
                    try:
                        student_name = student_record['name'].encode('latin-1', 'replace').decode('latin-1')
                    except Exception:
                        student_name = 'Name contains special characters'

                status = record.get('status') or 'N/A'
                seconds = str(record.get('attentive_seconds', 'N/A'))

                pdf.cell(90, 10, student_name, 1, 0)
                pdf.cell(45, 10, status, 1, 0, 'C')
                pdf.cell(45, 10, seconds, 1, 1, 'C')

        if img_buffer:
            pdf.add_page()
            pdf.set_font("Arial", 'B', 18)
            pdf.cell(0, 10, "Emotional Engagement Summary", 0, 1, 'C')
            pdf.ln(10)
            img_w = 160
            pdf.image(img_buffer, x=(pdf.w - img_w) / 2, y=None, w=img_w, type='png')
        else:
            pdf.add_page()
            pdf.set_font("Arial", 'I', 12)
            pdf.cell(0, 10, "No emotion data was recorded for this session.", 0, 1, 'C')

        pdf_buffer = io.BytesIO()
        pdf.output(pdf_buffer)
        pdf_buffer.seek(0)

        return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=report_session_{session_id}.pdf"
        })

    except Exception as e:
        print(f"--- PDF GENERATION CRASHED ---")
        print(f"Error: {e}")
        print(f"--- END OF CRASH REPORT ---")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")