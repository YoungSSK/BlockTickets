import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode = 'light') => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isLight ? '#2563EB' : '#3B82F6',
        dark: '#1E40AF',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#64748B',
      },
      background: {
        default: isLight ? '#F8FAFC' : '#0B0F19',
        paper: isLight ? '#FFFFFF' : '#1E293B',
      },
      text: {
        primary: isLight ? '#0F172A' : '#F8FAFC',
        secondary: isLight ? '#64748B' : '#94A3B8',
        disabled: isLight ? '#94A3B8' : '#64748B',
      },
      divider: isLight ? '#E2E8F0' : '#334155',
      status: {
        success: isLight ? '#10B981' : '#34D399',
        warning: isLight ? '#F97316' : '#FB923C',
        error: isLight ? '#EF4444' : '#F87171',
        pending: isLight ? '#F59E0B' : '#FBBF24',
        onchain: isLight ? '#6366F1' : '#818CF8',
        checkedIn: isLight ? '#8B5CF6' : '#A78BFA',
        cancelled: isLight ? '#64748B' : '#94A3B8',
      },
    },
    typography: {
      fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      h1: {
        fontSize: '2.0rem',
        fontWeight: 700,
        lineHeight: 1.25,
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.35,
      },
      h4: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1.0rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
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
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};
