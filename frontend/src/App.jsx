// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Auth } from './Auth';
import { Dashboard } from './Dashboard';
import { ManageStudents } from './ManageStudents';
import { MarkAttendance } from './MarkAttendance';
import { PastRecords } from './PastRecords';
import { AppBar } from './AppBar'; // <-- Import AppBar
import theme from './theme'; // <-- Import Theme

// --- MUI Imports ---
import { ThemeProvider } from '@mui/material/styles'; // <-- Import ThemeProvider
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
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
      <ThemeProvider theme={theme}> {/* ThemeProvider needed even for loading */}
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}> {/* Apply theme globally */}
      <CssBaseline />
      <BrowserRouter>
        <AppBar /> {/* Display AppBar on all pages */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Main content area */}
          <Routes>
            {/* Routes remain the same */}
            <Route path="/" element={!session ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} />
            <Route path="/login" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={!session ? <Navigate to="/login" /> : <Dashboard />} />
            <Route path="/manage-students" element={!session ? <Navigate to="/login" /> : <ManageStudents />} />
            <Route path="/mark-attendance" element={!session ? <Navigate to="/login" /> : <MarkAttendance />} />
            <Route path="/past-records" element={!session ? <Navigate to="/login" /> : <PastRecords />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;