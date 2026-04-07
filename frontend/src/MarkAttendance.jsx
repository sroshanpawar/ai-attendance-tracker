// src/MarkAttendance.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { supabase } from './supabaseClient';

// --- MUI Imports ---
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Divider from '@mui/material/Divider';

import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import StopCircleRoundedIcon from '@mui/icons-material/StopCircleRounded';
import VideoCameraFrontRoundedIcon from '@mui/icons-material/VideoCameraFrontRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import LinkedCameraRoundedIcon from '@mui/icons-material/LinkedCameraRounded';
// --- End MUI Imports ---

const API_URL = 'http://localhost:8000';
const FRAME_INTERVAL_MS = 4000; 

const DURATION_OPTIONS = [
  { label: '30 Seconds', value: 0.5 }, { label: '1 Minute', value: 1 },
  { label: '5 Minutes', value: 5 },   { label: '10 Minutes', value: 10 },
  { label: '15 Minutes', value: 15 }, { label: '20 Minutes', value: 20 },
  { label: '25 Minutes', value: 25 }, { label: '30 Minutes', value: 30 },
];

export function MarkAttendance() {
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

  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  
  useEffect(() => { 
    const fetchBatches = async () => { 
      setLoading(true); setError(''); 
      try { 
        const token = await getAuthToken(); 
        const response = await axios.get(`${API_URL}/batches`, { headers: { 'Authorization': `Bearer ${token}` } }); 
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
      const batch = batches.find(b => b.id === parseInt(selectedBatchId)); 
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
      const token = await getAuthToken(); 
      await axios.post(`${API_URL}/session/frame`, { session_id: session.session_id, image_base64: imageSrc }, { headers: { 'Authorization': `Bearer ${token}` } }); 
      console.log('Frame sent.'); 
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
      const token = await getAuthToken(); 
      const response = await axios.post(`${API_URL}/session/start`, { batch_id: parseInt(selectedBatchId), duration_minutes: selectedDuration }, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setSession(response.data); 
      setMessage('Session Live! AI Recognition Active.'); 
    } catch (err) { 
      const errorMsg = err.response?.data?.detail || 'Failed to start session.'; 
      setError(errorMsg); 
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
      const token = await getAuthToken(); 
      await axios.post(`${API_URL}/session/end`, { session_id: sessionId }, { headers: { 'Authorization': `Bearer ${token}` } }); 
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

  // ── Stage 1: Setup Form ────────────────────────────────────────────────────────
  if (!session) {
    return (
      <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 }, fontFamily: "'Inter', sans-serif" }}> 
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 3, color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
          Back to Dashboard
        </Button>

        <Grid container spacing={4} alignItems="center">
          {/* Left Column: Form */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }} elevation={0}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                Start Session
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#64748b', mb: 3 }}>
                Configure your class session before opening the camera.
              </Typography>

              {message && <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>{message}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

              <Box component="form" onSubmit={handleStartSession} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', mb: 1, textTransform: 'uppercase' }}>Select Class Batch</Typography>
                  <FormControl fullWidth required disabled={loading} size="small">
                    <Select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                    >
                      <MenuItem value="" disabled><em>Choose a batch</em></MenuItem>
                      {batches.map(batch => (
                        <MenuItem key={batch.id} value={batch.id} sx={{ fontWeight: 500 }}>
                          {batch.batch_name} ({batch.subject})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {selectedBatchInfo && (
                  <Box sx={{ p: 2, bgcolor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#1e3a8a' }}>
                      <strong>Subject:</strong> {selectedBatchInfo.subject} <br/>
                      <strong>Batch Name:</strong> {selectedBatchInfo.batch_name}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', mb: 1, textTransform: 'uppercase' }}>Tracking Duration</Typography>
                  <FormControl fullWidth disabled={loading} size="small">
                    <Select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(parseFloat(e.target.value))}
                      sx={{ borderRadius: '12px', bgcolor: '#f8fafc' }}
                    >
                      {DURATION_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value} sx={{ fontWeight: 500 }}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  disabled={!selectedBatchId || loading} 
                  disableElevation
                  startIcon={!loading && <PlayCircleFilledRoundedIcon />}
                  sx={{ mt: 1, borderRadius: '12px', py: 1.5, bgcolor: '#0f172a', fontWeight: 800, '&:hover': { bgcolor: '#1e293b' } }} 
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }}/> : 'Launch Camera & Start'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Information/Illustration Area */}
          <Grid item xs={12} md={7} sx={{ display: { xs: 'none', md: 'block' } }}>
             <Box sx={{ p: 5, borderRadius: '24px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', minHeight: '400px' }}>
                <VideoCameraFrontRoundedIcon sx={{ fontSize: '80px', color: '#94a3b8', mb: 2 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#334155', mb: 1 }}>
                   Automated Face Tracking
                </Typography>
                <Typography sx={{ color: '#64748b', maxWidth: '400px' }}>
                   The engine will sample frames every few seconds during the session to identify students in the room. Ensure your camera has a clear view of the classroom.
                </Typography>
             </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ── Stage 2: Active Session Split View ────────────────────────────────────────────────────────
  return (
    <Box sx={{ flexGrow: 1, maxWidth: '100%', mx: 'auto', p: { xs: 2, sm: 3 }, fontFamily: "'Inter', sans-serif" }}> 
      
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 3, bgcolor: '#1e293b', color: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }}></span>
              LIVE RECORDING
           </Typography>
           <Divider orientation="vertical" variant="middle" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
           <Box>
             <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Batch</Typography>
             <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>{selectedBatchInfo?.batch_name}</Typography>
           </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
           <Box sx={{ textAlign: 'right' }}>
             <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Time Remaining</Typography>
             <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 0.5 }}>
               <AccessTimeRoundedIcon fontSize="small"/> {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
             </Typography>
           </Box>
           <Button 
             variant="contained" 
             color="error" 
             disableElevation 
             onClick={handleEndSession} 
             disabled={loading}
             sx={{ borderRadius: '12px', fontWeight: 800, py: 1 }}
           >
             End Session
           </Button>
        </Box>
      </Box>

      {/* Main Split Layout */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        
        {/* Left: Info / Status */}
        <Box sx={{ width: { xs: '100%', md: '33.333333%' }, flexShrink: 0 }}>
          <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%', display: 'flex', flexDirection: 'column' }} elevation={0}>
             <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolRoundedIcon sx={{ color: '#8b5cf6' }}/> Session Diagnostics
             </Typography>
             
             {message && <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>{message}</Alert>}
             {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

             <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                   <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 0.5 }}>Subject</Typography>
                   <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{selectedBatchInfo?.subject}</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                   <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 0.5 }}>Duration Target</Typography>
                   <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{selectedDuration} Minutes</Typography>
                </Box>
                
                <Box sx={{ mt: 'auto', textAlign: 'center', pt: 4 }}>
                   <CircularProgress size={40} sx={{ color: '#3b82f6', mb: 2 }} />
                   <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                      Processing Faces...
                   </Typography>
                   <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mt: 1 }}>
                      Results will be available in Past Records once the session ends.
                   </Typography>
                </Box>
             </Box>
          </Paper>
        </Box>

        {/* Right: Camera Feed */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, borderRadius: '24px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }} elevation={0}>
             {/* Widescreen container for webcam using 16:9 padding hack */}
             <Box sx={{ width: '100%', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', bgcolor: '#000', position: 'relative', display: 'block' }}>
               <Webcam
                 audio={false}
                 ref={webcamRef}
                 screenshotFormat="image/jpeg"
                 videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
                 style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
               />
               
               {/* Frame sampling visual indicator */}
               <Box sx={{ position: 'absolute', right: 16, top: 16, px: 2, py: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, backdropFilter: 'blur(4px)', zIndex: 10 }}>
                   <LinkedCameraRoundedIcon sx={{ fontSize: '1rem' }} /> Auto-Sampling Active
               </Box>
             </Box>

             {/* Progress Bar inside Camera Card, below video */}
             <Box sx={{ px: 2, mt: 4, mb: 1 }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                 <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>SESSION PROGRESS</Typography>
                 <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6' }}>{Math.round(progress)}%</Typography>
               </Box>
               <LinearProgress variant="determinate" value={progress} sx={{ flexGrow: 1, height: 16, borderRadius: 8, '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }, backgroundColor: '#e2e8f0' }} />
             </Box>
          </Paper>
        </Box>

      </Box>
      
      {/* Add keyframes for pulse animation globally in the file if needed, or inline using JS */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </Box>
  );
}