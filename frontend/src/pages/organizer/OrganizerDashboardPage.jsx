import React, { useState, useMemo } from 'react';
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

// Helper: Rút gọn địa chỉ ví và mã băm
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu các chỉ số kinh tế của Ban Tổ Chức
const INITIAL_ORGANIZER_METRICS = {
    totalRevenueEth: 48.75,
    totalRevenueUsd: 159500,
    resaleRoyaltyEth: 1.42,
    withdrawableBalanceEth: 12.50,
    totalTicketsSold: 965,
    totalTicketsMaxSupply: 1200,
    totalCheckedInCount: 773,
    activeEventsCount: 2,
    pendingEventsCount: 1,
    endedEventsCount: 1,
};

// Danh sách các sự kiện do Organizer quản lý
const INITIAL_MY_EVENTS = [
    {
        id: 'EVT-2026-002',
        title: 'Vietnam Blockchain Summit 2026',
        category: 'technology',
        categoryLabel: 'Công nghệ & Web3',
        status: 'published',
        statusText: 'Đang Mở Bán',
        venue: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
        date: '28/11/2026',
        startTime: '08:30',
        ticketsSold: 412,
        maxSupply: 500,
        checkedIn: 382,
        primaryRevenueEth: 28.50,
        royaltyEarnedEth: 0.85,
        totalRevenueEth: 29.35,
        contractAddress: '0x71C948261901823901928394819203849102A319',
    },
    {
        id: 'EVT-2026-001',
        title: 'Hòa Nhạc Giao Hưởng Mùa Thu 2026',
        category: 'music',
        categoryLabel: 'Âm nhạc cổ điển',
        status: 'published',
        statusText: 'Đang Mở Bán',
        venue: 'Nhà Hát Lớn Hà Nội, 01 Tràng Tiền',
        date: '15/11/2026',
        startTime: '20:00',
        ticketsSold: 285,
        maxSupply: 300,
        checkedIn: 195,
        primaryRevenueEth: 15.20,
        royaltyEarnedEth: 0.38,
        totalRevenueEth: 15.58,
        contractAddress: '0x882A990812Da7201bF241cba0982E12Da9911812',
    },
    {
        id: 'EVT-2026-007',
        title: 'Web3 Developer Bootcamp & Hackathon 2026',
        category: 'technology',
        categoryLabel: 'Công nghệ & AI',
        status: 'pending',
        statusText: 'Chờ Admin Duyệt',
        venue: 'Đại học Bách Khoa Hà Nội, Hai Bà Trưng',
        date: '22/12/2026',
        startTime: '09:00',
        ticketsSold: 0,
        maxSupply: 200,
        checkedIn: 0,
        primaryRevenueEth: 0.00,
        royaltyEarnedEth: 0.00,
        totalRevenueEth: 0.00,
        contractAddress: null,
    },
    {
        id: 'EVT-2025-089',
        title: 'Tech Startup Pitching Day 2025',
        category: 'workshop',
        categoryLabel: 'Hội thảo đầu tư',
        status: 'ended',
        statusText: 'Đã Kết Thúc',
        venue: 'Khách sạn Lotte Hà Nội, 54 Liễu Giai',
        date: '10/10/2025',
        startTime: '13:30',
        ticketsSold: 200,
        maxSupply: 200,
        checkedIn: 196,
        primaryRevenueEth: 5.05,
        royaltyEarnedEth: 0.19,
        totalRevenueEth: 5.24,
        contractAddress: '0x123A990812Da7201bF241cba0982E12Da9911999',
    },
];

// Nhật ký tài chính & bản quyền gần nhất
const INITIAL_FINANCIAL_LOGS = [
    {
        id: 'TXN-9021',
        type: 'royalty',
        typeLabel: 'Bản quyền 5% Chợ thứ cấp',
        eventTitle: 'Vietnam Blockchain Summit 2026',
        tokenId: 1422,
        amountEth: 0.014,
        txHash: '0x8a9f3b12dc089148b39019284918239018294018234810239481902371ef8923',
        time: '35 phút trước',
        status: 'completed',
    },
    {
        id: 'TXN-9020',
        type: 'primary_sale',
        typeLabel: 'Khách mua vé NFT mới',
        eventTitle: 'Hòa Nhạc Giao Hưởng Mùa Thu 2026',
        tokenId: 286,
        amountEth: 0.08,
        txHash: '0x5c7e19283019284918239018294018234810239481902371ef892312dc089148',
        time: '2 giờ trước',
        status: 'completed',
    },
    {
        id: 'TXN-9019',
        type: 'royalty',
        typeLabel: 'Bản quyền 5% Chợ thứ cấp',
        eventTitle: 'Vietnam Blockchain Summit 2026',
        tokenId: 312,
        amountEth: 0.0037,
        txHash: '0x3d2b918239018294018234810239481902371ef892312dc089148b3901928491',
        time: '4 giờ trước',
        status: 'completed',
    },
    {
        id: 'TXN-9018',
        type: 'withdrawal',
        typeLabel: 'Rút doanh thu về ví cá nhân',
        eventTitle: 'Hệ thống Smart Contract TicketMarketplace',
        tokenId: null,
        amountEth: -10.00,
        txHash: '0x7f1a3b12dc089148b39019284918239018294018234810239481902371ef8923',
        time: '1 ngày trước',
        status: 'completed',
    },
];

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

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
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
                        <Link component={RouterLink} to="/">Trang chủ</Link>
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
                                                    {user?.walletAddress || '0x8F4211A990812Da7201bF241cba0982E12Da9911'}
                                                </Typography>
                                                <Tooltip title="Sao chép ví">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Sao chép địa chỉ ví ban tổ chức"
                                                        onClick={() => handleCopy(user?.walletAddress || '0x8F4211A990812Da7201bF241cba0982E12Da9911', 'địa chỉ ví')}
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
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
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
                            {financialLogs.map((log) => (
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
                            ))}
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
                                    {truncateHash(user?.walletAddress || '0x8F4211A990812Da7201bF241cba0982E12Da9911', 10, 8)}
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

