// src/theme.js  — Academic Light Mode Theme
import { createTheme } from '@mui/material/styles';

// ─── Academic Color Palette ────────────────────────────────────────────────
const ACADEMIC = {
  // Sidebar / primary brand
  navyDark:  '#0f2044',
  navy:      '#1a3560',
  navyMid:   '#1e40af',
  blue:      '#2563eb',
  blueLight: '#3b82f6',

  // Backgrounds
  appBg:    '#f0f2f5',
  white:    '#ffffff',
  surface:  '#ffffff',
  surfaceAlt: '#f8fafc',

  // Text
  textPrimary:   '#0f172a',
  textSecondary: '#475569',
  textMuted:     '#94a3b8',
  textDisabled:  '#cbd5e1',

  // Borders
  border:      '#e2e8f0',
  borderLight: '#f1f5f9',

  // Status
  success: '#059669',
  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',

  error:   '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',

  warning: '#d97706',
  warningBg: '#fffbeb',

  info:    '#0284c7',
  infoBg:  '#f0f9ff',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: ACADEMIC.blue,
      dark: ACADEMIC.navyMid,
      light: ACADEMIC.blueLight,
      contrastText: '#ffffff',
    },
    secondary: {
      main: ACADEMIC.navy,
      contrastText: '#ffffff',
    },
    background: {
      default: ACADEMIC.appBg,
      paper:   ACADEMIC.white,
    },
    text: {
      primary:   ACADEMIC.textPrimary,
      secondary: ACADEMIC.textSecondary,
      disabled:  ACADEMIC.textMuted,
    },
    success: { main: ACADEMIC.success, contrastText: '#fff' },
    error:   { main: ACADEMIC.error,   contrastText: '#fff' },
    warning: { main: ACADEMIC.warning, contrastText: '#fff' },
    info:    { main: ACADEMIC.info,    contrastText: '#fff' },
    divider: ACADEMIC.border,
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.025em', color: ACADEMIC.textPrimary },
    h2: { fontWeight: 700, letterSpacing: '-0.020em', color: ACADEMIC.textPrimary },
    h3: { fontWeight: 700, letterSpacing: '-0.015em', color: ACADEMIC.textPrimary },
    h4: { fontWeight: 700, letterSpacing: '-0.010em', color: ACADEMIC.textPrimary },
    h5: { fontWeight: 600, color: ACADEMIC.textPrimary },
    h6: { fontWeight: 600, color: ACADEMIC.textPrimary },
    body1: { color: ACADEMIC.textPrimary, lineHeight: 1.65 },
    body2: { color: ACADEMIC.textSecondary, lineHeight: 1.6, fontSize: '0.875rem' },
    caption: { color: ACADEMIC.textMuted, fontSize: '0.75rem' },
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
  },

  shape: { borderRadius: 8 },

  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 4px rgba(0,0,0,0.08)',
    '0 2px 8px rgba(0,0,0,0.09)',
    '0 4px 12px rgba(0,0,0,0.10)',
    '0 6px 16px rgba(0,0,0,0.10)',
    '0 8px 20px rgba(0,0,0,0.10)',
    '0 10px 24px rgba(0,0,0,0.10)',
    '0 12px 28px rgba(0,0,0,0.10)',
    '0 14px 32px rgba(0,0,0,0.10)',
    '0 16px 36px rgba(0,0,0,0.10)',
    '0 18px 40px rgba(0,0,0,0.10)',
    '0 20px 44px rgba(0,0,0,0.10)',
    '0 22px 48px rgba(0,0,0,0.10)',
    '0 24px 52px rgba(0,0,0,0.10)',
    '0 26px 56px rgba(0,0,0,0.10)',
    '0 28px 60px rgba(0,0,0,0.10)',
    '0 30px 64px rgba(0,0,0,0.10)',
    '0 32px 68px rgba(0,0,0,0.10)',
    '0 34px 72px rgba(0,0,0,0.10)',
    '0 36px 76px rgba(0,0,0,0.10)',
    '0 38px 80px rgba(0,0,0,0.10)',
    '0 40px 84px rgba(0,0,0,0.10)',
    '0 42px 88px rgba(0,0,0,0.10)',
    '0 44px 92px rgba(0,0,0,0.10)',
  ],

  components: {
    // ─── CssBaseline ───────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: ACADEMIC.appBg, color: ACADEMIC.textPrimary },
      },
    },

    // ─── Paper / Cards ──────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: ACADEMIC.white,
          border: `1px solid ${ACADEMIC.border}`,
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        },
        elevation1: { boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
        elevation2: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        elevation3: { boxShadow: '0 4px 12px rgba(0,0,0,0.09)' },
      },
    },

    // ─── Button ─────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '9px 20px',
          fontSize: '0.875rem',
          transition: 'all 0.15s ease',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          background: ACADEMIC.blue,
          color: '#fff',
          '&:hover': { background: ACADEMIC.navyMid },
        },
        outlinedPrimary: {
          borderColor: ACADEMIC.blue,
          color: ACADEMIC.blue,
          '&:hover': { background: 'rgba(37,99,235,0.05)', borderColor: ACADEMIC.navyMid },
        },
        text: {
          color: ACADEMIC.textSecondary,
          '&:hover': { background: ACADEMIC.borderLight, color: ACADEMIC.textPrimary },
        },
        sizeSmall:  { padding: '5px 14px', fontSize: '0.8rem' },
        sizeLarge:  { padding: '11px 28px', fontSize: '0.95rem' },
      },
    },

    // ─── TextField ──────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: ACADEMIC.white,
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: ACADEMIC.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: ACADEMIC.blue,
            borderWidth: '1.5px',
          },
        },
        input: { color: ACADEMIC.textPrimary, fontSize: '0.875rem' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: ACADEMIC.textSecondary, fontSize: '0.875rem', '&.Mui-focused': { color: ACADEMIC.blue } },
      },
    },

    // ─── Table ──────────────────────────────────────────────────
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 10, border: `1px solid ${ACADEMIC.border}` },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            color: ACADEMIC.textSecondary,
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            borderBottom: `2px solid ${ACADEMIC.border}`,
            padding: '12px 18px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:nth-of-type(even)': { backgroundColor: '#fafbfc' },
            '&:hover': { backgroundColor: 'rgba(37,99,235,0.04)' },
            '&:last-child td': { borderBottom: 'none' },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${ACADEMIC.border}`,
          padding: '13px 18px',
          fontSize: '0.875rem',
          color: ACADEMIC.textPrimary,
        },
      },
    },

    // ─── Chip ───────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { height: 26, fontSize: '0.75rem', fontWeight: 600, borderRadius: 6 },
        filledDefault: { background: '#e2e8f0', color: ACADEMIC.textSecondary },
        colorPrimary: { background: 'rgba(37,99,235,0.12)', color: ACADEMIC.blue },
      },
    },

    // ─── Alert ──────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.875rem' },
        standardSuccess: { background: ACADEMIC.successBg, border: `1px solid ${ACADEMIC.successBorder}`, color: '#065f46' },
        standardError:   { background: ACADEMIC.errorBg,   border: `1px solid ${ACADEMIC.errorBorder}`,   color: '#7f1d1d' },
        standardInfo:    { background: ACADEMIC.infoBg,    border: `1px solid #bae6fd`, color: '#0c4a6e' },
        standardWarning: { background: ACADEMIC.warningBg, border: '1px solid #fde68a', color: '#78350f' },
      },
    },

    // ─── Menu ───────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: `1px solid ${ACADEMIC.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          borderRadius: 10,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: 6,
          margin: '2px 6px',
          color: ACADEMIC.textPrimary,
          '&:hover': { background: 'rgba(37,99,235,0.06)' },
          '&.Mui-selected': { background: 'rgba(37,99,235,0.09)', '&:hover': { background: 'rgba(37,99,235,0.12)' } },
        },
      },
    },

    // ─── LinearProgress ─────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 8, backgroundColor: '#e2e8f0' },
        bar:  { borderRadius: 99, backgroundColor: ACADEMIC.blue },
      },
    },

    // ─── Divider ────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: { root: { borderColor: ACADEMIC.border } },
    },

    // ─── IconButton ─────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: ACADEMIC.textMuted,
          borderRadius: 8,
          '&:hover': { background: ACADEMIC.borderLight, color: ACADEMIC.blue },
        },
      },
    },

    // ─── Checkbox ───────────────────────────────────────────────
    MuiCheckbox: {
      styleOverrides: {
        root: { color: '#cbd5e1', '&.Mui-checked': { color: ACADEMIC.blue } },
      },
    },

    // ─── Tooltip ────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: ACADEMIC.navyDark, fontSize: '0.78rem', borderRadius: 6, padding: '5px 10px' },
      },
    },

    // ─── FormControlLabel ───────────────────────────────────────
    MuiFormControlLabel: {
      styleOverrides: {
        label: { fontSize: '0.875rem', color: ACADEMIC.textSecondary },
      },
    },

    // ─── ListItemText ───────────────────────────────────────────
    MuiListItemText: {
      styleOverrides: {
        primary: { fontWeight: 500, fontSize: '0.875rem', color: ACADEMIC.textPrimary },
        secondary: { fontSize: '0.78rem', color: ACADEMIC.textMuted },
      },
    },
  },
});

export default theme;
export { ACADEMIC };