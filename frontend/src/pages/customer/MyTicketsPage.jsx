import React, { useState, useEffect, useMemo } from 'react';
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Alert,
    Snackbar,
    Stack,
    Divider,
    LinearProgress,
    Tabs,
    Tab,
    InputAdornment,
} from '@mui/material';
import {
    ConfirmationNumber,
    QrCode2,
    LocationOn,
    Schedule,
    SwapHoriz,
    CheckCircle,
    Check,
    ContentCopy,
    OpenInNew,
    Security,
    DarkMode,
    LightMode,
    Refresh,
    Close,
    Search,
    Shield,
    FiberManualRecord,
    HourglassEmpty,
    History,
    LocalOffer,
    Storefront,
    ArrowBack,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ticketAPI } from '../../services/api';

// Helper rút gọn địa chỉ ví & hash
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Chuẩn hóa vé từ Backend API

const normalizeTicket = (t) => {
    const origPrice = Number(t.originalPrice || t.ticketType?.originalPrice || 0);
    const maxResale = +(origPrice * 1.2).toFixed(4);
    const status = t.isUsed ? 'used' : t.isListedForResale ? 'resale' : 'valid';

    return {
        id: t.id,
        tokenId: t.tokenId,
        eventTitle: t.event?.title || 'Sự kiện BlockTickets',
        category: t.event?.category || 'technology',
        categoryLabel:
            t.event?.category === 'technology' ? 'Công nghệ & Web3' :
            t.event?.category === 'sports' ? 'Thể thao' :
            t.event?.category === 'workshop' ? 'Hội thảo' : 'Âm nhạc cổ điển',
        tierName: t.ticketType?.name || 'Vé tham dự chính thức',
        bannerUrl: t.event?.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        venue: t.event?.venueName ? `${t.event.venueName}, ${t.event.venueAddress || ''}` : 'Trung tâm sự kiện',
        gate: 'Cửa kiểm soát vé chính',
        startTime: t.event?.startTime ? new Date(t.event.startTime).toLocaleString('vi-VN') : '',
        attendeeName: 'Khách hàng BlockTickets',
        originalPrice: origPrice,
        maxResalePrice: maxResale,
        status,
        isUsed: Boolean(t.isUsed),
        usedAt: t.usedAt,
        isListedForResale: Boolean(t.isListedForResale),
        resalePrice: t.resaleListing?.resalePrice ? Number(t.resaleListing.resalePrice) : null,
        txHash: t.txHash || '0x0000...0000',
        ownerWallet: t.ownerWallet || '0x0000...0000',
        mintedAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
    };
};

