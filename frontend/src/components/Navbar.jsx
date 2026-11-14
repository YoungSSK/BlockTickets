import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Container,
    Typography,
    Button,
    IconButton,
    Chip,
    Stack,
    Tooltip,
    Menu,
    MenuItem,
    Divider,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    ConfirmationNumber,
    DarkMode,
    LightMode,
    Menu as MenuIcon,
    Close as CloseIcon,
    AccountBalanceWallet,
    AdminPanelSettings,
    EventNote,
    PeopleAlt,
    Person,
    Logout,
    Login,
    FiberManualRecord,
    Storefront,
    CheckCircle,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

// MetaMask Fox inline SVG
const MetaMaskIcon = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 318 318" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M274.1 35.5L174.6 108.7L193.5 64.3L274.1 35.5Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44.4 35.5L143.1 109.4L125.1 64.3L44.4 35.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M238.3 206.8L211.8 248.1L268.5 263.4L284.5 207.7L238.3 206.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34.1 207.7L49.9 263.4L106.6 248.1L80.1 206.8L34.1 207.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M103.6 138.2L88.1 161.7L144.4 164.2L142.5 103.8L103.6 138.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M214.9 138.2L175.5 103.1L174.6 164.2L230.5 161.7L214.9 138.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M106.6 248.1L141 232.7L111.4 208.1L106.6 248.1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M177.5 232.7L211.8 248.1L207.1 208.1L177.5 232.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

