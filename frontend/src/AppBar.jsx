// src/AppBar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InsightsIcon from '@mui/icons-material/Insights'; // Icon similar to reference

export function AppBar() {
  const navigate = useNavigate();
  const [session, setSession] = React.useState(null);

  // Check session on mount to show/hide sign out button
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    // Use position="sticky" to keep it at the top when scrolling
    <MuiAppBar position="sticky" elevation={0}> 
      <Toolbar>
        <InsightsIcon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 700 }} 
          onClick={() => navigate('/')}
        >
          AI Attendance Tracker
        </Typography>
        {session && (
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleSignOut}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Sign Out
          </Button>
        )}
      </Toolbar>
    </MuiAppBar>
  );
}