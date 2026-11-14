import React, { useState, useEffect, useCallback } from 'react';
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
    CircularProgress,
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
    AccountBalanceWallet,
    ContentCopy,
    Refresh,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { authAPI, userAPI } from '../services/api';

const SIDEBAR_WIDTH = 270;

const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

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

    // State ví Web3 MetaMask
    const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
    const [walletBalance, setWalletBalance] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCopy = (text, label = 'địa chỉ ví') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 6, 4)}`, 'success');
    };

    // Lấy số dư Sepolia ETH thật từ MetaMask
    const fetchWalletBalance = useCallback(async (address) => {
        if (!address) {
            setWalletBalance('');
            return;
        }
        try {
            if (window.ethereum) {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const balanceBigInt = await browserProvider.getBalance(address);
                const ethStr = ethers.formatEther(balanceBigInt);
                const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                setWalletBalance(`${ethNum} ETH`);
            } else {
                try {
                    const rpcProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
                    const balanceBigInt = await rpcProvider.getBalance(address);
                    const ethStr = ethers.formatEther(balanceBigInt);
                    const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                    setWalletBalance(`${ethNum} ETH`);
                } catch {
                    setWalletBalance('');
                }
            }
        } catch (err) {
            console.error('Lỗi khi lấy số dư ví DashboardLayout:', err);
        }
    }, []);

    // Tự động kiểm tra ví đã kết nối trong MetaMask
    useEffect(() => {
        let isMounted = true;
        const checkWallet = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts[0]) {
                        if (isMounted) {
                            setWalletAddress(accounts[0]);
                            await fetchWalletBalance(accounts[0]);
                        }
                        return;
                    }
                } catch (err) {
                    console.error('Lỗi eth_accounts DashboardLayout:', err);
                }
            }
            if (user?.walletAddress) {
                setWalletAddress(user.walletAddress);
                fetchWalletBalance(user.walletAddress);
            }
        };

        checkWallet();
        return () => {
            isMounted = false;
        };
    }, [user, fetchWalletBalance]);

    // Lắng nghe sự kiện chuyển đổi tài khoản ví hoặc đổi mạng
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
                await fetchWalletBalance(accounts[0]);
                showSnackbar(`Đã chuyển sang ví: ${truncateHash(accounts[0], 6, 4)}`, 'info');
            } else {
                setWalletAddress('');
                setWalletBalance('');
            }
        };

        const handleChainChanged = () => {
            if (walletAddress) {
                fetchWalletBalance(walletAddress);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [walletAddress, fetchWalletBalance]);

    // Xử lý kết nối ví MetaMask
    const handleConnectWallet = async () => {
        if (!window.ethereum) {
            showSnackbar('Trình duyệt chưa cài MetaMask. Vui lòng cài đặt tiện ích MetaMask!', 'warning');
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts[0]) {
                const addr = accounts[0];
                setWalletAddress(addr);
                await fetchWalletBalance(addr);
                showSnackbar(`Đã kết nối ví MetaMask: ${truncateHash(addr, 6, 4)}`, 'success');

                // Nếu tài khoản Organizer chưa lưu ví trong profile, tự động đồng bộ vào database
                if (user && !user.walletAddress) {
                    try {
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        const nonceRes = await authAPI.getNonce(addr);
                        const nonce = nonceRes.data?.data?.nonce;
                        if (nonce) {
                            const signature = await signer.signMessage(nonce);
                            await userAPI.linkWallet({
                                walletAddress: addr,
                                signature,
                                nonce,
                            });
                            showSnackbar('Đã liên kết ví MetaMask vào hồ sơ Ban Tổ Chức thành công!', 'success');
                            const updatedUser = { ...user, walletAddress: addr };
                            localStorage.setItem('blocktickets_user', JSON.stringify(updatedUser));
                        }
                    } catch (linkErr) {
                        console.log('Bỏ qua liên kết profile nếu người dùng không ký nonce:', linkErr.message);
                    }
                }
            }
        } catch (err) {
            if (err?.code === 4001 || err?.info?.error?.code === 4001) {
                showSnackbar('Bạn đã từ chối yêu cầu kết nối ví MetaMask.', 'warning');
            } else {
                showSnackbar(err.message || 'Lỗi khi kết nối ví MetaMask.', 'error');
            }
        } finally {
            setIsConnecting(false);
        }
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
                label: 'Tạo Sự Kiện Mới',
                path: '/organizer/create-event',
                icon: <AddCircleOutline />,
                desc: 'Khởi tạo sự kiện & cấu hình vé NFT',
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
                            (item.path === '/admin/users' && location.pathname.startsWith('/admin/users'));

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
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip
                                label={portalBadge}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    bgcolor: role === 'admin' ? 'error.light' : 'primary.light',
                                    color: role === 'admin' ? 'error.main' : 'primary.main',
                                    px: 0.5,
                                }}
                            />
                            {user?.walletAddress && (
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'text.secondary' }}>
                                    {truncateHash(user.walletAddress, 4, 3)}
                                </Typography>
                            )}
                        </Stack>
                    </Box>
                </Stack>

                {/* Khối hiển thị & kết nối ví Web3 cho Organizer / Admin */}
                <Box
                    sx={{
                        mb: 2,
                        p: 1.2,
                        borderRadius: '10px',
                        bgcolor: walletAddress ? 'rgba(16, 185, 129, 0.08)' : 'background.paper',
                        border: 1,
                        borderColor: walletAddress ? 'status.success' : 'divider',
                    }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                            <MetaMaskIcon size={16} />
                            <Typography variant="caption" fontWeight={700} color={walletAddress ? 'status.success' : 'text.secondary'}>
                                {walletAddress ? 'Ví MetaMask Sepolia' : 'Chưa kết nối ví'}
                            </Typography>
                        </Stack>
                        {walletAddress && (
                            <Chip label="Sepolia" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'status.successBg', color: 'status.success' }} />
                        )}
                    </Stack>
                    {walletAddress ? (
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Tooltip title="Nhấp để sao chép địa chỉ ví">
                                <Typography
                                    variant="caption"
                                    sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                    onClick={() => handleCopy(walletAddress, 'địa chỉ ví')}
                                >
                                    {truncateHash(walletAddress, 6, 4)}
                                </Typography>
                            </Tooltip>
                            <Typography variant="caption" fontWeight={700} color="primary.main">
                                {walletBalance || '... ETH'}
                            </Typography>
                        </Stack>
                    ) : (
                        <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={handleConnectWallet}
                            disabled={isConnecting}
                            startIcon={isConnecting ? <CircularProgress size={12} color="inherit" /> : <MetaMaskIcon size={14} />}
                            sx={{ mt: 0.8, height: 28, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
                        >
                            {isConnecting ? 'Đang kết nối...' : 'Kết nối ví MetaMask'}
                        </Button>
                    )}
                </Box>

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

                        {/* Top Actions & Quick Logout Button */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            {/* Nút Kết nối ví MetaMask trên Header */}
                            {walletAddress ? (
                                <Tooltip title={`Ví MetaMask đang kết nối: ${walletAddress} (Bấm để sao chép)`}>
                                    <Box
                                        onClick={() => handleCopy(walletAddress, 'địa chỉ ví')}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '8px',
                                            border: 1,
                                            borderColor: 'divider',
                                            bgcolor: 'background.subtle',
                                            cursor: 'pointer',
                                            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                                        }}
                                    >
                                        <MetaMaskIcon size={18} />
                                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.1 }}>
                                                    {truncateHash(walletAddress, 6, 4)}
                                                </Typography>
                                                <FiberManualRecord sx={{ fontSize: 8, color: 'status.success' }} />
                                            </Stack>
                                            <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ fontSize: '0.68rem', display: 'block' }}>
                                                {walletBalance || 'Sepolia'}
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
                                    disabled={isConnecting}
                                    startIcon={isConnecting ? <CircularProgress size={14} color="inherit" /> : <MetaMaskIcon />}
                                    sx={{ height: 38, borderRadius: '8px', fontWeight: 700 }}
                                >
                                    {isConnecting ? 'Đang kết nối...' : 'Kết nối ví'}
                                </Button>
                            )}

                            {topActions}

                            {/* Nút Đăng xuất nhanh trên Header */}
                            <Tooltip title="Đăng xuất khỏi hệ thống">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => setLogoutDialogOpen(true)}
                                    startIcon={<Logout />}
                                    sx={{
                                        height: 38,
                                        borderRadius: '8px',
                                        display: { xs: 'none', sm: 'inline-flex' },
                                    }}
                                >
                                    Đăng xuất
                                </Button>
                            </Tooltip>
                        </Stack>
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
