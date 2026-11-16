import React, { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    IconButton,
    Avatar,
    Chip,
    Button,
    Stack,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Snackbar,
    Alert,
    useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Dashboard as DashboardIcon,
    TrendingUp,
    EventNote,
    CheckCircle,
    PeopleAlt,
    QrCodeScanner,
    AddCircleOutline,
    Logout,
    DarkMode,
    LightMode,
    Menu as MenuIcon,
    Close as CloseIcon,
    ConfirmationNumber,
    Shield,
    AdminPanelSettings,
    FiberManualRecord,
    ContentCopy,
    Refresh,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';

const SIDEBAR_WIDTH = 270;

const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// MetaMask Fox inline SVG


/**
 * DashboardLayout - Chuẩn giao diện quản trị có bộ tab điều khiển bên trái
 * Áp dụng thống nhất cho cả Admin Portal và Organizer Portal
 * 
 * @param {('admin'|'organizer')} role - Phân hệ quản trị
 * @param {string} title - Tiêu đề chính trang
 * @param {string} subtitle - Mô tả phụ
 * @param {React.ReactNode} topActions - Các nút thao tác bổ sung trên thanh tiêu đề
 * @param {React.ReactNode} children - Nội dung trang
 */
const DashboardLayout = ({
    role = 'admin',
    title,
    subtitle,
    topActions,
    hideHeaderActions = true,
    children,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

    const { user, logout } = useAuth();
    const { mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCopy = (text, label = 'nội dung') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 6, 4)}`, 'success');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        setLogoutDialogOpen(false);
        logout();
        navigate('/login', { replace: true });
    };

    // Danh sách menu tab điều khiển bên trái theo vai trò
    const menuItems = role === 'admin'
        ? [
            {
                key: 'dashboard',
                label: 'Bảng Điều Khiển',
                path: '/admin/dashboard',
                icon: <TrendingUp />,
                desc: 'Tổng quan chỉ số & audit log',
            },
            {
                key: 'events',
                label: 'Duyệt Sự Kiện',
                path: '/admin/events',
                icon: <EventNote />,
                desc: 'Phê duyệt & kiểm tra smart contract',
            },
            {
                key: 'users',
                label: 'Quản Lý Người Dùng',
                path: '/admin/users',
                icon: <PeopleAlt />,
                desc: 'Phân quyền & giám sát ví Web3',
            },
        ]
        : [
            {
                key: 'dashboard',
                label: 'Bảng Điều Khiển',
                path: '/organizer/dashboard',
                icon: <TrendingUp />,
                desc: 'Doanh số vé & rút tiền on-chain',
            },
            {
                key: 'create-event',
                label: 'Tạo sự kiện',
                path: '/organizer/events',
                icon: <EventNote />,
                desc: 'Danh sách sự kiện & khởi tạo mới',
            },
            {
                key: 'check-in',
                label: 'Soát Vé Tại Cổng',
                path: '/organizer/check-in',
                icon: <QrCodeScanner />,
                desc: 'Quét mã QR HMAC bảo mật',
            },
        ];

    const portalBadge = role === 'admin' ? 'QUẢN TRỊ VIÊN' : 'BAN TỔ CHỨC';
    const portalColor = role === 'admin' ? '#EF4444' : '#2563EB';

    // Nội dung Sidebar bên trái
    const sidebarContent = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
            }}
        >
            {/* 1. Header Sidebar: Logo & Phân hệ */}
            <Box sx={{ p: 2.5, pb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '10px',
                            bgcolor: role === 'admin' ? 'error.main' : 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                        }}
                    >
                        {role === 'admin' ? <AdminPanelSettings sx={{ fontSize: 24 }} /> : <ConfirmationNumber sx={{ fontSize: 24 }} />}
                    </Box>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.1, fontSize: '1.1rem' }}>
                            BlockTickets
                        </Typography>
                        <Typography variant="caption" sx={{ letterSpacing: '0.08em', fontWeight: 700, color: portalColor, fontSize: '0.68rem' }}>
                            {role === 'admin' ? 'ADMIN PORTAL' : 'ORGANIZER PORTAL'}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
                    <Chip
                        icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: 'status.success' }} />}
                        label="Sepolia Testnet #11155111"
                        size="small"
                        sx={{
                            bgcolor: 'status.successBg',
                            color: 'status.success',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            width: '100%',
                            justifyContent: 'flex-start',
                        }}
                    />
                </Stack>
            </Box>

            <Divider sx={{ mx: 2, mb: 1.5 }} />

            {/* 2. Danh mục Menu Tabs điều khiển bên trái */}
            <Box sx={{ flexGrow: 1, px: 1.5 }}>
                <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={700}
                    sx={{ px: 1.5, pb: 1, display: 'block', letterSpacing: '0.05em' }}
                >
                    ĐIỀU HƯỚNG QUẢN TRỊ
                </Typography>
                <List disablePadding>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/admin/events' && location.pathname.startsWith('/admin/events')) ||
                            (item.path === '/admin/users' && location.pathname.startsWith('/admin/users')) ||
                            (item.key === 'create-event' && (location.pathname.startsWith('/organizer/events') || location.pathname.startsWith('/organizer/create-event')));

                        return (
                            <ListItem key={item.key} disablePadding sx={{ mb: 0.8 }}>
                                <ListItemButton
                                    component={RouterLink}
                                    to={item.path}
                                    onClick={() => isMobile && setMobileOpen(false)}
                                    sx={{
                                        borderRadius: '10px',
                                        py: 1.2,
                                        px: 1.5,
                                        bgcolor: isActive ? 'action.selected' : 'transparent',
                                        color: isActive ? 'primary.main' : 'text.secondary',
                                        borderLeft: isActive ? 3 : 0,
                                        borderColor: 'primary.main',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                            color: 'primary.main',
                                            '& .MuiListItemIcon-root': {
                                                color: 'primary.main',
                                            },
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 38,
                                            color: isActive ? 'primary.main' : 'text.secondary',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.88rem',
                                            fontWeight: isActive ? 700 : 500,
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* 3. Phần dưới Sidebar: Thông tin User, Chuyển Theme & Nút LOGOUT */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.subtle' }}>
                {/* Thông tin tài khoản đang đăng nhập */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                    <Avatar
                        sx={{
                            width: 38,
                            height: 38,
                            bgcolor: role === 'admin' ? 'error.main' : 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                        }}
                    >
                        {(user?.fullName || 'BT').slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden', flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} noWrap color="text.primary">
                            {user?.fullName || (role === 'admin' ? 'Quản trị viên' : 'Ban tổ chức')}
                        </Typography>
                        <Chip
                            label={portalBadge}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: role === 'admin' ? '#EF4444' : '#2563EB',
                                color: '#ffffff',
                                px: 0.8,
                                letterSpacing: '0.04em',
                                mt: 0.3,
                            }}
                        />
                    </Box>
                </Stack>

                {/* Hàng nút công cụ: Chuyển theme & Đăng xuất */}
                <Stack direction="row" spacing={1}>
                    <Tooltip title={mode === 'light' ? 'Bật Dark Mode' : 'Bật Light Mode'}>
                        <IconButton
                            onClick={toggleTheme}
                            size="small"
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: '8px',
                                bgcolor: 'background.paper',
                                color: 'text.secondary',
                                flexShrink: 0,
                                width: 38,
                                height: 38,
                            }}
                        >
                            {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    {/* NÚT ĐĂNG XUẤT (LOGOUT) CHÍNH */}
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Logout />}
                        onClick={() => setLogoutDialogOpen(true)}
                        sx={{
                            height: 38,
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            bgcolor: 'background.paper',
                            borderColor: 'error.main',
                            color: 'error.main',
                            '&:hover': {
                                bgcolor: 'error.main',
                                color: '#fff',
                            },
                        }}
                    >
                        Đăng Xuất
                    </Button>
                </Stack>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* ═══════════════════════════════════════════════════════════════════
                SIDEBAR DESKTOP (CỐ ĐỊNH BÊN TRÁI)
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                component="nav"
                sx={{
                    width: { lg: SIDEBAR_WIDTH },
                    flexShrink: { lg: 0 },
                    display: { xs: 'none', lg: 'block' },
                }}
            >
                <Box
                    sx={{
                        width: SIDEBAR_WIDTH,
                        height: '100vh',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        zIndex: 1200,
                    }}
                >
                    {sidebarContent}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════════════
                SIDEBAR MOBILE DRAWER (TRÊN MÀN HÌNH NHỎ)
            ═══════════════════════════════════════════════════════════════════ */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
                }}
            >
                {sidebarContent}
            </Drawer>

            {/* ═══════════════════════════════════════════════════════════════════
                KHU VỰC NỘI DUNG CHÍNH (MAIN CONTENT AREA)
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* TOP APP BAR (HEADER NẰM TRÊN) */}
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        borderBottom: 1,
                        borderColor: 'divider',
                        py: 1.5,
                        px: { xs: 2, sm: 3, md: 4 },
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        {/* Nút Hamburger mở menu trên di động + Tiêu đề */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <IconButton
                                color="inherit"
                                aria-label="open drawer"
                                edge="start"
                                onClick={handleDrawerToggle}
                                sx={{ display: { lg: 'none' } }}
                            >
                                <MenuIcon />
                            </IconButton>

                            <Box>
                                {title && (
                                    <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.35rem' } }}>
                                        {title}
                                    </Typography>
                                )}
                                {subtitle && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        {subtitle}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>

                        {/* Top Actions (chỉ hiển thị khi có và không bị ẩn) */}
                        {!hideHeaderActions && topActions && (
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                {topActions}
                            </Stack>
                        )}
                    </Stack>
                </Box>

                {/* VÙNG NỘI DUNG NẰM TRONG CONTAINER */}
                <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, pb: 8 }}>
                    {children}
                </Box>
            </Box>

            {/* ═══════════════════════════════════════════════════════════════════
                HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT (CONFIRM LOGOUT DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={logoutDialogOpen}
                onClose={() => setLogoutDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '12px', p: 1, minWidth: { xs: 300, sm: 380 } }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                    Xác nhận đăng xuất
                </DialogTitle>
                <DialogContent>
                    <DialogContentText color="text.secondary">
                        Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc <strong>{portalBadge}</strong> không? Các dữ liệu chưa lưu sẽ bị hủy.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setLogoutDialogOpen(false)} variant="outlined" color="inherit" sx={{ borderRadius: '8px' }}>
                        Hủy
                    </Button>
                    <Button onClick={handleLogout} variant="contained" color="error" startIcon={<Logout />} sx={{ borderRadius: '8px' }}>
                        Đăng xuất ngay
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar thông báo ví Web3 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DashboardLayout;
