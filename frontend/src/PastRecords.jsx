// src/PastRecords.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

const API_URL = 'http://localhost:8000';

export function PastRecords() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getAuthToken = async () =>
    (await supabase.auth.getSession()).data.session?.access_token;

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getAuthToken();
        const response = await axios.get(`${API_URL}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validSessions = Array.isArray(response.data)
          ? response.data.filter(Boolean)
          : [];
        setSessions(validSessions);
      } catch (err) {
        setError('Failed to fetch sessions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleRowClick = (sessionId) => navigate(`/session/${sessionId}`);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return 'Invalid Date'; }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    return timeStr;
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'rgba(6,182,212,0.15)',
              border: '1px solid rgba(6,182,212,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
            }}
          >
            <HistoryRoundedIcon sx={{ fontSize: '1.2rem' }} />
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Past Records
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: '#475569', ml: '56px' }}>
          Click any session row to view detailed attendance records and download reports.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── Table ───────────────────────────────────────────────── */}
      <Paper>
        <TableContainer>
          <Table aria-label="past sessions table">
            <TableHead>
              <TableRow>
                <TableCell>Class Name</TableCell>
                <TableCell>Subject / Batch</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="right" sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography sx={{ mt: 2, color: '#475569', fontSize: '0.875rem' }}>
                      Loading sessions...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <InboxRoundedIcon sx={{ fontSize: '2.5rem', color: '#1e293b', mb: 1 }} />
                    <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
                      No past sessions found. Start a new session to see records here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow
                    hover
                    role="button"
                    tabIndex={-1}
                    key={session.id}
                    onClick={() => handleRowClick(session.id)}
                    sx={{
                      cursor: 'pointer',
                      '& td': { py: 1.8 },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        {session.class_name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.batch || 'N/A'}
                        size="small"
                        sx={{
                          fontSize: '0.72rem',
                          height: 22,
                          background: 'rgba(6,182,212,0.12)',
                          color: '#06b6d4',
                          border: '1px solid rgba(6,182,212,0.25)',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <EventRoundedIcon sx={{ fontSize: '0.9rem', color: '#475569' }} />
                        <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                          {formatDate(session.session_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <AccessTimeRoundedIcon sx={{ fontSize: '0.9rem', color: '#475569' }} />
                        <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                          {formatTime(session.session_time)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <ArrowForwardIosRoundedIcon sx={{ fontSize: '0.8rem', color: '#334155' }} />
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