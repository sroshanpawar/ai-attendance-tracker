// src/AppBar.jsx — Sticky Top Header (enterprise academic style)
import React from 'react';
import { supabase } from './supabaseClient';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';

// Named export used in App.jsx as <TopBar />
export function TopBar() {
  const [userEmail, setUserEmail] = React.useState('');

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || '');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || '');
    });
    return () => subscription.unsubscribe();
  }, []);

  const initials = userEmail
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = userEmail ? userEmail.split('@')[0] : '';

  return (
    <Box
      component="header"
      sx={{
        // STICKY — lives in the normal flow, never overlays content
        position: 'sticky',
        top: 0,
        zIndex: 50,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2.5, md: 4 },
        height: 64,
        flexShrink: 0,
      }}
    >
      {/* LEFT — Greeting */}
      <Box>
        <Typography
          sx={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.2,
          }}
        >
          {greeting}{firstName ? `, ${firstName}` : ''}! 👋
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.15 }}>
          AI Attendance Tracker &mdash; Instructor Portal
        </Typography>
      </Box>

      {/* RIGHT — User profile + Sign Out */}
      {userEmail && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* User pill */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 0.5,
              border: '1px solid #e2e8f0',
              borderRadius: '99px',
              bgcolor: '#f8fafc',
            }}
          >
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: '#2563eb',
              }}
            >
              {initials}
            </Avatar>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1e293b',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userEmail}
            </Typography>
          </Box>

        </Box>
      )}
    </Box>
  );
}

// Legacy default export for any direct import
export function AppBar() { return <TopBar />; }