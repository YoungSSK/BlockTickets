import React from 'react';
import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import { Refresh, DeleteOutline, Home, WarningAmber } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary bắt được lỗi giao diện:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearCacheAndReload = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {
            console.error('Lỗi khi xóa storage:', e);
        }
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#0F172A',
                        color: '#F8FAFC',
                        p: 3,
                    }}
                >
                    <Container maxWidth="sm">
                        <Paper
                            elevation={4}
                            sx={{
                                p: 4,
                                borderRadius: '16px',
                                bgcolor: '#1E293B',
                                color: '#F8FAFC',
                                border: '1px solid #334155',
                                textAlign: 'center',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(239, 68, 68, 0.15)',
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <WarningAmber sx={{ fontSize: 36 }} />
                            </Box>

                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                Đã xảy ra sự cố hiển thị giao diện
                            </Typography>

                            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
                                Hệ thống vừa được cập nhật hoặc bộ nhớ tạm trình duyệt có dữ liệu phiên cũ chưa tương thích. Vui lòng thử tải lại trang hoặc làm mới bộ nhớ tạm bên dưới.
                            </Typography>

                            {this.state.error && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        mb: 3,
                                        bgcolor: '#0F172A',
                                        borderColor: '#334155',
                                        textAlign: 'left',
                                        overflowX: 'auto',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#F87171' }}>
                                        {this.state.error.toString()}
                                    </Typography>
                                </Paper>
                            )}

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Refresh />}
                                    onClick={this.handleReload}
                                    sx={{ fontWeight: 600, borderRadius: '8px' }}
                                >
                                    Tải lại trang
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<DeleteOutline />}
                                    onClick={this.handleClearCacheAndReload}
                                    sx={{ fontWeight: 600, borderRadius: '8px' }}
                                >
                                    Xóa Cache & Đăng nhập lại
                                </Button>
                            </Stack>
                        </Paper>
                    </Container>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
