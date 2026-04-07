// src/StudentDatabase.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

const API_URL = 'http://localhost:8000';

const EditStudentBatches = ({ student, allBatches, onSave, onCancel, loading }) => {
  const [currentSelectedBatches, setCurrentSelectedBatches] = useState(() => new Set(student.batches.map(b => b.id)));
  const handleCheckboxChange = (batchId) => { setCurrentSelectedBatches(prev => { const newSet = new Set(prev); if (newSet.has(batchId)) newSet.delete(batchId); else newSet.add(batchId); return newSet; }); };
  return ( 
    <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: '12px', mt: 1, bgcolor: '#f8fafc', width: '100%' }}> 
      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>Edit Batches for {student.name}</Typography> 
      <FormGroup> 
        {allBatches.map(batch => ( 
          <FormControlLabel key={batch.id} control={<Checkbox checked={currentSelectedBatches.has(batch.id)} onChange={() => handleCheckboxChange(batch.id)} size="small" />} label={<Typography sx={{fontSize: '0.85rem'}}>{`${batch.batch_name} (${batch.subject})`}</Typography>} /> 
        ))} 
      </FormGroup> 
      <Box sx={{ mt: 2 }}> 
        <Button onClick={() => onSave(student.id, Array.from(currentSelectedBatches))} disabled={loading} variant="contained" size="small" disableElevation sx={{ borderRadius: '8px' }}>Save</Button> 
        <Button onClick={onCancel} disabled={loading} size="small" sx={{ ml: 1, color: '#64748b' }}>Cancel</Button> 
      </Box> 
    </Box> 
  );
};

export function StudentDatabase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatchId, setFilterBatchId] = useState(null);

  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
  
  const fetchBatches = async () => { 
    try { 
      const token = await getAuthToken(); 
      const response = await axios.get(`${API_URL}/batches`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setBatches(response.data); 
    } catch (err) { 
      setError('Could not fetch batches.'); 
    } 
  };
  
  const fetchStudents = async () => { 
    setLoading(true); setError(''); 
    try { 
      const token = await getAuthToken(); 
      const response = await axios.get(`${API_URL}/students`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setStudents(response.data); 
    } catch (err) { 
      setError('Could not fetch students.'); 
    } finally { 
      setLoading(false); 
    } 
  };

  useEffect(() => { fetchBatches(); fetchStudents(); }, []);

  const handleSaveStudentBatches = async (studentId, updatedBatchIds) => { 
    setLoading(true); setError(''); setMessage(''); 
    try { 
      const token = await getAuthToken(); 
      await axios.put(`${API_URL}/student/${studentId}/batches`, { batch_ids: updatedBatchIds }, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setMessage('Student updated.'); setEditingStudentId(null); fetchStudents(); 
    } catch (err) { 
      setError(err.response?.data?.detail || 'Failed to update.'); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const handleDeleteStudent = async (studentId) => { 
    if (!window.confirm("Delete this student permanently?")) return; 
    setLoading(true); setError(''); setMessage(''); 
    try { 
      const token = await getAuthToken(); 
      await axios.delete(`${API_URL}/student/${studentId}`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setMessage('Student deleted!'); setStudents(prev => prev.filter(s => s.id !== studentId)); 
    } catch (err) { 
      setError(err.response?.data?.detail || 'Failed to delete.'); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const filteredStudents = useMemo(() => { 
    return students.filter(student => { 
      const nameMatches = student.name.toLowerCase().includes(searchTerm.toLowerCase()); 
      const batchMatches = filterBatchId === null || student.batches.some(batch => batch.id === filterBatchId); 
      return nameMatches && batchMatches; 
    }); 
  }, [students, searchTerm, filterBatchId]);

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 }, fontFamily: "'Inter', sans-serif" }}> 
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/manage')} sx={{ mb: 3, color: '#64748b', textTransform: 'none', fontWeight: 600 }}>
        Back to Manage Hub
      </Button>
      
      {message && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Paper sx={{ p: 4, borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }} elevation={0}>
        <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupAddRoundedIcon sx={{ color: '#3b82f6' }} /> Enrolled Students Database
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          <TextField flex={1} size="small" variant="outlined" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f8fafc' } }}
            InputProps={{
              startAdornment: ( <InputAdornment position="start"> <SearchIcon sx={{ color: '#94a3b8' }} /> </InputAdornment> ),
            }}
          />
          
          <Box>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', height: '100%' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', mr: 1 }}>Filter Batch</Typography>
              <Chip label="All" clickable variant={filterBatchId === null ? "filled" : "outlined"} onClick={() => setFilterBatchId(null)} size="small" sx={{ fontWeight: 600, border: filterBatchId !== null ? '1px solid #e2e8f0' : 'none' }} />
              {batches.map(batch => (
                 <Chip key={batch.id} label={batch.batch_name} clickable color={filterBatchId === batch.id ? "primary" : "default"} variant={filterBatchId === batch.id ? "filled" : "outlined"} onClick={() => setFilterBatchId(batch.id)} size="small" sx={{ fontWeight: 600, border: filterBatchId !== batch.id ? '1px solid #e2e8f0' : 'none' }} />
              ))}
            </Stack>
          </Box>
        </Box>

        {loading && students.length === 0 && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={32}/></Box>}
        {!loading && students.length === 0 && (<Box sx={{ textAlign: 'center', p: 4, color: '#94a3b8' }}><Typography>Database is empty.</Typography></Box>)}
        {!loading && filteredStudents.length === 0 && students.length > 0 && (<Box sx={{ textAlign: 'center', p: 4, color: '#94a3b8' }}><Typography>No matches found.</Typography></Box>)}

        <Box sx={{ flexGrow: 1, borderTop: '1px solid #f1f5f9' }}>
          <List sx={{ maxHeight: 600, overflowY: 'auto' }}>
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
    </Box>
  );
}
