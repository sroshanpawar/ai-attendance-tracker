// src/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
// MUI Icons
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Reusable component for the colorful dashboard items
const DashboardItem = ({ title, icon, onClick, color }) => (
  <Paper
    elevation={0} // Shadow is handled by theme
    sx={{
      p: 2.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: `${color}.main`,
      color: `${color}.contrastText`,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6, // Increase shadow on hover
      },
    }}
    onClick={onClick}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {icon}
      <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>{title}</Typography>
    </Box>
    <ArrowForwardIcon />
  </Paper>
);


export function Dashboard() {
  const navigate = useNavigate();
  const iconStyles = { fontSize: 32 }; // Style for icons

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto' }}>
       <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Instructor Dashboard
       </Typography>
       
       {/* The colorful "stat boxes" */}
       <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
              <DashboardItem
                  title="Manage Students"
                  icon={<GroupAddIcon sx={iconStyles} />}
                  onClick={() => navigate('/manage-students')}
                  color="success" // Green
               />
          </Grid>
          <Grid item xs={12} md={4}>
               <DashboardItem
                  title="Mark Attendance"
                  icon={<HowToRegIcon sx={iconStyles} />}
                  onClick={() => navigate('/mark-attendance')}
                  color="error" // Red
               />
          </Grid>
           <Grid item xs={12} md={4}>
               <DashboardItem
                  title="View Records"
                  icon={<HistoryIcon sx={iconStyles} />}
                  onClick={() => navigate('/past-records')}
                  color="info" // Blue
               />
          </Grid>
       </Grid>

       {/* You can add other content here, like charts or recent activity */}
       <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Welcome!</Typography>
          <Typography variant="body1">
            Select an action from the options above to get started. You can manage your
            student rosters, start a new attendance session, or review past records.
          </Typography>
       </Paper>
    </Box>
  );
}