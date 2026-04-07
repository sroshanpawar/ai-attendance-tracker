// src/PastRecords.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

// MUI Imports
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const API_URL = 'http://localhost:8000';

export function PastRecords() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true); setError('');
      try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_URL}/sessions`, { headers: { 'Authorization': `Bearer ${token}` } });
        // --- THIS IS THE FIX ---
        // Ensure data is an array and filter out any null/undefined entries
        const validSessions = Array.isArray(response.data) ? response.data.filter(Boolean) : [];
        setSessions(validSessions);
        // --- END FIX ---
      } catch (err) { 
        setError('Failed to fetch sessions.'); 
        console.error(err); 
      }
      finally { setLoading(false); }
    };
    fetchSessions();
  }, []);

  const handleRowClick = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  const formatDate = (dateStr) => { if (!dateStr) return 'N/A'; try { const date = new Date(dateStr); if (isNaN(date)) return 'Invalid Date'; return date.toLocaleDateString(); } catch (e) { return 'Invalid Date'; } };
  const formatTime = (timeStr) => { if (!timeStr) return 'N/A'; return timeStr; };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Dashboard
      </Button>
      <Typography variant="h4" gutterBottom>Past Attendance Records</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Class Name</TableCell>
                <TableCell>Subject/Batch</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={4} align="center">No past sessions found.</TableCell>
                </TableRow>
              ) : (
                // Map over the already filtered list
                sessions.map((session) => ( 
                  <TableRow
                    hover
                    role="button"
                    tabIndex={-1}
                    key={session.id} // This is safe now
                    onClick={() => handleRowClick(session.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{session.class_name || 'N/A'}</TableCell>
                    <TableCell>{session.batch || 'N/A'}</TableCell>
                    <TableCell>{formatDate(session.session_date)}</TableCell>
                    <TableCell>{formatTime(session.session_time)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}