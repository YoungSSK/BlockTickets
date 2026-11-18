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
    Stack,
    Skeleton,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    MapPin,
    Calendar,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Ticket,
} from 'lucide-react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { eventAPI } from '../../services/api';

const CATEGORY_SECTIONS = [
    {
        key: 'music',
        title: 'Sự kiện Âm nhạc',
        label: 'Âm nhạc',
    },
    {
        key: 'sports',
        title: 'Sự kiện Thể thao',
        label: 'Thể thao',
    },
    {
        key: 'technology',
        title: 'Sự kiện Công nghệ',
        label: 'Công nghệ',
    },
    {
        key: 'workshop',
        title: 'Hội thảo & Workshop',
        label: 'Hội thảo',
    },
];

const CATEGORY_MAP = CATEGORY_SECTIONS.reduce((acc, item) => {
    acc[item.key] = item;
    return acc;
}, {});

const normalizeHomeEvent = (evt) => {
    const ticketTypes = Array.isArray(evt.ticketTypes) ? evt.ticketTypes : [];
    const prices = ticketTypes.map((t) => Number(t.originalPrice || 0)).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxSupply = ticketTypes.reduce((s, t) => s + Number(t.maxSupply || 0), 0);
    const minted = ticketTypes.reduce((s, t) => s + Number(t.currentSupply || t.mintedAmount || 0), 0);
    const remainingTickets = Math.max(0, maxSupply - minted);
    const catMeta = CATEGORY_MAP[evt.category] || { label: 'Sự kiện' };

    const isPublishedOnChain = evt.status === 'published' && Boolean(evt.onChainEventId);
    const isSoldOut = maxSupply > 0 && remainingTickets === 0;
    const now = Date.now();
    const endMs = evt.endTime ? new Date(evt.endTime).getTime() : NaN;
    const isEnded = Number.isFinite(endMs) && now > endMs;

    let badgeText = 'Đang mở bán';
    let badgeBg = 'rgba(16, 185, 129, 0.9)';
    if (isEnded) {
        badgeText = 'Đã kết thúc';
        badgeBg = 'rgba(100, 116, 139, 0.9)';
    } else if (!isPublishedOnChain) {
        badgeText = 'Sắp mở bán';
        badgeBg = 'rgba(245, 158, 11, 0.92)';
    } else if (isSoldOut) {
        badgeText = 'Hết vé';
        badgeBg = 'rgba(220, 38, 38, 0.92)';
    }

    return {
        ...evt,
        id: evt.id,
        title: evt.title,
        category: evt.category || 'music',
        categoryLabel: catMeta.label,
        bannerUrl:
            evt.bannerUrl ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        venue: evt.venueName || evt.venue || 'Việt Nam',
        city: evt.venueCity || evt.city || '',
        dateText: evt.startTime ? new Date(evt.startTime).toLocaleDateString('vi-VN') : '',
        dateTimeText: evt.startTime
            ? new Date(evt.startTime).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              })
            : '',
        createdAtMs: evt.createdAt ? new Date(evt.createdAt).getTime() : Number(evt.id || 0),
        minPrice,
        remainingTickets,
        maxSupply,
        badgeText,
        badgeBg,
    };
};

