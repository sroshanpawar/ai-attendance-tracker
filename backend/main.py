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
from scipy.spatial import distance as dist # For EAR calculation
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

# --- Constants ---
EAR_THRESHOLD = 0.25 # Threshold for blink detection

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
    expose_headers=["Content-Disposition"],
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

# --- Helper Functions ---

def base64_to_image(base64_string):
    """Converts a base64 string to an OpenCV image."""
    if "," in base64_string:
        base64_string = base64_string.split(',')[1]
    img_bytes = base64.b64decode(base64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return img

def calculate_ear(eye):
    # compute the euclidean distances between vertical landmarks
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    # compute the euclidean distance between horizontal landmarks
    C = dist.euclidean(eye[0], eye[3])
    # compute the eye aspect ratio
    ear = (A + B) / (2.0 * C)
    return ear

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"message": "AI Attendance Tracker backend is running!"}


# --- Student Management ---
@app.post("/student")
def register_student(student: StudentRegistration, user: dict = Depends(get_current_user)):
    try:
        if not student.image_base64: raise HTTPException(status_code=400, detail="No image provided.")
        img = base64_to_image(student.image_base64)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        if not face_locations: raise HTTPException(status_code=400, detail="No face detected.")

        # Ensure landmarks are detected before encoding - reduces errors later
        landmarks = face_recognition.face_landmarks(rgb_img, face_locations)
        if not landmarks or not landmarks[0].get('left_eye') or not landmarks[0].get('right_eye'):
             raise HTTPException(status_code=400, detail="Could not detect facial features needed for liveness check. Try a clearer picture.")

        encoding = face_recognition.face_encodings(rgb_img, face_locations)[0]
        encoding_list = encoding.tolist()
        student_response = supabase.table('students').insert({ "name": student.name, "face_encodings": encoding_list, "user_id": user.id }).execute()
        if not student_response.data: raise HTTPException(status_code=500, detail="Failed to save student.")
        new_student_id = student_response.data[0]['id']
        if student.batch_ids:
            records = [{"batch_id": b_id, "student_id": new_student_id} for b_id in student.batch_ids]
            supabase.table('batch_students').insert(records).execute()
        return { "message": "Student registered successfully!", "data": student_response.data }
    except HTTPException as http_ex: raise http_ex
    except Exception as e: print(f"Reg err: {e}"); raise HTTPException(status_code=500, detail=f"Internal error during registration: {str(e)}")

