// src/EnrollStudent.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { supabase } from './supabaseClient';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Paper from '@mui/material/Paper';
import LinkedCameraRoundedIcon from '@mui/icons-material/LinkedCameraRounded';

const API_URL = 'http://localhost:8000';

export function EnrollStudent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const webcamRef = useRef(null);
  const [studentName, setStudentName] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [registerSelectedBatches, setRegisterSelectedBatches] = useState(new Set());

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

  const capture = useCallback(() => { const imageSrc = webcamRef.current.getScreenshot(); setImgSrc(imageSrc); }, [webcamRef, setImgSrc]);
  const handleRegisterBatchCheckbox = (batchId) => { setRegisterSelectedBatches(prev => { const newSet = new Set(prev); if (newSet.has(batchId)) newSet.delete(batchId); else newSet.add(batchId); return newSet; }); };
  
  const handleRegisterStudent = async (e) => { 
    e.preventDefault(); 
    if (!studentName || !imgSrc) { setError('Name and photo required.'); return; } 
    if (registerSelectedBatches.size === 0) { setError('Assign to at least one batch.'); return; } 
    setLoading(true); setError(''); setMessage(''); 
    try { 
      const token = await getAuthToken(); 
      await axios.post(`${API_URL}/student`, { name: studentName, image_base64: imgSrc, batch_ids: Array.from(registerSelectedBatches) }, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setMessage('Student registered successfully!'); setStudentName(''); setImgSrc(null); setRegisterSelectedBatches(new Set()); 
    } catch (err) { 
      setError(err.response?.data?.detail || 'Failed to register.'); 
    } finally { 
      setLoading(false); 
    } 
  };

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 600, mx: 'auto', p: { xs: 2, sm: 3 }, fontFamily: "'Inter', sans-serif" }}> 
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/manage')} sx={{ mb: 3, color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
        Back to Manage Hub
      </Button>

      {message && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }} elevation={0}>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkedCameraRoundedIcon sx={{ color: '#10b981' }} /> Enrol Student
        </Typography>
        <Box component="form" onSubmit={handleRegisterStudent} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField label="Student Full Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}/>
          
          <Box sx={{ width: '100%', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', border: '2px dashed #cbd5e1', bgcolor: '#f8fafc', position: 'relative', display: 'block' }}>
             {!imgSrc ? (
                <Webcam 
                  audio={false} 
                  ref={webcamRef} 
                  screenshotFormat="image/jpeg" 
                  videoConstraints={{ facingMode: "user", width: 1280, height: 720 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                />
             ) : (
                <img src={imgSrc} alt="Captured face" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             )}
          </Box>
          
          <Button onClick={!imgSrc ? capture : () => setImgSrc(null)} disabled={loading} variant="outlined" disableElevation sx={{ borderRadius: '12px', py: 1, borderColor: '#cbd5e1', color: '#0f172a', '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
            {!imgSrc ? 'Capture Face Data' : 'Retake Photo'}
          </Button>

          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', mb: 1.5 }}>Assign to Batches:</Typography>
            {batches.length === 0 ? (
              <Typography sx={{ fontSize: '0.8rem', color: '#ef4444' }}>Please create a batch first.</Typography>
            ) : (
              <Box sx={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc' }}>
                <FormGroup>
                  {batches.map(batch => (
                    <FormControlLabel key={batch.id} control={
                      <Checkbox checked={registerSelectedBatches.has(batch.id)} onChange={() => handleRegisterBatchCheckbox(batch.id)} size="small" />
                    } label={<Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{batch.batch_name}</Typography>} />
                  ))}
                </FormGroup>
              </Box>
            )}
          </Box>
          
          <Button type="submit" variant="contained" size="large" disableElevation disabled={loading || batches.length === 0 || !imgSrc} sx={{ borderRadius: '12px', py: 1.5, bgcolor: '#3b82f6', fontWeight: 800 }}>
            Complete Enrolment
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
