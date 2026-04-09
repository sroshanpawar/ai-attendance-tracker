import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ManageHub from './pages/ManageHub';
import ManageBatches from './pages/ManageBatches';
import EnrollStudent from './pages/EnrollStudent';
import StudentDatabase from './pages/StudentDatabase';
import MarkAttendance from './pages/MarkAttendance';
import PastRecords from './pages/PastRecords';
import SessionDetails from './pages/SessionDetails';

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
      <div className="flex h-screen w-full items-center justify-center bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!session ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />} />
        
        <Route path="/login" element={<Auth session={session} />} />

        {/* Protected Dashboard Layout */}
        <Route element={!session ? <Navigate to="/login" replace /> : <DashboardLayout session={session} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manage" element={<ManageHub />} />
          <Route path="/manage/batches" element={<ManageBatches />} />
          <Route path="/manage/enroll" element={<EnrollStudent />} />
          <Route path="/manage/students" element={<StudentDatabase />} />
          <Route path="/mark-attendance" element={<MarkAttendance session={session} />} />
          <Route path="/past-records" element={<PastRecords />} />
          <Route path="/session/:sessionId" element={<SessionDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