const EventProductCard = ({ event }) => {
    const navigate = useNavigate();

    return (
        <Card
            onClick={() => navigate(`/events/${event.id}`)}
            sx={{
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '14px',
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: 'primary.main',
                    boxShadow: '0 14px 28px -8px rgba(0, 0, 0, 0.22)',
                    '& .event-card-img': {
                        transform: 'scale(1.05)',
                    },
                },
            }}
        >
            <Box sx={{ position: 'relative', overflow: 'hidden', aspectRatio: '16 / 9', bgcolor: 'background.subtle' }}>
                <CardMedia
                    component="img"
                    image={event.bannerUrl}
                    alt={event.title}
                    className="event-card-img"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.35s ease',
                    }}
                />
                <Chip
                    label={event.badgeText}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        bgcolor: event.badgeBg,
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        height: 24,
                    }}
                />
            </Box>

            <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                    variant="subtitle1"
                    color="text.primary"
                    fontWeight={700}
                    sx={{
                        lineHeight: 1.35,
                        minHeight: '2.7em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {event.title}
                </Typography>

                <Typography variant="subtitle1" color="primary.main" fontWeight={800}>
                    {event.minPrice > 0 ? `Từ ${event.minPrice} ETH` : 'Đang cập nhật'}
                </Typography>

                <Stack spacing={0.5} sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    {event.dateText && (
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
                            <Calendar size={14} style={{ flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {event.dateText}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
                        <MapPin size={14} style={{ flexShrink: 0 }} />
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {event.city ? `${event.venue}, ${event.city}` : event.venue}
                        </Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

const HomePage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isHeroPaused, setIsHeroPaused] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await eventAPI.getEvents({ limit: 60, sort: 'newest' });
                const backendEvents = res.data?.data?.events;
                if (Array.isArray(backendEvents)) {
                    const normalized = backendEvents
                        .map(normalizeHomeEvent)
                        .sort((a, b) => b.createdAtMs - a.createdAtMs);
                    setEvents(normalized);
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

    // Danh sách banner nổi bật lấy từ các sự kiện mới nhất (ưu tiên sự kiện mới nhất ở vị trí đầu tiên)
    const heroEvents = useMemo(() => events.slice(0, 5), [events]);

    useEffect(() => {
        if (heroIndex >= heroEvents.length) {
            setHeroIndex(0);
        }
    }, [heroEvents.length, heroIndex]);

    useEffect(() => {
        if (heroEvents.length <= 1 || isHeroPaused) return undefined;
        const timer = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroEvents.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [heroEvents.length, isHeroPaused]);

    // Sự kiện mới tạo (tối đa 8 sự kiện mới nhất)
    const newestEvents = useMemo(() => events.slice(0, 8), [events]);

    // Chỉ giữ các đề mục thể loại có ít nhất 1 sự kiện
    const activeCategorySections = useMemo(() => {
        return CATEGORY_SECTIONS.map((section) => ({
            ...section,
            items: events.filter((evt) => evt.category === section.key).slice(0, 8),
        })).filter((section) => section.items.length > 0);
    }, [events]);

    const activeHero = heroEvents[heroIndex] || null;

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Navbar />

            <Container maxWidth="xl" sx={{ pt: { xs: 2.5, md: 3.5 }, pb: 8, flex: 1 }}>
                {/* ═══════════════════════════════════════════════════════════════════
                    1. BANNER SỰ KIỆN MỚI NHẤT (E-COMMERCE HERO BANNER)
                ═══════════════════════════════════════════════════════════════════ */}
                <Box
                    onMouseEnter={() => setIsHeroPaused(true)}
                    onMouseLeave={() => setIsHeroPaused(false)}
                    sx={{ mb: 3.5 }}
                >
                    {loading ? (
                        <Skeleton
                            variant="rectangular"
                            sx={{
                                width: '100%',
                                height: { xs: 300, sm: 380, md: 440 },
                                borderRadius: '18px',
                            }}
                        />
                    ) : activeHero ? (
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: { xs: 320, sm: 390, md: 450 },
                                borderRadius: '18px',
                                overflow: 'hidden',
                                border: 1,
                                borderColor: 'divider',
                                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.35)',
                            }}
                        >
                            {/* Ảnh nền Banner */}
                            <Box
                                component="img"
                                src={activeHero.bannerUrl}
                                alt={activeHero.title}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />

                            {/* Lớp phủ gradient giúp chữ luôn nổi bật trên mọi ảnh */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background:
                                        'linear-gradient(90deg, rgba(11,15,25,0.92) 0%, rgba(11,15,25,0.72) 48%, rgba(11,15,25,0.22) 100%), linear-gradient(0deg, rgba(11,15,25,0.85) 0%, rgba(11,15,25,0) 55%)',
                                }}
                            />

                            {/* Nội dung sự kiện trên Banner */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    p: { xs: 2.5, sm: 4, md: 5 },
                                    maxWidth: { xs: '100%', md: '68%' },
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5} flexWrap="wrap" useFlexGap>
                                    {heroIndex === 0 && (
                                        <Chip
                                            icon={<Sparkles size={14} style={{ color: '#fff', marginLeft: 6 }} />}
                                            label="Sự kiện mới nhất"
                                            size="small"
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: '#ffffff',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                    )}
                                    <Chip
                                        label={activeHero.categoryLabel}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.16)',
                                            color: '#ffffff',
                                            backdropFilter: 'blur(6px)',
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                        }}
                                    />
                                    <Chip
                                        label={activeHero.badgeText}
                                        size="small"
                                        sx={{
                                            bgcolor: activeHero.badgeBg,
                                            color: '#ffffff',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                        }}
                                    />
                                </Stack>

                                <Typography
                                    variant="h1"
                                    sx={{
                                        color: '#ffffff',
                                        fontWeight: 800,
                                        fontSize: { xs: '1.5rem', sm: '2.1rem', md: '2.65rem' },
                                        lineHeight: 1.18,
                                        mb: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {activeHero.title}
                                </Typography>

                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={{ xs: 0.75, sm: 2.5 }}
                                    sx={{ color: 'rgba(255,255,255,0.88)', mb: 2.5 }}
                                >
                                    {activeHero.dateTimeText && (
                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                            <Calendar size={16} />
                                            <Typography variant="body2" fontWeight={500} color="inherit">
                                                {activeHero.dateTimeText}
                                            </Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                        <MapPin size={16} />
                                        <Typography variant="body2" fontWeight={500} color="inherit" noWrap>
                                            {activeHero.city ? `${activeHero.venue}, ${activeHero.city}` : activeHero.venue}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        component={RouterLink}
                                        to={`/events/${activeHero.id}`}
                                        endIcon={<ArrowRight size={18} />}
                                        sx={{
                                            height: 46,
                                            px: 3.5,
                                            borderRadius: '10px',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        Mua vé ngay
                                    </Button>

                                    {activeHero.minPrice > 0 && (
                                        <Typography
                                            variant="h3"
                                            sx={{
                                                color: '#60A5FA',
                                                fontWeight: 800,
                                                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                                            }}
                                        >
                                            Từ {activeHero.minPrice} ETH
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>

                            {/* Nút chuyển Banner nếu có nhiều sự kiện */}
                            {heroEvents.length > 1 && (
                                <>
                                    <IconButton
                                        aria-label="Sự kiện trước"
                                        onClick={() =>
                                            setHeroIndex((prev) => (prev - 1 + heroEvents.length) % heroEvents.length)
                                        }
                                        sx={{
                                            position: 'absolute',
                                            left: 14,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            bgcolor: 'rgba(0,0,0,0.45)',
                                            color: '#fff',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
                                            display: { xs: 'none', sm: 'inline-flex' },
                                        }}
                                    >
                                        <ChevronLeft size={22} />
                                    </IconButton>
                                    <IconButton
                                        aria-label="Sự kiện tiếp theo"
                                        onClick={() => setHeroIndex((prev) => (prev + 1) % heroEvents.length)}
                                        sx={{
                                            position: 'absolute',
                                            right: 14,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            bgcolor: 'rgba(0,0,0,0.45)',
                                            color: '#fff',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.72)' },
                                            display: { xs: 'none', sm: 'inline-flex' },
                                        }}
                                    >
                                        <ChevronRight size={22} />
                                    </IconButton>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{
                                            position: 'absolute',
                                            bottom: 18,
                                            right: 24,
                                        }}
                                    >
                                        {heroEvents.map((ev, idx) => (
                                            <Box
                                                key={ev.id}
                                                onClick={() => setHeroIndex(idx)}
                                                sx={{
                                                    width: idx === heroIndex ? 26 : 9,
                                                    height: 9,
                                                    borderRadius: 5,
                                                    bgcolor: idx === heroIndex ? 'primary.main' : 'rgba(255,255,255,0.45)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.25s ease',
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Box>
                    ) : (
                        <Card
                            sx={{
                                bgcolor: 'background.paper',
                                py: 8,
                                textAlign: 'center',
                                borderRadius: '16px',
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'center', color: 'text.disabled', mb: 1.5 }}>
                                <Ticket size={48} />
                            </Box>
                            <Typography variant="h3" color="text.primary" fontWeight={700}>
                                Hiện chưa có sự kiện nào đang mở bán
                            </Typography>
                        </Card>
                    )}
                </Box>

                {/* ═══════════════════════════════════════════════════════════════════
                    2. ĐỀ MỤC: SỰ KIỆN MỚI TẠO
                ═══════════════════════════════════════════════════════════════════ */}
                {loading ? (
                    <Grid container spacing={2.5} mb={6}>
                        {[1, 2, 3, 4].map((i) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: '14px' }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    newestEvents.length > 0 && (
                        <Box id="section-newest" sx={{ mb: 6, scrollMarginTop: '90px' }}>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2.5}
                            >
                                <Typography variant="h2" color="text.primary" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                                    Sự kiện mới tạo
                                </Typography>

                                <Button
                                    component={RouterLink}
                                    to="/events"
                                    endIcon={<ArrowRight size={17} />}
                                    sx={{ fontWeight: 700, textTransform: 'none' }}
                                >
                                    Xem tất cả
                                </Button>
                            </Stack>

                            <Grid container spacing={2.5}>
                                {newestEvents.map((event) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={event.id}>
                                        <EventProductCard event={event} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                    4. CÁC ĐỀ MỤC THEO THỂ LOẠI (CHỈ HIỂN THỊ KHI CÓ SỰ KIỆN)
                ═══════════════════════════════════════════════════════════════════ */}
                {!loading &&
                    activeCategorySections.map((section) => (
                        <Box
                            key={section.key}
                            id={`section-${section.key}`}
                            sx={{ mb: 6, scrollMarginTop: '90px' }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2.5}
                            >
                                <Typography
                                    variant="h2"
                                    color="text.primary"
                                    fontWeight={800}
                                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                                >
                                    {section.title}
                                </Typography>

                                <Button
                                    component={RouterLink}
                                    to={`/events?category=${section.key}`}
                                    endIcon={<ArrowRight size={17} />}
                                    sx={{ fontWeight: 700, textTransform: 'none' }}
                                >
                                    Xem tất cả
                                </Button>
                            </Stack>

                            <Grid container spacing={2.5}>
                                {section.items.map((event) => (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={event.id}>
                                        <EventProductCard event={event} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
            </Container>

            <Footer />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{ zIndex: 99999 }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    elevation={8}
                    sx={{
                        width: '100%',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.925rem',
                        color: '#ffffff',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.25)',
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default HomePage;
