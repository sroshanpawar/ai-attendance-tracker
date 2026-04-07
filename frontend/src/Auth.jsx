// src/Auth.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setIsError(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setMessage(error.error_description || error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setIsError(false);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (error) throw error;
      setMessage('Account created! Check your email for a verification link.');
      setIsError(false);
    } catch (error) {
      setMessage(error.error_description || error.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#FDFCF8', // Cream background resembling the reference image
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Decorative background shapes */}
      <Box sx={{ position: 'absolute', top: '15%', left: '10%', opacity: 0.4 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><path d="M2.5 37.5C10 25 30 25 37.5 2.5" stroke="#000" strokeWidth="1" fill="none" strokeDasharray="4 4" /></svg>
      </Box>
      <Box sx={{ position: 'absolute', top: '25%', right: '15%', opacity: 0.3 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="#000" strokeWidth="1" fill="none" /></svg>
      </Box>
      <Box sx={{ position: 'absolute', bottom: '15%', left: '20%', opacity: 0.5 }}>
        <svg width="80" height="40" viewBox="0 0 80 40" fill="none"><path d="M0,20 Q20,40 40,20 T80,20" stroke="#000" strokeWidth="1" fill="none" /></svg>
      </Box>
      <Box sx={{ position: 'absolute', bottom: '20%', right: '10%', opacity: 0.6 }}>
        <Box sx={{ width: 80, height: 120, bgcolor: '#F7C68B', borderRadius: '8px', zIndex: 0 }} />
      </Box>

      {/* Main Login Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          bgcolor: '#ffffff',
          borderRadius: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
          p: { xs: 4, sm: 6 },
          position: 'relative',
          zIndex: 10,
          mx: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'center', mb: 1 }}>
          {mode === 'login' ? 'Login' : 'Create Account'}
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', mb: 4, px: 2 }}>
          {mode === 'login'
            ? 'Hey, Enter your details to get sign in to your account'
            : 'Fill in your details to get started with the platform'}
        </Typography>

        {message && (
          <Alert severity={isError ? 'error' : 'success'} sx={{ mb: 3, borderRadius: '12px' }}>
            {message}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={mode === 'login' ? handleLogin : handleSignUp}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          {mode === 'signup' && (
            <TextField
              required fullWidth id="fullName" placeholder="Full Name" name="fullName"
              autoComplete="name" autoFocus={mode === 'signup'}
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlinedIcon sx={{ fontSize: '1.2rem', color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <TextField
            required fullWidth id="email" placeholder="Enter Email / Phone No" name="email"
            autoComplete="email" autoFocus={mode === 'login'}
            value={email} onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ fontSize: '1.2rem', color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            required fullWidth id="password" placeholder="Passcode" name="password"
            type={showPassword ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ fontSize: '1.2rem', color: '#94a3b8' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => setShowPassword(p => !p)}
                    sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.8rem' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          {mode === 'login' && (
            <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600, mt: -1 }}>
              Having trouble in sign in?
            </Typography>
          )}

          <Button
            type="submit" fullWidth variant="contained" size="large"
            disabled={loading}
            disableElevation
            sx={{
              py: 1.5,
              mt: 1,
              borderRadius: '12px',
              bgcolor: '#F3BE83', // Soft orange/peach from reference
              color: '#1a1a1a',
              fontWeight: 800,
              fontSize: '1rem',
              '&:hover': { bgcolor: '#e5af72' }
            }}
          >
            {loading
              ? <CircularProgress size={24} sx={{ color: '#1a1a1a' }} />
              : mode === 'login' ? 'Sign in' : 'Create Account'}
          </Button>

          <Divider sx={{ my: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', px: 1, fontWeight: 500 }}>
              — Or {mode === 'login' ? 'Sign in' : 'Sign up'} with —
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {['Google', 'Apple ID'].map((provider) => (
              <Button
                key={provider}
                variant="outlined"
                sx={{
                  borderRadius: '12px',
                  flex: 1,
                  py: 1,
                  borderColor: '#e2e8f0',
                  color: '#0f172a',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                }}
              >
                {provider}
              </Button>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Typography
                component="span"
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}
                sx={{
                  fontWeight: 800,
                  color: '#0f172a',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In Now'}
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer Text */}
      <Box sx={{ position: 'absolute', bottom: '3%', width: '100%', textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
          Copyright @ AI Tracker 2026 | Privacy Policy
        </Typography>
      </Box>
    </Box>
  );
}