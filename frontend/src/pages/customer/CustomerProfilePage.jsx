import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    IconButton,
    Chip,
    TextField,
    Tooltip,
    Alert,
    Snackbar,
    Stack,
    Divider,
    Paper,
    Avatar,
    Tabs,
    Tab,
    CircularProgress,
    useTheme,
} from '@mui/material';
import {
    Person,
    AccountBalanceWallet,
    ConfirmationNumber,
    Email,
    CheckCircle,
    ContentCopy,
    OpenInNew,
    Refresh,
    SwapHoriz,
    Storefront,
    Save,
    Edit,
    Close,
    QrCodeScanner,
    VerifiedUser,
    ArrowForward,
    Logout,
    LinkOff,
    Sync,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { userAPI, authAPI, ticketAPI } from '../../services/api';

// MetaMask inline SVG icon
const MetaMaskIcon = ({ size = 20 }) => (
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

const CustomerProfilePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user, updateUser, logout } = useAuth();
    const {
        walletAddress,
        walletBalance,
        isConnecting,
        isLinking,
        connectWallet,
        switchWallet,
        disconnectWallet,
        linkWalletToAccount,
        refreshBalance,
    } = useWallet();

    // Tab state (0: Thông tin cá nhân, 1: Ví Web3, 2: Tổng quan vé)
    const [activeTab, setActiveTab] = useState(0);

    // Form thông tin cá nhân
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Đồng bộ tên hiển thị khi user thay đổi ở chế độ xem
    useEffect(() => {
        if (!isEditingProfile) {
            setFullName(user?.fullName || '');
        }
    }, [user?.fullName, isEditingProfile]);

    const hasProfileChanges = fullName.trim() !== (user?.fullName || '').trim();

    // Thống kê vé NFT
    const [ticketStats, setTicketStats] = useState({
        total: 0,
        valid: 0,
        used: 0,
        resale: 0,
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    // Thông báo Toast Snackbar
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    // Tải thống kê vé của khách hàng (đồng bộ với ví liên kết hoặc ví MetaMask đang mở)
    useEffect(() => {
        let isMounted = true;
        const loadTicketStats = async () => {
            const activeWallet = user?.walletAddress || walletAddress;

            if (!activeWallet) {
                if (isMounted) {
                    setTicketStats({ total: 0, valid: 0, used: 0, resale: 0 });
                    setIsLoadingStats(false);
                }
                return;
            }

            setIsLoadingStats(true);
            try {
                const res = await ticketAPI.getMyTickets({ wallet: activeWallet });
                const tickets = res.data?.data?.tickets || res.data?.tickets || [];
                if (isMounted) {
                    const total = tickets.length;
                    let valid = 0;
                    let used = 0;
                    let resale = 0;

                    tickets.forEach((t) => {
                        const isTicketUsed = Boolean(t.isUsed || t.is_used || t.status === 'used');
                        const isTicketResale = !isTicketUsed && Boolean(t.isListedForResale || t.is_listed_for_resale || t.status === 'resale');
                        if (isTicketUsed) {
                            used += 1;
                        } else if (isTicketResale) {
                            resale += 1;
                        } else {
                            valid += 1;
                        }
                    });

                    setTicketStats({ total, valid, used, resale });
                }
            } catch (err) {
                console.error('Lỗi khi tải thống kê vé:', err);
                if (isMounted) {
                    setTicketStats({ total: 0, valid: 0, used: 0, resale: 0 });
                }
            } finally {
                if (isMounted) setIsLoadingStats(false);
            }
        };

        loadTicketStats();
        return () => {
            isMounted = false;
        };
    }, [user?.walletAddress, walletAddress]);

    // Bắt đầu chỉnh sửa hồ sơ cá nhân
    const handleStartEditProfile = () => {
        setFullName(user?.fullName || '');
        setIsEditingProfile(true);
    };

    // Hủy chỉnh sửa hồ sơ cá nhân
    const handleCancelEditProfile = () => {
        setFullName(user?.fullName || '');
        setIsEditingProfile(false);
    };

    // Cập nhật họ tên hồ sơ cá nhân
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!isEditingProfile) return;

        const trimmed = fullName.trim();
        if (!trimmed || trimmed.length < 2) {
            showSnackbar('Họ và tên phải có ít nhất 2 ký tự.', 'warning');
            return;
        }

        if (trimmed === (user?.fullName || '').trim()) {
            setIsEditingProfile(false);
            return;
        }

        setIsSavingProfile(true);
        try {
            const res = await userAPI.updateProfile({ fullName: trimmed });
            const updatedUser = res.data?.data?.user || res.data?.user;
            if (updatedUser) {
                updateUser({ fullName: updatedUser.fullName });
                setFullName(updatedUser.fullName);
            } else {
                updateUser({ fullName: trimmed });
                setFullName(trimmed);
            }
            setIsEditingProfile(false);
            showSnackbar('Cập nhật hồ sơ thành công!', 'success');
        } catch (err) {
            showSnackbar(err?.response?.data?.message || 'Không thể cập nhật hồ sơ.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Kết nối ví MetaMask
    const handleConnectMetaMask = async () => {
        try {
            const acc = await connectWallet();
            showSnackbar(`Kết nối ví MetaMask thành công: ${truncateHash(acc, 6, 4)}`, 'success');
        } catch (err) {
            if (err?.code !== 4001) {
                showSnackbar(err.message || 'Lỗi kết nối ví MetaMask', 'error');
            }
        }
    };

    // Đổi ví MetaMask qua chuẩn EIP-2255
    const handleSwitchWallet = async () => {
        try {
            const acc = await switchWallet();
            showSnackbar(`Đã chuyển sang ví MetaMask: ${truncateHash(acc, 6, 4)}`, 'success');
        } catch (err) {
            if (err?.code !== 4001) {
                showSnackbar(err.message || 'Lỗi khi đổi tài khoản ví', 'error');
            }
        }
    };

    // Ngắt kết nối ví MetaMask trên trình duyệt
    const handleDisconnectWallet = async () => {
        try {
            await disconnectWallet();
            showSnackbar('Đã ngắt kết nối ví MetaMask trên trình duyệt!', 'info');
        } catch (err) {
            showSnackbar(err.message || 'Lỗi khi ngắt kết nối ví', 'error');
        }
    };

    // Liên kết ví MetaMask vào hồ sơ người dùng trong Database
    const handleLinkWallet = async (targetAddr) => {
        const addrToLink = targetAddr || walletAddress;
        if (!addrToLink) {
            showSnackbar('Vui lòng kết nối ví MetaMask trước!', 'warning');
            return;
        }

        try {
            await linkWalletToAccount(addrToLink);
            showSnackbar('Liên kết ví MetaMask vào tài khoản thành công!', 'success');
        } catch (err) {
            if (err?.code === 4001) {
                showSnackbar('Bạn đã hủy ký xác nhận trên ví MetaMask.', 'warning');
            } else {
                showSnackbar(err?.response?.data?.message || err.message || 'Lỗi liên kết ví.', 'error');
            }
        }
    };

    // Sao chép nội dung vào Clipboard
    const handleCopy = (text, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flex: 1 }}>
                {/* HERO PROFILE HEADER */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 4 },
                        borderRadius: '16px',
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        mb: 4,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={3}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                        <Avatar
                            sx={{
                                width: { xs: 72, md: 88 },
                                height: { xs: 72, md: 88 },
                                bgcolor: 'primary.main',
                                color: '#ffffff',
                                fontSize: { xs: '1.75rem', md: '2.25rem' },
                                fontWeight: 700,
                                border: '3px solid',
                                borderColor: 'primary.light',
                                boxShadow: 2,
                            }}
                        >
                            {(user?.fullName || 'U')[0].toUpperCase()}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" mb={0.5}>
                                <Typography variant="h2" fontWeight={700} color="text.primary">
                                    {user?.fullName || 'Người dùng'}
                                </Typography>
                                <Chip
                                    icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                                    label="Tài khoản hợp lệ"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 600, height: 22 }}
                                />
                            </Stack>

                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ color: 'text.secondary', mt: 0.8 }}>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <Email sx={{ fontSize: 16 }} />
                                    <Typography variant="body2">{user?.email || 'Chưa cập nhật email'}</Typography>
                                </Stack>
                                {user?.walletAddress || walletAddress ? (
                                    <Stack direction="row" spacing={0.8} alignItems="center">
                                        <MetaMaskIcon size={16} />
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {truncateHash(user?.walletAddress || walletAddress, 6, 4)}
                                        </Typography>
                                        {user?.walletAddress && walletAddress && user.walletAddress.toLowerCase() === walletAddress.toLowerCase() ? (
                                            <Chip label="Đã đồng bộ" size="small" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                                        ) : user?.walletAddress ? (
                                            <Chip label="Ví liên kết" size="small" color="info" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600 }} />
                                        ) : (
                                            <Chip label="Ví MetaMask" size="small" color="warning" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600 }} />
                                        )}
                                    </Stack>
                                ) : (
                                    <Chip
                                        label="Chưa liên kết ví Web3"
                                        size="small"
                                        color="warning"
                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                                    />
                                )}
                            </Stack>
                        </Box>

                        {/* Nút Đăng xuất */}
                        <Box sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, mt: { xs: 2, sm: 0 } }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                startIcon={<Logout />}
                                sx={{
                                    height: 40,
                                    px: 2.5,
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    width: { xs: '100%', sm: 'auto' },
                                    borderColor: 'error.main',
                                    '&:hover': {
                                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                                        borderColor: 'error.dark',
                                    },
                                }}
                            >
                                Đăng xuất
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                {/* 4 THẺ THỐNG KÊ HOẠT ĐỘNG VÉ */}
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid item xs={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TỔNG VÉ SỞ HỮU
                                    </Typography>
                                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: 'primary.light', color: 'primary.main', display: 'flex' }}>
                                        <ConfirmationNumber sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Typography variant="h3" fontWeight={700} color="text.primary">
                                    {isLoadingStats ? <CircularProgress size={22} /> : ticketStats.total}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Vé sự kiện NFT trên ví
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        VÉ CÒN HIỆU LỰC
                                    </Typography>
                                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: 'status.successBg' || 'rgba(16, 185, 129, 0.12)', color: 'status.success' || '#10B981', display: 'flex' }}>
                                        <CheckCircle sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Typography variant="h3" fontWeight={700} color="success.main">
                                    {isLoadingStats ? <CircularProgress size={22} /> : ticketStats.valid}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Sẵn sàng quét mã QR tại cổng
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        VÉ ĐÃ CHECK-IN
                                    </Typography>
                                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex' }}>
                                        <QrCodeScanner sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Typography variant="h3" fontWeight={700} color="#8B5CF6">
                                    {isLoadingStats ? <CircularProgress size={22} /> : ticketStats.used}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Đã tham dự sự kiện
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        VÉ ĐANG BÁN LẠI
                                    </Typography>
                                    <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: 'status.warningBg' || 'rgba(245, 158, 11, 0.12)', color: 'status.warning' || '#F59E0B', display: 'flex' }}>
                                        <Storefront sx={{ fontSize: 20 }} />
                                    </Box>
                                </Stack>
                                <Typography variant="h3" fontWeight={700} color="warning.main">
                                    {isLoadingStats ? <CircularProgress size={22} /> : ticketStats.resale}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Niêm yết trên Chợ vé thứ cấp
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* TABS NỘI DUNG CHÍNH */}
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '16px',
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        overflow: 'hidden',
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={(e, val) => {
                            setActiveTab(val);
                            if (val !== 0 && isEditingProfile) {
                                handleCancelEditProfile();
                            }
                        }}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            px: 2,
                            pt: 1,
                            bgcolor: 'background.subtle',
                        }}
                    >
                        <Tab
                            icon={<Person sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="Thông Tin Cá Nhân"
                            sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
                        />
                        <Tab
                            icon={<AccountBalanceWallet sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="Ví Web3 & Blockchain"
                            sx={{ fontWeight: 600, textTransform: 'none', minHeight: 48 }}
                        />

                    </Tabs>

                    <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                        {/* TAB 1: THÔNG TIN CÁ NHÂN */}
                        {activeTab === 0 && (
                            <Box component="form" onSubmit={handleSaveProfile} sx={{ maxWidth: 600 }}>
                                <Typography variant="h3" fontWeight={700} color="text.primary" mb={1}>
                                    {isEditingProfile ? 'Chỉnh Sửa Hồ Sơ Khách Hàng' : 'Hồ Sơ Khách Hàng'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    Thông tin này được hiển thị trên hệ thống và sử dụng khi xác minh chủ sở hữu vé NFT.
                                </Typography>

                                <Stack spacing={2.5}>
                                    <TextField
                                        label="Họ và tên"
                                        fullWidth
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Nhập họ và tên đầy đủ..."
                                        helperText={isEditingProfile ? 'Họ tên phải có ít nhất 2 ký tự' : undefined}
                                        disabled={!isEditingProfile || isSavingProfile}
                                        required={isEditingProfile}
                                    />

                                    <TextField
                                        label="Địa chỉ Email"
                                        fullWidth
                                        value={user?.email || ''}
                                        disabled
                                        helperText="Email dùng làm định danh đăng nhập bảo mật và không thể thay đổi trực tiếp"
                                    />

                                    <Box sx={{ pt: 1 }}>
                                        {!isEditingProfile ? (
                                            <Button
                                                key="edit-profile-btn"
                                                type="button"
                                                variant="contained"
                                                color="primary"
                                                size="medium"
                                                onClick={handleStartEditProfile}
                                                startIcon={<Edit />}
                                                sx={{ height: 42, px: 3, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                            >
                                                Chỉnh Sửa
                                            </Button>
                                        ) : (
                                            <Stack direction="row" spacing={1.5}>
                                                <Button
                                                    key="save-profile-btn"
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    size="medium"
                                                    disabled={isSavingProfile || !hasProfileChanges || fullName.trim().length < 2}
                                                    startIcon={isSavingProfile ? <CircularProgress size={16} color="inherit" /> : <Save />}
                                                    sx={{ height: 42, px: 3, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                                >
                                                    {isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                                                </Button>
                                                <Button
                                                    key="cancel-profile-btn"
                                                    type="button"
                                                    variant="outlined"
                                                    color="inherit"
                                                    size="medium"
                                                    disabled={isSavingProfile}
                                                    onClick={handleCancelEditProfile}
                                                    startIcon={<Close />}
                                                    sx={{ height: 42, px: 2.5, borderRadius: '8px', fontWeight: 600, textTransform: 'none', borderColor: 'divider' }}
                                                >
                                                    Hủy
                                                </Button>
                                            </Stack>
                                        )}
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* TAB 2: VÍ WEB3 & BLOCKCHAIN */}
                        {activeTab === 1 && (
                            <Box sx={{ maxWidth: 750 }}>
                                <Typography variant="h3" fontWeight={700} color="text.primary" mb={1}>
                                    Quản Lý Ví Blockchain (Ethereum Sepolia)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    Toàn bộ vé tham dự sự kiện tại BlockTickets được phát hành dưới dạng NFT ERC-721 bất biến vào ví Web3 của bạn. Trạng thái kết nối ví luôn được đồng bộ trực tiếp với thanh điều hướng.
                                </Typography>

                                {/* PHẦN 1: TRẠNG THÁI VÍ METAMASK ĐANG HOẠT ĐỘNG (ĐỒNG BỘ VỚI NAVBAR) */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '12px',
                                        mb: 3,
                                        border: 1,
                                        borderColor: walletAddress ? 'primary.main' : 'divider',
                                        bgcolor: walletAddress ? 'action.selected' : 'background.paper',
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <MetaMaskIcon size={20} />
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                Ví MetaMask Đang Hoạt Động Trên Trình Duyệt
                                            </Typography>
                                        </Stack>
                                        <Chip
                                            label={walletAddress ? 'Đang kết nối' : 'Chưa kết nối'}
                                            size="small"
                                            color={walletAddress ? 'success' : 'default'}
                                            sx={{ fontWeight: 600, height: 22 }}
                                        />
                                    </Stack>

                                    {walletAddress ? (
                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" mb={2}>
                                                <Chip
                                                    label="Ethereum Sepolia Testnet"
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, height: 22 }}
                                                />
                                                <Typography variant="body2" color="primary.main" fontWeight={700}>
                                                    Số dư: {walletBalance || '0 ETH'}
                                                </Typography>
                                                <Tooltip title="Làm mới số dư ví">
                                                    <IconButton size="small" onClick={refreshBalance} sx={{ p: 0.5 }}>
                                                        <Refresh fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>

                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={1}
                                                sx={{
                                                    p: 1.5,
                                                    bgcolor: 'background.paper',
                                                    borderRadius: '8px',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    mb: 2,
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, flex: 1, wordBreak: 'break-all' }}>
                                                    {walletAddress}
                                                </Typography>
                                                <Tooltip title="Sao chép địa chỉ ví">
                                                    <IconButton size="small" onClick={() => handleCopy(walletAddress, 'địa chỉ ví MetaMask')}>
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xem trên Etherscan Sepolia">
                                                    <IconButton
                                                        size="small"
                                                        component="a"
                                                        href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <OpenInNew fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>

                                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={handleSwitchWallet}
                                                    startIcon={<SwapHoriz fontSize="small" />}
                                                    sx={{ height: 34, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                                >
                                                    Đổi tài khoản ví MetaMask
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={handleDisconnectWallet}
                                                    startIcon={<LinkOff fontSize="small" />}
                                                    sx={{ height: 34, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                                >
                                                    Ngắt kết nối ví
                                                </Button>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
                                                Trình duyệt chưa kết nối ví MetaMask. Kết nối ví để quản lý vé NFT và thanh toán sự kiện.
                                            </Alert>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleConnectMetaMask}
                                                disabled={isConnecting}
                                                startIcon={isConnecting ? <CircularProgress size={16} color="inherit" /> : <MetaMaskIcon size={18} />}
                                                sx={{ height: 38, px: 2.5, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                            >
                                                {isConnecting ? 'Đang kết nối MetaMask...' : 'Kết nối ví MetaMask ngay'}
                                            </Button>
                                        </Box>
                                    )}
                                </Paper>

                                {/* PHẦN 2: VÍ WEB3 ĐÃ LIÊN KẾT TRONG CƠ SỞ DỮ LIỆU */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '12px',
                                        mb: 3,
                                        bgcolor: user?.walletAddress ? 'background.subtle' : 'background.paper',
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <VerifiedUser sx={{ color: user?.walletAddress ? 'success.main' : 'warning.main', fontSize: 20 }} />
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                Ví Web3 Đã Liên Kết Trong Cơ Sở Dữ Liệu
                                            </Typography>
                                        </Stack>
                                        <Chip
                                            label={user?.walletAddress ? 'Đã liên kết' : 'Chưa liên kết'}
                                            size="small"
                                            color={user?.walletAddress ? 'success' : 'warning'}
                                            sx={{ fontWeight: 600, height: 22 }}
                                        />
                                    </Stack>

                                    {user?.walletAddress ? (
                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: '8px', border: 1, borderColor: 'divider' }}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, flex: 1, wordBreak: 'break-all' }}>
                                                    {user.walletAddress}
                                                </Typography>
                                                <Tooltip title="Sao chép địa chỉ ví">
                                                    <IconButton size="small" onClick={() => handleCopy(user.walletAddress, 'địa chỉ ví')}>
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Xem trên Etherscan Sepolia">
                                                    <IconButton
                                                        size="small"
                                                        component="a"
                                                        href={`https://sepolia.etherscan.io/address/${user.walletAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <OpenInNew fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>

                                            {/* Kiểm tra đồng bộ giữa ví đã liên kết và ví MetaMask đang mở */}
                                            {walletAddress && walletAddress.toLowerCase() !== user.walletAddress.toLowerCase() ? (
                                                <Alert severity="warning" sx={{ mt: 2, borderRadius: '8px' }}>
                                                    <Typography variant="body2" fontWeight={600} mb={0.5}>
                                                        Ví MetaMask đang kết nối ({truncateHash(walletAddress, 6, 4)}) khác với ví đã liên kết ({truncateHash(user.walletAddress, 6, 4)}).
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="warning"
                                                        onClick={() => handleLinkWallet(walletAddress)}
                                                        disabled={isLinking}
                                                        startIcon={isLinking ? <CircularProgress size={14} color="inherit" /> : <Sync fontSize="small" />}
                                                        sx={{ mt: 1, borderRadius: '6px', fontWeight: 600, textTransform: 'none' }}
                                                    >
                                                        {isLinking ? 'Đang cập nhật...' : `Cập nhật liên kết sang ví (${truncateHash(walletAddress, 6, 4)})`}
                                                    </Button>
                                                </Alert>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                    ✓ Ví này đã được xác thực ký danh tính và đồng bộ cho mọi giao dịch NFT vé sự kiện.
                                                </Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box sx={{ mt: 1 }}>
                                            <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px' }}>
                                                Tài khoản của bạn chưa được liên kết với ví Web3 nào trong hệ thống.
                                            </Alert>

                                            {walletAddress ? (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    onClick={() => handleLinkWallet(walletAddress)}
                                                    disabled={isLinking}
                                                    startIcon={isLinking ? <CircularProgress size={16} color="inherit" /> : <MetaMaskIcon size={16} />}
                                                    sx={{ height: 38, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                                >
                                                    {isLinking ? 'Đang xác thực ví...' : `Liên kết ví MetaMask (${truncateHash(walletAddress, 6, 4)}) vào tài khoản`}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    onClick={handleConnectMetaMask}
                                                    startIcon={<MetaMaskIcon size={16} />}
                                                    sx={{ height: 38, borderRadius: '8px', fontWeight: 600, textTransform: 'none' }}
                                                >
                                                    Kết nối ví MetaMask trước khi liên kết
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Container>

            <Footer />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CustomerProfilePage;

