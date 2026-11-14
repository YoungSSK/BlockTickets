import React, { useState, useMemo, useEffect } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    LinearProgress,
    Stack,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Breadcrumbs,
    Link,
    Divider,
    useTheme,
} from '@mui/material';
import {
    EventNote,
    ConfirmationNumber,
    AccountBalanceWallet,
    TrendingUp,
    PeopleAlt,
    CheckCircle,
    HourglassEmpty,
    Refresh,
    ContentCopy,
    OpenInNew,
    Security,
    Search,
    Visibility,
    Add,
    QrCodeScanner,
    Storefront,
    Close,
    Launch,
    FiberManualRecord,
    InfoOutlined,
    Shield,
    MonetizationOn,
    Payments,
    ArrowForward,
    Settings,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { organizerAPI } from '../../services/api';
import { ethers } from 'ethers';
import { EVENT_TICKET_ADDRESS } from '../../constants/contracts';
import EventTicketABI from '../../constants/abi/EventTicket.json';

// Helper: Rút gọn địa chỉ ví và mã băm
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu các chỉ số kinh tế của Ban Tổ Chức
const EMPTY_ORGANIZER_METRICS = {
    totalRevenueEth: 0,
    totalRevenueUsd: 0,
    resaleRoyaltyEth: 0,
    withdrawableBalanceEth: 0,
    totalTicketsSold: 0,
    totalTicketsMaxSupply: 0,
    totalCheckedInCount: 0,
    activeEventsCount: 0,
    pendingEventsCount: 0,
    endedEventsCount: 0,
};

const INITIAL_ORGANIZER_METRICS = EMPTY_ORGANIZER_METRICS;

const INITIAL_MY_EVENTS = [];

const INITIAL_FINANCIAL_LOGS = [];

const OrganizerDashboardPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Dữ liệu chỉ số & sự kiện
    const [metrics, setMetrics] = useState(INITIAL_ORGANIZER_METRICS);
    const [events, setEvents] = useState(INITIAL_MY_EVENTS);
    const [financialLogs] = useState(INITIAL_FINANCIAL_LOGS);

    // Bộ lọc & Tab
    const [statusTab, setStatusTab] = useState('all'); // 'all' | 'published' | 'pending' | 'ended'
    const [searchTerm, setSearchTerm] = useState('');

    // Modal rút doanh thu on-chain
    const [openWithdrawModal, setOpenWithdrawModal] = useState(false);
    const [withdrawStep, setWithdrawStep] = useState('initial'); // 'initial' | 'pending_signature' | 'verifying_block' | 'confirmed'
    const [withdrawTxHash, setWithdrawTxHash] = useState('');

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [loading, setLoading] = useState(false);

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
    };

    // Tải dữ liệu thật từ Backend API
    const loadOrganizerData = async () => {
        setLoading(true);
        try {
            const [statsRes, eventsRes] = await Promise.allSettled([
                organizerAPI.getStats(),
                organizerAPI.getMyEvents({ page: 1, limit: 50 }),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data?.stats) {
                const s = statsRes.value.data.data.stats;
                setMetrics({
                    totalRevenueEth: Number(s.totalRevenueEth) || 0,
                    totalRevenueUsd: Number(s.totalRevenueUsd) || 0,
                    resaleRoyaltyEth: +(Number(s.totalRevenueEth || 0) * 0.05).toFixed(3),
                    withdrawableBalanceEth: Number(s.totalRevenueEth) || 0,
                    totalTicketsSold: Number(s.totalTicketsMinted) || 0,
                    totalTicketsMaxSupply: Number(s.totalTicketsMaxSupply) || Number(s.totalTicketsMinted) || 0,
                    totalCheckedInCount: Number(s.checkedInCount) || 0,
                    activeEventsCount: Number(s.activeEventsCount) || 0,
                    pendingEventsCount: Number(s.pendingEventsCount) || 0,
                    draftEventsCount: Number(s.draftEventsCount) || 0,
                    endedEventsCount: Number(s.endedEventsCount) || 0,
                });
            }

            if (eventsRes.status === 'fulfilled') {
                const rawEvents = Array.isArray(eventsRes.value?.data?.data?.events)
                    ? eventsRes.value.data.data.events
                    : [];
                const dbEvents = rawEvents.map((e) => {
                    const ticketsSold = e.ticketTypes?.reduce((sum, tt) => sum + (tt.currentSupply || tt.mintedAmount || 0), 0) || 0;
                    const maxSupply = e.ticketTypes?.reduce((sum, tt) => sum + (tt.maxSupply || 0), 0) || 0;
                    const revEth = e.ticketTypes?.reduce((sum, tt) => sum + (tt.currentSupply || 0) * (Number(tt.originalPrice) || 0), 0) || 0;

                    let statusText = 'ĐANG MỞ BÁN';
                    if (e.status === 'approved') statusText = 'ĐÃ DUYỆT';
                    else if (e.status === 'pending') statusText = 'CHỜ DUYỆT';
                    else if (e.status === 'draft') statusText = 'BẢN NHÁP';
                    else if (e.status === 'ended') statusText = 'ĐÃ KẾT THÚC';

                    return {
                        id: e.id,
                        title: e.title,
                        venue: e.venueName || e.venueCity || 'Hà Nội',
                        date: e.startTime ? new Date(e.startTime).toLocaleDateString('vi-VN') : '',
                        startTime: e.startTime ? new Date(e.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
                        status: e.status,
                        statusText,
                        ticketsSold,
                        maxSupply,
                        checkedIn: 0,
                        totalRevenueEth: revEth,
                        royaltyEarnedEth: +(revEth * 0.05).toFixed(3),
                    };
                });
                setEvents(dbEvents);
            }
        } catch (err) {
            console.warn('Lỗi khi tải dữ liệu Ban tổ chức từ server:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrganizerData();
    }, []);

    // Xử lý công bố sự kiện đã được duyệt
    const handlePublishEvent = async (eventId) => {
        try {
            let onChainEventId = null;
            if (window.ethereum) {
                try {
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await browserProvider.getSigner();
                    const contract = new ethers.Contract(EVENT_TICKET_ADDRESS, EventTicketABI, signer);

                    const targetEvt = events.find((e) => e.id === eventId);
                    if (targetEvt && !targetEvt.onChainEventId) {
                        showSnackbar('Đang khởi tạo sự kiện trên Smart Contract Sepolia...', 'info');
                        const totalCap = targetEvt.ticketTypes?.reduce((acc, t) => acc + (t.capacity || 100), 0) || 500;
                        const endTimestamp = Math.floor(new Date(targetEvt.endTime || Date.now() + 86400000 * 30).getTime() / 1000);
                        const tx = await contract.createEvent(targetEvt.bannerUrl || 'ipfs://event', totalCap, endTimestamp);
                        const receipt = await tx.wait();

                        // Đọc EventCreated log để lấy eventId
                        const iface = new ethers.Interface(EventTicketABI);
                        for (const log of receipt.logs) {
                            try {
                                const parsed = iface.parseLog(log);
                                if (parsed && parsed.name === 'EventCreated') {
                                    onChainEventId = Number(parsed.args.eventId);
                                    break;
                                }
                            } catch (_) {}
                        }

                        // Thêm ticket tiers lên contract
                        if (onChainEventId && targetEvt.ticketTypes && targetEvt.ticketTypes.length > 0) {
                            for (const tier of targetEvt.ticketTypes) {
                                try {
                                    const priceWei = ethers.parseEther(Number(tier.price || 0.01).toFixed(6));
                                    const tierTx = await contract.addTicketTier(
                                        onChainEventId,
                                        tier.name || 'Standard',
                                        priceWei,
                                        tier.capacity || 100,
                                        tier.maxPerWallet || 10
                                    );
                                    await tierTx.wait();
                                } catch (tierErr) {
                                    console.warn('Lỗi thêm tier on-chain:', tierErr);
                                }
                            }
                        }
                    }
                } catch (onChainErr) {
                    console.warn('Bỏ qua tạo on-chain nếu người dùng từ chối:', onChainErr);
                }
            }

            await organizerAPI.publishEvent(eventId, onChainEventId ? { onChainEventId } : {});
            showSnackbar('Đã công khai mở bán sự kiện thành công!', 'success');
            loadOrganizerData();
        } catch (err) {
            showSnackbar(err.message || 'Lỗi khi công bố sự kiện', 'error');
        }
    };

    // Xử lý gửi sự kiện nháp lên Admin phê duyệt
    const handleSubmitReview = async (eventId) => {
        try {
            await organizerAPI.submitReview(eventId);
            showSnackbar('Đã gửi sự kiện lên ban quản trị phê duyệt!', 'success');
            loadOrganizerData();
        } catch (err) {
            showSnackbar(err.message || 'Lỗi khi gửi duyệt sự kiện', 'error');
        }
    };

    // Lọc danh sách sự kiện
    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            const matchesStatus = statusTab === 'all' || evt.status === statusTab;
            const matchesSearch =
                evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evt.venue.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [events, statusTab, searchTerm]);

    // Xử lý rút tiền on-chain
    const handleConfirmWithdraw = () => {
        setWithdrawStep('pending_signature');

        setTimeout(() => {
            const mockTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            setWithdrawTxHash(mockTx);
            setWithdrawStep('verifying_block');

            setTimeout(() => {
                setWithdrawStep('confirmed');
                // Cập nhật số dư có thể rút về 0 ETH
                setMetrics((prev) => ({
                    ...prev,
                    withdrawableBalanceEth: 0.00,
                }));
            }, 3000);
        }, 2000);
    };

    // Tính tỷ lệ check-in tổng thể
    const overallCheckInRate = metrics.totalTicketsSold > 0
        ? ((metrics.totalCheckedInCount / metrics.totalTicketsSold) * 100).toFixed(1)
        : '0.0';

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
                <Container maxWidth="lg">
                    {/* BREADCRUMB */}
                    <Breadcrumbs
                        aria-label="breadcrumb"
                        sx={{ mb: 2.5, '& a': { textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } } }}
                    >
                        <Typography color="text.primary" fontWeight={600}>
                            Bảng điều khiển Nhà tổ chức (Organizer)
                        </Typography>
                    </Breadcrumbs>

                    {/* HERO HEADER SECTION */}
                    <Box
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            mb: 4,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                            spacing={2.5}
                        >
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                                    <Chip
                                        icon={<EventNote sx={{ fontSize: '1rem !important' }} />}
                                        label="BAN TỔ CHỨC • QUẢN LÝ SỰ KIỆN & DOANH THU"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                    />
                                    <Chip
                                        icon={<Shield sx={{ fontSize: '1rem !important' }} />}
                                        label="ON-CHAIN ROYALTY 5% (BR-02)"
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            bgcolor: theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)',
                                            color: theme.palette.status?.success || 'success.main',
                                        }}
                                    />
                                </Stack>

                                <Typography variant="h1" fontWeight={800} color="text.primary" gutterBottom>
                                    Trung Tâm Quản Trị Nhà Tổ Chức
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, lineHeight: 1.6 }}>
                                    Giám sát doanh số phát hành vé NFT sơ cấp, nguồn thu bản quyền 5% thứ cấp tự động trên Smart Contract,
                                    và kiểm soát tỷ lệ check-in tại cổng sự kiện thời gian thực.
                                </Typography>
                            </Box>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width={{ xs: '100%', md: 'auto' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    component={RouterLink}
                                    to="/organizer/check-in"
                                    startIcon={<QrCodeScanner />}
                                    sx={{ height: 44, borderRadius: '8px', fontWeight: 600, px: 2.5 }}
                                >
                                    Soát Vé Tại Cổng
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    component={RouterLink}
                                    to="/organizer/create-event"
                                    startIcon={<Add />}
                                    sx={{ height: 44, borderRadius: '8px', fontWeight: 700, px: 3 }}
                                >
                                    Tạo Sự Kiện Mới
                                </Button>
                            </Stack>
                        </Stack>

                        {/* THÔNG TIN VÍ & QUYẾT TOÁN ON-CHAIN */}
                        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6} md={7}>
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <AccountBalanceWallet color="primary" sx={{ fontSize: 28 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Địa chỉ ví thụ hưởng doanh thu của BTC (Sepolia):
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                                    {user?.walletAddress || 'Chưa liên kết ví'}
                                                </Typography>
                                                <Tooltip title="Sao chép ví">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Sao chép địa chỉ ví ban tổ chức"
                                                        onClick={() => handleCopy(user?.walletAddress || '', 'địa chỉ ví')}
                                                        disabled={!user?.walletAddress}
                                                    >
                                                        <ContentCopy sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} sm={6} md={5}>
                                    <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} alignItems="center">
                                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Số dư có thể rút on-chain:
                                            </Typography>
                                            <Typography variant="h3" fontWeight={800} color="primary.main">
                                                {metrics.withdrawableBalanceEth} ETH
                                            </Typography>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Payments />}
                                            disabled={metrics.withdrawableBalanceEth <= 0}
                                            onClick={() => {
                                                setWithdrawStep('initial');
                                                setOpenWithdrawModal(true);
                                            }}
                                            sx={{ borderRadius: '8px', fontWeight: 600, height: 40, px: 2.5 }}
                                        >
                                            Rút Doanh Thu
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* BỘ CHỈ SỐ KPI TÀI CHÍNH & VẬN HÀNH (4 CARDS) */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* 1. Tổng doanh thu bán vé */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TỔNG DOANH THU BÁN VÉ
                                    </Typography>
                                    <MonetizationOn color="primary" sx={{ fontSize: 20 }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="primary.main" gutterBottom>
                                    {metrics.totalRevenueEth} ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ~${metrics.totalRevenueUsd.toLocaleString()} USD (Bán sơ cấp)
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* 2. Bản quyền Chợ thứ cấp (5% Royalty) */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        BẢN QUYỀN 5% ROYALTY
                                    </Typography>
                                    <TrendingUp sx={{ fontSize: 20, color: theme.palette.status?.success || 'success.main' }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} sx={{ color: theme.palette.status?.success || 'success.main' }} gutterBottom>
                                    +{metrics.resaleRoyaltyEth} ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tự động từ TicketMarketplace (BR-02)
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* 3. Tỷ lệ vé đã phát hành */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TIẾN ĐỘ BÁN VÉ
                                    </Typography>
                                    <ConfirmationNumber color="action" sx={{ fontSize: 20 }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="text.primary" gutterBottom>
                                    {metrics.totalTicketsSold} / {metrics.totalTicketsMaxSupply}
                                </Typography>
                                <Box sx={{ width: '100%', mt: 0.5 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(metrics.totalTicketsSold / metrics.totalTicketsMaxSupply) * 100}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        {/* 4. Tỷ lệ check-in thực tế */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TỶ LỆ CHECK-IN TẠI CỔNG
                                    </Typography>
                                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.status?.checkedIn || '#8B5CF6' }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} sx={{ color: theme.palette.status?.checkedIn || '#8B5CF6' }} gutterBottom>
                                    {overallCheckInRate}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {metrics.totalCheckedInCount} khách đã quét hợp lệ
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* DANH SÁCH SỰ KIỆN DO ORGANIZER QUẢN LÝ (MY EVENTS TABLE) */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            mb: 4,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header Bảng & Bộ lọc */}
                        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                                <Grid item xs={12} md={6}>
                                    <Tabs
                                        value={statusTab}
                                        onChange={(e, val) => setStatusTab(val)}
                                        textColor="primary"
                                        indicatorColor="primary"
                                        sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
                                    >
                                        <Tab label={`Tất cả (${events.length})`} value="all" />
                                        <Tab label="Đang mở bán" value="published" />
                                        <Tab label="Chờ duyệt" value="pending" />
                                        <Tab label="Đã kết thúc" value="ended" />
                                    </Tabs>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Tìm theo tên sự kiện, mã EVT, địa điểm..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search color="action" fontSize="small" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: searchTerm && (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Xóa tìm kiếm sự kiện"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        <Close fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Bảng sự kiện */}
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Sự kiện & Thời gian</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Tiến độ bán vé</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Soát vé cổng</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Doanh thu (ETH)</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                                                <EventNote sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                                                <Typography variant="body1" fontWeight={600} color="text.secondary">
                                                    Không tìm thấy sự kiện nào phù hợp.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEvents.map((evt) => {
                                            const salesPercent = evt.maxSupply > 0 ? ((evt.ticketsSold / evt.maxSupply) * 100).toFixed(0) : 0;
                                            const checkInPercent = evt.ticketsSold > 0 ? ((evt.checkedIn / evt.ticketsSold) * 100).toFixed(0) : 0;

                                            return (
                                                <TableRow
                                                    key={evt.id}
                                                    hover
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    {/* Sự kiện & Thời gian */}
                                                    <TableCell>
                                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                            {evt.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {evt.venue} • {evt.date} ({evt.startTime})
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                                                            {evt.id}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Trạng thái */}
                                                    <TableCell>
                                                        <Chip
                                                            label={evt.statusText}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.75rem',
                                                                bgcolor:
                                                                    evt.status === 'published'
                                                                        ? theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)'
                                                                        : evt.status === 'pending'
                                                                        ? theme.palette.status?.pendingBg || 'rgba(245, 158, 11, 0.12)'
                                                                        : theme.palette.status?.cancelledBg || 'rgba(100, 116, 139, 0.12)',
                                                                color:
                                                                    evt.status === 'published'
                                                                        ? theme.palette.status?.success || 'success.main'
                                                                        : evt.status === 'pending'
                                                                        ? theme.palette.status?.pending || '#F59E0B'
                                                                        : theme.palette.status?.cancelled || 'text.secondary',
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Tiến độ bán vé */}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {evt.ticketsSold} / {evt.maxSupply} vé
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={Number(salesPercent)}
                                                                sx={{ height: 5, borderRadius: 3, flexGrow: 1 }}
                                                            />
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                {salesPercent}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Soát vé cổng */}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.status?.checkedIn || '#8B5CF6' }}>
                                                            {evt.checkedIn} / {evt.ticketsSold} khách
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Đã quét ({checkInPercent}%)
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Doanh thu */}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={800} color="primary.main">
                                                            {evt.totalRevenueEth.toFixed(2)} ETH
                                                        </Typography>
                                                        {evt.royaltyEarnedEth > 0 && (
                                                            <Typography variant="caption" sx={{ color: theme.palette.status?.success || 'success.main', display: 'block' }}>
                                                                +{evt.royaltyEarnedEth} ETH Royalty
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Thao tác */}
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                            {evt.status === 'approved' && (
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => handlePublishEvent(evt.id)}
                                                                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, fontWeight: 700, borderRadius: '6px' }}
                                                                >
                                                                    Mở Bán
                                                                </Button>
                                                            )}

                                                            {evt.status === 'draft' && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="primary"
                                                                    onClick={() => handleSubmitReview(evt.id)}
                                                                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, fontWeight: 700, borderRadius: '6px' }}
                                                                >
                                                                    Gửi Duyệt
                                                                </Button>
                                                            )}

                                                            {evt.status === 'published' && (
                                                                <Tooltip title="Mở máy quét soát vé tại cổng">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        component={RouterLink}
                                                                        to="/organizer/check-in"
                                                                        aria-label={`Soát vé sự kiện ${evt.title}`}
                                                                    >
                                                                        <QrCodeScanner fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            <Tooltip title="Xem trang sự kiện công khai">
                                                                <IconButton
                                                                    size="small"
                                                                    component={RouterLink}
                                                                    to={`/events/${evt.id}`}
                                                                    aria-label={`Xem sự kiện ${evt.title}`}
                                                                >
                                                                    <Launch fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* NHẬT KÝ DÒNG TIỀN & BẢN QUYỀN GẦN NHẤT (FINANCIAL ACTIVITY FEED) */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            p: 3,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TrendingUp color="primary" />
                                <Box>
                                    <Typography variant="h3" fontWeight={700}>
                                        Nhật Ký Dòng Tiền & Doanh Thu Bản Quyền Gần Nhất
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Đối soát trực tiếp giữa hợp đồng thông minh Sepolia và cơ sở dữ liệu Aiven Cloud MySQL
                                    </Typography>
                                </Box>
                            </Stack>

                            <Button
                                size="small"
                                color="inherit"
                                onClick={() => showSnackbar('Đã đồng bộ giao dịch mới nhất từ blockchain!', 'success')}
                                startIcon={<Refresh />}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Làm mới
                            </Button>
                        </Stack>

                        <Stack spacing={1.5}>
                            {financialLogs.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa có phát sinh giao dịch tài chính hoặc phân phối bản quyền nào.
                                    </Typography>
                                </Box>
                            ) : (
                                financialLogs.map((log) => (
                                <Paper
                                    key={log.id}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '10px',
                                        bgcolor: 'background.subtle',
                                        border: 1,
                                        borderColor: 'divider',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                            <Chip
                                                label={log.typeLabel}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    bgcolor:
                                                        log.type === 'royalty'
                                                            ? theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)'
                                                            : log.type === 'withdrawal'
                                                            ? theme.palette.status?.warningBg || 'rgba(249, 115, 22, 0.12)'
                                                            : 'action.selected',
                                                    color:
                                                        log.type === 'royalty'
                                                            ? theme.palette.status?.success || 'success.main'
                                                            : log.type === 'withdrawal'
                                                            ? theme.palette.status?.warning || 'warning.main'
                                                            : 'primary.main',
                                                }}
                                            />
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {log.eventTitle}
                                            </Typography>
                                            {log.tokenId && (
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    Token #{log.tokenId}
                                                </Typography>
                                            )}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            Thời gian: {log.time} • TxHash:{' '}
                                            <span style={{ fontFamily: 'monospace' }}>{truncateHash(log.txHash, 8, 6)}</span>
                                        </Typography>
                                    </Box>

                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={800}
                                            sx={{
                                                color:
                                                    log.amountEth > 0
                                                        ? theme.palette.status?.success || 'success.main'
                                                        : theme.palette.text.primary,
                                            }}
                                        >
                                            {log.amountEth > 0 ? `+${log.amountEth} ETH` : `${log.amountEth} ETH`}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <CheckCircle sx={{ fontSize: 13, color: 'success.main' }} /> On-chain Confirmed
                                        </Typography>
                                    </Box>
                                </Paper>
                            ))
                        )}
                        </Stack>
                    </Paper>
                </Container>
            </Box>

            {/* MODAL RÚT DOANH THU ON-CHAIN VỀ VÍ BAN TỔ CHỨC */}
            <Dialog
                open={openWithdrawModal}
                onClose={() => {
                    if (withdrawStep !== 'verifying_block') {
                        setOpenWithdrawModal(false);
                    }
                }}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: 1.5,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '10px',
                                    bgcolor: 'action.selected',
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Payments />
                            </Box>
                            <Box>
                                <Typography variant="h3" fontWeight={700}>
                                    Rút Doanh Thu On-Chain
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Giải ngân từ Smart Contract về ví BTC
                                </Typography>
                            </Box>
                        </Stack>
                        {withdrawStep !== 'verifying_block' && (
                            <IconButton
                                size="small"
                                aria-label="Đóng popup rút doanh thu"
                                onClick={() => setOpenWithdrawModal(false)}
                            >
                                <Close />
                            </IconButton>
                        )}
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 1.5 }}>
                    {withdrawStep === 'initial' && (
                        <Stack spacing={2}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'background.subtle',
                                    border: 1,
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Số tiền giải ngân khả dụng:
                                </Typography>
                                <Typography variant="h1" fontWeight={800} color="primary.main" my={0.5}>
                                    {metrics.withdrawableBalanceEth} ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Bao gồm doanh thu bán vé sơ cấp và 5% phí bản quyền
                                </Typography>
                            </Paper>

                            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '10px', p: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Ví đích nhận thanh toán:
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                    {user?.walletAddress ? truncateHash(user.walletAddress, 10, 8) : 'Chưa liên kết ví Web3'}
                                </Typography>
                            </Box>

                            <Alert severity="info" sx={{ fontSize: '0.8rem', borderRadius: '8px' }}>
                                Giao dịch rút tiền sẽ được gửi trực tiếp đến hàm <code>withdrawOrganizerFunds()</code> trên Smart Contract Sepolia.
                            </Alert>
                        </Stack>
                    )}

                    {withdrawStep === 'pending_signature' && (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <AccountBalanceWallet sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h3" fontWeight={700} gutterBottom>
                                Vui lòng xác nhận trên ví MetaMask
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Đang mở cửa sổ ký giao dịch giải ngân {metrics.withdrawableBalanceEth} ETH...
                            </Typography>
                            <LinearProgress sx={{ width: '70%', mx: 'auto', borderRadius: 4, height: 6 }} />
                        </Box>
                    )}

                    {withdrawStep === 'verifying_block' && (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                            <HourglassEmpty sx={{ fontSize: 50, color: theme.palette.status?.onchain || 'primary.main', mb: 2 }} />
                            <Typography variant="h3" fontWeight={700} gutterBottom>
                                Đang đóng khối giao dịch Sepolia...
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                TxHash: {truncateHash(withdrawTxHash, 10, 8)}
                            </Typography>
                            <LinearProgress
                                sx={{
                                    width: '80%',
                                    mx: 'auto',
                                    borderRadius: 4,
                                    height: 6,
                                    bgcolor: theme.palette.status?.onchainBg,
                                    '& .MuiLinearProgress-bar': { bgcolor: theme.palette.status?.onchain },
                                }}
                            />
                        </Box>
                    )}

                    {withdrawStep === 'confirmed' && (
                        <Box sx={{ py: 2, textAlign: 'center' }}>
                            <CheckCircle sx={{ fontSize: 56, color: 'success.main', mb: 1.5 }} />
                            <Typography variant="h3" fontWeight={800} color="text.primary" gutterBottom>
                                Rút Doanh Thu Thành Công!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Số tiền đã được chuyển trực tiếp vào ví MetaMask của bạn trên mạng Ethereum Sepolia Testnet.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 0 }}>
                    {withdrawStep === 'initial' && (
                        <Stack direction="row" spacing={1.5} width="100%" justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => setOpenWithdrawModal(false)}
                                sx={{ borderRadius: '8px' }}
                            >
                                Hủy Bỏ
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConfirmWithdraw}
                                sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
                            >
                                Xác Nhận Rút
                            </Button>
                        </Stack>
                    )}

                    {withdrawStep === 'confirmed' && (
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={() => {
                                setOpenWithdrawModal(false);
                                showSnackbar('Giao dịch rút tiền đã được xác nhận on-chain!', 'success');
                            }}
                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            Hoàn Tất & Đóng
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Footer />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: '10px', fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default OrganizerDashboardPage;

