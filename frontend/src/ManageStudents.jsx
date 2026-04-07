// src/ManageStudents.jsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import axios from 'axios';
import { supabase } from './supabaseClient';

// --- MUI Imports ---
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
// --- End MUI Imports ---

const API_URL = 'http://localhost:8000';

// --- EditStudentBatches Component (remains the same) ---
const EditStudentBatches = ({ student, allBatches, onSave, onCancel, loading }) => {
    const [currentSelectedBatches, setCurrentSelectedBatches] = useState(() => new Set(student.batches.map(b => b.id)));
    const handleCheckboxChange = (batchId) => { setCurrentSelectedBatches(prev => { const newSet = new Set(prev); if (newSet.has(batchId)) newSet.delete(batchId); else newSet.add(batchId); return newSet; }); };
    return ( <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, mt: 1, bgcolor: '#f9f9f9', width: '100%' }}> <Typography variant="subtitle1" gutterBottom>Edit Batches for {student.name}</Typography> <FormGroup> {allBatches.map(batch => ( <FormControlLabel key={batch.id} control={<Checkbox checked={currentSelectedBatches.has(batch.id)} onChange={() => handleCheckboxChange(batch.id)} />} label={`${batch.batch_name} (${batch.subject})`} /> ))} </FormGroup> <Box sx={{ mt: 2 }}> <Button onClick={() => onSave(student.id, Array.from(currentSelectedBatches))} disabled={loading} variant="contained" size="small">Save</Button> <Button onClick={onCancel} disabled={loading} size="small" sx={{ ml: 1 }}>Cancel</Button> </Box> </Box> );
};

