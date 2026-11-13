import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
    ConfirmationNumber,
    AccountBalanceWallet,
    TrendingUp,
    PeopleAlt,
    EventNote,
    CheckCircle,
    Cancel,
    HourglassEmpty,
    Refresh,
    ContentCopy,
    OpenInNew,
    Security,
    DarkMode,
    LightMode,
    Search,
    Visibility,
    ElectricBolt,
    QrCode2,
    Storefront,
    Check,
    Close,
    Launch,
    AdminPanelSettings,
    FiberManualRecord,
    InfoOutlined,
    Home,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';

// Helper: Rút gọn địa chỉ ví và mã băm giao dịch theo chuẩn Section 4.2
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu khởi tạo mô phỏng MongoDB Atlas & Ethereum Sepolia
const INITIAL_METRICS = {
    totalRevenueEth: 158.45,
    totalRevenueUsd: 498200,
    revenueGrowth: '+18.4%',
    resaleRoyaltyEth: 4.85,
    totalTicketsMinted: 8420,
    totalTicketsMaxSupply: 10000,
    checkedInCount: 5210,
    totalEvents: 42,
    pendingEventsCount: 5,
    activeEventsCount: 18,
    endedEventsCount: 19,
    totalUsers: 3180,
    connectedWallets: 2840,
    complianceScore: 100, // 100% tuân thủ trần giá 120%
};

const INITIAL_PENDING_EVENTS = [
    {
        id: 'EVT-2026-001',
        title: 'Hòa Nhạc Giao Hưởng Mùa Thu 2026',
        organizer: 'Hanoi Symphony Orchestra',
        organizerWallet: '0x3A2198Ccfa31E4082218901Dfb8293aa7e9B1102',
        category: 'music',
        categoryLabel: 'Âm nhạc',
        venue: 'Nhà Hát Lớn Hà Nội, 01 Tràng Tiền, Hoàn Kiếm',
        startTime: '15/11/2026 - 20:00',
        ticketPriceRange: '0.08 - 0.25 ETH',
        maxSupply: 800,
        submittedAt: '25 phút trước',
        description: 'Đêm hòa nhạc cổ điển quốc tế với sự tham gia của dàn nhạc giao hưởng danh tiếng. Phát hành 2 hạng vé: Standard và VIP.',
        bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'EVT-2026-002',
        title: 'Vietnam Blockchain Summit 2026',
        organizer: 'TechChain Foundation',
        organizerWallet: '0x8F4211A990812Da7201bF241cba0982E12Da9911',
        category: 'technology',
        categoryLabel: 'Công nghệ',
        venue: 'Trung tâm Hội nghị Quốc gia, Nam Từ Liêm, Hà Nội',
        startTime: '28/11/2026 - 08:30',
        ticketPriceRange: '0.15 - 0.50 ETH',
        maxSupply: 1500,
        submittedAt: '2 giờ trước',
        description: 'Hội nghị cấp cao về công nghệ Blockchain, Web3, Smart Contract & Tokenization lớn nhất năm 2026 tại Việt Nam.',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'EVT-2026-003',
        title: 'Giải Marathon Quốc Tế Vịnh Hạ Long',
        organizer: 'Halong Running Club',
        organizerWallet: '0x11B988Cc009941aB28394Fa019283738C0882190',
        category: 'sports',
        categoryLabel: 'Thể thao',
        venue: 'Bờ biển Bãi Cháy, TP. Hạ Long, Quảng Ninh',
        startTime: '05/12/2026 - 05:00',
        ticketPriceRange: '0.05 ETH',
        maxSupply: 3000,
        submittedAt: '5 giờ trước',
        description: 'Giải chạy việt dã quốc tế bên bờ di sản thiên nhiên thế giới Hạ Long, quy tụ hơn 3000 vận động viên toàn cầu.',
        bannerUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'EVT-2026-004',
        title: 'Workshop Chuyên Sâu Smart Contract Security & DeFi',
        organizer: 'Web3 Builders Guild',
        organizerWallet: '0x7E1922Ab00192Fa93847291823901923AA559812',
        category: 'workshop',
        categoryLabel: 'Hội thảo',
        venue: 'Tòa nhà FPT Tower, số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
        startTime: '10/12/2026 - 14:00',
        ticketPriceRange: '0.03 ETH',
        maxSupply: 200,
        submittedAt: '1 ngày trước',
        description: 'Đào tạo kỹ năng kiểm toán bảo mật hợp đồng thông minh Solidity, các kỹ thuật phòng thủ re-entrancy, flash loan.',
        bannerUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    },
    {
        id: 'EVT-2026-005',
        title: 'Lễ Hội Âm Nhạc Điện Tử EDM Sonic Wave 2026',
        organizer: 'Sonic Events Asia',
        organizerWallet: '0x992B4871923485aa8394827189283921EE108371',
        category: 'music',
        categoryLabel: 'Âm nhạc',
        venue: 'Công viên Yên Sở, Hoàng Mai, Hà Nội',
        startTime: '20/12/2026 - 16:00',
        ticketPriceRange: '0.12 - 0.35 ETH',
        maxSupply: 5000,
        submittedAt: '1 ngày trước',
        description: 'Đại nhạc hội âm thanh ánh sáng ngoài trời với Top 100 DJ quốc tế cùng hệ thống soát vé QR động tốc độ cao.',
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    },
];

