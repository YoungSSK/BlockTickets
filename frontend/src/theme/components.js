export const getComponentOverrides = (mode) => ({
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: 'none',
                minHeight: '44px',
                '&:hover': {
                    boxShadow: 'none',
                },
                '&:active': {
                    boxShadow: 'none',
                },
            },
            containedPrimary: {
                '&:hover': {
                    backgroundColor: '#1D4ED8',
                },
                '&:active': {
                    backgroundColor: '#1E40AF',
                },
            },
            outlinedPrimary: {
                borderColor: mode === 'light' ? '#2563EB' : '#3B82F6',
                '&:hover': {
                    backgroundColor: mode === 'light' ? '#EFF6FF' : 'rgba(59, 130, 246, 0.08)',
                },
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: '10px',
                border: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
                backgroundImage: 'none',
                '&:hover': {
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
            },
        },
    },
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
                backgroundImage: 'none',
            },
        },
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
            size: 'medium',
        },
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: {
                borderRadius: '8px',
                minHeight: '48px',
                '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: mode === 'light' ? '#E2E8F0' : '#334155',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: mode === 'light' ? '#94A3B8' : '#64748B',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: mode === 'light' ? '#2563EB' : '#3B82F6',
                    borderWidth: '2px',
                },
                '&.Mui-error .MuiOutlinedInput-notchedOutline': {
                    borderColor: mode === 'light' ? '#EF4444' : '#F87171',
                },
            },
        },
    },
    MuiInputLabel: {
        styleOverrides: {
            root: {
                '&.Mui-focused': {
                    color: mode === 'light' ? '#2563EB' : '#3B82F6',
                },
            },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.75rem',
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
    MuiCssBaseline: {
        styleOverrides: {
            '*': {
                boxSizing: 'border-box',
            },
            body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === 'light' ? '#CBD5E1 transparent' : '#475569 transparent',
            },
        },
    },
    MuiDivider: {
        styleOverrides: {
            root: {
                borderColor: mode === 'light' ? '#E2E8F0' : '#334155',
            },
        },
    },
    MuiAlert: {
        styleOverrides: {
            root: {
                borderRadius: '8px',
            },
        },
    },
});
