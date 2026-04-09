import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../lib/axios';
import { Play, Square, Video, Clock, CheckCircle2, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const FRAME_INTERVAL_MS = 4000;

const DURATION_OPTIONS = [
  { label: '30 Seconds', value: 0.5 }, { label: '1 Minute', value: 1 },
  { label: '5 Minutes', value: 5 },   { label: '10 Minutes', value: 10 },
  { label: '15 Minutes', value: 15 }, { label: '20 Minutes', value: 20 },
  { label: '25 Minutes', value: 25 }, { label: '30 Minutes', value: 30 },
];

export default function MarkAttendance({ session: authSession }) {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1].value);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);

  const intervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const sessionTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/batches`);
        setBatches(response.data);
      } catch (err) {
        setError('Could not fetch batches.');
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      const batch = batches.find((b) => b.id === parseInt(selectedBatchId));
      setSelectedBatchInfo(batch);
    } else {
      setSelectedBatchInfo(null);
    }
  }, [selectedBatchId, batches]);

  const sendFrame = useCallback(async () => {
    if (!webcamRef.current || !session) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    try {
      await api.post(`/session/frame`, { session_id: session.session_id, image_base64: imageSrc });
    } catch (err) {
      console.error('Error sending frame:', err);
    }
  }, [session]);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) { setError('Please select a batch.'); return; }
    setLoading(true); setError(''); setMessage('Initializing environment...');
    const durationSecs = selectedDuration * 60;
    setTotalDurationSeconds(durationSecs);
    setCountdown(durationSecs);
    try {
      const response = await api.post(`/session/start`, { batch_id: parseInt(selectedBatchId), duration_minutes: selectedDuration });
      setSession(response.data);
      setMessage('Session Live! AI Recognition Active.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start session.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = useCallback(async () => {
    clearInterval(intervalRef.current); clearInterval(countdownIntervalRef.current); clearTimeout(sessionTimeoutRef.current);
    if (!session) return;
    setMessage('Session finished. Finalizing records...');
    setLoading(true);
    const sessionId = session.session_id;
    setSession(null);
    try {
      await api.post(`/session/end`, { session_id: sessionId });
      setMessage('Attendance successfully saved! Redirecting...');
      setTimeout(() => navigate('/past-records'), 1500);
    } catch (err) {
      setError('Failed to save final attendance.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  }, [session, navigate]);

  useEffect(() => {
    if (session) {
      const durationSecs = selectedDuration * 60;
      setCountdown(durationSecs); setTotalDurationSeconds(durationSecs);
      sendFrame();
      intervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS);
      countdownIntervalRef.current = setInterval(() => { setCountdown(prev => (prev <= 1 ? 0 : prev - 1)); }, 1000);
      sessionTimeoutRef.current = setTimeout(() => { handleEndSession(); }, durationSecs * 1000);
      return () => { clearInterval(intervalRef.current); clearInterval(countdownIntervalRef.current); clearTimeout(sessionTimeoutRef.current); };
    } else {
      clearInterval(intervalRef.current); clearInterval(countdownIntervalRef.current); clearTimeout(sessionTimeoutRef.current);
    }
  }, [session, selectedDuration, sendFrame, handleEndSession]);

  const progress = totalDurationSeconds > 0 ? (countdown / totalDurationSeconds) * 100 : 0;

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-semibold transition-colors text-sm">
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Config Setup */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100">
            <h2 className="text-2xl font-extrabold text-primary mb-2">Start a Live Session</h2>
            <p className="text-sm text-slate-500 font-medium mb-8">Configure your class session before opening the camera.</p>

            {message && (
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm font-bold flex gap-2 items-center mb-6 border border-blue-100">
                <CheckCircle2 className="w-5 h-5" /> {message}
              </div>
            )}
            {error && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold flex gap-2 items-center mb-6 border border-rose-100">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}

            <form onSubmit={handleStartSession} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Batch</label>
                <select
                  required
                  disabled={loading}
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-primary font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  <option value="" disabled>Choose a batch</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.batch_name} ({batch.subject})</option>
                  ))}
                </select>
              </div>

              {selectedBatchInfo && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                  <p className="text-sm text-indigo-900">
                    <span className="font-bold text-indigo-700">Subject:</span> {selectedBatchInfo.subject} <br />
                    <span className="font-bold text-indigo-700">Batch:</span> {selectedBatchInfo.batch_name}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tracking Duration</label>
                <select
                  disabled={loading}
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-primary font-semibold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedBatchId || loading}
                className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
                Launch Camera & Start
              </button>
            </form>
          </div>

          {/* Graphic Side */}
          <div className="hidden lg:flex bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl p-12 h-full flex-col justify-center items-center text-center">
            <Video className="w-24 h-24 text-slate-300 mb-6 drop-shadow-md" />
            <h3 className="text-2xl font-extrabold text-slate-700 mb-4">Automated Face Tracking</h3>
            <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
              The engine will securely sample frames during the session to identify students in the room. Ensure your camera is permitted and has a clear view of the classroom.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Live State ---
  return (
    <div className="w-full h-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-4 px-6 flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 justify-center px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full font-bold text-xs tracking-wider uppercase">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
            Live Tracking Phase
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedBatchInfo?.subject}</p>
            <p className="text-white font-semibold text-sm">{selectedBatchInfo?.batch_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Remaining</p>
            <p className="text-white font-extrabold text-xl font-mono flex items-center justify-end gap-1.5 mt-0.5">
              <Clock className="w-5 h-5 text-slate-400" />
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={handleEndSession}
            disabled={loading}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-4 h-4 fill-white" />}
            End Session
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Progress & Info */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-3xl p-6 h-full shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col">
            <h3 className="text-lg font-extrabold text-primary mb-6 flex items-center gap-2">
              <ActivityIcon className="text-accent w-5 h-5" /> Session Diagnostics
            </h3>

            {message && <div className="bg-blue-50 text-blue-700 text-sm font-bold p-4 rounded-xl mb-4 border border-blue-100">{message}</div>}
            {error && <div className="bg-rose-50 text-rose-700 text-sm font-bold p-4 rounded-xl mb-4 border border-rose-100">{error}</div>}

            <div className="space-y-3 mb-8">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Subject</p>
                <p className="font-extrabold text-primary">{selectedBatchInfo?.subject}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Duration Target</p>
                <p className="font-extrabold text-primary">{selectedDuration} Minutes</p>
              </div>
            </div>

            <div className="mt-auto flex flex-col items-center justify-center p-6 text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse"></div>
              </div>
              <p className="mt-4 font-bold text-primary">Processing Faces in Real-time</p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Results will be available in Past Records once the session is finalized.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Camera View & High-Tech Overlays */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="bg-white rounded-3xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex-1 flex flex-col">
            
            <div className="relative w-full rounded-2xl overflow-hidden bg-black flex-1 shadow-inner aspect-video">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Overlays */}
              <div className="absolute inset-0 border-2 border-accent/30 pointer-events-none mix-blend-screen rounded-2xl"></div>
              
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-accent/80 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-accent/80 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-accent/80 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-accent/80 rounded-br-lg"></div>

              {/* Status indicator overlay */}
              <div className="absolute top-6 right-6 backdrop-blur-md bg-black/40 text-white px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-widest flex items-center gap-2 border border-white/10">
                <Video className="w-3.5 h-3.5 text-accent" />
                AUTO-SAMPLING ACTIVE
              </div>
            </div>

            {/* Hardware Progress Bar */}
            <div className="px-3 pt-6 pb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Buffer Progress</span>
                <span className="text-xs font-extrabold text-accent">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="bg-accent h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

// Simple icon wrapper
function ActivityIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
