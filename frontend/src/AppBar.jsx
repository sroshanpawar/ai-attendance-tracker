// src/AppBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// --- MUI Imports ---
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
// --- End MUI Imports ---

export function AppBar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Check if user is logged in (simple check, App.jsx handles actual routing)
  const isLoggedIn = supabase.auth.getSession() !== null;


  return (
    <MuiAppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          AI Attendance Tracker
        </Typography>
        {isLoggedIn && (
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        )}
      </Toolbar>
    </MuiAppBar>
  );
}