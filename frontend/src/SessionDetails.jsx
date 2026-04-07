// src/SessionDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

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
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';

import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

const API_URL = 'http://localhost:8000';

function StatCard({ icon, label, value, color }) {
  return (
    <Box
      sx={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '11px',
          background: `${color}18`,
          border: `1px solid ${color}28`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
          '& .MuiSvgIcon-root': { fontSize: '1.15rem' },
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.7rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', mt: 0.2 }}>
          {value || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
}

function StatusBadge({ status }) {
  const isPresent = status === 'Present';
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 24,
        fontSize: '0.72rem',
        fontWeight: 700,
        borderRadius: '6px',
        background: isPresent ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
        color: isPresent ? '#34d399' : '#fb7185',
        border: `1px solid ${isPresent ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
      }}
    />
  );
}

function LivenessBadge({ verified }) {
  if (verified) {
    return (
      <Tooltip title="Liveness verified via blink detection">
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#06b6d4', fontSize: '0.8rem', fontWeight: 600 }}>
          <VerifiedUserRoundedIcon sx={{ fontSize: '0.95rem' }} />
          Verified
        </Box>
      </Tooltip>
    );
  }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#334155', fontSize: '0.8rem' }}>
      <RemoveCircleOutlineRoundedIcon sx={{ fontSize: '0.95rem' }} />
      <span>—</span>
    </Box>
  );
}

export function SessionDetails() {
  const { sessionId } = useParams();
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');
        const [sessionRes, attendanceRes] = await Promise.all([
          axios.get(`${API_URL}/session/${sessionId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/session/${sessionId}/attendance`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setSessionInfo(sessionRes.data);
        setAttendanceRecords(attendanceRes.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load session details.');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchData();
  }, [sessionId, getAuthToken]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError('');
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const response = await axios.get(`${API_URL}/report/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
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
      setError(err.response?.data?.detail || err.message || 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  }, [sessionId, getAuthToken]);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;

  // Guard clauses
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/past-records')} sx={{ mb: 2 }}>
          Back to Records
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  if (!sessionInfo) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/past-records')} sx={{ mb: 2 }}>
          Back to Records
        </Button>
        <Alert severity="warning">Session data could not be found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* ── Back + Action Row ───────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate('/past-records')}
            size="small"
            sx={{ mb: 1, color: '#64748b', fontSize: '0.8rem' }}
          >
            Past Records
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.25 }}>
            {sessionInfo.class_name || 'Session Details'}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
            {sessionInfo.batch || ''}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={16} sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <DownloadRoundedIcon />}
          onClick={handleDownload}
          disabled={downloading}
          size="large"
          sx={{ flexShrink: 0 }}
        >
          {downloading ? 'Generating...' : 'Download PDF Report'}
        </Button>
      </Box>

      {/* ── Session Info Tiles ──────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {[
          { icon: <ClassRoundedIcon />, label: 'Class', value: sessionInfo.class_name, color: '#4f8ef7' },
          { icon: <EventRoundedIcon />, label: 'Date', value: formatDate(sessionInfo.session_date), color: '#7c3aed' },
          { icon: <AccessTimeRoundedIcon />, label: 'Time', value: sessionInfo.session_time || 'N/A', color: '#06b6d4' },
          { icon: <TimerRoundedIcon />, label: 'Duration', value: sessionInfo.duration_minutes ? `${sessionInfo.duration_minutes} min` : 'N/A', color: '#10b981' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* ── Attendance Summary Pills ────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>Attendance:</Typography>
          <Chip label={`${presentCount} Present`} size="small" sx={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700, fontSize: '0.72rem' }} />
          <Chip label={`${absentCount} Absent`} size="small" sx={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)', fontWeight: 700, fontSize: '0.72rem' }} />
        </Box>
      </Box>

      {/* ── Attendance Table ────────────────────────────────────── */}
      <Paper>
        <TableContainer>
          <Table aria-label="attendance records">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Attentive Time</TableCell>
                <TableCell align="center">Liveness</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <InboxRoundedIcon sx={{ fontSize: '2.5rem', color: '#1e293b', mb: 1 }} />
                    <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
                      No attendance records found for this session.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                attendanceRecords.map((record, index) => (
                  <TableRow hover key={record.student_id || index}>
                    <TableCell sx={{ color: '#334155', fontSize: '0.78rem', width: 50 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '9px',
                            background: 'rgba(79,142,247,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#4f8ef7',
                            flexShrink: 0,
                          }}
                        >
                          {record.student_name?.slice(0, 2).toUpperCase() || '??'}
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                          {record.student_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                        {record.attentive_seconds != null ? `${record.attentive_seconds}s` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <LivenessBadge verified={record.liveness_verified} />
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