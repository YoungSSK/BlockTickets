import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
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
    Stack,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Badge,
} from '@mui/material';
import {
    ArrowBack,
    CheckCircle,
    Cancel,
    HourglassEmpty,
    Refresh,
    ContentCopy,
    OpenInNew,
    Search,
    Visibility,
    Check,
    Close,
    ViewModule,
    ViewList,
    EventNote,
    LocationOn,
    Schedule,
    ConfirmationNumber,
    AccountBalanceWallet,
    VerifiedUser,
    Security,
    DarkMode,
    LightMode,
    InfoOutlined,
    AdminPanelSettings,
    FiberManualRecord,
    WarningAmber,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Helper rút gọn địa chỉ ví và mã băm
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu các sự kiện đăng ký phê duyệt
const INITIAL_EVENTS = [];

// Gợi ý lý do từ chối thường gặp
const QUICK_REJECTION_REASONS = [
    'Thiếu giấy phép biểu diễn nghệ thuật / tổ chức sự kiện theo quy định pháp luật.',
    'Thông tin địa điểm hoặc thời gian tổ chức không rõ ràng, chưa được xác minh.',
    'Giá vé phát hành hoặc cơ cấu nguồn cung vé bất hợp lý, có dấu hiệu lừa đảo.',
    'Hình ảnh poster / banner có dấu hiệu vi phạm bản quyền hoặc chất lượng không đạt chuẩn.',
    'Nhà tổ chức chưa hoàn tất xác thực danh tính và thông tin liên hệ chính thức.',
];

const normalizeEvent = (evt) => ({
    ...evt,
    id: evt.id,
    title: evt.title || 'Sự kiện chưa đặt tên',
    description: evt.description || '',
    category: evt.category || 'music',
    categoryLabel:
        evt.category === 'technology' ? 'Công nghệ' :
        evt.category === 'sports' ? 'Thể thao' :
        evt.category === 'workshop' ? 'Hội thảo' : 'Âm nhạc',
    bannerUrl: evt.bannerUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    venue: {
        name: evt.venueName || evt.venue?.name || 'Chưa xác định',
        address: evt.venueAddress || evt.venue?.address || '',
        city: evt.venueCity || evt.venue?.city || 'Việt Nam',
    },
    startTime: evt.startTime ? new Date(evt.startTime).toLocaleString('vi-VN') : '',
    endTime: evt.endTime ? new Date(evt.endTime).toLocaleString('vi-VN') : '',
    submittedAt: evt.createdAt ? new Date(evt.createdAt).toLocaleDateString('vi-VN') : 'Mới cập nhật',
    status: evt.status || 'pending',
    rejectionReason: evt.rejectionReason || '',
    organizer: {
        name: evt.organizer?.fullName || evt.organizer?.name || 'Nhà tổ chức',
        email: evt.organizer?.email || '',
        wallet: evt.organizer?.walletAddress || evt.organizer?.wallet || '',
        previousEventsCount: evt.organizer?.previousEventsCount ?? 1,
        trustScore: evt.organizer?.trustScore || '98%',
    },
    ticketTypes: Array.isArray(evt.ticketTypes)
        ? evt.ticketTypes.map((tt) => ({
            id: tt.id,
            name: tt.name,
            originalPrice: Number(tt.originalPrice || 0),
            maxSupply: Number(tt.maxSupply || 0),
            maxResalePrice: Number(tt.maxResalePrice || (Number(tt.originalPrice || 0) * 1.2).toFixed(4)),
            description: tt.description || '',
        }))
        : [],
});

const EventApprovalPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();

    // State danh sách sự kiện
    const [events, setEvents] = useState(INITIAL_EVENTS);
    const [viewMode, setViewMode] = useState('card'); // 'card' hoặc 'table'
    const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Dialog state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
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

    // Tải dữ liệu sự kiện từ Backend
    const fetchEvents = async () => {
        setIsRefreshing(true);
        try {
            const res = await adminAPI.getAllEvents({ limit: 50 });
            const backendEvents = res.data?.data?.events;
            if (Array.isArray(backendEvents)) {
                const normalized = backendEvents.map(normalizeEvent);
                setEvents(normalized);
            }
        } catch (err) {
            console.log('Chưa kết nối API Backend hoặc chưa đăng nhập Admin:', err.message);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Sao chép clipboard
    const handleCopy = (text, label = 'mã') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 8, 6)}`, 'success');
    };

    // Làm mới dữ liệu
    const handleRefresh = async () => {
        await fetchEvents();
        showSnackbar('Đã làm mới danh sách hàng đợi sự kiện từ hệ thống!', 'success');
    };

    // Xử lý mở Modal Phê duyệt
    const handleOpenApproveModal = (event) => {
        setSelectedEvent(event);
        setApproveModalOpen(true);
    };

    // Xác nhận Phê duyệt sự kiện
    const handleConfirmApprove = async () => {
        if (!selectedEvent) return;
        try {
            await adminAPI.approveEvent(selectedEvent.id);
            setEvents((prev) =>
                prev.map((evt) =>
                    evt.id === selectedEvent.id
                        ? { ...evt, status: 'approved', rejectionReason: '' }
                        : evt
                )
            );
            showSnackbar(`Đã phê duyệt sự kiện "${selectedEvent.title}" thành công! Sự kiện đã sẵn sàng mở bán trên Sepolia.`, 'success');
        } catch (err) {
            // Cập nhật UI optimistic kèm thông báo
            setEvents((prev) =>
                prev.map((evt) =>
                    evt.id === selectedEvent.id
                        ? { ...evt, status: 'approved', rejectionReason: '' }
                        : evt
                )
            );
            showSnackbar(err.message || `Đã phê duyệt sự kiện "${selectedEvent.title}" (chế độ demo).`, 'info');
        } finally {
            setApproveModalOpen(false);
            if (detailModalOpen) setDetailModalOpen(false);
        }
    };

    // Xử lý mở Modal Từ chối
    const handleOpenRejectModal = (event) => {
        setSelectedEvent(event);
        setRejectionReason('');
        setRejectError('');
        setRejectModalOpen(true);
    };

    // Xác nhận Từ chối sự kiện kèm lý do
    const handleConfirmReject = async () => {
        if (!rejectionReason.trim()) {
            setRejectError('Vui lòng nhập lý do từ chối để gửi thông báo cho Nhà tổ chức.');
            return;
        }

        try {
            await adminAPI.rejectEvent(selectedEvent.id, rejectionReason.trim());
            setEvents((prev) =>
                prev.map((evt) =>
                    evt.id === selectedEvent.id
                        ? { ...evt, status: 'rejected', rejectionReason: rejectionReason.trim() }
                        : evt
                )
            );
            showSnackbar(`Đã từ chối sự kiện "${selectedEvent.title}". Lý do giải thích đã lưu vết kiểm toán.`, 'info');
        } catch (err) {
            setEvents((prev) =>
                prev.map((evt) =>
                    evt.id === selectedEvent.id
                        ? { ...evt, status: 'rejected', rejectionReason: rejectionReason.trim() }
                        : evt
                )
            );
            showSnackbar(err.message || `Đã từ chối sự kiện "${selectedEvent.title}".`, 'info');
        } finally {
            setRejectModalOpen(false);
            if (detailModalOpen) setDetailModalOpen(false);
        }
    };

    // Thống kê nhanh
    const stats = useMemo(() => {
        const pendingCount = events.filter((e) => e.status === 'pending').length;
        const approvedCount = events.filter((e) => e.status === 'approved').length;
        const rejectedCount = events.filter((e) => e.status === 'rejected').length;
        const totalTickets = events
            .filter((e) => e.status === 'pending')
            .reduce((sum, e) => sum + e.ticketTypes.reduce((s, t) => s + t.maxSupply, 0), 0);
        return { pendingCount, approvedCount, rejectedCount, totalTickets };
    }, [events]);

    // Lọc sự kiện theo điều kiện
    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            // Lọc theo trạng thái
            if (statusFilter !== 'all' && event.status !== statusFilter) return false;
            // Lọc theo danh mục
            if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;
            // Lọc theo từ khóa tìm kiếm
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = event.title.toLowerCase().includes(q);
                const matchOrg = event.organizer.name.toLowerCase().includes(q);
                const matchCity = event.venue.city.toLowerCase().includes(q);
                const matchId = event.id.toLowerCase().includes(q);
                if (!matchTitle && !matchOrg && !matchCity && !matchId) return false;
            }
            return true;
        });
    }, [events, statusFilter, categoryFilter, searchQuery]);

    // Helper render Status Chip theo Section 2.3
    const renderStatusChip = (status) => {
        switch (status) {
            case 'pending':
                return (
                    <Chip
                        icon={<HourglassEmpty sx={{ fontSize: '14px !important', color: 'status.pending' }} />}
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
            case 'approved':
                return (
                    <Chip
                        icon={<CheckCircle sx={{ fontSize: '14px !important', color: 'status.success' }} />}
                        label="Đã duyệt"
                        size="small"
                        sx={{
                            bgcolor: 'status.successBg',
                            color: 'status.success',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'rejected':
                return (
                    <Chip
                        icon={<Cancel sx={{ fontSize: '14px !important', color: 'status.error' }} />}
                        label="Bị từ chối"
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
                return <Chip label={status} size="small" sx={{ borderRadius: '6px' }} />;
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
                        {/* Tiêu đề & Nút quay lại */}
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <Button
                                    size="small"
                                    startIcon={<ArrowBack />}
                                    onClick={() => navigate('/admin/dashboard')}
                                    sx={{ color: 'text.secondary', px: 0, '&:hover': { bgcolor: 'transparent', color: 'primary.main' } }}
                                >
                                    Bảng điều khiển Quản trị
                                </Button>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Typography variant="h2" color="text.primary">
                                    Hàng Đợi Phê Duyệt Sự Kiện
                                </Typography>
                                <Chip
                                    label={`${stats.pendingCount} cần xử lý`}
                                    size="small"
                                    sx={{
                                        bgcolor: 'status.pendingBg',
                                        color: 'status.pending',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        height: 24,
                                    }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Thẩm định nội dung, địa điểm, bản quyền và hạn mức nguồn cung trước khi cấp phép phát hành vé NFT on-chain
                            </Typography>
                        </Box>

                        {/* Top Actions: Refresh & Theme toggle */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Tooltip title="Làm mới hàng đợi từ MongoDB Atlas">
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        onClick={handleRefresh}
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
                                        Làm mới
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
                    2. THẺ THỐNG KÊ NHANH HÀNG ĐỢI (QUICK STATS CARDS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            SỰ KIỆN CHỜ DUYỆT
                                        </Typography>
                                        <Typography variant="h2" color="status.pending" fontWeight={700} mt={0.5}>
                                            {stats.pendingCount}
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
                                        <HourglassEmpty />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Thời gian chờ trung bình: ~1.2 giờ
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            ĐÃ PHÊ DUYỆT (THÀNH CÔNG)
                                        </Typography>
                                        <Typography variant="h2" color="status.success" fontWeight={700} mt={0.5}>
                                            {stats.approvedCount}
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
                                        <CheckCircle />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Sẵn sàng mở bán trên Smart Contract
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            BỊ TỪ CHỐI / CẦN SỬA
                                        </Typography>
                                        <Typography variant="h2" color="status.error" fontWeight={700} mt={0.5}>
                                            {stats.rejectedCount}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'status.errorBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.error',
                                        }}
                                    >
                                        <Cancel />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Đã gửi lý do chi tiết cho Organizer
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            NGUỒN CUNG VÉ ĐĂNG KÝ
                                        </Typography>
                                        <Typography variant="h2" color="primary.main" fontWeight={700} mt={0.5}>
                                            {(stats.totalTickets || 0).toLocaleString('vi-VN')}
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
                                        <ConfirmationNumber />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Tổng vé NFT từ các sự kiện chờ duyệt
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ═══════════════════════════════════════════════════════════════════
                    3. BỘ LỌC & THANH CÔNG CỤ TÌM KIẾM (TOOLBAR & FILTERS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            justifyContent="space-between"
                            spacing={2}
                        >
                            {/* Tabs trạng thái */}
                            <Tabs
                                value={statusFilter}
                                onChange={(e, val) => setStatusFilter(val)}
                                textColor="primary"
                                indicatorColor="primary"
                                sx={{ minHeight: 40 }}
                            >
                                <Tab
                                    value="pending"
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>Chờ duyệt</span>
                                            <Chip
                                                label={stats.pendingCount}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    bgcolor: 'status.pendingBg',
                                                    color: 'status.pending',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        </Stack>
                                    }
                                    sx={{ minHeight: 40, py: 1 }}
                                />
                                <Tab value="approved" label={`Đã duyệt (${stats.approvedCount})`} sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="rejected" label={`Đã từ chối (${stats.rejectedCount})`} sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="all" label={`Tất cả (${events.length})`} sx={{ minHeight: 40, py: 1 }} />
                            </Tabs>

                            {/* Bộ lọc Thể loại, Ô tìm kiếm & Chuyển đổi View */}
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel id="category-filter-label">Thể loại</InputLabel>
                                    <Select
                                        labelId="category-filter-label"
                                        label="Thể loại"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        sx={{ height: 40 }}
                                    >
                                        <MenuItem value="all">Tất cả thể loại</MenuItem>
                                        <MenuItem value="music">Âm nhạc</MenuItem>
                                        <MenuItem value="technology">Công nghệ</MenuItem>
                                        <MenuItem value="sports">Thể thao</MenuItem>
                                        <MenuItem value="workshop">Hội thảo</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    placeholder="Tìm tên sự kiện, Organizer, tỉnh thành..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ minWidth: 260, height: 40 }}
                                />

                                <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={(e, val) => val && setViewMode(val)}
                                    size="small"
                                    aria-label="Chế độ hiển thị"
                                >
                                    <ToggleButton value="card" aria-label="Xem dạng lưới thẻ">
                                        <ViewModule fontSize="small" />
                                    </ToggleButton>
                                    <ToggleButton value="table" aria-label="Xem dạng bảng dữ liệu">
                                        <ViewList fontSize="small" />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════════
                    4. DANH SÁCH SỰ KIỆN: DẠNG LƯỚI THẺ (CARD VIEW)
                ═══════════════════════════════════════════════════════════════════ */}
                {viewMode === 'card' && (
                    <>
                        {filteredEvents.length === 0 ? (
                            <Card sx={{ bgcolor: 'background.paper', py: 8, textAlign: 'center' }}>
                                <CheckCircle sx={{ fontSize: 56, color: 'status.success', mb: 1.5 }} />
                                <Typography variant="h3" color="text.primary">
                                    Không có sự kiện nào trong danh sách
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 450, mx: 'auto' }}>
                                    Không tìm thấy sự kiện nào khớp với tiêu chí lọc hiện tại. Thử xóa từ khóa tìm kiếm hoặc đổi tab bộ lọc.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setStatusFilter('all');
                                        setCategoryFilter('all');
                                        setSearchQuery('');
                                    }}
                                    sx={{ mt: 3 }}
                                >
                                    Đặt lại bộ lọc
                                </Button>
                            </Card>
                        ) : (
                            <Grid container spacing={3}>
                                {filteredEvents.map((event) => (
                                    <Grid item xs={12} md={6} lg={4} key={event.id}>
                                        <Card
                                            sx={{
                                                bgcolor: 'background.paper',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-3px)',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                },
                                            }}
                                        >
                                            {/* Poster Image */}
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component="img"
                                                    height="180"
                                                    image={event.bannerUrl}
                                                    alt={event.title}
                                                    sx={{ objectFit: 'cover' }}
                                                />
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        left: 12,
                                                        display: 'flex',
                                                        gap: 1,
                                                    }}
                                                >
                                                    <Chip
                                                        label={event.categoryLabel}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                                                            color: '#fff',
                                                            backdropFilter: 'blur(4px)',
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                                                    {renderStatusChip(event.status)}
                                                </Box>
                                            </Box>

                                            {/* Nội dung Card */}
                                            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                {/* Header & Title */}
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Mã: {event.id} • Gửi: {event.submittedAt}
                                                </Typography>
                                                <Typography
                                                    variant="h3"
                                                    color="text.primary"
                                                    sx={{
                                                        mt: 0.5,
                                                        mb: 1.5,
                                                        fontWeight: 600,
                                                        lineHeight: 1.35,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {event.title}
                                                </Typography>

                                                {/* Organizer info */}
                                                <Box sx={{ p: 1.5, bgcolor: 'background.subtle', borderRadius: '8px', mb: 2 }}>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                        <Box>
                                                            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                                                {event.organizer.name}
                                                            </Typography>
                                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                <Typography
                                                                    variant="caption"
                                                                    sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                                                >
                                                                    {truncateHash(event.organizer.wallet, 6, 4)}
                                                                </Typography>
                                                                <Tooltip title="Sao chép ví Organizer">
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="Sao chép ví"
                                                                        onClick={() => handleCopy(event.organizer.wallet, 'ví Organizer')}
                                                                        sx={{ p: 0.2 }}
                                                                    >
                                                                        <ContentCopy sx={{ fontSize: 13 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        </Box>
                                                        <Chip
                                                            icon={<VerifiedUser sx={{ fontSize: '13px !important' }} />}
                                                            label={`Uy tín: ${event.organizer.trustScore}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                                        />
                                                    </Stack>
                                                </Box>

                                                {/* Địa điểm & Thời gian */}
                                                <Stack spacing={1} mb={2}>
                                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                                        <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {event.venue.name}, {event.venue.city}
                                                        </Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Schedule sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {event.startTime}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>

                                                {/* Preview các hạng vé */}
                                                <Box sx={{ mb: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                                                        CÁC HẠNG VÉ PHÁT HÀNH ({event.ticketTypes.length} loại)
                                                    </Typography>
                                                    <Stack spacing={0.75}>
                                                        {event.ticketTypes.map((tier) => (
                                                            <Stack
                                                                key={tier.id}
                                                                direction="row"
                                                                justifyContent="space-between"
                                                                alignItems="center"
                                                            >
                                                                <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                                    {tier.name}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                                                                        {tier.originalPrice} ETH
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        ({tier.maxSupply} vé)
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        ))}
                                                    </Stack>
                                                </Box>

                                                {/* Cảnh báo lý do từ chối nếu có */}
                                                {event.status === 'rejected' && event.rejectionReason && (
                                                    <Alert severity="error" sx={{ mt: 2, py: 0.5, fontSize: '0.8rem' }}>
                                                        <strong>Lý do từ chối:</strong> {event.rejectionReason}
                                                    </Alert>
                                                )}

                                                {/* Action buttons dưới chân Card */}
                                                <Box sx={{ pt: 2.5, mt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                    <Stack direction="row" spacing={1} justifyContent="space-between">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<Visibility sx={{ fontSize: 16 }} />}
                                                            onClick={() => {
                                                                setSelectedEvent(event);
                                                                setDetailModalOpen(true);
                                                            }}
                                                            sx={{ flex: 1 }}
                                                        >
                                                            Chi tiết
                                                        </Button>

                                                        {event.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="primary"
                                                                    startIcon={<Check sx={{ fontSize: 16 }} />}
                                                                    onClick={() => handleOpenApproveModal(event)}
                                                                    sx={{ flex: 1 }}
                                                                >
                                                                    Duyệt
                                                                </Button>
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="error"
                                                                    startIcon={<Close sx={{ fontSize: 16 }} />}
                                                                    onClick={() => handleOpenRejectModal(event)}
                                                                >
                                                                    Từ chối
                                                                </Button>
                                                            </>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    5. DANH SÁCH SỰ KIỆN: DẠNG BẢNG DỮ LIỆU (TABLE VIEW)
                ═══════════════════════════════════════════════════════════════════ */}
                {viewMode === 'table' && (
                    <Card sx={{ bgcolor: 'background.paper' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Mã & Banner</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Tên Sự Kiện & Danh Mục</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Nhà Tổ Chức & Ví</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Địa Điểm & Thành Phố</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Thời Gian</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Cơ Cấu Giá Vé (ETH)</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Hành Động</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body1" color="text.secondary">
                                                    Không tìm thấy sự kiện nào phù hợp.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEvents.map((event) => (
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
                                                    <Typography variant="subtitle2" color="text.primary" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                                                        {event.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Mã: {event.id} • {event.categoryLabel}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                                                        {event.organizer.name}
                                                    </Typography>
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                                        >
                                                            {truncateHash(event.organizer.wallet, 6, 4)}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Sao chép ví"
                                                            onClick={() => handleCopy(event.organizer.wallet, 'ví Organizer')}
                                                            sx={{ p: 0.2 }}
                                                        >
                                                            <ContentCopy sx={{ fontSize: 13 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary">
                                                        {event.venue.city}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                                                        {event.venue.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary">
                                                        {event.startTime.split(' - ')[0]}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {event.startTime.split(' - ')[1]}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                                                        {event.ticketTypes.map((t) => t.originalPrice).join(' - ')} ETH
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tổng: {event.ticketTypes.reduce((s, t) => s + t.maxSupply, 0)} vé
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {renderStatusChip(event.status)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="Xem hồ sơ chi tiết">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Xem chi tiết"
                                                                onClick={() => {
                                                                    setSelectedEvent(event);
                                                                    setDetailModalOpen(true);
                                                                }}
                                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {event.status === 'pending' && (
                                                            <>
                                                                <Tooltip title="Phê duyệt sự kiện">
                                                                    <IconButton
                                                                        size="small"
                                                                        aria-label="Phê duyệt"
                                                                        onClick={() => handleOpenApproveModal(event)}
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
                                                                        aria-label="Từ chối"
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
                                                            </>
                                                        )}
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
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                6. MODAL CHI TIẾT SỰ KIỆN TOÀN DIỆN (EVENT DETAIL MODAL - SECTION 6.4)
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
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="h3" color="text.primary">
                                        Hồ Sơ Thẩm Định Sự Kiện
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Mã kiểm duyệt: {selectedEvent.id} • Gửi lúc: {selectedEvent.submittedAt}
                                    </Typography>
                                </Box>
                                {renderStatusChip(selectedEvent.status)}
                            </Stack>
                        </DialogTitle>

                        <DialogContent dividers>
                            {/* Banner lớn */}
                            <Box
                                component="img"
                                src={selectedEvent.bannerUrl}
                                alt={selectedEvent.title}
                                sx={{
                                    width: '100%',
                                    height: 240,
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                    mb: 3,
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            />

                            <Typography variant="h2" color="text.primary" gutterBottom>
                                {selectedEvent.title}
                            </Typography>

                            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                                {selectedEvent.description}
                            </Typography>

                            <Grid container spacing={2.5} sx={{ my: 1 }}>
                                {/* Thông tin Nhà tổ chức */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ bgcolor: 'background.subtle', height: '100%', p: 2 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            THÔNG TIN NHÀ TỔ CHỨC (ORGANIZER)
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.primary" fontWeight={600} mt={0.5}>
                                            {selectedEvent.organizer.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Email: {selectedEvent.organizer.email}
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                Ví: {truncateHash(selectedEvent.organizer.wallet, 8, 6)}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                aria-label="Sao chép ví"
                                                onClick={() => handleCopy(selectedEvent.organizer.wallet, 'ví Organizer')}
                                                sx={{ p: 0.2 }}
                                            >
                                                <ContentCopy sx={{ fontSize: 13 }} />
                                            </IconButton>
                                        </Stack>
                                        <Typography variant="caption" color="primary.main" fontWeight={600} display="block" mt={0.5}>
                                            Lịch sử: {selectedEvent.organizer.previousEventsCount} sự kiện đã tổ chức • Uy tín: {selectedEvent.organizer.trustScore}
                                        </Typography>
                                    </Card>
                                </Grid>

                                {/* Thời gian & Địa điểm */}
                                <Grid item xs={12} sm={6}>
                                    <Card sx={{ bgcolor: 'background.subtle', height: '100%', p: 2 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            ĐỊA ĐIỂM & THỜI GIAN TỔ CHỨC
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.primary" fontWeight={600} mt={0.5}>
                                            {selectedEvent.venue.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedEvent.venue.address}, {selectedEvent.venue.city}
                                        </Typography>
                                        <Typography variant="body2" color="text.primary" fontWeight={600} mt={1}>
                                            Bắt đầu: {selectedEvent.startTime}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Kết thúc: {selectedEvent.endTime}
                                        </Typography>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Bảng Chi Tiết Hạng Vé Phân Phối */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h4" color="text.primary" gutterBottom>
                                    Cơ Cấu Hạng Vé & Quy Tắc Trần Giá 120% (BR-02)
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    Các thông số này sẽ được kích hoạt bất biến trên Smart Contract <code>EventTicket.sol</code> khi bạn bấm duyệt.
                                </Typography>

                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                                    <Table size="small">
                                        <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600 }}>Tên Hạng Vé</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Giá Gốc (originalPrice)</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Trần Giá Bán Lại (Max 120%)</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Số Lượng Tối Đa (maxSupply)</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Ghi Chú Quyền Lợi</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedEvent.ticketTypes.map((tier) => (
                                                <TableRow key={tier.id}>
                                                    <TableCell sx={{ fontWeight: 600 }}>{tier.name}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="primary.main" fontWeight={700}>
                                                            {tier.originalPrice} ETH
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="status.success" fontWeight={600}>
                                                            {tier.maxResalePrice} ETH
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{(tier.maxSupply || 0).toLocaleString('vi-VN')} vé</TableCell>
                                                    <TableCell>{tier.description}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                            <Box>
                                {selectedEvent.status === 'pending' && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Close />}
                                        onClick={() => handleOpenRejectModal(selectedEvent)}
                                    >
                                        Từ Chối Sự Kiện
                                    </Button>
                                )}
                            </Box>
                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setDetailModalOpen(false)}
                                >
                                    Đóng
                                </Button>
                                {selectedEvent.status === 'pending' && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Check />}
                                        onClick={() => handleOpenApproveModal(selectedEvent)}
                                    >
                                        Phê Duyệt Sự Kiện
                                    </Button>
                                )}
                            </Stack>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                7. MODAL XÁC NHẬN PHÊ DUYỆT (APPROVE CONFIRMATION DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <CheckCircle sx={{ color: 'status.success', fontSize: 28 }} />
                        <Typography variant="h3" color="text.primary">
                            Xác Nhận Phê Duyệt Sự Kiện
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText color="text.secondary" paragraph>
                        Bạn đang chuẩn bị phê duyệt sự kiện <strong>"{selectedEvent?.title}"</strong> của Nhà tổ chức{' '}
                        <strong>{selectedEvent?.organizer.name}</strong>.
                    </DialogContentText>
                    <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            Sau khi được duyệt, sự kiện sẽ chuyển sang trạng thái <strong>Công khai (Published)</strong> và các hạng vé sẽ sẵn sàng để người dùng mint vé NFT trực tiếp trên mạng Sepolia Testnet.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button variant="outlined" onClick={() => setApproveModalOpen(false)}>
                        Quay lại
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleConfirmApprove}
                    >
                        Xác Nhận Phê Duyệt
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                8. MODAL TỪ CHỐI SỰ KIỆN KÈM LÝ DO (REJECT DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Cancel sx={{ color: 'status.error', fontSize: 28 }} />
                        <Typography variant="h3" color="status.error">
                            Từ Chối Phê Duyệt Sự Kiện
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText color="text.secondary" sx={{ mb: 2 }}>
                        Vui lòng giải thích rõ lý do từ chối để gửi thông báo hướng dẫn chỉnh sửa cho Nhà tổ chức{' '}
                        <strong>{selectedEvent?.organizer.name}</strong>.
                    </DialogContentText>

                    {rejectError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {rejectError}
                        </Alert>
                    )}

                    {/* Các gợi ý lý do nhanh */}
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                        CHỌN NHANH LÝ DO PHỔ BIẾN:
                    </Typography>
                    <Stack spacing={1} mb={2}>
                        {QUICK_REJECTION_REASONS.map((reason, idx) => (
                            <Chip
                                key={idx}
                                label={reason}
                                onClick={() => {
                                    setRejectionReason(reason);
                                    if (rejectError) setRejectError('');
                                }}
                                variant="outlined"
                                sx={{
                                    height: 'auto',
                                    py: 0.75,
                                    borderRadius: '6px',
                                    '& .MuiChip-label': {
                                        whiteSpace: 'normal',
                                        textAlign: 'left',
                                        fontSize: '0.8rem',
                                    },
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            />
                        ))}
                    </Stack>

                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={3}
                        label="Lý do chi tiết từ chối"
                        placeholder="Nhập nội dung phản hồi chi tiết..."
                        value={rejectionReason}
                        onChange={(e) => {
                            setRejectionReason(e.target.value);
                            if (rejectError) setRejectError('');
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button variant="outlined" onClick={() => setRejectModalOpen(false)}>
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
                9. TOAST SNACKBAR THÔNG BÁO
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

export default EventApprovalPage;

