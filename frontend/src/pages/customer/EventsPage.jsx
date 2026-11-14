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
    Breadcrumbs,
    Link,
    CircularProgress,
    Alert,
    InputLabel,
    Pagination,
} from '@mui/material';
import {
    ConfirmationNumber,
    Search,
    LocationOn,
    Schedule,
    FilterList,
    FiberManualRecord,
    ArrowForward,
    EventNote,
    Clear,
    VerifiedUser,
    Storefront,
    Sort,
    Person,
} from '@mui/icons-material';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { eventAPI } from '../../services/api';

const normalizeEvent = (evt) => {
    const ticketTypes = Array.isArray(evt.ticketTypes) ? evt.ticketTypes : [];
    const prices = ticketTypes.map((t) => Number(t.originalPrice || 0)).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0.05;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0.25;
    const maxSupply = ticketTypes.reduce((s, t) => s + Number(t.maxSupply || 0), 0) || 1000;
    const minted = ticketTypes.reduce((s, t) => s + Number(t.currentSupply || t.mintedAmount || 0), 0);
    const remainingTickets = Math.max(0, maxSupply - minted);

    const categoryLabelMap = {
        technology: 'Công nghệ & Web3',
        music: 'Âm nhạc & Concert',
        sports: 'Thể thao',
        workshop: 'Hội thảo & Triển lãm',
    };

    let formattedDate = '';
    if (evt.startTime) {
        try {
            const d = new Date(evt.startTime);
            formattedDate = d.toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            formattedDate = String(evt.startTime);
        }
    }

    return {
        ...evt,
        id: evt.id,
        title: evt.title || 'Sự kiện chưa đặt tên',
        description: evt.description || '',
        category: evt.category || 'music',
        categoryLabel: categoryLabelMap[evt.category] || 'Sự kiện nổi bật',
        bannerUrl: evt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        venue: evt.venueName || evt.venue || 'Việt Nam',
        city: evt.venueCity || evt.city || 'Hà Nội',
        startTime: formattedDate,
        rawStartTime: evt.startTime,
        minPrice,
        maxPrice,
        remainingTickets,
        maxSupply,
        organizer: evt.organizer?.fullName || evt.organizer?.name || 'BlockTickets Partner',
    };
};

const EventsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Query parameters từ URL
    const querySearch = searchParams.get('search') || '';
    const queryCategory = searchParams.get('category') || 'all';
    const queryCity = searchParams.get('city') || 'all';

    // State bộ lọc và dữ liệu
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [searchQuery, setSearchQuery] = useState(querySearch);
    const [selectedCity, setSelectedCity] = useState(queryCity);
    const [selectedCategoryTab, setSelectedCategoryTab] = useState(queryCategory);
    const [sortBy, setSortBy] = useState('newest');

    // Fetch danh sách sự kiện từ API Backend
    const fetchEvents = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await eventAPI.getEvents({ limit: 50 });
            const backendEvents = res.data?.data?.events;
            if (Array.isArray(backendEvents)) {
                setEvents(backendEvents.map(normalizeEvent));
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sự kiện:', err);
            setErrorMsg(err.message || 'Không thể kết nối đến máy chủ lấy danh sách sự kiện.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Cập nhật URL params khi người dùng thay đổi bộ lọc
    const handleCategoryChange = (event, newValue) => {
        setSelectedCategoryTab(newValue);
        const params = new URLSearchParams(searchParams);
        if (newValue !== 'all') {
            params.set('category', newValue);
        } else {
            params.delete('category');
        }
        setSearchParams(params);
    };

    const handleCityChange = (e) => {
        const city = e.target.value;
        setSelectedCity(city);
        const params = new URLSearchParams(searchParams);
        if (city !== 'all') {
            params.set('city', city);
        } else {
            params.delete('city');
        }
        setSearchParams(params);
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        const params = new URLSearchParams(searchParams);
        if (val.trim()) {
            params.set('search', val);
        } else {
            params.delete('search');
        }
        setSearchParams(params);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCity('all');
        setSelectedCategoryTab('all');
        setSortBy('newest');
        setSearchParams({});
    };

    // Lọc và sắp xếp danh sách sự kiện
    const filteredEvents = useMemo(() => {
        let result = events.filter((evt) => {
            // Lọc theo danh mục
            if (selectedCategoryTab !== 'all' && evt.category !== selectedCategoryTab) {
                return false;
            }

            // Lọc theo thành phố
            if (selectedCity !== 'all') {
                const cityLower = selectedCity.toLowerCase();
                const venueCityLower = (evt.city || '').toLowerCase();
                const venueAddressLower = (evt.venue || '').toLowerCase();
                if (!venueCityLower.includes(cityLower) && !venueAddressLower.includes(cityLower)) {
                    return false;
                }
            }

            // Lọc theo từ khóa tìm kiếm (tên, địa điểm, ban tổ chức, mô tả)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = (evt.title || '').toLowerCase().includes(q);
                const matchVenue = (evt.venue || '').toLowerCase().includes(q);
                const matchCity = (evt.city || '').toLowerCase().includes(q);
                const matchOrg = (evt.organizer || '').toLowerCase().includes(q);
                const matchDesc = (evt.description || '').toLowerCase().includes(q);
                if (!matchTitle && !matchVenue && !matchCity && !matchOrg && !matchDesc) {
                    return false;
                }
            }

            return true;
        });

        // Sắp xếp
        return result.sort((a, b) => {
            if (sortBy === 'price_asc') {
                return a.minPrice - b.minPrice;
            }
            if (sortBy === 'price_desc') {
                return b.minPrice - a.minPrice;
            }
            if (sortBy === 'date_asc') {
                return new Date(a.rawStartTime || 0) - new Date(b.rawStartTime || 0);
            }
            // default 'newest'
            return Number(b.id) - Number(a.id);
        });
    }, [events, selectedCategoryTab, selectedCity, searchQuery, sortBy]);

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* 1. NAVBAR */}
            <Navbar />

            {/* 2. MAIN CONTENT CONTAINER */}
            <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
                <Container maxWidth="xl">
                    {/* BREADCRUMB */}
                    <Breadcrumbs
                        aria-label="breadcrumb"
                        sx={{
                            mb: 2.5,
                            '& a': {
                                textDecoration: 'none',
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' },
                            },
                        }}
                    >
                        <Link component={RouterLink} to="/">Trang chủ</Link>
                        <Typography color="text.primary" fontWeight={600}>
                            Khám phá sự kiện
                        </Typography>
                    </Breadcrumbs>

                    {/* HERO HEADER SECTION (CHUYÊN BIỆT CHO TRANG KHÁM PHÁ SỰ KIỆN) */}
                    <Box
                        sx={{
                            p: { xs: 3, md: 4.5 },
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            mb: 4,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative Radial Background Accent */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -80,
                                right: -80,
                                width: 280,
                                height: 280,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }}
                        />

                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5} flexWrap="wrap" useFlexGap>
                                    <Chip
                                        icon={<EventNote sx={{ fontSize: '1rem !important' }} />}
                                        label="KHÁM PHÁ SỰ KIỆN • VÉ NFT CHÍNH HÃNG"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em' }}
                                    />
                                    <Chip
                                        icon={<VerifiedUser sx={{ fontSize: '1rem !important' }} />}
                                        label="ETHEREUM SEPOLIA BLOCKCHAIN"
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            bgcolor: 'action.selected',
                                            color: 'primary.main',
                                        }}
                                    />
                                </Stack>

                                <Typography
                                    variant="h1"
                                    color="text.primary"
                                    fontWeight={800}
                                    sx={{
                                        fontSize: { xs: '1.75rem', sm: '2.3rem' },
                                        lineHeight: 1.25,
                                        mb: 1.5,
                                    }}
                                >
                                    Tất Cả Sự Kiện Đang Mở Bán
                                </Typography>

                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ maxWidth: 720, lineHeight: 1.65, mb: 2 }}
                                >
                                    Khám phá và sở hữu vé sự kiện NFT độc bản, bất biến trên Blockchain với trần giá bán lại 120% chống phe vé và mã QR soát vé HMAC động siêu bảo mật.
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* SEARCH & FILTERS CONTROL BAR */}
                    <Card
                        sx={{
                            p: 2.5,
                            borderRadius: '12px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            mb: 4,
                        }}
                    >
                        <Grid container spacing={2} alignItems="center">
                            {/* Input tìm kiếm */}
                            <Grid item xs={12} md={5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Tìm tên sự kiện, nghệ sĩ, diễn giả, địa điểm..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchQuery ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => handleSearchChange({ target: { value: '' } })}>
                                                    <Clear sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                />
                            </Grid>

                            {/* Lọc theo Thành phố */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={selectedCity}
                                        onChange={handleCityChange}
                                        displayEmpty
                                    >
                                        <MenuItem value="all">Tất cả địa điểm</MenuItem>
                                        <MenuItem value="Hà Nội">Hà Nội</MenuItem>
                                        <MenuItem value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</MenuItem>
                                        <MenuItem value="Đà Nẵng">Đà Nẵng</MenuItem>
                                        <MenuItem value="Quảng Ninh">Quảng Ninh</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Sắp xếp theo */}
                            <Grid item xs={12} sm={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        displayEmpty
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <Sort sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            </InputAdornment>
                                        }
                                    >
                                        <MenuItem value="newest">Mới nhất</MenuItem>
                                        <MenuItem value="date_asc">Ngày diễn ra sớm nhất</MenuItem>
                                        <MenuItem value="price_asc">Giá vé: Thấp đến Cao</MenuItem>
                                        <MenuItem value="price_desc">Giá vé: Cao đến Thấp</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Nút đặt lại */}
                            <Grid item xs={12} md={1}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="inherit"
                                    onClick={handleResetFilters}
                                    sx={{ height: 40, borderRadius: '8px', fontSize: '0.85rem' }}
                                >
                                    Đặt lại
                                </Button>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        {/* Category Tabs */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={2}
                        >
                            <Tabs
                                value={selectedCategoryTab}
                                onChange={handleCategoryChange}
                                textColor="primary"
                                indicatorColor="primary"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ minHeight: 40 }}
                            >
                                <Tab value="all" label="Tất cả sự kiện" sx={{ minHeight: 40, py: 0.5, fontWeight: 600 }} />
                                <Tab value="technology" label="Công nghệ & Web3" sx={{ minHeight: 40, py: 0.5, fontWeight: 600 }} />
                                <Tab value="music" label="Âm nhạc & Concert" sx={{ minHeight: 40, py: 0.5, fontWeight: 600 }} />
                                <Tab value="sports" label="Thể thao" sx={{ minHeight: 40, py: 0.5, fontWeight: 600 }} />
                                <Tab value="workshop" label="Hội thảo & Triển lãm" sx={{ minHeight: 40, py: 0.5, fontWeight: 600 }} />
                            </Tabs>

                            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                                Hiển thị <strong>{filteredEvents.length}</strong> sự kiện
                            </Typography>
                        </Stack>
                    </Card>

                    {/* ERROR ALERT */}
                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 3 }} action={
                            <Button color="inherit" size="small" onClick={fetchEvents}>
                                Thử lại
                            </Button>
                        }>
                            {errorMsg}
                        </Alert>
                    )}

                    {/* LOADING STATE */}
                    {loading ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}>
                            <CircularProgress size={44} thickness={4} />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Đang tải danh sách sự kiện từ Blockchain & Máy chủ...
                            </Typography>
                        </Box>
                    ) : filteredEvents.length === 0 ? (
                        /* EMPTY STATE */
                        <Card sx={{ bgcolor: 'background.paper', py: 8, px: 3, textAlign: 'center', borderRadius: '12px' }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'action.selected',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    color: 'primary.main',
                                    mb: 2,
                                }}
                            >
                                <EventNote sx={{ fontSize: 32 }} />
                            </Box>
                            <Typography variant="h3" color="text.primary" fontWeight={700}>
                                Không tìm thấy sự kiện phù hợp
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 480, mx: 'auto' }}>
                                Không có sự kiện nào khớp với tiêu chí tìm kiếm hoặc bộ lọc danh mục đã chọn. Hãy thử xóa bớt điều kiện lọc.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleResetFilters}
                                sx={{ mt: 3, borderRadius: '8px', px: 3 }}
                            >
                                Đặt Lại Toàn Bộ Bộ Lọc
                            </Button>
                        </Card>
                    ) : (
                        /* EVENT CARDS GRID */
                        <Grid container spacing={3}>
                            {filteredEvents.map((event) => (
                                <Grid item xs={12} sm={6} lg={4} key={event.id}>
                                    <Card
                                        sx={{
                                            bgcolor: 'background.paper',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: 1,
                                            borderColor: 'divider',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.1)',
                                            },
                                        }}
                                    >
                                        {/* Poster 16:9 */}
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="210"
                                                image={event.bannerUrl}
                                                alt={event.title}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                            <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
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
                                                    fontSize: '1.15rem',
                                                    lineHeight: 1.4,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {event.title}
                                            </Typography>

                                            <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                                                    {event.venue}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                    BTC: {event.organizer}
                                                </Typography>
                                            </Stack>

                                            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={2}>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
                                                            GIÁ VÉ TỪ
                                                        </Typography>
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
                                                    endIcon={<ArrowForward />}
                                                    sx={{ borderRadius: '8px', fontWeight: 600, py: 1 }}
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
                </Container>
            </Box>

            {/* 3. FOOTER */}
            <Footer />
        </Box>
    );
};

export default EventsPage;

