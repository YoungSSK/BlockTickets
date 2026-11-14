import React from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Link,
    Divider,
    Chip,
} from '@mui/material';
import {
    ConfirmationNumber,
    Security,
    Shield,
    FiberManualRecord,
    Launch,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                pt: 6,
                pb: 4,
                mt: 'auto',
            }}
        >
            <Container maxWidth="xl">
                <Grid container spacing={4} mb={4}>
                    {/* Cột 1: Thương hiệu & Giới thiệu */}
                    <Grid item xs={12} md={4}>
                        <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                            <Box
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '8px',
                                    bgcolor: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                }}
                            >
                                <ConfirmationNumber sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography variant="h3" color="primary.main" fontWeight={700}>
                                BlockTickets
                            </Typography>
                        </Stack>

                        <Typography variant="body2" color="text.secondary" paragraph sx={{ maxWidth: 360, lineHeight: 1.6 }}>
                            Nền tảng phân phối & chuyển nhượng vé sự kiện ứng dụng công nghệ Blockchain & NFT trên Ethereum Sepolia.
                            Chống vé giả, triệt tiêu phe vé với trần giá bất biến 120%.
                        </Typography>

                        <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                            <Chip
                                icon={<FiberManualRecord sx={{ color: 'status.success', fontSize: 10 }} />}
                                label="Sepolia Testnet #11155111"
                                size="small"
                                sx={{ bgcolor: 'status.successBg', color: 'status.success', fontWeight: 600 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Cột 2: Khám phá */}
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={700} mb={2}>
                            KHÁM PHÁ
                        </Typography>
                        <Stack spacing={1.2}>
                            <Link component={RouterLink} to="/" color="text.secondary" variant="body2" underline="hover">
                                Trang chủ
                            </Link>
                            <Link component={RouterLink} to="/events" color="text.secondary" variant="body2" underline="hover">
                                Sự kiện nổi bật
                            </Link>
                            <Link component={RouterLink} to="/marketplace" color="text.secondary" variant="body2" underline="hover">
                                Chợ vé thứ cấp
                            </Link>
                            <Link component={RouterLink} to="/my-tickets" color="text.secondary" variant="body2" underline="hover">
                                Kho vé của tôi
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Cột 3: Quản trị & Nhà tổ chức */}
                    <Grid item xs={6} sm={4} md={3}>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={700} mb={2}>
                            QUẢN TRỊ & HỆ THỐNG
                        </Typography>
                        <Stack spacing={1.2}>
                            <Link component={RouterLink} to="/admin/dashboard" color="text.secondary" variant="body2" underline="hover">
                                Bảng điều khiển Quản trị
                            </Link>
                            <Link component={RouterLink} to="/admin/events" color="text.secondary" variant="body2" underline="hover">
                                Phê duyệt sự kiện
                            </Link>
                            <Link component={RouterLink} to="/admin/users" color="text.secondary" variant="body2" underline="hover">
                                Quản lý người dùng & ví
                            </Link>
                            <Link component={RouterLink} to="/login" color="text.secondary" variant="body2" underline="hover">
                                Đăng nhập tài khoản
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Cột 4: Bảo mật & Chuỗi khối */}
                    <Grid item xs={12} sm={4} md={3}>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={700} mb={2}>
                            SMART CONTRACT & BẢO MẬT
                        </Typography>
                        <Stack spacing={1.2}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Chuẩn Token: <strong>ERC-721 (Non-Fungible Token)</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Quy tắc bất biến: <strong>Trần giá bán lại 120% (BR-02)</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Soát vé: <strong>Mã QR động ký số HMAC</strong>
                            </Typography>
                            <Link
                                href="https://sepolia.etherscan.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                color="primary"
                                variant="caption"
                                fontWeight={600}
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                            >
                                Sepolia Etherscan Explorer <Launch sx={{ fontSize: 13 }} />
                            </Link>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                >
                    <Typography variant="caption" color="text.secondary">
                        © 2026 BlockTickets System. Bảo lưu mọi quyền. Nền tảng vé sự kiện Blockchain.
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        Thiết kế theo chuẩn Modern SaaS Design System (docs/theme_specification.md)
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
};

export default Footer;

