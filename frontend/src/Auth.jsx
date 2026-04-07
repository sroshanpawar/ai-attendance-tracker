// src/Auth.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

// --- MUI Imports ---
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ minWidth: 275, maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" component="div" sx={{ mb: 2, textAlign: 'center' }}>
            AI Attendance Login
          </Typography>

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
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ position: 'relative' }}
              >
                Login
                {loading && <CircularProgress size={24} sx={{ position: 'absolute' }} />}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleSignUp}
                disabled={loading}
              >
                Sign Up
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}