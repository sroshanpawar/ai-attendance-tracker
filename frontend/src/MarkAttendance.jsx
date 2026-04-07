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
import Paper from '@mui/material/Paper'; // Changed from Card
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress'; 
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  // ... (All your existing state variables: webcamRef, batches, selectedBatchId, etc.) ...
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

  // ... (All your existing functions: getAuthToken, useEffect, handleBatchChange, sendFrame, handlers, etc.) ...
  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  useEffect(() => { const fetchBatches = async () => { setLoading(true); setError(''); try { const token = await getAuthToken(); const response = await axios.get(`${API_URL}/batches`, { headers: { 'Authorization': `Bearer ${token}` } }); setBatches(response.data); } catch (err) { setError('Could not fetch batches.'); } finally { setLoading(false); } }; fetchBatches(); }, []);
  useEffect(() => { if (selectedBatchId) { const batch = batches.find(b => b.id === parseInt(selectedBatchId)); setSelectedBatchInfo(batch); } else { setSelectedBatchInfo(null); } }, [selectedBatchId, batches]);
  const sendFrame = useCallback(async () => { if (!webcamRef.current || !session) return; const imageSrc = webcamRef.current.getScreenshot(); if (!imageSrc) return; try { const token = await getAuthToken(); await axios.post(`${API_URL}/session/frame`, { session_id: session.session_id, image_base64: imageSrc }, { headers: { 'Authorization': `Bearer ${token}` } }); console.log('Frame sent.'); } catch (err) { console.error('Error sending frame:', err); } }, [session]);
  const handleStartSession = async (e) => { e.preventDefault(); if (!selectedBatchId) { setError('Please select a batch.'); return; } setLoading(true); setError(''); setMessage('Starting session...'); const durationSecs = selectedDuration * 60; setTotalDurationSeconds(durationSecs); setCountdown(durationSecs); try { const token = await getAuthToken(); const response = await axios.post(`${API_URL}/session/start`, { batch_id: parseInt(selectedBatchId), duration_minutes: selectedDuration }, { headers: { 'Authorization': `Bearer ${token}` } }); setSession(response.data); setMessage('Session started! Marking attendance...'); } catch (err) { console.error('Error starting session:', err); const errorMsg = err.response?.data?.detail || 'Failed to start session.'; setError(errorMsg); setMessage(''); } finally { setLoading(false); } };
  const handleEndSession = useCallback(async () => { clearInterval(intervalRef.current); clearInterval(countdownIntervalRef.current); clearTimeout(sessionTimeoutRef.current); if (!session) return; setMessage('Session finished. Saving...'); setLoading(true); const sessionId = session.session_id; setSession(null); try { const token = await getAuthToken(); await axios.post(`${API_URL}/session/end`, { session_id: sessionId }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Attendance saved! Redirecting...'); setTimeout(() => navigate('/dashboard'), 2000); } catch (err) { console.error('Error ending session:', err); setError('Failed to save final attendance.'); setMessage(''); } finally { setLoading(false); } }, [session, navigate]);
  useEffect(() => { if (session) { const durationSecs = selectedDuration * 60; setCountdown(durationSecs); setTotalDurationSeconds(durationSecs); sendFrame(); intervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS); countdownIntervalRef.current = setInterval(() => { setCountdown(prev => (prev <= 1 ? 0 : prev - 1)); }, 1000); sessionTimeoutRef.current = setTimeout(() => { handleEndSession(); }, durationSecs * 1000); return () => { clearInterval(intervalRef.current); clearInterval(countdownIntervalRef.current); clearTimeout(sessionTimeoutRef.current); }; } else { clearInterval(intervalRef.current); clearInterval(countdownIntervalRef.current); clearTimeout(sessionTimeoutRef.current); } }, [session, selectedDuration, sendFrame, handleEndSession]);
  
  const progress = totalDurationSeconds > 0 ? (countdown / totalDurationSeconds) * 100 : 0;

  // Stage 1: Setup Form
  if (!session) {
    return (
      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}> {/* Center the form */}
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          Dashboard
        </Button>
        <Typography variant="h5" gutterBottom>Mark Attendance</Typography>

        {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleStartSession}>
          <FormControl fullWidth margin="normal" required disabled={loading}>
            <InputLabel id="batch-select-label">Select Batch</InputLabel>
            <Select
              labelId="batch-select-label"
              id="batch-select"
              value={selectedBatchId}
              label="Select Batch"
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              <MenuItem value=""><em>-- Select a Batch --</em></MenuItem>
              {batches.map(batch => (
                <MenuItem key={batch.id} value={batch.id}>
                  {batch.batch_name} ({batch.subject})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedBatchInfo && (
            <Alert severity="info" variant="outlined" sx={{ my: 1 }}>
              <strong>Subject:</strong> {selectedBatchInfo.subject}
            </Alert>
          )}

          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel id="duration-select-label">Session Duration</InputLabel>
            <Select
              labelId="duration-select-label"
              id="duration-select"
              value={selectedDuration}
              label="Session Duration"
              onChange={(e) => setSelectedDuration(parseFloat(e.target.value))}
            >
              {DURATION_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button type="submit" variant="contained" size="large" disabled={!selectedBatchId || loading} sx={{ mt: 2 }} fullWidth>
            {loading ? <CircularProgress size={24}/> : 'Start Session'}
          </Button>
        </Box>
      </Paper>
    );
  }

  // Stage 2: Active Session
  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}> {/* Center the active session */}
      <Typography variant="h5" gutterBottom>Attendance in Progress...</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Batch:</strong> {selectedBatchInfo?.batch_name} ({selectedBatchInfo?.subject})
      </Typography>

      <Box sx={{ border: '2px solid #ddd', width: '100%', aspectRatio: '4/3', margin: '15px auto', overflow: 'hidden', borderRadius: 2 }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      <Typography variant="h6" align="center" sx={{ my: 1 }}>
        Time Remaining: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
      </Typography>
      <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />

      {message && <Alert severity="info" sx={{ mt: 3 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
    </Paper>
  );
}