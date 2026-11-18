import React from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Link,
    Divider,
} from '@mui/material';
import {
    ConfirmationNumber,
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
                pt: 5,
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

                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.65 }}>
                            Nền tảng đặt vé & chuyển nhượng vé sự kiện NFT minh bạch trên Blockchain.
                            Đặt vé nhanh chóng, chống giả mạo và sang nhượng an toàn.
                        </Typography>
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
                                Tất cả sự kiện
                            </Link>
                            <Link component={RouterLink} to="/marketplace" color="text.secondary" variant="body2" underline="hover">
                                Chợ vé thứ cấp
                            </Link>
                            <Link component={RouterLink} to="/my-tickets" color="text.secondary" variant="body2" underline="hover">
                                Vé của tôi
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Cột 3: Danh mục sự kiện */}
                    <Grid item xs={6} sm={4} md={3}>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={700} mb={2}>
                            DANH MỤC SỰ KIỆN
                        </Typography>
                        <Stack spacing={1.2}>
                            <Link component={RouterLink} to="/events?category=music" color="text.secondary" variant="body2" underline="hover">
                                Sự kiện Âm nhạc
                            </Link>
                            <Link component={RouterLink} to="/events?category=sports" color="text.secondary" variant="body2" underline="hover">
                                Sự kiện Thể thao
                            </Link>
                            <Link component={RouterLink} to="/events?category=technology" color="text.secondary" variant="body2" underline="hover">
                                Sự kiện Công nghệ
                            </Link>
                            <Link component={RouterLink} to="/events?category=workshop" color="text.secondary" variant="body2" underline="hover">
                                Hội thảo & Workshop
                            </Link>
                        </Stack>
                    </Grid>

                    {/* Cột 4: Smart Contract */}
                    <Grid item xs={12} sm={4} md={3}>
                        <Typography variant="subtitle2" color="text.primary" fontWeight={700} mb={2}>
                            SMART CONTRACT
                        </Typography>
                        <Stack spacing={1.2}>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Chuẩn Token: <strong>ERC-721 (Non-Fungible Token)</strong>
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

                <Divider sx={{ my: 2.5 }} />

                <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                    © 2026 BlockTickets. Bảo lưu mọi quyền.
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
