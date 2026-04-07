// src/SessionDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

// MUI Imports
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const API_URL = 'http://localhost:8000';

export function SessionDetails() {
  const { sessionId } = useParams(); // Get session ID from URL
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  // Fetch session details and attendance records
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getAuthToken();
        if (!token) throw new Error("Not authenticated");

        // Fetch session details
        const sessionRes = await axios.get(`${API_URL}/session/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch attendance records
        const attendanceRes = await axios.get(`${API_URL}/session/${sessionId}/attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setSessionInfo(sessionRes.data); // Set state AFTER both requests succeed
        setAttendanceRecords(attendanceRes.data);

      } catch (err) {
        console.error("Error fetching session data:", err);
        setError(err.response?.data?.detail || err.message || 'Failed to load session details.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId, getAuthToken]);

  // Handle PDF Download
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await axios.get(`${API_URL}/report/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_session_${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Error downloading report:", err);
      setError(err.response?.data?.detail || err.message || 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  }, [sessionId, getAuthToken]);

  // Helper formats
  const formatDate = (dateStr) => { if (!dateStr) return 'N/A'; try { const date = new Date(dateStr); if (isNaN(date)) return 'Invalid Date'; return date.toLocaleDateString(); } catch (e) { return 'Invalid Date'; } };
  const formatTime = (timeStr) => { if (!timeStr) return 'N/A'; return timeStr; };

  // --- GUARD CLAUSES ---
  // These stop the render if data isn't ready

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/past-records')} sx={{ mb: 2 }}>
          Back to Records
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!sessionInfo) {
     return (
       <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
         <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/past-records')} sx={{ mb: 2 }}>
           Back to Records
         </Button>
         <Alert severity="warning">Session data could not be found.</Alert>
       </Box>
    );
  }
  // --- END GUARD CLAUSES ---


  // This part will only run if loading=false, error="", and sessionInfo exists
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/past-records')} sx={{ mb: 2 }}>
        Back to Records
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Session Details
        </Typography>
        <Typography variant="body1">
          <strong>Class:</strong> {sessionInfo.class_name || 'N/A'} ({sessionInfo.batch || 'N/A'})
        </Typography>
        <Typography variant="body1">
          <strong>Date:</strong> {formatDate(sessionInfo.session_date)}
        </Typography>
        <Typography variant="body1">
          <strong>Time:</strong> {formatTime(sessionInfo.session_time)}
        </Typography>
        <Typography variant="body1">
          <strong>Duration:</strong> {sessionInfo.duration_minutes || 'N/A'} minutes
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Attendance Records
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Time (sec)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Liveness</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No attendance records found for this session.</TableCell>
                </TableRow>
              ) : (
                attendanceRecords.map((record, index) => (
                  <TableRow hover key={record.student_id || index}>
                    <TableCell component="th" scope="row">
                      {record.student_name}
                    </TableCell>
                    <TableCell align="center" sx={{ color: record.status === 'Present' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                      {record.status}
                    </TableCell>
                    <TableCell align="center">{record.attentive_seconds ?? 'N/A'}</TableCell>
                    <TableCell align="center" sx={{ color: record.liveness_verified ? 'success.main' : 'text.secondary' }}>
                      {record.liveness_verified ? 'Verified' : 'Not Verified'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? 'Downloading...' : 'Download Full PDF Report'}
        </Button>
      </Box>
    </Box>
  );
}