@app.get("/students")
async def get_students(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("students").select("id, name, created_at, batch_students(batches(id, batch_name))").eq("user_id", user.id).order("created_at", desc=True).execute()
        students_data = []
        for student in response.data:
            assigned_batches = [link["batches"] for link in student.get("batch_students", []) if link.get("batches")]
            students_data.append({ "id": student["id"], "name": student["name"], "created_at": student["created_at"], "batches": assigned_batches })
        return students_data
    except Exception as e: print(f"Get students err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to get students: {str(e)}")

@app.put("/student/{student_id}/batches")
async def update_student_batches(student_id: int, update_data: StudentBatchUpdate, user: dict = Depends(get_current_user)):
    try:
        student_check = supabase.table("students").select("id").eq("id", student_id).eq("user_id", user.id).maybe_single().execute()
        if not student_check.data: raise HTTPException(status_code=404, detail="Student not found or permission denied.")
        supabase.table("batch_students").delete().eq("student_id", student_id).execute()
        if update_data.batch_ids:
            records = [{"batch_id": b_id, "student_id": student_id} for b_id in update_data.batch_ids]
            supabase.table("batch_students").insert(records).execute()
        return {"message": "Student batch assignments updated."}
    except Exception as e: print(f"Update student err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to update batches: {str(e)}")

@app.delete("/student/{student_id}")
async def delete_student(student_id: int, user: dict = Depends(get_current_user)):
    try:
        # Verify ownership before delete for extra safety, though RLS should handle it
        student_check = supabase.table("students").select("id").eq("id", student_id).eq("user_id", user.id).maybe_single().execute()
        if not student_check.data:
             # Don't raise error, just inform user it might not exist for them
             return {"message": "Student not found for this user."}

        supabase.table("students").delete().eq("id", student_id).eq("user_id", user.id).execute()
        return {"message": "Student deleted successfully."}
    except Exception as e: print(f"Delete student err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to delete student: {str(e)}")

# --- Batch Management ---
@app.get("/batches")
async def get_batches(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("batches").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e: print(f"Get batches err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to get batches: {str(e)}")

@app.post("/batch")
async def create_batch(batch: BatchCreate, user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("batches").insert({ "batch_name": batch.batch_name, "subject": batch.subject, "user_id": user.id }).execute()
        if not response.data: raise HTTPException(status_code=500, detail="Could not create batch.")
        return {"message": "Batch created.", "data": response.data[0]}
    except Exception as e: print(f"Create batch err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to create batch: {str(e)}")

@app.delete("/batch/{batch_id}")
async def delete_batch(batch_id: int, user: dict = Depends(get_current_user)):
    try:
         # Verify ownership before delete
        batch_check = supabase.table("batches").select("id").eq("id", batch_id).eq("user_id", user.id).maybe_single().execute()
        if not batch_check.data:
             return {"message": "Batch not found for this user."}

        supabase.table("batches").delete().eq("id", batch_id).eq("user_id", user.id).execute()
        return {"message": "Batch deleted."}
    except Exception as e: print(f"Delete batch err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to delete batch: {str(e)}")

# --- Attendance Session ---
@app.post("/session/start")
async def start_session(req: SessionStartRequest, user: dict = Depends(get_current_user)):
    try:
        batch_res = supabase.table("batches").select("id, batch_name, subject").eq("id", req.batch_id).eq("user_id", user.id).single().execute()
        if not batch_res.data: raise HTTPException(status_code=404, detail="Batch not found or permission denied.")
        batch_info = batch_res.data
        student_res = supabase.table("students").select("id, name, face_encodings, batch_students!inner(batch_id)").eq("batch_students.batch_id", req.batch_id).execute()
        if not student_res.data: raise HTTPException(status_code=404, detail="No students found in this batch.")
        known_faces, attendance_tracker, emotion_tracker, blink_tracker, all_student_ids = {}, {}, {}, {}, []
        for student in student_res.data:
            s_id = student['id']; all_student_ids.append(s_id)
            if student.get("face_encodings"): known_faces[s_id] = np.array(student['face_encodings'])
            attendance_tracker[s_id], emotion_tracker[s_id], blink_tracker[s_id] = 0, {}, False
        if not known_faces: raise HTTPException(status_code=404, detail="None of the students in this batch have face data registered.")
        session_id, duration_s = str(uuid.uuid4()), req.duration_minutes * 60
        now = datetime.now(); date, time = now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")
        db_res = supabase.table("sessions").insert({ "class_name": batch_info['batch_name'], "batch": batch_info['subject'], "duration_minutes": req.duration_minutes, "user_id": user.id, "session_date": date, "session_time": time, "batch_id": req.batch_id }).execute()
        if not db_res.data: raise HTTPException(status_code=500, detail="Could not create database session entry.")
        db_id = db_res.data[0]['id']
        threshold_s = duration_s * 0.7
        active_sessions[session_id] = { "db_session_id": db_id, "batch_id": req.batch_id, "known_faces": known_faces, "all_student_ids": all_student_ids, "attendance_tracker": attendance_tracker, "emotion_tracker": emotion_tracker, "blink_tracker": blink_tracker, "last_frame_time": now, "settings": { "duration_seconds": duration_s, "threshold_seconds": threshold_s } }
        return {"message": "Session started", "session_id": session_id}
    except Exception as e: print(f"Start session err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@app.post("/session/frame")
async def process_frame(req: FrameProcessRequest, user: dict = Depends(get_current_user)):
    try:
        session_id = req.session_id
        if session_id not in active_sessions: return {"message": "Session ended, frame ignored."}
        s_data = active_sessions[session_id]; now = datetime.now()
        elapsed = (now - s_data["last_frame_time"]).total_seconds(); s_data["last_frame_time"] = now
        encodings, ids = list(s_data["known_faces"].values()), list(s_data["known_faces"].keys())
        img = base64_to_image(req.image_base64); rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        locs = face_recognition.face_locations(rgb_img); f_encs = face_recognition.face_encodings(rgb_img, locs); f_marks = face_recognition.face_landmarks(rgb_img, locs)
        found_ids = []
        for i, f_enc in enumerate(f_encs):
            loc, marks = locs[i], f_marks[i]
            # Skip if landmarks (needed for EAR) are missing for this face
            if not marks or not marks.get('left_eye') or not marks.get('right_eye'):
                continue
            matches = face_recognition.compare_faces(encodings, f_enc, tolerance=0.6)
            dists = face_recognition.face_distance(encodings, f_enc); best_idx = np.argmin(dists)
            if matches[best_idx]:
                s_id = ids[best_idx]; found_ids.append(s_id)
                leftE = marks['left_eye']; rightE = marks['right_eye']
                leftEAR, rightEAR = calculate_ear(leftE), calculate_ear(rightE)
                ear = (leftEAR + rightEAR) / 2.0
                if ear < EAR_THRESHOLD: s_data["blink_tracker"][s_id] = True; print(f"Blink detected: {s_id}")
                top, right, bottom, left = loc; face_img = rgb_img[top:bottom, left:right]
                try:
                    analysis = DeepFace.analyze(cv2.cvtColor(face_img, cv2.COLOR_RGB2BGR), actions=['emotion'], enforce_detection=False)
                    emotion = analysis[0]['dominant_emotion']
                    if s_id in s_data["emotion_tracker"]: s_data["emotion_tracker"][s_id][emotion] = s_data["emotion_tracker"][s_id].get(emotion, 0) + 1
                except Exception: pass
        for s_id in found_ids:
             if s_id in s_data["attendance_tracker"]: s_data["attendance_tracker"][s_id] += elapsed
        return {"message": "Frame processed", "found_students": found_ids, "time_credited": elapsed}
    except Exception as e: print(f"Frame err: {e}"); raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")

@app.post("/session/end")
async def end_session(req: SessionEndRequest, user: dict = Depends(get_current_user)):
    try:
        session_id = req.session_id
        if session_id not in active_sessions: raise HTTPException(status_code=404, detail="Session not found.")
        s_data = active_sessions.pop(session_id)
        db_id, threshold = s_data["db_session_id"], s_data["settings"]["threshold_seconds"]
        times, emotions, blinks, all_ids = s_data["attendance_tracker"], s_data["emotion_tracker"], s_data["blink_tracker"], s_data["all_student_ids"]
        records = []
        for s_id in all_ids:
            time_p = times.get(s_id, 0); status = "Present" if time_p >= threshold else "Absent"
            live = blinks.get(s_id, False)
            records.append({ "session_id": db_id, "student_id": s_id, "status": status, "attentive_seconds": round(time_p), "emotion_summary": emotions.get(s_id, {}), "liveness_verified": live })
        if records: supabase.table("attendance_records").insert(records).execute()
        return {"message": "Session ended and attendance recorded."}
    except Exception as e: print(f"End session err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

# --- Reporting & Session Details ---
@app.get("/sessions")
async def get_sessions(user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("sessions").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return response.data
    except Exception as e: print(f"Get sessions err: {e}"); raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

# --- NEW Endpoint ---
@app.get("/session/{session_id}")
async def get_session_details(session_id: int, user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("sessions").select("*").eq("id", session_id).eq("user_id", user.id).maybe_single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Session not found or permission denied.")
        return response.data
    except Exception as e:
        print(f"Error getting session details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get session details: {str(e)}")

# --- NEW Endpoint ---
@app.get("/session/{session_id}/attendance")
async def get_session_attendance(session_id: int, user: dict = Depends(get_current_user)):
    try:
        session_check = supabase.table("sessions").select("id").eq("id", session_id).eq("user_id", user.id).maybe_single().execute()
        if not session_check.data:
            raise HTTPException(status_code=404, detail="Session not found or permission denied.")
        response = supabase.table("attendance_records").select(
            "status, attentive_seconds, liveness_verified, emotion_summary, students(id, name)"
        ).eq("session_id", session_id).execute()
        attendance_list = []
        for record in response.data:
            student_info = record.get('students')
            attendance_list.append({
                "student_id": student_info.get('id') if student_info else None,
                "student_name": student_info.get('name') if student_info else "Unknown Student",
                "status": record.get('status'),
                "attentive_seconds": record.get('attentive_seconds'),
                "liveness_verified": record.get('liveness_verified'),
                "emotion_summary": record.get('emotion_summary')
            })
        return attendance_list
    except Exception as e:
        print(f"Error getting session attendance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get session attendance: {str(e)}")


class ReportPDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Generated by AI Attendance Tracker | Page {self.page_no()}", 0, 0, "C")

@app.get("/report/{session_id}")
async def get_report(session_id: int, user: dict = Depends(get_current_user)):
    import re
    try:
        session_res = supabase.table("sessions").select("*").eq("id", session_id).eq("user_id", user.id).single().execute()
        if not session_res.data: raise HTTPException(status_code=404, detail="Session not found.")
        s_data = session_res.data
        att_res = supabase.table("attendance_records").select("status, attentive_seconds, liveness_verified, students(name), emotion_summary").eq("session_id", session_id).execute()
        att_data = att_res.data
        
        emo_counts = {}
        present_count = 0
        absent_count = 0
        
        if att_data:
            for rec in att_data:
                status = rec.get("status", "")
                if status == "Present": present_count += 1
                elif status == "Absent": absent_count += 1
                if rec.get('emotion_summary'):
                    for emo, count in rec['emotion_summary'].items(): emo_counts[emo] = emo_counts.get(emo, 0) + count
        
        total_enrolled = present_count + absent_count
        
        img_buf = None
        if emo_counts:
            labels, sizes = list(emo_counts.keys()), list(emo_counts.values())
            plt.figure(figsize=(8, 6), facecolor='white')
            colors = plt.cm.Pastel1.colors
            plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, pctdistance=0.85, colors=colors)
            plt.title("Class Emotional Engagement Summary", pad=20, fontsize=14, fontweight='bold', color='#0f172a')
            plt.axis('equal')
            img_buf = io.BytesIO()
            plt.savefig(img_buf, format='png', bbox_inches='tight', dpi=150)
            plt.close()
            img_buf.seek(0)
            
        pdf = ReportPDF()
        pdf.add_page()
        
        c_name = str(s_data.get('class_name', 'N/A'))
        batch = str(s_data.get('batch', 'N/A'))
        date = str(s_data.get('session_date', 'N/A'))
        time = str(s_data.get('session_time', 'N/A'))
        duration = str(s_data.get('duration_minutes', 'N/A'))
        
        # 1. Header
        pdf.set_font("Arial", 'B', 22)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 15, "Official Attendance Record", 0, 1, 'C')
        
        pdf.set_draw_color(30, 58, 138)
        pdf.set_line_width(0.5)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(8)
        
        # 2. Session Metadata
        pdf.set_font("Arial", 'B', 12)
        pdf.set_text_color(71, 85, 105)
        pdf.cell(0, 6, f"Batch: {c_name} | Subject: {batch}", 0, 1, 'L')
        pdf.cell(0, 6, f"Date: {date} | Time: {time}", 0, 1, 'L')
        pdf.cell(0, 6, f"Duration: {duration} minutes", 0, 1, 'L')
        pdf.ln(5)
        
        # Summary Metrics
        pdf.set_font("Arial", 'B', 11)
        pdf.set_text_color(15, 23, 42)
        pdf.set_fill_color(241, 245, 249)
        pdf.cell(0, 10, f"  Total Enrolled: {total_enrolled}  |  Total Present: {present_count}  |  Total Absent: {absent_count}", 0, 1, 'L', fill=True)
        pdf.ln(8)
        
        # 3. Table Styling
        pdf.set_font("Arial", 'B', 11)
        pdf.set_fill_color(15, 23, 42)
        pdf.set_text_color(255, 255, 255)
        pdf.set_draw_color(226, 232, 240)
        pdf.set_line_width(0.2)
        
        pdf.cell(80, 10, "  Student Name", 1, 0, 'L', fill=True)
        pdf.cell(30, 10, "Status", 1, 0, 'C', fill=True)
        pdf.cell(35, 10, "Time (sec)", 1, 0, 'C', fill=True)
        pdf.cell(45, 10, "Liveness", 1, 1, 'C', fill=True)
        
        pdf.set_font("Arial", '', 10)
        fill = False
        if att_data:
            for rec in att_data:
                s_rec, s_name = rec.get('students'), 'Unknown'
                if s_rec and s_rec.get('name'):
                    try: s_name = s_rec['name'].encode('latin-1', 'replace').decode('latin-1')
                    except Exception: s_name = 'Special Chars'
                
                status = rec.get('status', 'N/A')
                secs = str(rec.get('attentive_seconds', 'N/A'))
                live = "Verified" if rec.get('liveness_verified') else "Not Verified"
                
                pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
                
                pdf.set_text_color(15, 23, 42)
                pdf.cell(80, 10, f"  {s_name}", 1, 0, 'L', fill=fill)
                
                if status == "Present": pdf.set_text_color(16, 185, 129)
                elif status == "Absent": pdf.set_text_color(244, 63, 94)
                else: pdf.set_text_color(15, 23, 42)
                pdf.cell(30, 10, status, 1, 0, 'C', fill=fill)
                
                pdf.set_text_color(100, 116, 139)
                pdf.cell(35, 10, secs, 1, 0, 'C', fill=fill)
                
                if live == "Verified": pdf.set_text_color(8, 145, 178)
                else: pdf.set_text_color(148, 163, 184)
                pdf.cell(45, 10, live, 1, 1, 'C', fill=fill)
                
                fill = not fill
                
        # 4. Emotion Chart
        if img_buf:
            pdf.add_page()
            
            pdf.set_font("Arial", 'B', 22)
            pdf.set_text_color(15, 23, 42)
            pdf.cell(0, 15, "Emotional Engagement Analysis", 0, 1, 'C')
            
            pdf.set_draw_color(30, 58, 138)
            pdf.set_line_width(0.5)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(8)

            img_w = 150
            pdf.image(img_buf, x=(210 - img_w) / 2, y=pdf.get_y(), w=img_w, type='png')
            
            # Move cursor below image
            pdf.set_y(pdf.get_y() + (img_w * 0.75) + 10) # approximate height for matplotlib
            
            pdf.set_font("Arial", 'B', 14)
            pdf.set_text_color(71, 85, 105)
            pdf.cell(0, 10, "Emotion Distribution Breakdown", 0, 1, 'C')
            pdf.ln(5)
            
            pdf.set_font("Arial", 'B', 11)
            pdf.set_fill_color(30, 58, 138)
            pdf.set_text_color(255, 255, 255)
            
            pdf.set_x(45)
            pdf.cell(60, 10, "  Emotion Category", 1, 0, 'L', fill=True)
            pdf.cell(60, 10, "Recorded Instances", 1, 1, 'C', fill=True)
            
            pdf.set_font("Arial", '', 11)
            fill = False
            total_emos = sum(emo_counts.values())
            
            for emo, count in sorted(emo_counts.items(), key=lambda x: x[1], reverse=True):
                pdf.set_x(45)
                pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
                pdf.set_text_color(15, 23, 42)
                
                percentage = f"{(count / total_emos) * 100:.1f}%" if total_emos > 0 else "0%"
                
                pdf.cell(60, 10, f"  {str(emo).title()}", 1, 0, 'L', fill=fill)
                pdf.cell(60, 10, f"{count} ({percentage})", 1, 1, 'C', fill=fill)
                fill = not fill
        else:
            pdf.add_page()
            pdf.set_font("Arial", 'I', 12)
            pdf.set_text_color(100, 116, 139)
            pdf.cell(0, 10, "No emotion data gathered for this session.", 0, 1, 'C')
        
        pdf_buf = io.BytesIO()
        pdf.output(pdf_buf)
        pdf_buf.seek(0)
        
        # Smart Filename
        clean_batch = re.sub(r'[^a-zA-Z0-9_\-]', '', c_name.replace(' ', '_'))
        clean_time = time.replace(':', '-')
        filename = f"Attendance_Report_{clean_batch}_{date}_{clean_time}.pdf"
        
        return StreamingResponse(
            pdf_buf, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
        )
    except Exception as e: 
        print(f"PDF err: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")