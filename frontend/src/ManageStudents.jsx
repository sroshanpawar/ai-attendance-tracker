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
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import LinkedCameraRoundedIcon from '@mui/icons-material/LinkedCameraRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
// --- End MUI Imports ---

const API_URL = 'http://localhost:8000';

const EditStudentBatches = ({ student, allBatches, onSave, onCancel, loading }) => {
    const [currentSelectedBatches, setCurrentSelectedBatches] = useState(() => new Set(student.batches.map(b => b.id)));
    const handleCheckboxChange = (batchId) => { setCurrentSelectedBatches(prev => { const newSet = new Set(prev); if (newSet.has(batchId)) newSet.delete(batchId); else newSet.add(batchId); return newSet; }); };
    return ( <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', mt: 1, bgcolor: '#f8fafc', width: '100%' }}> <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>Edit Batches for {student.name}</Typography> <FormGroup> {allBatches.map(batch => ( <FormControlLabel key={batch.id} control={<Checkbox checked={currentSelectedBatches.has(batch.id)} onChange={() => handleCheckboxChange(batch.id)} size="small" />} label={<Typography sx={{fontSize: '0.85rem'}}>{`${batch.batch_name} (${batch.subject})`}</Typography>} /> ))} </FormGroup> <Box sx={{ mt: 2 }}> <Button onClick={() => onSave(student.id, Array.from(currentSelectedBatches))} disabled={loading} variant="contained" size="small" disableElevation sx={{ borderRadius: '8px' }}>Save</Button> <Button onClick={onCancel} disabled={loading} size="small" sx={{ ml: 1, color: '#64748b' }}>Cancel</Button> </Box> </Box> );
};

export function ManageStudents() {
  const navigate = useNavigate();
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

  useEffect(() => { fetchBatches(); fetchStudents(); }, []);
  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  const fetchBatches = async () => { setLoading(true); setError(''); try { const token = await getAuthToken(); const response = await axios.get(`${API_URL}/batches`, { headers: { 'Authorization': `Bearer ${token}` } }); setBatches(response.data); } catch (err) { setError('Could not fetch batches.'); } finally { setLoading(false); } };
  const fetchStudents = async () => { setLoading(true); setError(''); try { const token = await getAuthToken(); const response = await axios.get(`${API_URL}/students`, { headers: { 'Authorization': `Bearer ${token}` } }); setStudents(response.data); } catch (err) { setError('Could not fetch students.'); } finally { setLoading(false); } };
  const handleCreateBatch = async (e) => { e.preventDefault(); setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); const response = await axios.post(`${API_URL}/batch`, { batch_name: newBatchName, subject: newBatchSubject }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Batch created!'); setNewBatchName(''); setNewBatchSubject(''); setBatches(prev => [response.data.data, ...prev]); } catch (err) { setError(err.response?.data?.detail || 'Failed to create batch.'); } finally { setLoading(false); } };
  const handleDeleteBatch = async (batchId) => { if (!window.confirm("Delete this batch? Current students will lose this association.")) return; setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.delete(`${API_URL}/batch/${batchId}`, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Batch deleted!'); setBatches(prev => prev.filter(b => b.id !== batchId)); } catch (err) { setError(err.response?.data?.detail || 'Failed to delete batch.'); } finally { setLoading(false); } };
  const capture = useCallback(() => { const imageSrc = webcamRef.current.getScreenshot(); setImgSrc(imageSrc); }, [webcamRef, setImgSrc]);
  const handleRegisterBatchCheckbox = (batchId) => { setRegisterSelectedBatches(prev => { const newSet = new Set(prev); if (newSet.has(batchId)) newSet.delete(batchId); else newSet.add(batchId); return newSet; }); };
  const handleRegisterStudent = async (e) => { e.preventDefault(); if (!studentName || !imgSrc) { setError('Name and photo required.'); return; } if (registerSelectedBatches.size === 0) { setError('Assign to at least one batch.'); return; } setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.post(`${API_URL}/student`, { name: studentName, image_base64: imgSrc, batch_ids: Array.from(registerSelectedBatches) }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Student registered successfully!'); setStudentName(''); setImgSrc(null); setRegisterSelectedBatches(new Set()); fetchStudents(); } catch (err) { setError(err.response?.data?.detail || 'Failed to register.'); } finally { setLoading(false); } };
  const handleSaveStudentBatches = async (studentId, updatedBatchIds) => { setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.put(`${API_URL}/student/${studentId}/batches`, { batch_ids: updatedBatchIds }, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Student updated.'); setEditingStudentId(null); fetchStudents(); } catch (err) { setError(err.response?.data?.detail || 'Failed to update.'); } finally { setLoading(false); } };
  const handleDeleteStudent = async (studentId) => { if (!window.confirm("Delete this student permanently?")) return; setLoading(true); setError(''); setMessage(''); try { const token = await getAuthToken(); await axios.delete(`${API_URL}/student/${studentId}`, { headers: { 'Authorization': `Bearer ${token}` } }); setMessage('Student deleted!'); setStudents(prev => prev.filter(s => s.id !== studentId)); } catch (err) { setError(err.response?.data?.detail || 'Failed to delete.'); } finally { setLoading(false); } };
  
  const filteredStudents = useMemo(() => { return students.filter(student => { const nameMatches = student.name.toLowerCase().includes(searchTerm.toLowerCase()); const batchMatches = filterBatchId === null || student.batches.some(batch => batch.id === filterBatchId); return nameMatches && batchMatches; }); }, [students, searchTerm, filterBatchId]);

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 }, fontFamily: "'Inter', sans-serif" }}> 
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 3, color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
        Back to Dashboard
      </Button>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <GroupAddRoundedIcon sx={{ fontSize: '2.5rem', color: '#3b82f6' }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Roster Management
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#64748b' }}>
            Register new students, capture their biometric encodings, and assign them to batches.
          </Typography>
        </Box>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Grid container spacing={4}>
        
        {/* --- Column 1: Batch & Registration Flow --- */}
        <Grid item xs={12} md={5}>
          
          {/* Batches Panel */}
          <Paper sx={{ p: 4, mb: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }} elevation={0}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddCircleOutlineRoundedIcon sx={{ color: '#8b5cf6' }} /> Manage Batches
            </Typography>
            <Box component="form" onSubmit={handleCreateBatch} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <TextField placeholder="e.g. CS-101 Morning" label="Batch Name" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} required size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                <TextField placeholder="e.g. Computer Science" label="Subject" value={newBatchSubject} onChange={(e) => setNewBatchSubject(e.target.value)} required size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                <Button type="submit" variant="contained" disableElevation disabled={loading} sx={{ borderRadius: '12px', py: 1, bgcolor: '#0f172a', '&:hover': { bgcolor: '#1e293b' } }}>
                  Create Batch
                </Button>
            </Box>
            
            {batches.length > 0 && (
              <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <List dense sx={{ maxHeight: 200, overflowY: 'auto', p: 0 }}>
                  {batches.map((batch, idx) => (
                    <Box key={batch.id}>
                      {idx > 0 && <Divider />}
                      <ListItem secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteBatch(batch.id)} disabled={loading} size="small" sx={{ color: '#ef4444' }}> 
                          <DeleteIcon fontSize="small"/> 
                        </IconButton>
                      } sx={{ py: 1.5 }}>
                        <ListItemText 
                          primary={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{batch.batch_name}</Typography>} 
                          secondary={<Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{batch.subject}</Typography>} 
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Box>
            )}
          </Paper>

          {/* Register Panel */}
          <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }} elevation={0}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkedCameraRoundedIcon sx={{ color: '#10b981' }} /> Enrol Student
            </Typography>
            <Box component="form" onSubmit={handleRegisterStudent} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField label="Student Full Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}/>
              
              {/* Fix for Camera Bug: Fixed size container with strict constraints */}
              <Box sx={{ width: '100%', maxWidth: '100%', aspectRatio: '4/3', borderRadius: '16px', overflow: 'hidden', border: '2px dashed #cbd5e1', bgcolor: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {!imgSrc ? (
                    <Webcam 
                      audio={false} 
                      ref={webcamRef} 
                      screenshotFormat="image/jpeg" 
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
        </Grid>

        {/* --- Column 2: Resident Database --- */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%', display: 'flex', flexDirection: 'column' }} elevation={0}>
            <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 3 }}>
              Enrolled Students Database
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <TextField fullWidth size="small" variant="outlined" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' } }}
                InputProps={{
                  startAdornment: ( <InputAdornment position="start"> <SearchIcon sx={{ color: '#94a3b8' }} /> </InputAdornment> ),
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', mb: 1 }}>Filter by Batch</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="All" clickable variant={filterBatchId === null ? "filled" : "outlined"} onClick={() => setFilterBatchId(null)} size="small" sx={{ fontWeight: 600, border: filterBatchId !== null ? '1px solid #e2e8f0' : 'none' }} />
                {batches.map(batch => (
                   <Chip key={batch.id} label={batch.batch_name} clickable color={filterBatchId === batch.id ? "primary" : "default"} variant={filterBatchId === batch.id ? "filled" : "outlined"} onClick={() => setFilterBatchId(batch.id)} size="small" sx={{ fontWeight: 600, border: filterBatchId !== batch.id ? '1px solid #e2e8f0' : 'none' }} />
                ))}
              </Stack>
            </Box>

            {loading && students.length === 0 && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={32}/></Box>}
            {!loading && students.length === 0 && (<Box sx={{ textAlign: 'center', p: 4, color: '#94a3b8' }}><Typography>Database is empty.</Typography></Box>)}
            {!loading && filteredStudents.length === 0 && students.length > 0 && (<Box sx={{ textAlign: 'center', p: 4, color: '#94a3b8' }}><Typography>No matches found.</Typography></Box>)}

            <Box sx={{ flexGrow: 1, borderTop: '1px solid #f1f5f9' }}>
              <List sx={{ maxHeight: 650, overflowY: 'auto' }}>
                {filteredStudents.map((student, idx) => (
                  <React.Fragment key={student.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton aria-label="edit" onClick={() => editingStudentId === student.id ? setEditingStudentId(null) : setEditingStudentId(student.id)} disabled={loading} size="small" sx={{ color: '#3b82f6', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}> <EditIcon fontSize="small"/> </IconButton>
                          <IconButton aria-label="delete" onClick={() => handleDeleteStudent(student.id)} disabled={loading} size="small" sx={{ color: '#ef4444', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}> <DeleteIcon fontSize="small"/> </IconButton>
                        </Box>
                      }
                      sx={{ py: 2 }}
                    >
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{student.name}</Typography>}
                        secondary={<Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.5 }}>{student.batches.length > 0 ? student.batches.map(b => b.batch_name).join(', ') : 'No Batches'}</Typography>}
                      />
                    </ListItem>
                    {editingStudentId === student.id && (
                      <ListItem sx={{ pb: 3, pt: 0 }}>
                        <EditStudentBatches student={student} allBatches={batches} onSave={handleSaveStudentBatches} onCancel={() => setEditingStudentId(null)} loading={loading} />
                      </ListItem>
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}