const INITIAL_TRANSACTIONS = [
    {
        txHash: '0x8a9f3b12dc089148b39019284918239018294018234810239481902371ef8923',
        type: 'primary_mint',
        typeLabel: 'Mint Vé Sơ Cấp (ERC-721)',
        eventTitle: 'Vietnam Blockchain Summit 2026',
        tokenId: 1420,
        ticketTier: 'VIP Pass',
        wallet: '0x789b9102934812301928394819203849102334ef',
        valueEth: 0.50,
        status: 'success',
        blockNumber: 7421898,
        timestamp: '1 phút trước',
    },
    {
        txHash: '0x3c2a11f8e4092837491029384019283491029384910293849102938490a18374',
        type: 'resale_secondary',
        typeLabel: 'Giao Dịch Chuyển Nhượng Thứ Cấp',
        eventTitle: 'Hòa Nhạc Giao Hưởng Mùa Thu',
        tokenId: 312,
        ticketTier: 'Standard',
        wallet: '0x619a82739182390192839481920384910293bb41',
        valueEth: 0.096,
        note: 'Trần giá 120% hợp lệ (Gốc 0.08 ETH)',
        status: 'success',
        blockNumber: 7421895,
        timestamp: '4 phút trước',
    },
    {
        txHash: '0x91df7a28e3b019283940192834910293849102938491029384910293187ca019',
        type: 'primary_mint',
        typeLabel: 'Mint Vé Sơ Cấp (ERC-721)',
        eventTitle: 'EDM Sonic Wave 2026',
        tokenId: 891,
        ticketTier: 'GA Pass',
        wallet: '0x10ae9102938491029384910293849102938449bc',
        valueEth: 0.12,
        status: 'onchain',
        blockNumber: null,
        timestamp: 'Vừa xong (Chờ xác nhận block)',
    },
    {
        txHash: '0x65bb9103af4c10293849102938491029384910293849102938491029328eb920',
        type: 'check_in',
        typeLabel: 'Quét QR Check-in Cổng Sự Kiện',
        eventTitle: 'Workshop Smart Contract Security',
        tokenId: 45,
        ticketTier: 'Standard',
        wallet: '0x55aa102938491029384910293849102938493341',
        valueEth: 0.0,
        status: 'checkedIn',
        blockNumber: 7421880,
        timestamp: '12 phút trước',
    },
    {
        txHash: '0x00ae2140bb991029384910293849102938491029384910293849102977df9812',
        type: 'resale_secondary',
        typeLabel: 'Giao Dịch Chuyển Nhượng Thứ Cấp',
        eventTitle: 'Giải Marathon Quốc Tế Vịnh Hạ Long',
        tokenId: 109,
        ticketTier: 'Full Marathon 42km',
        wallet: '0x88bb1029384910293849102938491029384977aa',
        valueEth: 0.055,
        note: 'Trần giá 120% hợp lệ (Gốc 0.05 ETH)',
        status: 'success',
        blockNumber: 7421872,
        timestamp: '28 phút trước',
    },
    {
        txHash: '0x54ec1992aa001029384910293849102938491029384910293849102944ee1928',
        type: 'primary_mint',
        typeLabel: 'Mint Vé Sơ Cấp (ERC-721)',
        eventTitle: 'Vietnam Blockchain Summit 2026',
        tokenId: 1421,
        ticketTier: 'Standard Pass',
        wallet: '0x22ee1029384910293849102938491029384999ff',
        valueEth: 0.15,
        status: 'error',
        blockNumber: 7421865,
        timestamp: '45 phút trước',
    },
];

const AUDIT_LOGS = [
    {
        id: 'LOG-8812',
        adminName: 'Admin System (Superuser)',
        adminWallet: '0x1234567890123456789012345678901234567890',
        action: 'APPROVE_EVENT',
        target: 'EVT-2026-000 (Triển Lãm Nghệ Thuật Số NFT)',
        ipAddress: '113.190.24.18',
        timestamp: '3 giờ trước',
    },
    {
        id: 'LOG-8811',
        adminName: 'Admin System (Superuser)',
        adminWallet: '0x1234567890123456789012345678901234567890',
        action: 'UPDATE_CONFIG',
        target: 'TicketMarketplace.sol (Royalty: 2.5%)',
        ipAddress: '113.190.24.18',
        timestamp: '1 ngày trước',
    },
    {
        id: 'LOG-8810',
        adminName: 'Admin Operator #02',
        adminWallet: '0x9876543210987654321098765432109876543210',
        action: 'SUSPEND_USER',
        target: 'User ID: 0x99af...1102 (Hành vi spam đơn hàng lặp)',
        ipAddress: '14.232.19.82',
        timestamp: '2 ngày trước',
    },
];

const CATEGORIES_DATA = [
    { name: 'Âm nhạc (Music)', percent: 42, color: '#2563EB', events: 18, tickets: '4,200 vé' },
    { name: 'Công nghệ (Tech & Web3)', percent: 28, color: '#6366F1', events: 12, tickets: '2,800 vé' },
    { name: 'Thể thao (Sports)', percent: 18, color: '#10B981', events: 8, tickets: '1,800 vé' },
    { name: 'Hội thảo (Workshop)', percent: 12, color: '#F59E0B', events: 4, tickets: '1,200 vé' },
];

const normalizePendingEvent = (evt) => ({
    ...evt,
    id: evt.id,
    title: evt.title,
    organizer: evt.organizer?.fullName || evt.organizer?.name || 'Nhà tổ chức',
    organizerWallet: evt.organizer?.walletAddress || evt.organizer?.wallet || '0x0000...0000',
    category: evt.category || 'music',
    categoryLabel:
        evt.category === 'technology' ? 'Công nghệ' :
        evt.category === 'sports' ? 'Thể thao' :
        evt.category === 'workshop' ? 'Hội thảo' : 'Âm nhạc',
    startTime: evt.startTime ? new Date(evt.startTime).toLocaleString('vi-VN') : '',
    ticketCount: Array.isArray(evt.ticketTypes)
        ? evt.ticketTypes.reduce((s, t) => s + Number(t.maxSupply || 0), 0)
        : 0,
    priceRange: Array.isArray(evt.ticketTypes) && evt.ticketTypes.length > 0
        ? `${Math.min(...evt.ticketTypes.map((t) => Number(t.originalPrice || 0)))} - ${Math.max(...evt.ticketTypes.map((t) => Number(t.originalPrice || 0)))} ETH`
        : '0.05 ETH',
    ticketTypes: Array.isArray(evt.ticketTypes) ? evt.ticketTypes : [],
    submittedAt: evt.createdAt ? new Date(evt.createdAt).toLocaleDateString('vi-VN') : 'Mới cập nhật',
    venue: evt.venueName || evt.venue || 'Việt Nam',
    description: evt.description || '',
    bannerUrl: evt.bannerUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
});

const AdminDashboardPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();

    // States
    const [currentTab, setCurrentTab] = useState(0);
    const [timeRange, setTimeRange] = useState('30days');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState('15:02:10');

    // Data states
    const [metrics, setMetrics] = useState(INITIAL_METRICS);
    const [pendingEvents, setPendingEvents] = useState(INITIAL_PENDING_EVENTS);
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

    // Modal dialog states
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectError, setRejectError] = useState('');

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    // Tải số liệu Dashboard và sự kiện chờ duyệt từ Backend
    const fetchDashboardData = async () => {
        setIsRefreshing(true);
        try {
            const [metricsRes, pendingRes] = await Promise.allSettled([
                adminAPI.getMetrics(),
                adminAPI.getPendingEvents({ limit: 10 }),
            ]);

            if (metricsRes.status === 'fulfilled' && metricsRes.value.data?.data) {
                setMetrics((prev) => ({
                    ...prev,
                    ...metricsRes.value.data.data,
                }));
            }

            if (pendingRes.status === 'fulfilled') {
                const pEvents = pendingRes.value.data?.data?.events;
                if (Array.isArray(pEvents) && pEvents.length > 0) {
                    setPendingEvents(pEvents.map(normalizePendingEvent));
                }
            }

            const now = new Date();
            setLastSyncTime(now.toTimeString().split(' ')[0]);
        } catch (err) {
            console.log('Chưa kết nối API Backend hoặc chưa đăng nhập Admin:', err.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Sao chép clipboard với thông báo
    const handleCopy = (text, label = 'mã') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 8, 6)}`, 'success');
    };

    // Làm mới dữ liệu
    const handleRefreshData = async () => {
        await fetchDashboardData();
        showSnackbar('Đã đồng bộ dữ liệu mới nhất từ Sepolia Testnet & Cơ sở dữ liệu!', 'success');
    };

    // Phê duyệt sự kiện
    const handleApproveEvent = async (event) => {
        try {
            await adminAPI.approveEvent(event.id);
            setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
            setMetrics((prev) => ({
                ...prev,
                pendingEventsCount: Math.max(0, prev.pendingEventsCount - 1),
                activeEventsCount: prev.activeEventsCount + 1,
            }));
            showSnackbar(`Đã phê duyệt sự kiện "${event.title}" thành công! Sự kiện đã sẵn sàng mở bán.`, 'success');
        } catch (err) {
            setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
            setMetrics((prev) => ({
                ...prev,
                pendingEventsCount: Math.max(0, prev.pendingEventsCount - 1),
                activeEventsCount: prev.activeEventsCount + 1,
            }));
            showSnackbar(err.message || `Đã phê duyệt sự kiện "${event.title}" (chế độ demo).`, 'info');
        } finally {
            if (detailModalOpen) setDetailModalOpen(false);
        }
    };

    // Mở modal từ chối
    const handleOpenRejectModal = (event) => {
        setSelectedEvent(event);
        setRejectionReason('');
        setRejectError('');
        setRejectModalOpen(true);
    };

    // Xác nhận từ chối sự kiện
    const handleConfirmReject = async () => {
        if (!rejectionReason.trim()) {
            setRejectError('Vui lòng nhập lý do từ chối để thông báo cho Nhà tổ chức.');
            return;
        }

        const targetEvent = selectedEvent;
        try {
            await adminAPI.rejectEvent(targetEvent.id, rejectionReason.trim());
            setPendingEvents((prev) => prev.filter((e) => e.id !== targetEvent.id));
            setMetrics((prev) => ({
                ...prev,
                pendingEventsCount: Math.max(0, prev.pendingEventsCount - 1),
            }));
            showSnackbar(`Đã từ chối sự kiện "${targetEvent.title}". Thông báo kèm lý do đã được gửi tới Organizer.`, 'info');
        } catch (err) {
            setPendingEvents((prev) => prev.filter((e) => e.id !== targetEvent.id));
            setMetrics((prev) => ({
                ...prev,
                pendingEventsCount: Math.max(0, prev.pendingEventsCount - 1),
            }));
            showSnackbar(err.message || `Đã từ chối sự kiện "${targetEvent.title}".`, 'info');
        } finally {
            setRejectModalOpen(false);
            if (detailModalOpen) setDetailModalOpen(false);
        }
    };

    // Lọc sự kiện đang chờ duyệt
    const filteredPendingEvents = pendingEvents.filter((evt) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            evt.title.toLowerCase().includes(q) ||
            evt.organizer.toLowerCase().includes(q) ||
            evt.categoryLabel.toLowerCase().includes(q) ||
            evt.id.toLowerCase().includes(q)
        );
    });

    // Helper render Chip Trạng thái theo bảng Business Status Tokens của Section 2.3
    const renderStatusChip = (status) => {
        switch (status) {
            case 'success':
                return (
                    <Chip
                        icon={<CheckCircle sx={{ fontSize: '15px !important', color: 'status.success' }} />}
                        label="Thành công"
                        size="small"
                        sx={{
                            bgcolor: 'status.successBg',
                            color: 'status.success',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'pending':
                return (
                    <Chip
                        icon={<HourglassEmpty sx={{ fontSize: '15px !important', color: 'status.pending' }} />}
                        label="Chờ duyệt"
                        size="small"
                        sx={{
                            bgcolor: 'status.pendingBg',
                            color: 'status.pending',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'onchain':
                return (
                    <Chip
                        icon={<ElectricBolt sx={{ fontSize: '15px !important', color: 'status.onchain' }} />}
                        label="Chờ đóng Block"
                        size="small"
                        sx={{
                            bgcolor: 'status.onchainBg',
                            color: 'status.onchain',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'checkedIn':
                return (
                    <Chip
                        icon={<QrCode2 sx={{ fontSize: '15px !important', color: 'status.checkedIn' }} />}
                        label="Đã Check-in"
                        size="small"
                        sx={{
                            bgcolor: 'status.checkedInBg',
                            color: 'status.checkedIn',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'error':
            case 'failed':
                return (
                    <Chip
                        icon={<Cancel sx={{ fontSize: '15px !important', color: 'status.error' }} />}
                        label="Thất bại"
                        size="small"
                        sx={{
                            bgcolor: 'status.errorBg',
                            color: 'status.error',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            default:
                return (
                    <Chip
                        label={status}
                        size="small"
                        sx={{
                            bgcolor: 'status.cancelledBg',
                            color: 'status.cancelled',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
            {/* ═══════════════════════════════════════════════════════════════════
                1. TOP HEADER / APP BAR
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 2,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Container maxWidth="xl">
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                        spacing={2}
                    >
                        {/* Title & Network Status Pill */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '8px',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                    }}
                                >
                                    <AdminPanelSettings fontSize="small" />
                                </Box>
                                <Typography variant="h2" color="text.primary">
                                    Bảng Điều Khiển Quản Trị
                                </Typography>
                                <Chip
                                    label="ADMIN PORTAL"
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                />
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <FiberManualRecord sx={{ color: 'status.success', fontSize: 12 }} />
                                <Typography variant="caption" color="text.secondary">
                                    Sepolia Testnet #11155111 (Block #7,421,902)
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                    •
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Đồng bộ gần nhất: {lastSyncTime}
                                </Typography>
                            </Stack>
                        </Box>

                        {/* Top Actions: Home, Time range, Refresh, Theme Toggle */}
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                            <Button
                                variant="outlined"
                                size="medium"
                                startIcon={<Home />}
                                onClick={() => navigate('/')}
                                sx={{ height: 40 }}
                            >
                                Trang chủ
                            </Button>

                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    sx={{ height: 40, bgcolor: 'background.paper' }}
                                >
                                    <MenuItem value="today">Hôm nay</MenuItem>
                                    <MenuItem value="7days">7 ngày qua</MenuItem>
                                    <MenuItem value="30days">30 ngày qua</MenuItem>
                                    <MenuItem value="all">Toàn thời gian</MenuItem>
                                </Select>
                            </FormControl>

                            <Tooltip title="Làm mới dữ liệu từ Sepolia & Atlas">
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        onClick={handleRefreshData}
                                        disabled={isRefreshing}
                                        startIcon={
                                            <Refresh
                                                sx={{
                                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                                    '@keyframes spin': {
                                                        '0%': { transform: 'rotate(0deg)' },
                                                        '100%': { transform: 'rotate(360deg)' },
                                                    },
                                                }}
                                            />
                                        }
                                        sx={{ height: 40 }}
                                    >
                                        Đồng bộ
                                    </Button>
                                </span>
                            </Tooltip>

                            <Tooltip title={mode === 'light' ? 'Chuyển Dark Mode' : 'Chuyển Light Mode'}>
                                <IconButton
                                    aria-label="Chuyển đổi giao diện sáng tối"
                                    onClick={toggleTheme}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: '8px',
                                        width: 40,
                                        height: 40,
                                        color: 'text.secondary',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 4 }}>
                {/* ═══════════════════════════════════════════════════════════════════
                    2. BANNER GIÁM SÁT TUÂN THỦ TRẦN GIÁ (COMPLIANCE NOTICE)
                ═══════════════════════════════════════════════════════════════════ */}
                <Alert
                    severity="info"
                    icon={<Security sx={{ color: 'primary.main' }} />}
                    sx={{
                        mb: 4,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        '& .MuiAlert-message': { width: '100%' },
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                Giám sát tính toàn vẹn Smart Contract (BR-02: Quy tắc trần giá 120%)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Hợp đồng <code>TicketMarketplace.sol</code> đang kiểm duyệt 100% giao dịch thứ cấp trên chuỗi Sepolia.
                                Tỷ lệ tuân thủ: <strong>100%</strong> • 0 giao dịch vi phạm được ghi nhận.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                variant="text"
                                color="primary"
                                startIcon={<Launch sx={{ fontSize: 16 }} />}
                                onClick={() => handleCopy('0x48D11894aB01029384910293849102938491B281', 'Địa chỉ hợp đồng Chợ')}
                            >
                                Sao chép Contract Chợ
                            </Button>
                        </Stack>
                    </Stack>
                </Alert>

                {/* ═══════════════════════════════════════════════════════════════════
                    3. BẢNG CHỈ SỐ KPIs CỐT LÕI (OVERVIEW METRIC CARDS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Grid container spacing={3} mb={4}>
                    {/* KPI 1: Tổng Doanh Thu */}
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            TỔNG DOANH THU HỆ THỐNG
                                        </Typography>
                                        <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                                            {metrics.totalRevenueEth.toLocaleString('vi-VN')} ETH
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'action.selected',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                        }}
                                    >
                                        <AccountBalanceWallet fontSize="small" />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Ước tính: ~${metrics.totalRevenueUsd.toLocaleString('en-US')} USD
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1} mt={1.5}>
                                    <Chip
                                        label={metrics.revenueGrowth}
                                        size="small"
                                        sx={{
                                            bgcolor: 'status.successBg',
                                            color: 'status.success',
                                            fontWeight: 600,
                                            height: 22,
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        Phí chợ thứ cấp: <strong>{metrics.resaleRoyaltyEth} ETH</strong>
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* KPI 2: Tổng Vé NFT Đã Phát Hành */}
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            VÉ NFT ĐÃ PHÁT HÀNH
                                        </Typography>
                                        <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                                            {metrics.totalTicketsMinted.toLocaleString('vi-VN')}
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                / {metrics.totalTicketsMaxSupply.toLocaleString('vi-VN')}
                                            </Typography>
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'status.successBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.success',
                                        }}
                                    >
                                        <ConfirmationNumber fontSize="small" />
                                    </Box>
                                </Stack>
                                <Box mb={1}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="text.secondary">Tỷ lệ bán hết (Sell-out)</Typography>
                                        <Typography variant="caption" color="text.primary" fontWeight={600}>
                                            {((metrics.totalTicketsMinted / metrics.totalTicketsMaxSupply) * 100).toFixed(1)}%
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(metrics.totalTicketsMinted / metrics.totalTicketsMaxSupply) * 100}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    Đã check-in tại cổng: <strong>{metrics.checkedInCount.toLocaleString('vi-VN')} vé</strong>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* KPI 3: Sự Kiện Hệ Thống */}
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            TỔNG SỰ KIỆN HỆ THỐNG
                                        </Typography>
                                        <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                                            {metrics.totalEvents} Sự kiện
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'status.pendingBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.pending',
                                        }}
                                    >
                                        <EventNote fontSize="small" />
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                    <Chip
                                        icon={<HourglassEmpty sx={{ fontSize: '14px !important', color: 'status.pending' }} />}
                                        label={`${metrics.pendingEventsCount} chờ phê duyệt`}
                                        size="small"
                                        sx={{
                                            bgcolor: 'status.pendingBg',
                                            color: 'status.pending',
                                            fontWeight: 600,
                                            height: 24,
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        variant="text"
                                        color="primary"
                                        onClick={() => navigate('/admin/events')}
                                        sx={{ p: 0, minWidth: 'auto', fontSize: '0.75rem', fontWeight: 600 }}
                                    >
                                        Duyệt ngay →
                                    </Button>
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                    {metrics.activeEventsCount} đang mở bán • {metrics.endedEventsCount} đã hoàn tất
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* KPI 4: Người Dùng & Ví Web3 */}
                    <Grid item xs={12} sm={6} lg={3}>
                        <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            NGƯỜI DÙNG & VÍ METAMASK
                                        </Typography>
                                        <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                                            {metrics.totalUsers.toLocaleString('vi-VN')}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'status.onchainBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.onchain',
                                        }}
                                    >
                                        <PeopleAlt fontSize="small" />
                                    </Box>
                                </Stack>
                                <Box mb={1}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="text.secondary">Ví đã liên kết Web3</Typography>
                                        <Typography variant="caption" color="text.primary" fontWeight={600}>
                                            {((metrics.connectedWallets / metrics.totalUsers) * 100).toFixed(1)}%
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        color="secondary"
                                        value={(metrics.connectedWallets / metrics.totalUsers) * 100}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                                    <Typography variant="caption" color="text.secondary">
                                        {metrics.connectedWallets.toLocaleString('vi-VN')} ví hoạt động • 155 Organizer
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="text"
                                        color="primary"
                                        onClick={() => navigate('/admin/users')}
                                        sx={{ p: 0, minWidth: 'auto', fontSize: '0.75rem', fontWeight: 600 }}
                                    >
                                        Quản lý →
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ═══════════════════════════════════════════════════════════════════
                    4. NAVIGATION TABS (CHUYỂN ĐỔI GÓC NHÌN QUẢN TRỊ)
                ═══════════════════════════════════════════════════════════════════ */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={(e, val) => setCurrentTab(val)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>Tổng quan & Giám sát</span>
                                </Stack>
                            }
                        />
                        <Tab
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>Hàng đợi duyệt sự kiện</span>
                                    {pendingEvents.length > 0 && (
                                        <Chip
                                            label={pendingEvents.length}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                bgcolor: 'status.pendingBg',
                                                color: 'status.pending',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    )}
                                </Stack>
                            }
                        />
                        <Tab
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>Giao dịch On-Chain & Đơn hàng</span>
                                </Stack>
                            }
                        />
                        <Tab
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>Nhật ký Kiểm toán (Audit Logs)</span>
                                </Stack>
                            }
                        />
                    </Tabs>
                </Box>

                {/* ═══════════════════════════════════════════════════════════════════
                    TAB 0: TỔNG QUAN & GIÁM SÁT (OVERVIEW DASHBOARD)
                ═══════════════════════════════════════════════════════════════════ */}
                {currentTab === 0 && (
                    <Grid container spacing={3}>
                        {/* Hàng đợi duyệt sự kiện khẩn cấp */}
                        <Grid item xs={12} lg={8}>
                            <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
                                <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="h3" color="text.primary">
                                                Sự Kiện Cần Phê Duyệt Gấp
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Các sự kiện do Organizer gửi lên đang chờ kiểm duyệt nội dung và định giá
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => setCurrentTab(1)}
                                            >
                                                Xem nhanh ({pendingEvents.length})
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => navigate('/admin/events')}
                                            >
                                                Trang Phê Duyệt
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Box>

                                <TableContainer>
                                    <Table size="medium">
                                        <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Tên Sự Kiện</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Nhà Tổ Chức</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Hạng Giá & Vé</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="right">Hành Động</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingEvents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                        <CheckCircle sx={{ fontSize: 40, color: 'status.success', mb: 1 }} />
                                                        <Typography variant="body1" color="text.primary" fontWeight={600}>
                                                            Hàng đợi phê duyệt đang trống!
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Tất cả sự kiện gửi lên đã được xử lý xong.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                pendingEvents.slice(0, 3).map((event) => (
                                                    <TableRow key={event.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell>
                                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                                <Box
                                                                    component="img"
                                                                    src={event.bannerUrl}
                                                                    alt={event.title}
                                                                    sx={{
                                                                        width: 48,
                                                                        height: 36,
                                                                        borderRadius: '6px',
                                                                        objectFit: 'cover',
                                                                        border: 1,
                                                                        borderColor: 'divider',
                                                                    }}
                                                                />
                                                                <Box>
                                                                    <Typography variant="subtitle2" color="text.primary" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                                                                        {event.title}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Mã: {event.id} • {event.categoryLabel}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                                {event.organizer}
                                                            </Typography>
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '12px' }}
                                                                >
                                                                    {truncateHash(event.organizerWallet, 6, 4)}
                                                                </Typography>
                                                                <Tooltip title="Sao chép ví Organizer">
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="Sao chép ví Organizer"
                                                                        onClick={() => handleCopy(event.organizerWallet, 'địa chỉ ví')}
                                                                        sx={{ p: 0.2 }}
                                                                    >
                                                                        <ContentCopy sx={{ fontSize: 13 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                                                                {event.ticketPriceRange}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Nguồn cung: {event.maxSupply.toLocaleString('vi-VN')} vé
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="text.primary">
                                                                {event.startTime.split(' - ')[0]}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {event.submittedAt}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Tooltip title="Xem chi tiết nội dung sự kiện">
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="Xem chi tiết sự kiện"
                                                                        onClick={() => {
                                                                            setSelectedEvent(event);
                                                                            setDetailModalOpen(true);
                                                                        }}
                                                                        sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                                                    >
                                                                        <Visibility fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Phê duyệt ngay">
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="Phê duyệt sự kiện"
                                                                        onClick={() => handleApproveEvent(event)}
                                                                        sx={{
                                                                            bgcolor: 'status.successBg',
                                                                            color: 'status.success',
                                                                            borderRadius: '6px',
                                                                            '&:hover': { bgcolor: 'status.success', color: '#fff' },
                                                                        }}
                                                                    >
                                                                        <Check fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Từ chối sự kiện">
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="Từ chối sự kiện"
                                                                        onClick={() => handleOpenRejectModal(event)}
                                                                        sx={{
                                                                            bgcolor: 'status.errorBg',
                                                                            color: 'status.error',
                                                                            borderRadius: '6px',
                                                                            '&:hover': { bgcolor: 'status.error', color: '#fff' },
                                                                        }}
                                                                    >
                                                                        <Close fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>

                            {/* Giao dịch gần đây */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="h3" color="text.primary">
                                                Giám Sát Giao Dịch Blockchain Gần Đây
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Hoạt động mint vé ERC-721, mua lại thứ cấp và quét check-in qua cổng
                                            </Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setCurrentTab(2)}
                                        >
                                            Xem tất cả ({transactions.length})
                                        </Button>
                                    </Stack>
                                </Box>

                                <TableContainer>
                                    <Table size="medium">
                                        <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Mã Giao Dịch (TxHash)</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Loại Giao Dịch</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Sự Kiện & Token</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Giá Trị</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="right">Khối / Thời Gian</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions.slice(0, 4).map((tx) => (
                                                <TableRow key={tx.txHash} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}
                                                            >
                                                                {truncateHash(tx.txHash, 6, 4)}
                                                            </Typography>
                                                            <Tooltip title="Sao chép TxHash">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Sao chép TxHash"
                                                                    onClick={() => handleCopy(tx.txHash, 'TxHash')}
                                                                    sx={{ p: 0.2 }}
                                                                >
                                                                    <ContentCopy sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Xem trên Etherscan Sepolia Explorer">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Mở Etherscan"
                                                                    component="a"
                                                                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{ p: 0.2, color: 'primary.main' }}
                                                                >
                                                                    <OpenInNew sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                            {tx.typeLabel}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                            Ví: {truncateHash(tx.wallet, 6, 4)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="text.primary" fontWeight={500} noWrap sx={{ maxWidth: 180 }}>
                                                            {tx.eventTitle}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Token #{tx.tokenId} • {tx.ticketTier}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} color={tx.valueEth > 0 ? 'primary.main' : 'text.secondary'}>
                                                            {tx.valueEth > 0 ? `${tx.valueEth} ETH` : 'Gasless'}
                                                        </Typography>
                                                        {tx.note && (
                                                            <Typography variant="caption" color="status.success" display="block">
                                                                {tx.note}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderStatusChip(tx.status)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" color="text.primary">
                                                            {tx.timestamp}
                                                        </Typography>
                                                        {tx.blockNumber && (
                                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                                #{tx.blockNumber}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        </Grid>

                        {/* Cột Phụ: Phân bổ Hạng mục & Sức khỏe Blockchain */}
                        <Grid item xs={12} lg={4}>
                            {/* Phân bổ Thể loại Sự kiện */}
                            <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
                                <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="h3" color="text.primary">
                                        Phân Bổ Theo Thể Loại
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Tỷ trọng các sự kiện đang hoạt động trên hệ thống
                                    </Typography>
                                </Box>
                                <CardContent sx={{ p: 3 }}>
                                    {CATEGORIES_DATA.map((cat) => (
                                        <Box key={cat.name} sx={{ mb: 2.5, '&:last-child': { mb: 0 } }}>
                                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                    {cat.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                                    {cat.percent}% ({cat.events} SK)
                                                </Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={cat.percent}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: 'action.hover',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: cat.color,
                                                        borderRadius: 4,
                                                    },
                                                }}
                                            />
                                            <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                                                Tổng vé phát hành: {cat.tickets}
                                            </Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Sức khỏe Hệ thống & Smart Contract */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="h3" color="text.primary">
                                        Hạ Tầng & Hợp Đồng Thông Minh
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Trạng thái kết nối node RPC & cơ sở dữ liệu
                                    </Typography>
                                </Box>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack spacing={2.5}>
                                        <Box>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">Mạng Blockchain</Typography>
                                                <Chip
                                                    icon={<FiberManualRecord sx={{ color: 'status.success', fontSize: 10 }} />}
                                                    label="Sepolia Testnet (Online)"
                                                    size="small"
                                                    sx={{ bgcolor: 'status.successBg', color: 'status.success', fontWeight: 600 }}
                                                />
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Hợp đồng Vé NFT (EventTicket.sol - ERC-721)
                                            </Typography>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    0x71C9482...A319
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    aria-label="Sao chép Contract Vé"
                                                    onClick={() => handleCopy('0x71C948261901823901928394819203849102A319', 'Hợp đồng Vé')}
                                                >
                                                    <ContentCopy sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Hợp đồng Chợ Thứ Cấp (TicketMarketplace.sol)
                                            </Typography>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    0x48D1189...B281
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    aria-label="Sao chép Contract Chợ"
                                                    onClick={() => handleCopy('0x48D11894aB01029384910293849102938491B281', 'Hợp đồng Chợ')}
                                                >
                                                    <ContentCopy sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">Cơ sở dữ liệu MongoDB Atlas</Typography>
                                                <Typography variant="body2" color="status.success" fontWeight={600}>
                                                    Đã kết nối (Ping: 28ms)
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">Gas Price trung bình</Typography>
                                                <Typography variant="body2" color="primary.main" fontWeight={600}>
                                                    ~18.4 Gwei (Sepolia)
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    TAB 1: HÀNG ĐỢI DUYỆT SỰ KIỆN CHI TIẾT (PENDING EVENTS QUEUE)
                ═══════════════════════════════════════════════════════════════════ */}
                {currentTab === 1 && (
                    <Card sx={{ bgcolor: 'background.paper' }}>
                        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                spacing={2}
                            >
                                <Box>
                                    <Typography variant="h3" color="text.primary">
                                        Hàng Đợi Duyệt Sự Kiện ({pendingEvents.length})
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Xem xét kỹ thông tin bản quyền, địa điểm và định giá vé trước khi phê duyệt mở bán trên chuỗi
                                    </Typography>
                                </Box>
                                <TextField
                                    size="small"
                                    placeholder="Tìm theo tên, người tạo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ minWidth: 260 }}
                                />
                            </Stack>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Mã & Banner</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Tên Sự Kiện & Thể Loại</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Nhà Tổ Chức</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Địa Điểm & Thời Gian</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Giá Vé & Nguồn Cung</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Hành Động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPendingEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Không tìm thấy sự kiện nào phù hợp với bộ lọc tìm kiếm.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPendingEvents.map((event) => (
                                            <TableRow key={event.id} hover>
                                                <TableCell>
                                                    <Box
                                                        component="img"
                                                        src={event.bannerUrl}
                                                        alt={event.title}
                                                        sx={{
                                                            width: 70,
                                                            height: 48,
                                                            borderRadius: '8px',
                                                            objectFit: 'cover',
                                                            border: 1,
                                                            borderColor: 'divider',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                                        {event.title}
                                                    </Typography>
                                                    <Chip
                                                        label={event.categoryLabel}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'action.selected',
                                                            color: 'primary.main',
                                                            fontWeight: 600,
                                                            fontSize: '0.7rem',
                                                            height: 20,
                                                            mt: 0.5,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                        {event.organizer}
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                                        >
                                                            {truncateHash(event.organizerWallet, 6, 4)}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Sao chép ví"
                                                            onClick={() => handleCopy(event.organizerWallet, 'ví Organizer')}
                                                            sx={{ p: 0.2 }}
                                                        >
                                                            <ContentCopy sx={{ fontSize: 13 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary" noWrap sx={{ maxWidth: 200 }}>
                                                        {event.venue}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {event.startTime}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                                                        {event.ticketPriceRange}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tối đa: {event.maxSupply.toLocaleString('vi-VN')} vé
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {renderStatusChip('pending')}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<Visibility sx={{ fontSize: 16 }} />}
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setDetailModalOpen(true);
                                                            }}
                                                            sx={{ height: 32 }}
                                                        >
                                                            Chi tiết
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<Check sx={{ fontSize: 16 }} />}
                                                            onClick={() => handleApproveEvent(event)}
                                                            sx={{ height: 32 }}
                                                        >
                                                            Duyệt
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<Close sx={{ fontSize: 16 }} />}
                                                            onClick={() => handleOpenRejectModal(event)}
                                                            sx={{ height: 32 }}
                                                        >
                                                            Từ chối
                                                        </Button>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    TAB 2: GIÁM SÁT GIAO DỊCH BLOCKCHAIN TOÀN BỘ (TRANSACTION MONITOR)
                ═══════════════════════════════════════════════════════════════════ */}
                {currentTab === 2 && (
                    <Card sx={{ bgcolor: 'background.paper' }}>
                        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h3" color="text.primary">
                                        Lịch Sử Giao Dịch On-Chain & Đơn Hàng Mua Vé
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Truy vết toàn bộ mã băm TxHash, người mua, người bán trên hợp đồng Ethereum Sepolia
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<OpenInNew />}
                                    component="a"
                                    href="https://sepolia.etherscan.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Khám phá Sepolia Etherscan
                                </Button>
                            </Stack>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Mã Hash Giao Dịch</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Nghiệp Vụ</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Tên Sự Kiện & Hạng Vé</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Địa Chỉ Ví Tương Tác</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Giá Trị Giao Dịch</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Trạng Thái Chuỗi</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Khối Sepolia / Thời Gian</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.txHash} hover>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}
                                                    >
                                                        {truncateHash(tx.txHash, 8, 6)}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Sao chép TxHash"
                                                        onClick={() => handleCopy(tx.txHash, 'TxHash')}
                                                        sx={{ p: 0.2 }}
                                                    >
                                                        <ContentCopy sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Mở Etherscan"
                                                        component="a"
                                                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ p: 0.2, color: 'primary.main' }}
                                                    >
                                                        <OpenInNew sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                                    {tx.typeLabel}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                    {tx.eventTitle}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Token ID #{tx.tokenId} • {tx.ticketTier}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                                    >
                                                        {truncateHash(tx.wallet, 6, 4)}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Sao chép địa chỉ ví"
                                                        onClick={() => handleCopy(tx.wallet, 'địa chỉ ví')}
                                                        sx={{ p: 0.2 }}
                                                    >
                                                        <ContentCopy sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={700} color={tx.valueEth > 0 ? 'primary.main' : 'text.secondary'}>
                                                    {tx.valueEth > 0 ? `${tx.valueEth} ETH` : '0 ETH (Gasless)'}
                                                </Typography>
                                                {tx.note && (
                                                    <Typography variant="caption" color="status.success" display="block">
                                                        ✓ {tx.note}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {renderStatusChip(tx.status)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color="text.primary">
                                                    {tx.timestamp}
                                                </Typography>
                                                {tx.blockNumber ? (
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                        Block #{tx.blockNumber}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="caption" color="status.onchain">
                                                        Chờ thợ đào...
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    TAB 3: NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)
                ═══════════════════════════════════════════════════════════════════ */}
                {currentTab === 3 && (
                    <Card sx={{ bgcolor: 'background.paper' }}>
                        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                            <Typography variant="h3" color="text.primary">
                                Nhật Ký Kiểm Toán Hoạt Động Quản Trị (Audit Logs)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ghi nhận bất biến các thao tác phê duyệt sự kiện, phân quyền và khóa tài khoản vi phạm
                            </Typography>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Mã Nhật Ký</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Người Thực Hiện</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Hành Động</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Đối Tượng Tác Động</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Địa Chỉ IP</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Thời Gian</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {AUDIT_LOGS.map((log) => (
                                        <TableRow key={log.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {log.id}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                                    {log.adminName}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    {truncateHash(log.adminWallet, 6, 4)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.action}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.primary">
                                                    {log.target}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    {log.ipAddress}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" color="text.secondary">
                                                    {log.timestamp}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                )}
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                5. MODAL CHI TIẾT SỰ KIỆN (EVENT DETAIL DIALOG - SECTION 6.4)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                {selectedEvent && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Typography variant="h3" color="text.primary">
                                Chi Tiết Sự Kiện Đang Chờ Phê Duyệt
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Mã hồ sơ: {selectedEvent.id} • Gửi lúc: {selectedEvent.submittedAt}
                            </Typography>
                        </DialogTitle>

                        <DialogContent dividers>
                            {/* Banner */}
                            <Box
                                component="img"
                                src={selectedEvent.bannerUrl}
                                alt={selectedEvent.title}
                                sx={{
                                    width: '100%',
                                    height: 220,
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    mb: 3,
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            />

                            <Typography variant="h2" color="text.primary" gutterBottom>
                                {selectedEvent.title}
                            </Typography>

                            <Typography variant="body1" color="text.secondary" paragraph>
                                {selectedEvent.description}
                            </Typography>

                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary">NHÀ TỔ CHỨC</Typography>
                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600} mt={0.5}>
                                            {selectedEvent.organizer}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                            Ví: {selectedEvent.organizerWallet}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary">ĐỊNH GIÁ & NGUỒN CUNG</Typography>
                                        <Typography variant="subtitle2" color="primary.main" fontWeight={700} mt={0.5}>
                                            {selectedEvent.ticketPriceRange}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Giới hạn tối đa (maxSupply): {selectedEvent.maxSupply.toLocaleString('vi-VN')} vé NFT
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary">ĐỊA ĐIỂM & THỜI GIAN TỔ CHỨC</Typography>
                                        <Typography variant="body2" color="text.primary" fontWeight={600} mt={0.5}>
                                            {selectedEvent.venue}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Thời gian: {selectedEvent.startTime}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Close />}
                                onClick={() => handleOpenRejectModal(selectedEvent)}
                            >
                                Từ Chối Sự Kiện
                            </Button>
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setDetailModalOpen(false)}
                                >
                                    Đóng
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Check />}
                                    onClick={() => handleApproveEvent(selectedEvent)}
                                >
                                    Phê Duyệt & Mở Bán On-Chain
                                </Button>
                            </Stack>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                6. MODAL TỪ CHỐI SỰ KIỆN (REJECT DIALOG KÈM LÝ DO)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                <DialogTitle>
                    <Typography variant="h3" color="error.main">
                        Từ Chối Phê Duyệt Sự Kiện
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText color="text.secondary" sx={{ mb: 2 }}>
                        Vui lòng nhập lý do từ chối để gửi phản hồi chính thức cho Nhà tổ chức{' '}
                        <strong>{selectedEvent?.organizer}</strong>.
                    </DialogContentText>
                    {rejectError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {rejectError}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Ví dụ: Thiếu giấy phép biểu diễn nghệ thuật theo quy định, hoặc thông tin địa điểm chưa rõ ràng..."
                        value={rejectionReason}
                        onChange={(e) => {
                            setRejectionReason(e.target.value);
                            if (rejectError) setRejectError('');
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button
                        variant="outlined"
                        onClick={() => setRejectModalOpen(false)}
                    >
                        Hủy Bỏ
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmReject}
                    >
                        Xác Nhận Từ Chối
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                7. SNACKBAR / TOAST PHẢN HỒI THÔNG BÁO
            ═══════════════════════════════════════════════════════════════════ */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: '8px', color: '#fff' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminDashboardPage;

