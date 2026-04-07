// src/ManageBatches.jsx
import React, { useState, useEffect } from 'react';
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
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Paper from '@mui/material/Paper';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';

const API_URL = 'http://localhost:8000';

export function ManageBatches() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [batches, setBatches] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSubject, setNewBatchSubject] = useState('');

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

  const handleCreateBatch = async (e) => { 
    e.preventDefault(); setLoading(true); setError(''); setMessage(''); 
    try { 
      const token = await getAuthToken(); 
      const response = await axios.post(`${API_URL}/batch`, { batch_name: newBatchName, subject: newBatchSubject }, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setMessage('Batch created!'); setNewBatchName(''); setNewBatchSubject(''); 
      setBatches(prev => [response.data.data, ...prev]); 
    } catch (err) { 
      setError(err.response?.data?.detail || 'Failed to create batch.'); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const handleDeleteBatch = async (batchId) => { 
    if (!window.confirm("Delete this batch? Current students will lose this association.")) return; 
    setLoading(true); setError(''); setMessage(''); 
    try { 
      const token = await getAuthToken(); 
      await axios.delete(`${API_URL}/batch/${batchId}`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      setMessage('Batch deleted!'); 
      setBatches(prev => prev.filter(b => b.id !== batchId)); 
    } catch (err) { 
      setError(err.response?.data?.detail || 'Failed to delete batch.'); 
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
            <List dense sx={{ maxHeight: 300, overflowY: 'auto', p: 0 }}>
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
    </Box>
  );
}
