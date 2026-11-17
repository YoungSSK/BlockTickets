import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Paper,
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
    KeyboardArrowDown,
    ContentCopy,
    OpenInNew,
    SwapHoriz,
    LinkOff,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
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

    // State Menu tài khoản & ví Web3
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const [walletMenuAnchor, setWalletMenuAnchor] = useState(null);
    const [copiedAddress, setCopiedAddress] = useState(false);

    const isUserMenuOpen = Boolean(userMenuAnchor);
    const isWalletMenuOpen = Boolean(walletMenuAnchor);

    const handleUserMenuOpen = (event) => setUserMenuAnchor(event.currentTarget);
    const handleUserMenuClose = () => setUserMenuAnchor(null);

    const handleWalletMenuOpen = (event) => setWalletMenuAnchor(event.currentTarget);
    const handleWalletMenuClose = () => setWalletMenuAnchor(null);

    const handleCopyAddress = (e) => {
        e?.stopPropagation();
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

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
            console.error('Lỗi khi lấy số dư ví Navbar:', err);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const checkWallet = async () => {
            // Nếu người dùng đã chủ động bấm ngắt kết nối trong phiên thì không tự động kết nối lại
            if (sessionStorage.getItem('blocktickets_wallet_disconnected') === 'true') {
                return;
            }

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
                    console.error('Lỗi kiểm tra eth_accounts Navbar:', err);
                }
            }
            if (user?.walletAddress) {
                setWalletAddress(user.walletAddress);
                fetchWalletBalance(user.walletAddress);
            } else {
                setWalletAddress('');
                setWalletBalance('');
            }
        };

        checkWallet();
        return () => {
            isMounted = false;
        };
    }, [user, fetchWalletBalance]);

    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts && accounts.length > 0) {
                sessionStorage.removeItem('blocktickets_wallet_disconnected');
                setWalletAddress(accounts[0]);
                await fetchWalletBalance(accounts[0]);
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

    const handleConnectWallet = async () => {
        if (!window.ethereum) {
            alert('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt của bạn!');
            return;
        }

        try {
            sessionStorage.removeItem('blocktickets_wallet_disconnected');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts[0]) {
                setWalletAddress(accounts[0]);
                await fetchWalletBalance(accounts[0]);
            }
        } catch (err) {
            if (err?.code !== 4001) {
                console.error('Lỗi kết nối ví MetaMask:', err);
            }
        }
    };

    // Đổi tài khoản ví MetaMask bằng EIP-2255 wallet_requestPermissions
    const handleSwitchWallet = async () => {
        if (!window.ethereum) {
            alert('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt của bạn!');
            return;
        }

        try {
            sessionStorage.removeItem('blocktickets_wallet_disconnected');
            // Yêu cầu quyền truy cập tài khoản mới -> MetaMask bắt buộc mở popup danh sách tài khoản để người dùng chọn
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });

            // Lấy danh sách tài khoản mới sau khi chọn xong
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
                await fetchWalletBalance(accounts[0]);
            }
        } catch (err) {
            if (err?.code === 4001) {
                // Người dùng đóng popup MetaMask
                console.info('Người dùng đã đóng popup đổi tài khoản MetaMask.');
            } else {
                console.error('Lỗi khi đổi tài khoản ví MetaMask:', err);
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    if (accounts && accounts[0]) {
                        setWalletAddress(accounts[0]);
                        await fetchWalletBalance(accounts[0]);
                    }
                } catch (fallbackErr) {
                    console.error('Lỗi fallback kết nối ví:', fallbackErr);
                }
            }
        }
    };

    // Ngắt kết nối ví
    const handleDisconnectWallet = async () => {
        sessionStorage.setItem('blocktickets_wallet_disconnected', 'true');
        try {
            if (window.ethereum?.request) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_revokePermissions',
                        params: [{ eth_accounts: {} }],
                    });
                } catch {
                    // wallet_revokePermissions có thể không khả dụng trên phiên bản cũ
                }
            }
        } finally {
            setWalletAddress('');
            setWalletBalance('');
            handleWalletMenuClose();
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

                    {/* Right Action Tools: Wallet Capsule, Theme Toggle & Profile Menu */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {/* MetaMask Wallet Button / Capsule */}
                        {walletAddress ? (
                            <Tooltip title="Ví MetaMask (Ethereum Sepolia) - Nhấp để xem chi tiết">
                                <Button
                                    onClick={handleWalletMenuOpen}
                                    sx={{
                                        height: 38,
                                        px: 1.2,
                                        borderRadius: '10px',
                                        border: 1,
                                        borderColor: isWalletMenuOpen ? 'primary.main' : 'divider',
                                        bgcolor: 'background.paper',
                                        textTransform: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        boxShadow: isWalletMenuOpen ? 1 : 0,
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                            borderColor: 'primary.main',
                                        },
                                    }}
                                >
                                    {/* Sepolia Status Dot + Balance */}
                                    <Stack direction="row" alignItems="center" spacing={0.6}>
                                        <FiberManualRecord sx={{ color: 'status.success', fontSize: 9 }} />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                color: 'text.primary',
                                                fontSize: '0.78rem',
                                                display: { xs: 'none', sm: 'inline-block' },
                                            }}
                                        >
                                            {walletBalance || '0 ETH'}
                                        </Typography>
                                    </Stack>

                                    <Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto', display: { xs: 'none', sm: 'block' } }} />

                                    {/* MetaMask Fox + Truncated Address */}
                                    <Stack direction="row" alignItems="center" spacing={0.6}>
                                        <MetaMaskIcon size={16} />
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                fontSize: '0.78rem',
                                            }}
                                        >
                                            {truncateHash(walletAddress, 4, 4)}
                                        </Typography>
                                        <KeyboardArrowDown sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    </Stack>
                                </Button>
                            </Tooltip>
                        ) : (
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={handleConnectWallet}
                                startIcon={<MetaMaskIcon size={16} />}
                                sx={{ height: 38, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                            >
                                Kết nối ví
                            </Button>
                        )}

                        {/* Auth / Profile Button */}
                        {isAuthenticated ? (
                            <Tooltip title="Tài khoản & Tùy chọn">
                                <Button
                                    onClick={handleUserMenuOpen}
                                    sx={{
                                        height: 38,
                                        px: 1,
                                        borderRadius: '10px',
                                        border: 1,
                                        borderColor: isUserMenuOpen ? 'primary.main' : 'divider',
                                        bgcolor: isUserMenuOpen ? 'action.selected' : 'background.paper',
                                        textTransform: 'none',
                                        display: { xs: 'none', sm: 'flex' },
                                        alignItems: 'center',
                                        gap: 0.8,
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                            borderColor: 'primary.main',
                                        },
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 26,
                                            height: 26,
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                                    </Avatar>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '0.82rem',
                                            color: 'text.primary',
                                            maxWidth: 100,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {user?.fullName || 'Tài khoản'}
                                    </Typography>
                                    <KeyboardArrowDown sx={{ fontSize: 16, color: 'text.secondary' }} />
                                </Button>
                            </Tooltip>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                component={RouterLink}
                                to="/login"
                                sx={{ height: 38, borderRadius: '8px', textTransform: 'none', fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
                            >
                                Đăng nhập
                            </Button>
                        )}

                        {/* Theme Toggle Button (Đem ra ngoài cùng bên phải) */}
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
                                    '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
                                }}
                            >
                                {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        {/* Mobile Hamburger Menu */}
                        <IconButton
                            aria-label="Mở menu điều hướng"
                            onClick={() => setMobileDrawerOpen(true)}
                            sx={{ display: { xs: 'flex', lg: 'none' }, border: 1, borderColor: 'divider', borderRadius: '8px', width: 38, height: 38 }}
                        >
                            <MenuIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Stack>
            </Container>

            {/* Wallet Web3 Dropdown Menu */}
            <Menu
                anchorEl={walletMenuAnchor}
                open={isWalletMenuOpen}
                onClose={handleWalletMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        minWidth: 260,
                        p: 1.5,
                        borderRadius: '12px',
                        mt: 1,
                        border: 1,
                        borderColor: 'divider',
                    },
                }}
            >
                {/* Network Status Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.2}>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                        <FiberManualRecord sx={{ color: 'status.success', fontSize: 10 }} />
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                            Ethereum Sepolia
                        </Typography>
                    </Stack>
                    <Chip label="Testnet" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                </Stack>

                {/* Truncated Address & Copy Tool */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 1,
                        mb: 1.5,
                        borderRadius: '8px',
                        bgcolor: 'background.subtle',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {truncateHash(walletAddress, 6, 4)}
                    </Typography>
                    <Tooltip title={copiedAddress ? 'Đã sao chép!' : 'Sao chép địa chỉ ví'}>
                        <IconButton size="small" onClick={handleCopyAddress} sx={{ p: 0.5 }}>
                            {copiedAddress ? <CheckCircle fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </Paper>

                {/* Wallet Balance */}
                <Box sx={{ mb: 1.5, px: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        Số dư khả dụng:
                    </Typography>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                        {walletBalance || '0 ETH'}
                    </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Explorer & Change Actions */}
                <MenuItem
                    component="a"
                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWalletMenuClose}
                    sx={{ borderRadius: '6px', fontSize: '0.85rem', gap: 1, py: 0.8 }}
                >
                    <OpenInNew fontSize="small" sx={{ color: 'text.secondary' }} />
                    Xem trên Etherscan Sepolia
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleWalletMenuClose();
                        handleSwitchWallet();
                    }}
                    sx={{ borderRadius: '6px', fontSize: '0.85rem', gap: 1, py: 0.8 }}
                >
                    <SwapHoriz fontSize="small" sx={{ color: 'primary.main' }} />
                    Đổi tài khoản ví MetaMask
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem
                    onClick={handleDisconnectWallet}
                    sx={{
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        gap: 1,
                        py: 0.8,
                        color: 'error.main',
                        fontWeight: 600,
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <LinkOff fontSize="small" />
                    Ngắt kết nối ví
                </MenuItem>
            </Menu>

            {/* User Profile Dropdown Menu */}
            <Menu
                anchorEl={userMenuAnchor}
                open={isUserMenuOpen}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        minWidth: 230,
                        p: 1,
                        borderRadius: '12px',
                        mt: 1,
                        border: 1,
                        borderColor: 'divider',
                    },
                }}
            >
                {/* User Info Header */}
                <Box sx={{ px: 1.5, py: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {user?.fullName || 'Người dùng'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                        {user?.email || ''}
                    </Typography>
                    <Chip
                        label={user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'organizer' ? 'Ban tổ chức' : 'Khách hàng'}
                        size="small"
                        color={user?.role === 'admin' ? 'secondary' : user?.role === 'organizer' ? 'warning' : 'primary'}
                        sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                    />
                </Box>

                <Divider sx={{ my: 1 }} />





                {/* Logout Option */}
                <MenuItem
                    onClick={() => {
                        handleUserMenuClose();
                        logout();
                        navigate('/login');
                    }}
                    sx={{
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        gap: 1.2,
                        py: 0.8,
                        color: 'error.main',
                        fontWeight: 600,
                        '&:hover': {
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <Logout fontSize="small" />
                    Đăng xuất
                </MenuItem>
            </Menu>

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

