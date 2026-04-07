// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import axios from 'axios';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

// Icons
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PlayCircleFilledWhiteRoundedIcon from '@mui/icons-material/PlayCircleFilledWhiteRounded';

const API_URL = 'http://localhost:8000';

function StatTile({ title, value, subtext, icon, color, loading }) {
  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderRadius: '24px',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ p: 1, borderRadius: '12px', bgcolor: `${color}15`, color: color, display: 'flex' }}>
          {icon}
        </Box>
      </Box>

      {loading ? (
        <CircularProgress size={24} sx={{ color, mt: 1 }} />
      ) : (
        <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
          {value}
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
        <TrendingUpRoundedIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
        <Typography sx={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
          {subtext}
        </Typography>
      </Box>
    </Box>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [userFullName, setUserFullName] = useState('');
  const [stats, setStats] = useState({ students: 0, sessions: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadataName = session.user.user_metadata?.full_name;
        const emailName = session.user.email?.split('@')[0];
        setUserFullName(metadataName || emailName || 'Instructor');
      }
    });
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = { 'Authorization': `Bearer ${token}` };

        const [studentsRes, sessionsRes] = await Promise.all([
          axios.get(`${API_URL}/students`, { headers }),
          axios.get(`${API_URL}/sessions`, { headers }),
        ]);

        setStats({
          students: studentsRes.data.length || 0,
          sessions: sessionsRes.data.length || 0,
        });
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header Section ──────────────────────────────────────────────── */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {greeting}, {userFullName}! 👋
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>
            AI Attendance Tracker — Instructor Portal
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Typography>
        </Box>
      </Box>

      {/* ── Stats Row ────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatTile
            title="Total Enrolled Students"
            value={stats.students}
            subtext="+5% this month"
            icon={<PeopleAltRoundedIcon />}
            color="#3b82f6"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatTile
            title="Total Sessions Conducted"
            value={stats.sessions}
            subtext="Consistent tracking"
            icon={<EventNoteRoundedIcon />}
            color="#8b5cf6"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ bgcolor: '#ffffff', borderRadius: '24px', p: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <InsightsRoundedIcon sx={{ fontSize: '3rem', color: '#10b981', mb: 1 }} />
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              Engine Active
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mt: 0.5 }}>
              AI face recognition is ready.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* ── Widgets Layer ─────────────────────────────────────────── */}
      <Grid container spacing={3}>

        {/* Left Widget: Recent Sessions (Mocked/Empty State for aesthetic) */}
        <Grid item xs={12} md={8}>
          <Box sx={{ bgcolor: '#ffffff', borderRadius: '24px', p: 4, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Recent Attendance Logs
              </Typography>
              <Chip label="Last 7 days" size="small" sx={{ fontWeight: 600, color: '#64748b', bgcolor: '#f8fafc' }} />
            </Box>

            {/* List Header */}
            <Grid container sx={{ mb: 2, px: 2 }}>
              <Grid item xs={4}><Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Date</Typography></Grid>
              <Grid item xs={5}><Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Session ID</Typography></Grid>
              <Grid item xs={3}><Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Status</Typography></Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Placeholder Rows since Dashboard doesn't fetch detailed logs directly yet */}
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ px: 2, py: 1.5, '&:hover': { bgcolor: '#f8fafc', borderRadius: '12px' }, transition: 'background 0.2s' }}>
                <Grid container alignItems="center">
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                      {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={5}>
                    <Typography sx={{ fontSize: '0.9rem', color: '#64748b' }}>
                      CS-101 Morning Batch
                    </Typography>
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: 'right' }}>
                    <Chip label="COMPLETED" size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#10b981', bgcolor: '#d1fae5', height: 24 }} />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </Grid>

        {/* Right Widget: Action Center & Alerts */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>

            {/* Quick Start Card */}
            <Box sx={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', p: 4, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                <InsightsRoundedIcon sx={{ fontSize: '150px' }} />
              </Box>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mb: 1, position: 'relative' }}>
                Start Live Session
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#94a3b8', mb: 3, position: 'relative' }}>
                Launch the camera to begin marking attendance instantly.
              </Typography>
              <Box onClick={() => navigate('/mark-attendance')} sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 1, color: '#fff', textDecoration: 'none', bgcolor: 'rgba(255,255,255,0.1)', px: 3, py: 1.5, borderRadius: '12px', fontWeight: 600, transition: '0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <PlayCircleFilledWhiteRoundedIcon /> Launch Scanner
              </Box>
            </Box>

            {/* Alerts Widget */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '24px', p: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', flex: 1 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', mb: 2 }}>
                System Alerts
              </Typography>

              <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: '16px', display: 'flex', gap: 1.5, mb: 2 }}>
                <WarningAmberRoundedIcon sx={{ color: '#d97706', mt: 0.2 }} />
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>Camera Permissions</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#b45309', mt: 0.5 }}>Ensure your browser has access to the webcam before starting a session.</Typography>
                </Box>
              </Box>

            </Box>
          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}