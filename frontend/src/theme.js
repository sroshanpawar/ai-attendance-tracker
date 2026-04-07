// src/theme.js
import { createTheme } from '@mui/material/styles';
import { blue, grey } from '@mui/material/colors';

// Define a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: blue[700], // A slightly darker blue for primary elements
    },
    secondary: {
      main: grey[600], // Grey for secondary actions/text
    },
    background: {
      default: grey[100], // Light grey background for the page
      paper: '#ffffff',    // White background for cards/paper elements
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
       fontWeight: 600,
    }
  },
  components: {
    // Style overrides for specific components
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: blue[800], // Darker blue for app bar
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0,0,0,0.05)', // Softer shadow
          borderRadius: '12px', // Slightly more rounded corners
        },
      },
    },
     MuiButton: {
       styleOverrides: {
         root: {
           borderRadius: '8px', // Match card rounding
           textTransform: 'none', // Prevent ALL CAPS
           fontWeight: 600,
         },
         containedPrimary: {
           boxShadow: 'none',
           '&:hover': {
             boxShadow: 'none',
           },
         },
       },
     },
     MuiPaper: {
        styleOverrides: {
           root: {
             borderRadius: '12px',
             boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
           }
        }
     }
  },
});

export default theme;