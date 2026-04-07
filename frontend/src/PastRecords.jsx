// src/PastRecords.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

// --- MUI Imports ---
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
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// --- End MUI Imports ---


const API_URL = 'http://localhost:8000';

export function PastRecords() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null); // Session ID being downloaded

  const getAuthToken = async () => (await supabase.auth.getSession()).data.session?.access_token;

  useEffect(() => {
    const fetchSessions = async () => { /* ... (keep existing fetch logic) ... */
      setLoading(true); setError('');
      try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_URL}/sessions`, { headers: { 'Authorization': `Bearer ${token}` } });
        setSessions(response.data);
      } catch (err) { setError('Failed to fetch sessions.'); console.error(err); }
      finally { setLoading(false); }
    };
    fetchSessions();
  }, []);

  const handleDownload = async (sessionId) => { /* ... (keep existing download logic) ... */
    setDownloading(sessionId); setError('');
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_URL}/report/${sessionId}`, { headers: { 'Authorization': `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `report_session_${sessionId}.pdf`); document.body.appendChild(link); link.click(); link.parentNode.removeChild(link); window.URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to download report.'); console.error(err); }
    finally { setDownloading(null); }
  };

  // Helper to format date and time safely
  const formatDate = (dateStr) => { /* ... (keep existing format logic) ... */
    if (!dateStr) return 'N/A'; try { const date = new Date(dateStr); if (isNaN(date)) return 'Invalid Date'; return date.toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
  };
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A'; return timeStr; // Assuming time is already formatted H:M:S
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
        Dashboard
      </Button>
      <Typography variant="h4" gutterBottom>Past Attendance Records</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}> {/* Makes table scrollable */}
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Class Name</TableCell>
                <TableCell>Subject/Batch</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={5} align="center">No past sessions found.</TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={session.id}>
                    <TableCell>{session.class_name || 'N/A'}</TableCell>
                    <TableCell>{session.batch || 'N/A'}</TableCell>
                    <TableCell>{formatDate(session.session_date)}</TableCell>
                    <TableCell>{formatTime(session.session_time)}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={downloading === session.id ? <CircularProgress size={16} /> : <DownloadIcon />}
                        onClick={() => handleDownload(session.id)}
                        disabled={downloading === session.id}
                      >
                        {downloading === session.id ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    </TableCell>
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