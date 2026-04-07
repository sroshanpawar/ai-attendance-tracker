// src/Sidebar.jsx — Academic Navy Sidebar with prominent Sign Out
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';

import InsightsIcon from '@mui/icons-material/Insights';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

export const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',       icon: <DashboardRoundedIcon /> },
  { label: 'Manage',          path: '/manage',          icon: <GroupAddRoundedIcon /> },
  { label: 'Start Session',   path: '/mark-attendance', icon: <HowToRegRoundedIcon /> },
  { label: 'Past Records',    path: '/past-records',    icon: <HistoryRoundedIcon /> },
];

// ── Sidebar colors (Matching Dashboard HTML mockup)
const S = {
  bg:          '#1A2234',
  bgHover:     '#2A3347',
  bgActive:    '#2A3347',
  border:      '#36435c',
  text:        '#9ca3af', // gray-400 equivalent
  textActive:  '#ffffff',
  textMuted:   '#64748b',
  accent:      '#3b82f6',
};

export function Sidebar({ session }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: S.bg,
        borderRight: `1px solid ${S.border}`,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* ── Logo ────────────────────────────────────────────── */}
      <Box
        onClick={() => navigate('/dashboard')}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2.5, py: 2.5,
          borderBottom: `1px solid ${S.border}`,
          cursor: 'pointer', flexShrink: 0,
          '&:hover': { bgcolor: S.bgHover },
          transition: 'background 0.15s',
        }}
      >
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '8px',
            bgcolor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#60a5fa' }}>AI</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', lineHeight: 1.2 }}>
            AI Attendance<br/>Tracker
          </Typography>
        </Box>
      </Box>

      {/* ── Nav label ───────────────────────────────────────── */}
      <Box sx={{ flex: 1, px: 1.5, py: 2.5 }}>
        <Typography
          sx={{
            fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: S.textMuted,
            px: 1.5, mb: 1.5,
          }}
        >
          Menu
        </Typography>

        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/manage' && location.pathname.startsWith('/manage/'));
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2, py: 1.5,
                mb: 0.5,
                borderRadius: '12px',
                cursor: 'pointer',
                bgcolor: isActive ? S.bgActive : 'transparent',
                borderLeft: `4px solid ${isActive ? S.accent : 'transparent'}`,
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: isActive ? S.bgActive : S.bgHover,
                },
              }}
            >
              <Box
                sx={{
                  color: isActive ? '#fff' : S.text,
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                  '& .MuiSvgIcon-root': { fontSize: '1.25rem' },
                }}
              >
                {item.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.855rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? S.textActive : S.text,
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ── Sign Out ─────────────────────────────────────────── */}
      <Box sx={{ p: 3, flexShrink: 0, borderTop: `1px solid ${S.border}`, mt: 'auto' }}>
        {session?.user?.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Typography sx={{ color: '#d1d5db', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {session.user.email.charAt(0).toUpperCase()}
              </Typography>
            </Box>
            <Typography sx={{ color: '#d1d5db', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.user.email}
            </Typography>
          </Box>
        )}
        <Button
          fullWidth
          variant="outlined"
          onClick={handleSignOut}
          sx={{
            borderColor: '#4b5563',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.875rem',
            textTransform: 'none',
            justifyContent: 'center',
            py: 1,
            borderRadius: '8px',
            '&:hover': {
              borderColor: '#6b7280',
              bgcolor: S.bgHover,
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );
}
