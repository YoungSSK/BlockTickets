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
    TextField,
    Stack,
    Divider,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    Tabs,
    Tab,
    Tooltip,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    ConfirmationNumber,
    Search,
    LocationOn,
    Schedule,
    Security,
    VerifiedUser,
    QrCode2,
    SwapHoriz,
    ArrowForward,
    CheckCircle,
    TrendingUp,
    ElectricBolt,
    AccountBalanceWallet,
    EventNote,
    PeopleAlt,
    Star,
    FilterList,
    FiberManualRecord,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { eventAPI } from '../../services/api';

// 4 Trụ cột giá trị cốt lõi của BlockTickets
const VALUE_PROPOSITIONS = [
    {
        icon: VerifiedUser,
        title: 'Vé NFT Độc Bản ERC-721',
        description: 'Mỗi vé phát hành là một token NFT duy nhất trên mạng Ethereum Sepolia. Tuyệt đối không thể làm giả hoặc sao chép lậu.',
        color: '#2563EB',
    },
    {
        icon: SwapHoriz,
        title: 'Trần Giá Chuyển Nhượng 120%',
        description: 'Quy tắc BR-02 được Smart Contract kiểm tra bất biến. Ngăn chặn triệt để nạn đầu cơ và phe vé chợ đen đẩy giá cắt cổ.',
        color: '#10B981',
    },
    {
        icon: QrCode2,
        title: 'Soát Vé QR Động HMAC',
        description: 'Mã QR soát vé tại cổng thay đổi chữ ký số liên tục mỗi 30 giây, loại bỏ hoàn toàn hành vi chụp màn hình vé gửi cho nhiều người.',
        color: '#8B5CF6',
    },
    {
        icon: ElectricBolt,
        title: 'Thanh Toán Minh Bạch On-Chain',
        description: 'Thanh toán ETH an toàn qua ví MetaMask, nhận vé trực tiếp về ví cá nhân và đối soát doanh thu thời gian thực minh bạch.',
        color: '#F59E0B',
    },
];

const normalizeHomeEvent = (evt) => {
    const ticketTypes = Array.isArray(evt.ticketTypes) ? evt.ticketTypes : [];
    const prices = ticketTypes.map((t) => Number(t.originalPrice || 0)).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0.05;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0.25;
    const maxSupply = ticketTypes.reduce((s, t) => s + Number(t.maxSupply || 0), 0) || 1000;
    const minted = ticketTypes.reduce((s, t) => s + Number(t.currentSupply || t.mintedAmount || 0), 0);
    const remainingTickets = Math.max(0, maxSupply - minted);

    return {
        ...evt,
        id: evt.id,
        title: evt.title,
        category: evt.category || 'music',
        categoryLabel:
            evt.category === 'technology' ? 'Công nghệ & Web3' :
            evt.category === 'sports' ? 'Thể thao' :
            evt.category === 'workshop' ? 'Hội thảo & Khởi nghiệp' : 'Âm nhạc',
        bannerUrl: evt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        venue: evt.venueName || evt.venue || 'Việt Nam',
        city: evt.venueCity || evt.city || 'Hà Nội',
        startTime: evt.startTime ? new Date(evt.startTime).toLocaleDateString('vi-VN') : '',
        minPrice,
        maxPrice,
        remainingTickets,
        maxSupply,
        organizer: evt.organizer?.fullName || evt.organizer?.name || 'BlockTickets Partner',
        featured: Boolean(evt.featured ?? true),
    };
};

