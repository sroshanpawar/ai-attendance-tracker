// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Auth } from './Auth';
import { Dashboard } from './Dashboard';
import { ManageHub } from './ManageHub';
import { ManageBatches } from './ManageBatches';
import { EnrollStudent } from './EnrollStudent';
import { StudentDatabase } from './StudentDatabase';
import { MarkAttendance } from './MarkAttendance';
import { PastRecords } from './PastRecords';
import { SessionDetails } from './SessionDetails';
import { TopBar } from './AppBar';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import theme from './theme';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function AppLayout({ session }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';
  const showChrome = !!session && !isAuthPage;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Fixed sidebar */}
      {showChrome && <Sidebar session={session} />}

      {/* Right column: sticky header + scrollable content */}
      <Box
        sx={{
          flex: 1,
          ml: showChrome ? `${SIDEBAR_WIDTH}px` : 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          // This ensures no background-attachment fixed effects bleed through
          isolation: 'isolate',
        }}
      >
        {/* ── Top Header Removed per user request ── */}

        {/* ── Scrollable page content ── */}
        <Box
          component="main"
          sx={{
            flex: 1,
            bgcolor: '#f8fafc',
            px: { xs: 2.5, md: 4 },
            py: 4,
            overflowY: 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={!session ? <Navigate to="/login" /> : <Navigate to="/dashboard" />} />
            <Route path="/login" element={!session ? <Auth /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={!session ? <Navigate to="/login" /> : <Dashboard />} />
            <Route path="/manage" element={!session ? <Navigate to="/login" /> : <ManageHub />} />
            <Route path="/manage/batches" element={!session ? <Navigate to="/login" /> : <ManageBatches />} />
            <Route path="/manage/enroll" element={!session ? <Navigate to="/login" /> : <EnrollStudent />} />
            <Route path="/manage/students" element={!session ? <Navigate to="/login" /> : <StudentDatabase />} />
            <Route path="/mark-attendance" element={!session ? <Navigate to="/login" /> : <MarkAttendance />} />
            <Route path="/past-records" element={!session ? <Navigate to="/login" /> : <PastRecords />} />
            <Route path="/session/:sessionId" element={!session ? <Navigate to="/login" /> : <SessionDetails />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc' }}>
          <CircularProgress sx={{ color: '#2563eb' }} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout session={session} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;