// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Auth } from './Auth';
import { Dashboard } from './Dashboard';
import { ManageStudents } from './ManageStudents';
import { MarkAttendance } from './MarkAttendance';
import { PastRecords } from './PastRecords';
import { SessionDetails } from './SessionDetails';
import { AppBar } from './AppBar';
import theme from './theme';

// --- MUI Imports ---
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import Container from '@mui/material/Container'; // <-- REMOVED
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
// --- End MUI Imports ---

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setSession(session); }
    );
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar />
          {/* Main content area, now full width with padding */}
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}> 
            <Routes>
              {/* Routes remain the same */}
              <Route path="/" element={!session ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} />
              <Route path="/login" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={!session ? <Navigate to="/login" /> : <Dashboard />} />
              <Route path="/manage-students" element={!session ? <Navigate to="/login" /> : <ManageStudents />} />
              <Route path="/mark-attendance" element={!session ? <Navigate to="/login" /> : <MarkAttendance />} />
              <Route path="/past-records" element={!session ? <Navigate to="/login" /> : <PastRecords />} />
              <Route path="/session/:sessionId" element={!session ? <Navigate to="/login" /> : <SessionDetails />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;