export const getPalette = (mode) => ({
    mode,
    primary: {
        main: mode === 'light' ? '#2563EB' : '#3B82F6',
        hover: '#1D4ED8',
        dark: '#1E40AF',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#64748B',
        contrastText: '#FFFFFF',
    },
    background: {
        default: mode === 'light' ? '#F8FAFC' : '#0B0F19',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
        subtle: mode === 'light' ? '#F1F5F9' : '#334155',
    },
    text: {
        primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
        secondary: mode === 'light' ? '#64748B' : '#94A3B8',
        disabled: mode === 'light' ? '#94A3B8' : '#64748B',
    },
    divider: mode === 'light' ? '#E2E8F0' : '#334155',
    error: {
        main: mode === 'light' ? '#EF4444' : '#F87171',
        light: mode === 'light' ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
    },
    warning: {
        main: mode === 'light' ? '#F97316' : '#FB923C',
        light: mode === 'light' ? '#FFF7ED' : 'rgba(249, 115, 22, 0.15)',
    },
    success: {
        main: mode === 'light' ? '#10B981' : '#34D399',
        light: mode === 'light' ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
    },
    // Custom status tokens (accessed via theme.palette.status.*)
    // Defined according to docs/theme_specification.md Section 2.3 & 9.1
    status: {
        success: mode === 'light' ? '#10B981' : '#34D399',
        successBg: mode === 'light' ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
        pending: mode === 'light' ? '#F59E0B' : '#FBBF24',
        pendingBg: mode === 'light' ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
        onchain: mode === 'light' ? '#6366F1' : '#818CF8',
        onchainBg: mode === 'light' ? '#EEF2FF' : 'rgba(99, 102, 241, 0.15)',
        warning: mode === 'light' ? '#F97316' : '#FB923C',
        warningBg: mode === 'light' ? '#FFF7ED' : 'rgba(249, 115, 22, 0.15)',
        error: mode === 'light' ? '#EF4444' : '#F87171',
        errorBg: mode === 'light' ? '#FEF2F2' : 'rgba(239, 68, 68, 0.15)',
        checkedIn: mode === 'light' ? '#8B5CF6' : '#A78BFA',
        checkedInBg: mode === 'light' ? '#F5F3FF' : 'rgba(139, 92, 246, 0.15)',
        cancelled: mode === 'light' ? '#64748B' : '#94A3B8',
        cancelledBg: mode === 'light' ? '#F1F5F9' : 'rgba(100, 116, 139, 0.15)',
    },
    action: {
        hover: mode === 'light' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(59, 130, 246, 0.08)',
        selected: mode === 'light' ? '#EFF6FF' : 'rgba(37, 99, 235, 0.12)',
    },
});