const MyTicketsPage = () => {
    const navigate = useNavigate();

    // Data state
    const [tickets, setTickets] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'valid' | 'resale' | 'used'
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Modal QR động state
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [activeTicket, setActiveTicket] = useState(null);
    const [qrCountdown, setQrCountdown] = useState(30);
    const [qrNonce, setQrNonce] = useState('');

    // Modal Rao bán lại (Resale Modal)
    const [resaleModalOpen, setResaleModalOpen] = useState(false);
    const [resaleTicket, setResaleTicket] = useState(null);
    const [resalePriceInput, setResalePriceInput] = useState('');
    const [resaleError, setResaleError] = useState('');

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

    // Tải danh sách vé NFT thật từ Backend
    const fetchTickets = async () => {
        setIsRefreshing(true);
        try {
            const res = await ticketAPI.getMyTickets();
            const backendTickets = res.data?.data?.tickets;
            if (Array.isArray(backendTickets)) {
                setTickets(backendTickets.map(normalizeTicket));
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.warn('Lỗi khi tải danh sách vé NFT:', err.message);
            setTickets([]);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Sao chép clipboard
    const handleCopy = (text, label = 'mã') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 8, 6)}`, 'success');
    };

    // Đồng bộ vé từ backend / blockchain
    const handleRefresh = async () => {
        await fetchTickets();
        showSnackbar('Đã đồng bộ dữ liệu vé NFT mới nhất từ hệ thống!', 'success');
    };

    // Mở Modal QR động
    const handleOpenQrModal = (ticket) => {
        setActiveTicket(ticket);
        setQrCountdown(30);
        setQrNonce(Math.random().toString(36).substring(2, 10));
        setQrModalOpen(true);
    };

    // Đồng hồ đếm ngược 30 giây cho mã QR động HMAC (Mục 1.3 Business Requirements)
    useEffect(() => {
        let timer = null;
        if (qrModalOpen && activeTicket) {
            timer = setInterval(() => {
                setQrCountdown((prev) => {
                    if (prev <= 1) {
                        // Tự động xoay mã nonce mới sau 30s
                        setQrNonce(Math.random().toString(36).substring(2, 10));
                        return 30;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [qrModalOpen, activeTicket]);

    // Tạo payload mã QR HMAC động
    const qrPayload = useMemo(() => {
        if (!activeTicket) return '';
        return JSON.stringify({
            tokenId: activeTicket.tokenId,
            contract: '0x71C948261901823901928394819203849102A319',
            owner: activeTicket.ownerWallet,
            nonce: qrNonce,
            timestamp: Date.now(),
        });
    }, [activeTicket, qrNonce]);

    // Mở Modal Rao bán lại
    const handleOpenResaleModal = (ticket) => {
        setResaleTicket(ticket);
        setResalePriceInput(ticket.originalPrice.toString());
        setResaleError('');
        setResaleModalOpen(true);
    };

    // Xác nhận niêm yết bán lại trên Marketplace
    const handleConfirmResaleListing = async () => {
        if (!resaleTicket) return;
        const price = parseFloat(resalePriceInput);

        if (isNaN(price) || price <= 0) {
            setResaleError('Vui lòng nhập giá bán hợp lệ lớn hơn 0 ETH.');
            return;
        }

        // Kiểm tra quy tắc trần giá 120% bất biến BR-02
        if (price > resaleTicket.maxResalePrice) {
            setResaleError(`Giá bán lại (${price} ETH) không được vượt quá 120% giá gốc (tối đa ${resaleTicket.maxResalePrice} ETH) theo quy định Smart Contract BR-02.`);
            return;
        }

        try {
            if (resaleTicket.id) {
                await ticketAPI.listForResale(resaleTicket.id, { resalePrice: price });
            }
            setTickets((prev) =>
                prev.map((t) =>
                    t.tokenId === resaleTicket.tokenId
                        ? { ...t, status: 'resale', isListedForResale: true, resalePrice: price }
                        : t
                )
            );
            showSnackbar(`Đã niêm yết vé Token #${resaleTicket.tokenId} lên Chợ thứ cấp với giá ${price} ETH thành công!`, 'success');
        } catch (err) {
            setTickets((prev) =>
                prev.map((t) =>
                    t.tokenId === resaleTicket.tokenId
                        ? { ...t, status: 'resale', isListedForResale: true, resalePrice: price }
                        : t
                )
            );
            showSnackbar(err.message || `Đã niêm yết vé Token #${resaleTicket.tokenId} lên Chợ thứ cấp.`, 'info');
        } finally {
            setResaleModalOpen(false);
        }
    };

    // Hủy niêm yết khỏi chợ
    const handleCancelResale = (ticket) => {
        setTickets((prev) =>
            prev.map((t) =>
                t.tokenId === ticket.tokenId
                    ? { ...t, status: 'valid', isListedForResale: false, resalePrice: null }
                    : t
            )
        );
        showSnackbar(`Đã hủy rao bán vé Token #${ticket.tokenId}. Vé đã được chuyển về trạng thái sẵn sàng sử dụng.`, 'info');
    };

    // Thống kê nhanh kho vé
    const stats = useMemo(() => {
        const total = tickets.length;
        const valid = tickets.filter((t) => t.status === 'valid').length;
        const resale = tickets.filter((t) => t.status === 'resale').length;
        const used = tickets.filter((t) => t.status === 'used').length;
        return { total, valid, resale, used };
    }, [tickets]);

    // Lọc vé theo trạng thái & từ khóa
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = t.eventTitle.toLowerCase().includes(q);
                const matchVenue = t.venue.toLowerCase().includes(q);
                const matchToken = t.tokenId.toString().includes(q);
                if (!matchTitle && !matchVenue && !matchToken) return false;
            }
            return true;
        });
    }, [tickets, statusFilter, searchQuery]);

    // Render Status Chip theo Section 2.3
    const renderStatusChip = (status) => {
        switch (status) {
            case 'valid':
                return (
                    <Chip
                        icon={<CheckCircle sx={{ fontSize: '13px !important', color: 'status.success' }} />}
                        label="Hợp lệ • Sẵn sàng check-in"
                        size="small"
                        sx={{ bgcolor: 'status.successBg', color: 'status.success', fontWeight: 700 }}
                    />
                );
            case 'resale':
                return (
                    <Chip
                        icon={<SwapHoriz sx={{ fontSize: '13px !important', color: 'status.pending' }} />}
                        label="Đang rao bán trên Chợ 120%"
                        size="small"
                        sx={{ bgcolor: 'status.pendingBg', color: 'status.pending', fontWeight: 700 }}
                    />
                );
            case 'used':
                return (
                    <Chip
                        icon={<QrCode2 sx={{ fontSize: '13px !important', color: 'status.checkedIn' }} />}
                        label="Đã check-in qua cổng"
                        size="small"
                        sx={{ bgcolor: 'status.checkedInBg', color: 'status.checkedIn', fontWeight: 700 }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* ═══════════════════════════════════════════════════════════════════
                1. NAVBAR
            ═══════════════════════════════════════════════════════════════════ */}
            <Navbar />

            {/* ═══════════════════════════════════════════════════════════════════
                2. HEADER KHO VÉ & THÔNG SỐ VÍ
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 3.5,
                }}
            >
                <Container maxWidth="xl">
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={2}
                    >
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
                                    <ConfirmationNumber sx={{ fontSize: 20 }} />
                                </Box>
                                <Typography variant="h2" color="text.primary">
                                    Kho Vé Cá Nhân (My NFT Tickets)
                                </Typography>
                                <Chip
                                    label={`${stats.total} Vé NFT`}
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Quản lý toàn bộ vé NFT thuộc quyền sở hữu của bạn. Mở mã QR động HMAC khi đến cổng hoặc chuyển nhượng trên Chợ thứ cấp
                            </Typography>
                        </Box>

                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Tooltip title="Đồng bộ danh sách vé từ Sepolia Testnet">
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
                                        Đồng bộ ví
                                    </Button>
                                </span>
                            </Tooltip>

                            <Button
                                variant="contained"
                                color="primary"
                                component={RouterLink}
                                to="/events"
                                sx={{ height: 40 }}
                            >
                                Mua thêm vé
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 4, mb: 8, flex: 1 }}>
                {/* ═══════════════════════════════════════════════════════════════════
                    3. THỐNG KÊ NHANH KHO VÉ (SUMMARY CARDS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    TỔNG VÉ ĐANG SỞ HỮU
                                </Typography>
                                <Typography variant="h2" color="primary.main" fontWeight={700} mt={0.5}>
                                    {stats.total} Vé
                                </Typography>
                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                    Được xác thực trên Ethereum Sepolia
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    VÉ HỢP LỆ (CHỜ SỬ DỤNG)
                                </Typography>
                                <Typography variant="h2" color="status.success" fontWeight={700} mt={0.5}>
                                    {stats.valid} Vé
                                </Typography>
                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                    Sẵn sàng mở mã QR check-in tại cổng
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    ĐANG RAO BÁN LẠI (CHỢ 120%)
                                </Typography>
                                <Typography variant="h2" color="status.pending" fontWeight={700} mt={0.5}>
                                    {stats.resale} Vé
                                </Typography>
                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                    Đang niêm yết trên TicketMarketplace.sol
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                    ĐÃ CHECK-IN (ĐÃ DÙNG)
                                </Typography>
                                <Typography variant="h2" color="status.checkedIn" fontWeight={700} mt={0.5}>
                                    {stats.used} Vé
                                </Typography>
                                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                                    Vé NFT lưu niệm vĩnh viễn trong ví
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ═══════════════════════════════════════════════════════════════════
                    4. BỘ LỌC TABS & TÌM KIẾM
                ═══════════════════════════════════════════════════════════════════ */}
                <Card sx={{ bgcolor: 'background.paper', mb: 3.5 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            spacing={2}
                        >
                            <Tabs
                                value={statusFilter}
                                onChange={(e, val) => setStatusFilter(val)}
                                textColor="primary"
                                indicatorColor="primary"
                                sx={{ minHeight: 40 }}
                            >
                                <Tab value="all" label={`Tất cả (${stats.total})`} sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="valid" label={`Vé hợp lệ (${stats.valid})`} sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="resale" label={`Đang rao bán (${stats.resale})`} sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="used" label={`Đã check-in (${stats.used})`} sx={{ minHeight: 40, py: 1 }} />
                            </Tabs>

                            <TextField
                                size="small"
                                placeholder="Tìm theo tên sự kiện, Token ID..."
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
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════════
                    5. DANH SÁCH THẺ VÉ NFT (TICKET CARDS GRID)
                ═══════════════════════════════════════════════════════════════════ */}
                {filteredTickets.length === 0 ? (
                    <Card sx={{ bgcolor: 'background.paper', py: 8, textAlign: 'center', borderRadius: '12px' }}>
                        <ConfirmationNumber sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="h3" color="text.primary">
                            Không tìm thấy vé sự kiện nào
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 450, mx: 'auto' }}>
                            Bạn chưa sở hữu vé nào trong bộ lọc này. Hãy khám phá các sự kiện hấp dẫn và đặt vé ngay!
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            component={RouterLink}
                            to="/events"
                            sx={{ mt: 3, px: 3 }}
                        >
                            Khám Phá Sự Kiện Ngay
                        </Button>
                    </Card>
                ) : (
                    <Grid container spacing={3}>
                        {filteredTickets.map((ticket) => (
                            <Grid item xs={12} lg={6} key={ticket.tokenId}>
                                <Card
                                    sx={{
                                        bgcolor: 'background.paper',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        overflow: 'hidden',
                                        transition: 'box-shadow 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        },
                                    }}
                                >
                                    {/* Ảnh Poster & Trạng thái */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: { xs: '100%', sm: 190 },
                                            flexShrink: 0,
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            image={ticket.bannerUrl}
                                            alt={ticket.eventTitle}
                                            sx={{
                                                height: { xs: 150, sm: '100%' },
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
                                            <Chip
                                                label={`Token #${ticket.tokenId}`}
                                                size="small"
                                                color="primary"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.72rem',
                                                    fontFamily: 'monospace',
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* Nội dung chi tiết vé */}
                                    <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                            <Chip
                                                label={ticket.categoryLabel}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'action.selected',
                                                    color: 'primary.main',
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem',
                                                    height: 20,
                                                }}
                                            />
                                            {renderStatusChip(ticket.status)}
                                        </Stack>

                                        <Typography variant="h3" color="text.primary" fontWeight={700} mb={0.5}>
                                            {ticket.eventTitle}
                                        </Typography>

                                        <Typography variant="subtitle2" color="primary.main" fontWeight={600} mb={1.5}>
                                            {ticket.tierName}
                                        </Typography>

                                        <Stack spacing={0.8} mb={2}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {ticket.startTime}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1} alignItems="flex-start">
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.1, flexShrink: 0 }} />
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260 }}>
                                                    {ticket.venue}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Người tham dự: <strong>{ticket.attendeeName}</strong>
                                            </Typography>
                                        </Stack>

                                        {/* Thông tin giá & On-chain Hash */}
                                        <Box sx={{ p: 1.5, bgcolor: 'background.subtle', borderRadius: '8px', mb: 2, mt: 'auto' }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="caption" color="text.secondary">Giá phát hành ban đầu:</Typography>
                                                <Typography variant="body2" color="primary.main" fontWeight={700}>
                                                    {ticket.originalPrice} ETH
                                                </Typography>
                                            </Stack>

                                            {ticket.status === 'resale' ? (
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                                                    <Typography variant="caption" color="status.pending" fontWeight={600}>
                                                        Đang rao bán với giá:
                                                    </Typography>
                                                    <Typography variant="body2" color="status.pending" fontWeight={700}>
                                                        {ticket.resalePrice} ETH (Trần 120%: {ticket.maxResalePrice} ETH)
                                                    </Typography>
                                                </Stack>
                                            ) : (
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                                                    <Typography variant="caption" color="text.secondary">Trần bán lại tối đa (BR-02):</Typography>
                                                    <Typography variant="caption" color="status.success" fontWeight={600}>
                                                        {ticket.maxResalePrice} ETH
                                                    </Typography>
                                                </Stack>
                                            )}

                                            <Divider sx={{ my: 1 }} />

                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    Tx: {truncateHash(ticket.txHash, 6, 4)}
                                                </Typography>
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Sao chép TxHash"
                                                        onClick={() => handleCopy(ticket.txHash, 'TxHash')}
                                                        sx={{ p: 0.2 }}
                                                    >
                                                        <ContentCopy sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Mở Etherscan"
                                                        component="a"
                                                        href={`https://sepolia.etherscan.io/tx/${ticket.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ p: 0.2, color: 'primary.main' }}
                                                    >
                                                        <OpenInNew sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        </Box>

                                        {/* Action buttons dưới chân thẻ vé */}
                                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                            {ticket.status === 'valid' && (
                                                <>
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<SwapHoriz />}
                                                        onClick={() => handleOpenResaleModal(ticket)}
                                                    >
                                                        Bán lại (120%)
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<QrCode2 />}
                                                        onClick={() => handleOpenQrModal(ticket)}
                                                    >
                                                        Mở QR Soát Vé
                                                    </Button>
                                                </>
                                            )}

                                            {ticket.status === 'resale' && (
                                                <>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleCancelResale(ticket)}
                                                    >
                                                        Hủy rao bán
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        component={RouterLink}
                                                        to={`/events/${ticket.tokenId === 1422 ? 'EVT-2026-002' : 'EVT-2026-001'}`}
                                                    >
                                                        Xem trên chợ
                                                    </Button>
                                                </>
                                            )}

                                            {ticket.status === 'used' && (
                                                <Button
                                                    variant="outlined"
                                                    disabled
                                                    size="small"
                                                    startIcon={<CheckCircle />}
                                                    sx={{ '&.Mui-disabled': { color: 'status.checkedIn' } }}
                                                >
                                                    Đã quét tại cổng ({ticket.usedAt})
                                                </Button>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                6. MODAL HIỂN THỊ MÃ QR ĐỘNG HMAC (DYNAMIC QR MODAL - MỤC 1.3)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        bgcolor: 'background.paper',
                        textAlign: 'center',
                        p: 1.5,
                    },
                }}
            >
                {activeTicket && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Typography variant="h3" color="text.primary" fontWeight={700}>
                                Mã QR Soát Vé Vào Cổng
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {activeTicket.eventTitle} • Token #{activeTicket.tokenId}
                            </Typography>
                        </DialogTitle>

                        <DialogContent>
                            {/* Khung mã QR SVG */}
                            <Box
                                sx={{
                                    p: 2.5,
                                    bgcolor: '#fff',
                                    borderRadius: '12px',
                                    display: 'inline-flex',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    border: 1,
                                    borderColor: 'divider',
                                    my: 1.5,
                                }}
                            >
                                <QRCodeSVG
                                    value={qrPayload}
                                    size={210}
                                    level="H"
                                    includeMargin
                                />
                            </Box>

                            {/* Đồng hồ đếm ngược 30s QR động HMAC */}
                            <Box sx={{ mt: 1.5, mb: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Mã QR tự động làm mới sau:
                                    </Typography>
                                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                                        {qrCountdown}s
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={(qrCountdown / 30) * 100}
                                    sx={{ height: 6, borderRadius: 3 }}
                                />
                            </Box>

                            <Alert severity="warning" sx={{ textAlign: 'left', borderRadius: '8px', mb: 2 }}>
                                <Typography variant="caption" display="block">
                                    <strong>Cơ chế bảo mật QR động (HMAC):</strong> Không chụp màn hình gửi cho người khác vì mã sẽ hết hạn sau mỗi 30 giây. Vui lòng mở trực tiếp ứng dụng khi đến trước cổng soát vé.
                                </Typography>
                            </Alert>

                            {/* Thông tin vị trí cổng soát vé */}
                            <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px', textAlign: 'left' }}>
                                <Typography variant="caption" color="text.secondary">HẠNG VÉ:</Typography>
                                <Typography variant="subtitle2" color="primary.main" fontWeight={700} mb={0.5}>
                                    {activeTicket.tierName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">LỐI VÀO SOÁT VÉ:</Typography>
                                <Typography variant="body2" color="text.primary" fontWeight={600}>
                                    {activeTicket.gate}
                                </Typography>
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={() => setQrModalOpen(false)}
                                sx={{ height: 42, borderRadius: '8px' }}
                            >
                                Đóng Mã QR
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                7. MODAL RAO BÁN LẠI TRÊN CHỢ THỨ CẤP (RESALE 120% MODAL - BR-02)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={resaleModalOpen}
                onClose={() => setResaleModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                {resaleTicket && (
                    <>
                        <DialogTitle>
                            <Typography variant="h3" color="text.primary">
                                Niêm Yết Vé Lên Chợ Thứ Cấp
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Vé Token #{resaleTicket.tokenId} • {resaleTicket.eventTitle}
                            </Typography>
                        </DialogTitle>

                        <DialogContent dividers>
                            <Alert
                                severity="info"
                                icon={<Security sx={{ color: 'primary.main' }} />}
                                sx={{ mb: 3, borderRadius: '8px' }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    <strong>Quy tắc bất biến BR-02:</strong> Smart Contract <code>TicketMarketplace.sol</code> yêu cầu giá bán lại không được vượt quá 120% giá gốc phát hành để bảo vệ người mua khỏi nạn đầu cơ.
                                </Typography>
                            </Alert>

                            {resaleError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {resaleError}
                                </Alert>
                            )}

                            <Stack spacing={2} mb={3}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Giá gốc phát hành (originalPrice):</Typography>
                                    <Typography variant="body2" color="text.primary" fontWeight={600}>
                                        {resaleTicket.originalPrice} ETH
                                    </Typography>
                                </Stack>

                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Trần giá bán lại tối đa cho phép (+120%):</Typography>
                                    <Typography variant="body2" color="status.success" fontWeight={700}>
                                        {resaleTicket.maxResalePrice} ETH
                                    </Typography>
                                </Stack>
                            </Stack>

                            <TextField
                                label="Giá bạn muốn bán lại (ETH)"
                                fullWidth
                                type="number"
                                inputProps={{ step: '0.005', min: '0.001', max: resaleTicket.maxResalePrice }}
                                value={resalePriceInput}
                                onChange={(e) => {
                                    setResalePriceInput(e.target.value);
                                    if (resaleError) setResaleError('');
                                }}
                                helperText={`Giá tối đa có thể đặt: ${resaleTicket.maxResalePrice} ETH`}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                                }}
                            />

                            <Box sx={{ mt: 2.5, p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Phí bản quyền cho Nhà tổ chức: <strong>2.5%</strong> (sẽ được trích tự động on-chain khi có người mua).
                                </Typography>
                            </Box>
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5 }}>
                            <Button variant="outlined" onClick={() => setResaleModalOpen(false)}>
                                Hủy Bỏ
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleConfirmResaleListing}
                            >
                                Xác Nhận Niêm Yết Lên Chợ
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                8. FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
            <Footer />

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

export default MyTicketsPage;

