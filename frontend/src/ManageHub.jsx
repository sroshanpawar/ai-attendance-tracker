// src/ManageHub.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import LinkedCameraRoundedIcon from '@mui/icons-material/LinkedCameraRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';

export function ManageHub() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Manage Batches',
      desc: 'Create or remove class batches.',
      icon: <AddCircleOutlineRoundedIcon sx={{ fontSize: 50, color: '#8b5cf6' }} />,
      path: '/manage/batches'
    },
    {
      title: 'Enroll Student',
      desc: 'Capture biometric data and assign to batches.',
      icon: <LinkedCameraRoundedIcon sx={{ fontSize: 50, color: '#10b981' }} />,
      path: '/manage/enroll'
    },
    {
      title: 'Manage Student',
      desc: 'View roster, edit batches, or delete students.',
      icon: <PeopleAltRoundedIcon sx={{ fontSize: 50, color: '#3b82f6' }} />,
      path: '/manage/students'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 }, fontFamily: "'Inter', sans-serif" }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <GroupAddRoundedIcon sx={{ fontSize: '2.5rem', color: '#3b82f6' }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Manage Hub
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: '#64748b' }}>
            Select an action to continue.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {cards.map((card, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Paper
              onClick={() => navigate(card.path)}
              sx={{
                p: 4,
                borderRadius: '24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                border: '1px solid #f1f5f9',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                  borderColor: '#cbd5e1'
                }
              }}
              elevation={0}
            >
              <Box sx={{ mb: 2 }}>{card.icon}</Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.2rem' }}>
                {card.title}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                {card.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
