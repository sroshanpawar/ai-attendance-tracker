// src/Dashboard.jsx
import React from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

// --- MUI Imports ---
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
// --- End MUI Imports ---

export function Dashboard() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <Card sx={{ maxWidth: 500, margin: 'auto', mt: 5 }}>
      <CardContent sx={{ p: 3 }}> {/* Increased padding */}
        <Typography variant="h5" component="div" sx={{ mb: 3, textAlign: 'center' }}>
          Instructor Dashboard
        </Typography>
        <Stack spacing={2} divider={<Divider orientation="horizontal" flexItem />}>
          <Button variant="contained" size="large" onClick={() => navigate('/manage-students')}>
            Manage Students & Batches
          </Button>
          <Button variant="contained" size="large" onClick={() => navigate('/mark-attendance')}>
            Mark Attendance
          </Button>
          <Button variant="contained" size="large" onClick={() => navigate('/past-records')}>
            View Past Records
          </Button>
          <Button variant="outlined" color="error" size="large" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}