// --- Main Page Component ---
export function ManageStudents() {
  const navigate = useNavigate();
  // ... (All your existing state variables: loading, message, error, batches, students, etc.) ...
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSubject, setNewBatchSubject] = useState('');
  const webcamRef = useRef(null);
  const [studentName, setStudentName] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  const [registerSelectedBatches, setRegisterSelectedBatches] = useState(new Set());
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatchId, setFilterBatchId] = useState(null);

  // ... (All your existing functions: useEffect, getAuthToken, fetchBatches, fetchStudents, handlers, etc.) ...
  useEffect(() => { fetchBatches(); fetchStudents(); }, []);
  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  const fetchBatches = async () => { setLoading(true); setError(''); try { const token = await getAuthToken(); const response = await axios.get(`${API_URL}/batches`, { headers: { 'Authorization': `Bearer ${token}` } }); setBatches(response.data); } catch (err) { setError('Could not fetch batches.'); } finally { setLoading(false); } };
  const fetchStudents = async () => { setLoading(true); setError(''); try { const token = await getAuthToken(); const response = await axios.get(`${API_URL}/students`, { headers: { 'Authorization': `Bearer ${token}` } }); setStudents(response.data); } catch (err) { setError('Could not fetch students.'); } finally { setLoading(false); } };
  const handleCreateBatch = async (e) => { e.preventDefault(); setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); const response = await axios.post(`${API_URL}/batch`, { batch_name: newBatchName, subject: newBatchSubject }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Batch created!'); setNewBatchName(''); setNewBatchSubject(''); setBatches(prev => [response.data.data, ...prev]); } catch (err) { setError(err.response?.data?.detail || 'Failed to create batch.'); } finally { setLoading(false); } };
  const handleDeleteBatch = async (batchId) => { if (!window.confirm("Delete this batch?")) return; setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.delete(`${API_URL}/batch/${batchId}`, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Batch deleted!'); setBatches(prev => prev.filter(b => b.id !== batchId)); } catch (err) { setError(err.response?.data?.detail || 'Failed to delete batch.'); } finally { setLoading(false); } };
  const capture = useCallback(() => { const imageSrc = webcamRef.current.getScreenshot(); setImgSrc(imageSrc); }, [webcamRef, setImgSrc]);
  const handleRegisterBatchCheckbox = (batchId) => { setRegisterSelectedBatches(prev => { const newSet = new Set(prev); if (newSet.has(batchId)) newSet.delete(batchId); else newSet.add(batchId); return newSet; }); };
  const handleRegisterStudent = async (e) => { e.preventDefault(); if (!studentName || !imgSrc) { setError('Name and photo required.'); return; } if (registerSelectedBatches.size === 0) { setError('Assign to at least one batch.'); return; } setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.post(`${API_URL}/student`, { name: studentName, image_base64: imgSrc, batch_ids: Array.from(registerSelectedBatches) }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Student registered!'); setStudentName(''); setImgSrc(null); setRegisterSelectedBatches(new Set()); fetchStudents(); } catch (err) { setError(err.response?.data?.detail || 'Failed to register.'); } finally { setLoading(false); } };
  const handleSaveStudentBatches = async (studentId, updatedBatchIds) => { setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.put(`${API_URL}/student/${studentId}/batches`, { batch_ids: updatedBatchIds }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Student updated.'); setEditingStudentId(null); fetchStudents(); } catch (err) { setError(err.response?.data?.detail || 'Failed to update.'); } finally { setLoading(false); } };
  const handleDeleteStudent = async (studentId) => { if (!window.confirm("Delete this student permanently?")) return; setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.delete(`${API_URL}/student/${studentId}`, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Student deleted!'); setStudents(prev => prev.filter(s => s.id !== studentId)); } catch (err) { setError(err.response?.data?.detail || 'Failed to delete.'); } finally { setLoading(false); } };
  const filteredStudents = useMemo(() => { return students.filter(student => { const nameMatches = student.name.toLowerCase().includes(searchTerm.toLowerCase()); const batchMatches = filterBatchId === null || student.batches.some(batch => batch.id === filterBatchId); return nameMatches && batchMatches; }); }, [students, searchTerm, filterBatchId]);


  return (
    // Add a maxWidth Box to center the content on the new background
    <Box sx={{ flexGrow: 1, maxWidth: 1400, mx: 'auto' }}> 
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Dashboard
      </Button>
      <Typography variant="h4" component="h1" gutterBottom>Manage Students & Batches</Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>

        {/* --- Column 1: Batch Management & Registration --- */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}> {/* Use Paper and padding */}
            <Typography variant="h6" gutterBottom>Manage Batches</Typography>
            <Box component="form" onSubmit={handleCreateBatch} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField label="Batch Name" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} required size="small" sx={{ flexGrow: 1 }} />
                <TextField label="Subject" value={newBatchSubject} onChange={(e) => setNewBatchSubject(e.target.value)} required size="small" sx={{ flexGrow: 1 }} />
                <Button type="submit" variant="contained" disabled={loading}>Create</Button>
            </Box>
            <List dense sx={{maxHeight: 200, overflowY: 'auto'}}>
              {batches.map(batch => (
                <ListItem key={batch.id} secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteBatch(batch.id)} disabled={loading} size="small"> <DeleteIcon fontSize="small"/> </IconButton>
                }>
                  <ListItemText primary={batch.batch_name} secondary={batch.subject} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}> {/* Use Paper and padding */}
            <Typography variant="h6" gutterBottom>Register New Student</Typography>
            <Box component="form" onSubmit={handleRegisterStudent}>
              <TextField label="Student Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required fullWidth margin="normal" size="small"/>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                      <Box sx={{ border: '1px solid #ccc', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 2 }}>
                          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', height: '100%' }}/>
                      </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <Box sx={{ border: '1px solid #ccc', width: '100%', aspectRatio: '4/3', background: '#f0f0f0', borderRadius: 2 }}>
                          {imgSrc && <img src={imgSrc} alt="Captured" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </Box>
                  </Grid>
              </Grid>
              <Button onClick={capture} disabled={loading} variant="outlined" sx={{ mr: 1, mb: 2 }}>Capture Photo</Button>

              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Assign to Batches:</Typography>
              {batches.length === 0 ? (<Typography variant="body2">Create a batch first.</Typography>) : (
                <Box sx={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #eee', p: 1, mb: 2, borderRadius: 2 }}>
                  <FormGroup>
                    {batches.map(batch => (
                      <FormControlLabel key={batch.id} control={
                        <Checkbox checked={registerSelectedBatches.has(batch.id)} onChange={() => handleRegisterBatchCheckbox(batch.id)}/>
                      } label={`${batch.batch_name} (${batch.subject})`} />
                    ))}
                  </FormGroup>
                </Box>
              )}
              <Button type="submit" variant="contained" size="large" disabled={loading || batches.length === 0 || !imgSrc}>Register Student</Button>
            </Box>
          </Paper>
        </Grid>

        {/* --- Column 2: Existing Students --- */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}> {/* Use Paper and padding */}
            <Typography variant="h6" gutterBottom>Existing Students</Typography>
            
            <Box sx={{ mb: 2 }}>
              <TextField fullWidth size="small" variant="outlined" placeholder="Search students by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: ( <InputAdornment position="start"> <SearchIcon /> </InputAdornment> ),
                }}
              />
            </Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}> {/* Added gap for wrapping */}
                <Chip label="All Batches" clickable color={filterBatchId === null ? "primary" : "default"} onClick={() => setFilterBatchId(null)} size="small" />
              {batches.map(batch => (
                 <Chip key={batch.id} label={batch.batch_name} clickable color={filterBatchId === batch.id ? "primary" : "default"} onClick={() => setFilterBatchId(batch.id)} size="small" />
              ))}
            </Stack>

            {loading && students.length === 0 && <CircularProgress size={24}/>}
            {!loading && students.length === 0 && (<Typography variant="body2">No students registered yet.</Typography>)}
            {!loading && filteredStudents.length === 0 && students.length > 0 && (<Typography variant="body2">No students match the current filter.</Typography>)}

            <List sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {filteredStudents.map(student => (
                <React.Fragment key={student.id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={() => editingStudentId === student.id ? setEditingStudentId(null) : setEditingStudentId(student.id)} disabled={loading} sx={{ mr: 0.5 }} size="small"> <EditIcon fontSize="small"/> </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteStudent(student.id)} disabled={loading} size="small"> <DeleteIcon fontSize="small"/> </IconButton>
                      </>
                    }
                    sx={{ pr: 12 }}
                  >
                    <ListItemText
                      primary={student.name}
                      secondary={`Batches: ${student.batches.map(b => b.batch_name).join(', ') || 'None'}`}
                    />
                  </ListItem>
                  {editingStudentId === student.id && (
                    <ListItem>
                      <EditStudentBatches student={student} allBatches={batches} onSave={handleSaveStudentBatches} onCancel={() => setEditingStudentId(null)} loading={loading} />
                    </ListItem>
                  )}
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}