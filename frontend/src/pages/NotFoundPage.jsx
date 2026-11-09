import React from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    Card,
    CardContent,
} from '@mui/material';
import {
    Home,
    ArrowBack,
    ConfirmationNumber,
    SearchOff,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 3,
            }}
        >
            <Container maxWidth="sm">
                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '16px',
                        textAlign: 'center',
                        p: { xs: 3, sm: 5 },
                        border: 1,
                        borderColor: 'divider',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
                    }}
                >
                    <CardContent>
                        {/* 404 Badge & Icon */}
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'action.selected',
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}
                        >
                            <SearchOff sx={{ fontSize: 44 }} />
                        </Box>

                        <Typography
                            variant="h1"
                            color="primary.main"
                            fontWeight={800}
                            sx={{ fontSize: { xs: '3rem', sm: '4.5rem' }, lineHeight: 1, mb: 1 }}
                        >
                            404
                        </Typography>

                        <Typography variant="h2" color="text.primary" fontWeight={700} gutterBottom>
                            Không Tìm Thấy Trang Yêu Cầu
                        </Typography>

                        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 420, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
                            Đường dẫn bạn vừa truy cập không tồn tại, đã bị đổi tên hoặc tạm thời không khả dụng trên hệ thống BlockTickets.
                        </Typography>

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<Home />}
                                component={RouterLink}
                                to="/"
                                sx={{ height: 44, px: 3, borderRadius: '8px', fontWeight: 600, minWidth: 180 }}
                            >
                                Về Trang Chủ
                            </Button>

                            <Button
                                variant="outlined"
                                color="primary"
                                size="large"
                                startIcon={<ArrowBack />}
                                onClick={() => navigate(-1)}
                                sx={{ height: 44, px: 3, borderRadius: '8px', fontWeight: 600, minWidth: 140 }}
                            >
                                Quay Lại
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default NotFoundPage;