const Navbar = () => {
    const { mode, toggleTheme } = useAppTheme();
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State menu điều hướng trên thiết bị di động
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // State ví MetaMask
    const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
    const [walletBalance, setWalletBalance] = useState('');

    useEffect(() => {
        if (user?.walletAddress) {
            setWalletAddress(user.walletAddress);
        } else {
            setWalletAddress('');
        }
    }, [user]);

    const handleConnectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts[0]) {
                    setWalletAddress(accounts[0]);
                }
            } catch (err) {
                console.error('Lỗi kết nối ví MetaMask:', err);
            }
        } else {
            alert('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt của bạn!');
        }
    };

    // Danh sách menu điều hướng động theo phân hệ/vai trò tài khoản đang đăng nhập
    const navLinks = useMemo(() => {
        const role = user?.role;

        if (role === 'admin') {
            return [
                { label: 'Bảng điều khiển', path: '/admin/dashboard' },
                { label: 'Duyệt sự kiện', path: '/admin/events' },
                { label: 'Quản lý người dùng', path: '/admin/users' },
            ];
        }

        if (role === 'organizer') {
            return [
                { label: 'Bảng điều khiển', path: '/organizer/dashboard' },
                { label: 'Tạo sự kiện', path: '/organizer/create-event' },
                { label: 'Soát vé tại cổng', path: '/organizer/check-in' },
            ];
        }

        // Phân hệ Khách hàng (Customer) hoặc người dùng chưa đăng nhập
        const customerLinks = [
            { label: 'Trang chủ', path: '/' },
            { label: 'Khám phá sự kiện', path: '/events' },
            { label: 'Chợ vé thứ cấp', path: '/marketplace' },
        ];

        if (isAuthenticated) {
            customerLinks.push({ label: 'Kho vé của tôi', path: '/my-tickets' });
        }

        return customerLinks;
    }, [user?.role, isAuthenticated]);

    return (
        <Box
            component="header"
            sx={{
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                position: 'sticky',
                top: 0,
                zIndex: 1200,
                backdropFilter: 'blur(8px)',
            }}
        >
            <Container maxWidth="xl">
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ height: 70 }}
                >
                    {/* Logo & Brand */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        component={RouterLink}
                        to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'organizer' ? '/organizer/dashboard' : '/'}
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <Box
                            sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '8px',
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                            }}
                        >
                            <ConfirmationNumber sx={{ fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="h3" color="primary.main" fontWeight={700} sx={{ lineHeight: 1.1 }}>
                                BlockTickets
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                NFT EVENT TICKETING
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Desktop Navigation Links */}
                    <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ display: { xs: 'none', lg: 'flex' } }}
                    >
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            return (
                                <Button
                                    key={link.path}
                                    component={RouterLink}
                                    to={link.path}
                                    sx={{
                                        color: isActive ? 'primary.main' : 'text.secondary',
                                        fontWeight: isActive ? 700 : 500,
                                        px: 1.8,
                                        py: 0.8,
                                        borderRadius: '8px',
                                        bgcolor: isActive ? 'action.selected' : 'transparent',
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    {link.label}
                                </Button>
                            );
                        })}
                    </Stack>

                    {/* Right Action Tools: Wallet & Theme & Profile */}
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        {/* Sepolia Testnet Pill */}
                        <Chip
                            icon={<FiberManualRecord sx={{ color: 'status.success', fontSize: 10 }} />}
                            label="Sepolia"
                            size="small"
                            sx={{
                                bgcolor: 'status.successBg',
                                color: 'status.success',
                                fontWeight: 600,
                                height: 26,
                                display: { xs: 'none', sm: 'inline-flex' },
                            }}
                        />

                        {/* MetaMask Wallet Button / Pill */}
                        {walletAddress ? (
                            <Tooltip title="Ví MetaMask đang kết nối mạng Ethereum Sepolia">
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: '5px 12px',
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: '8px',
                                        bgcolor: 'background.subtle',
                                        cursor: 'pointer',
                                    }}
                                    onClick={handleConnectWallet}
                                >
                                    <MetaMaskIcon size={18} />
                                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.primary', display: 'block', lineHeight: 1.1 }}>
                                            {truncateHash(walletAddress, 6, 4)}
                                        </Typography>
                                        <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>
                                            {walletBalance}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Tooltip>
                        ) : (
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={handleConnectWallet}
                                startIcon={<MetaMaskIcon />}
                                sx={{ height: 38, borderRadius: '8px' }}
                            >
                                Kết nối ví
                            </Button>
                        )}

                        {/* Theme Toggle Button */}
                        <Tooltip title={mode === 'light' ? 'Chuyển Dark Mode' : 'Chuyển Light Mode'}>
                            <IconButton
                                aria-label="Chuyển đổi giao diện sáng tối"
                                onClick={toggleTheme}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: '8px',
                                    width: 38,
                                    height: 38,
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        {/* Auth / Profile Button */}
                        {isAuthenticated ? (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                                <Tooltip title={`${user?.fullName || 'Người dùng'} (${user?.role || 'customer'})`}>
                                    <Chip
                                        label={user?.fullName || 'Tài khoản'}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontWeight: 600, maxWidth: 140 }}
                                    />
                                </Tooltip>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => {
                                        logout();
                                        navigate('/login');
                                    }}
                                    startIcon={<Logout />}
                                    sx={{ height: 38, borderRadius: '8px' }}
                                >
                                    Đăng xuất
                                </Button>
                            </Stack>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                component={RouterLink}
                                to="/login"
                                sx={{ height: 38, borderRadius: '8px', display: { xs: 'none', sm: 'inline-flex' } }}
                            >
                                Đăng nhập
                            </Button>
                        )}

                        {/* Mobile Hamburger Menu */}
                        <IconButton
                            aria-label="Mở menu điều hướng"
                            onClick={() => setMobileDrawerOpen(true)}
                            sx={{ display: { xs: 'flex', lg: 'none' }, border: 1, borderColor: 'divider', borderRadius: '8px' }}
                        >
                            <MenuIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Stack>
            </Container>

            {/* Mobile Navigation Drawer */}
            <Drawer
                anchor="right"
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                PaperProps={{ sx: { width: 280, bgcolor: 'background.paper', p: 2 } }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                        BlockTickets
                    </Typography>
                    <IconButton aria-label="Đóng menu" onClick={() => setMobileDrawerOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <List>
                    {navLinks.map((link) => (
                        <ListItem key={link.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={RouterLink}
                                to={link.path}
                                onClick={() => setMobileDrawerOpen(false)}
                                sx={{ borderRadius: '8px' }}
                            >
                                <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    <Divider sx={{ my: 1.5 }} />
                    {isAuthenticated ? (
                        <>
                            <ListItem disablePadding sx={{ mb: 1 }}>
                                <Box sx={{ px: 2, py: 1, width: '100%', bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                    <Typography variant="body2" fontWeight={700} color="text.primary">
                                        {user?.fullName || 'Người dùng'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {user?.email || ''} ({user?.role || 'customer'})
                                    </Typography>
                                </Box>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => {
                                        logout();
                                        setMobileDrawerOpen(false);
                                        navigate('/login');
                                    }}
                                    sx={{ borderRadius: '8px', color: 'error.main' }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
                                        <Logout fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontWeight: 600 }} />
                                </ListItemButton>
                            </ListItem>
                        </>
                    ) : (
                        <ListItem disablePadding>
                            <ListItemButton
                                component={RouterLink}
                                to="/login"
                                onClick={() => setMobileDrawerOpen(false)}
                                sx={{ borderRadius: '8px', bgcolor: 'action.selected' }}
                            >
                                <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                                    <Login fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Đăng nhập tài khoản" primaryTypographyProps={{ fontWeight: 600, color: 'primary.main' }} />
                            </ListItemButton>
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </Box>
    );
};

export default Navbar;

