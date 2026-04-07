// src/Auth.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

// --- MUI Imports ---
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper'; // Changed from Card
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InsightsIcon from '@mui/icons-material/Insights'; // App Icon
// --- End MUI Imports ---

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setMessage(''); setIsError(false);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Redirect handled by App.jsx
    } catch (error) {
      setMessage(error.error_description || error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true); setMessage(''); setIsError(false);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage('Sign up successful! Please check your email for verification.');
      setIsError(false);
    } catch (error) {
      setMessage(error.error_description || error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Center the box on the page
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pt: 8 }}> 
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <InsightsIcon sx={{ color: 'primary.main', fontSize: 40, mb: 1 }} />
          <Typography variant="h5" component="h1" gutterBottom>
            AI Attendance Login
          </Typography>
        </Box>

        {message && (
          <Alert severity={isError ? "error" : "success"} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Box sx={{ mt: 3, mb: 1, position: 'relative' }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              size="large"
            >
              Login
              {loading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />}
            </Button>
          </Box>
           <Button
              type="button"
              fullWidth
              variant="outlined"
              onClick={handleSignUp}
              disabled={loading}
            >
              Sign Up
            </Button>
        </Box>
      </Paper>
    </Box>
  );
}