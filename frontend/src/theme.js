// src/theme.js
import { createTheme } from '@mui/material/styles';
import { blue, grey, green, red } from '@mui/material/colors';

// Define a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: blue[700], // A strong blue for primary actions
    },
    secondary: {
      main: grey[600],
    },
    background: {
      default: blue[50], // Very light blue background, like your reference
      paper: '#ffffff',    // White for all cards/paper
    },
    success: {
      main: green[600],
      contrastText: '#fff',
    },
    error: {
      main: red[600],
      contrastText: '#fff',
    },
    info: {
      main: blue[500],
      contrastText: '#fff',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, marginBottom: '1rem' },
    h5: { fontWeight: 600, marginBottom: '0.8rem' },
    h6: { fontWeight: 600, marginBottom: '0.5rem' },
  },
  shape: {
    borderRadius: 12, // More rounded corners, like your reference
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff', // White app bar
          color: grey[800],         // Dark text
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1)', // Subtle shadow
        },
      },
    },
    MuiPaper: { // Style for all Paper components
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0,0,0,0.08)', // Softer shadow
        },
      },
    },
     MuiCard: { // Style for all Card components
        styleOverrides: {
           root: {
             boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
           }
        }
     },
     MuiButton: {
       styleOverrides: {
         root: {
           textTransform: 'none',
           fontWeight: 600,
           padding: '10px 20px',
         },
         containedPrimary: {
           boxShadow: '0px 3px 6px rgba(0,123,255,0.2)', // Subtle blue shadow for primary button
           '&:hover': {
             boxShadow: 'none',
             backgroundColor: blue[800]
           },
         },
       },
     },
     MuiTableCell: {
        styleOverrides: {
            head: {
                fontWeight: 600,
                backgroundColor: grey[100],
                color: grey[700],
            }
        }
     }
  },
});

export default theme;