const HomePage = () => {
    const navigate = useNavigate();

    // State danh sách sự kiện & bộ lọc
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

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

    // Tải danh sách sự kiện đã duyệt/công khai từ Backend
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await eventAPI.getEvents({ limit: 50 });
                const backendEvents = res.data?.data?.events;
                if (Array.isArray(backendEvents)) {
                    setEvents(backendEvents.map(normalizeHomeEvent));
                } else {
                    setEvents([]);
                }
            } catch (err) {
                console.error('Lỗi khi tải sự kiện:', err.message);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // Chuyển hướng sang trang Khám phá sự kiện kèm tham số tìm kiếm
    const handleSearchSubmit = () => {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
        navigate(`/events?${params.toString()}`);
    };

    // Cuộn tới danh sách sự kiện
    const handleScrollToEvents = () => {
        const section = document.getElementById('events-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Lọc danh sách sự kiện theo từ khóa, thành phố và danh mục
    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            // Danh mục
            if (selectedCategoryTab !== 'all' && evt.category !== selectedCategoryTab) return false;
            // Thành phố
            if (selectedCity !== 'all' && evt.city !== selectedCity) return false;
            // Từ khóa tìm kiếm
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = (evt.title || '').toLowerCase().includes(q);
                const matchVenue = (evt.venue || '').toLowerCase().includes(q);
                const matchOrg = (evt.organizer || '').toLowerCase().includes(q);
                if (!matchTitle && !matchVenue && !matchOrg) return false;
            }
            return true;
        });
    }, [events, selectedCategoryTab, selectedCity, searchQuery]);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* ═══════════════════════════════════════════════════════════════════
                1. NAVBAR
            ═══════════════════════════════════════════════════════════════════ */}
            <Navbar />

            {/* ═══════════════════════════════════════════════════════════════════
                2. HERO SECTION
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pt: { xs: 6, md: 9 },
                    pb: { xs: 8, md: 10 },
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Vòng tròn trang trí nhẹ */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -120,
                        right: -120,
                        width: 480,
                        height: 480,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 70%)',
                        pointerEvents: 'none',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -80,
                        left: -80,
                        width: 360,
                        height: 360,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(99,102,241,0) 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ maxWidth: 860, mx: 'auto', textAlign: 'center' }}>
                        {/* Huy hiệu Sepolia */}
                        <Chip
                            icon={<ElectricBolt sx={{ fontSize: '14px !important', color: 'primary.main' }} />}
                            label="Nền Tảng Vé Sự Kiện NFT Đầu Tiên Trên Ethereum Sepolia"
                            size="small"
                            sx={{
                                bgcolor: 'action.selected',
                                color: 'primary.main',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                height: 28,
                                px: 1,
                                mb: 2.5,
                            }}
                        />

                        {/* Tiêu đề chính */}
                        <Typography
                            variant="h1"
                            color="text.primary"
                            fontWeight={800}
                            sx={{
                                fontSize: { xs: '2.0rem', sm: '2.8rem', md: '3.4rem' },
                                lineHeight: 1.18,
                                letterSpacing: '-0.02em',
                                mb: 2,
                            }}
                        >
                            Vé Sự Kiện Minh Bạch<br />
                            <Box component="span" sx={{ color: 'primary.main' }}>
                                Không Thể Làm Giả
                            </Box>{' '}
                            Với Blockchain
                        </Typography>

                        {/* Phụ đề */}
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                                fontSize: { xs: '1.0rem', md: '1.15rem' },
                                lineHeight: 1.7,
                                maxWidth: 680,
                                mx: 'auto',
                                mb: 4,
                            }}
                        >
                            Đúc vé NFT bất biến vào ví MetaMask, kiểm soát trần giá bán lại 120% chống phe vé, và soát vé tốc độ cao tại cổng với mã QR HMAC động.
                        </Typography>

                        {/* 2 Nút hành động Hero */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            justifyContent="center"
                            alignItems="center"
                            mb={6}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                component={RouterLink}
                                to="/events"
                                endIcon={<ArrowForward />}
                                sx={{
                                    height: 50,
                                    px: 4,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                }}
                            >
                                Khám Phá Sự Kiện Ngay
                            </Button>
                            {events.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="large"
                                    component={RouterLink}
                                    to={`/events/${events[0].id}`}
                                    sx={{
                                        height: 50,
                                        px: 3.5,
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                    }}
                                >
                                    Xem Sự Kiện ({events[0].title})
                                </Button>
                            )}
                        </Stack>

                        {/* Thanh tìm kiếm nổi (Floating Search Bar) */}
                        <Card
                            sx={{
                                bgcolor: 'background.paper',
                                p: 1.5,
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Grid container spacing={1.5} alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Tìm tên sự kiện, nghệ sĩ, diễn giả..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search sx={{ color: 'text.disabled' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.default' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            displayEmpty
                                            sx={{ bgcolor: 'background.default' }}
                                        >
                                            <MenuItem value="all">Tất cả địa điểm</MenuItem>
                                            <MenuItem value="Hà Nội">Hà Nội</MenuItem>
                                            <MenuItem value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</MenuItem>
                                            <MenuItem value="Quảng Ninh">Quảng Ninh</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSearchSubmit}
                                        sx={{ height: 40, fontWeight: 700, borderRadius: '8px' }}
                                    >
                                        Tìm Kiếm Vé
                                    </Button>
                                </Grid>
                            </Grid>
                        </Card>
                    </Box>
                </Container>
            </Box>

            {/* ═══════════════════════════════════════════════════════════════════
                3. SECTION: 4 TRỤ CỘT GIÁ TRỊ CỐT LÕI (VALUE PROPOSITIONS)
            ═══════════════════════════════════════════════════════════════════ */}
            <Container maxWidth="xl" sx={{ py: 8 }}>
                <Box textAlign="center" mb={5}>
                    <Typography variant="caption" color="primary.main" fontWeight={700} letterSpacing="0.08em">
                        TẠI SAO CHỌN BLOCKTICKETS?
                    </Typography>
                    <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                        Giải Pháp Toàn Diện Cho Vé Sự Kiện Kỷ Nguyên Web3
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        Xóa bỏ hoàn toàn vé giả mạo, nạn phe vé chợ đen và quy trình soát vé thủ công dễ sai sót.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {VALUE_PROPOSITIONS.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <Grid item xs={12} sm={6} lg={3} key={index}>
                                <Card sx={{ bgcolor: 'background.paper', height: '100%', p: 1 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '10px',
                                                bgcolor: 'action.selected',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'primary.main',
                                                mb: 2,
                                            }}
                                        >
                                            <IconComponent sx={{ fontSize: 26 }} />
                                        </Box>
                                        <Typography variant="h3" color="text.primary" fontWeight={600} gutterBottom>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                            {item.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                4. SECTION: DANH SÁCH SỰ KIỆN NỔI BẬT (FEATURED EVENTS)
            ═══════════════════════════════════════════════════════════════════ */}
            <Box id="events-section" sx={{ bgcolor: 'background.subtle', py: 8, borderTop: 1, borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        spacing={2}
                        mb={4}
                    >
                        <Box>
                            <Typography variant="caption" color="primary.main" fontWeight={700} letterSpacing="0.08em">
                                KHÁM PHÁ SỰ KIỆN
                            </Typography>
                            <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                                Sự Kiện Nổi Bật Đang Mở Bán
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Vé NFT chính thức được phát hành trực tiếp bởi các Nhà tổ chức uy tín
                            </Typography>
                        </Box>

                        {/* Tabs danh mục sự kiện */}
                        <Tabs
                            value={selectedCategoryTab}
                            onChange={(e, val) => setSelectedCategoryTab(val)}
                            textColor="primary"
                            indicatorColor="primary"
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ minHeight: 40 }}
                        >
                            <Tab value="all" label="Tất cả" sx={{ minHeight: 40, py: 1 }} />
                            <Tab value="technology" label="Công nghệ & Web3" sx={{ minHeight: 40, py: 1 }} />
                            <Tab value="music" label="Âm nhạc" sx={{ minHeight: 40, py: 1 }} />
                            <Tab value="sports" label="Thể thao" sx={{ minHeight: 40, py: 1 }} />
                            <Tab value="workshop" label="Hội thảo" sx={{ minHeight: 40, py: 1 }} />
                        </Tabs>
                    </Stack>

                    {/* Lưới Thẻ Sự Kiện (Grid of Event Cards) */}
                    {filteredEvents.length === 0 ? (
                        <Card sx={{ bgcolor: 'background.paper', py: 8, textAlign: 'center' }}>
                            <Typography variant="h3" color="text.primary">
                                Không tìm thấy sự kiện phù hợp
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                Hãy thử xóa từ khóa tìm kiếm hoặc chọn tất cả địa điểm để xem toàn bộ sự kiện.
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCity('all');
                                    setSelectedCategoryTab('all');
                                }}
                                sx={{ mt: 3 }}
                            >
                                Đặt lại bộ lọc
                            </Button>
                        </Card>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredEvents.map((event) => (
                                <Grid item xs={12} sm={6} lg={4} key={event.id}>
                                    <Card
                                        sx={{
                                            bgcolor: 'background.paper',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            },
                                        }}
                                    >
                                        {/* Poster sự kiện tỷ lệ 16:9 */}
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={event.bannerUrl}
                                                alt={event.title}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    left: 12,
                                                }}
                                            >
                                                <Chip
                                                    label={event.categoryLabel}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(0, 0, 0, 0.75)',
                                                        color: '#fff',
                                                        backdropFilter: 'blur(4px)',
                                                        fontWeight: 600,
                                                        fontSize: '0.72rem',
                                                    }}
                                                />
                                            </Box>
                                            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                                                <Chip
                                                    icon={<FiberManualRecord sx={{ color: '#10B981', fontSize: 10 }} />}
                                                    label="Đang mở bán"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                                                        color: '#10B981',
                                                        backdropFilter: 'blur(4px)',
                                                        fontWeight: 700,
                                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* Nội dung Card */}
                                        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                                <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {event.startTime}
                                                </Typography>
                                            </Stack>

                                            <Typography
                                                variant="h3"
                                                color="text.primary"
                                                fontWeight={700}
                                                sx={{
                                                    mb: 1.5,
                                                    lineHeight: 1.35,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {event.title}
                                            </Typography>

                                            <Stack direction="row" spacing={1} alignItems="flex-start" mb={2}>
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                                                    {event.venue}
                                                </Typography>
                                            </Stack>

                                            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={2}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">GIÁ TỪ</Typography>
                                                        <Typography variant="h3" color="primary.main" fontWeight={700}>
                                                            {event.minPrice} ETH
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Còn {event.remainingTickets} vé
                                                    </Typography>
                                                </Stack>

                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    color="primary"
                                                    component={RouterLink}
                                                    to={`/events/${event.id}`}
                                                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                                                >
                                                    Xem Chi Tiết & Mua Vé
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {filteredEvents.length > 0 && (
                        <Box textAlign="center" mt={5}>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="large"
                                component={RouterLink}
                                to="/events"
                                endIcon={<ArrowForward />}
                                sx={{ borderRadius: '8px', fontWeight: 600, px: 4 }}
                            >
                                Khám Phá Toàn Bộ Danh Sách Sự Kiện
                            </Button>
                        </Box>
                    )}
                </Container>
            </Box>

            {/* ═══════════════════════════════════════════════════════════════════
                5. SECTION: GIỚI THIỆU CHỢ THỨ CẤP (RESALE MARKETPLACE BANNER)
            ═══════════════════════════════════════════════════════════════════ */}
            <Container maxWidth="xl" sx={{ py: 8 }}>
                <Card
                    sx={{
                        bgcolor: 'background.paper',
                        borderRadius: '16px',
                        border: 1,
                        borderColor: 'divider',
                        p: { xs: 3, md: 5 },
                    }}
                >
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <Chip
                                icon={<SwapHoriz sx={{ fontSize: '14px !important', color: 'status.success' }} />}
                                label="CHỢ VÉ THỨ CẤP MINH BẠCH (MARKETPLACE)"
                                size="small"
                                sx={{ bgcolor: 'status.successBg', color: 'status.success', fontWeight: 700, mb: 2 }}
                            />
                            <Typography variant="h2" color="text.primary" fontWeight={800} gutterBottom>
                                Bỏ Lỡ Đợt Mở Bán Ban Đầu? Mua Lại Vé An Toàn Với Trần Giá 120%
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                                Tại BlockTickets, người sở hữu vé được quyền chuyển nhượng lại vé NFT cho người khác khi không thể tham dự.
                                Smart Contract <code>TicketMarketplace.sol</code> đảm bảo giá bán lại <strong>tuyệt đối không vượt quá 120% giá gốc</strong>.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    component={RouterLink}
                                    to="/marketplace"
                                    sx={{ height: 44, borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Khám Phá Vé Đang Rao Bán
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => showSnackbar('Hợp đồng Chợ thứ cấp đã được kiểm định bảo mật 100% on-chain!', 'info')}
                                    sx={{ height: 44, borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Tìm Hiểu Quy Tắc BR-02
                                </Button>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Box
                                sx={{
                                    p: 3,
                                    bgcolor: 'background.subtle',
                                    borderRadius: '12px',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1.5}>
                                    VÍ DỤ VỀ BẢO VỆ NGƯỜI MUA:
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Giá vé gốc (originalPrice):</Typography>
                                        <Typography variant="body2" color="text.primary" fontWeight={600}>0.25 ETH</Typography>
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">Trần tối đa cho phép (+120%):</Typography>
                                        <Typography variant="body2" color="status.success" fontWeight={700}>0.30 ETH</Typography>
                                    </Stack>
                                    <Divider />
                                    <Typography variant="caption" color="text.secondary">
                                        ✓ Mọi giao dịch đặt giá bán trên 0.30 ETH đều bị Smart Contract từ chối tự động (Transaction Reverted).
                                    </Typography>
                                </Stack>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                6. SECTION: THỐNG KÊ THỜI GIAN THỰC (LIVE STATS)
            ═══════════════════════════════════════════════════════════════════ */}
            <Box sx={{ bgcolor: 'background.paper', py: 6, borderTop: 1, borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Grid container spacing={3} textAlign="center">
                        <Grid item xs={6} md={3}>
                            <Typography variant="h2" color="primary.main" fontWeight={800}>
                                8,420+
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                                Vé NFT Đã Mint Trên Sepolia
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="h2" color="status.success" fontWeight={800}>
                                100%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                                Tuân Thủ Trần Giá 120%
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="h2" color="status.onchain" fontWeight={800}>
                                42
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                                Sự Kiện Được Phê Duyệt
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="h2" color="text.primary" fontWeight={800}>
                                0
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
                                Trường Hợp Vé Giả Mạo
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ═══════════════════════════════════════════════════════════════════
                7. FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
            <Footer />

            {/* ═══════════════════════════════════════════════════════════════════
                8. SNACKBAR THÔNG BÁO
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

export default HomePage;

