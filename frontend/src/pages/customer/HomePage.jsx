import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Stack,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Music,
  Laptop,
  Trophy,
  Users,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

// 1. Dữ liệu sự kiện HOT nhất tháng hiện tại (Trending Spotlight)
const HOT_EVENTS_MONTH = [
  {
    id: 'evt-01',
    title: 'Vietnam Blockchain Summit 2026',
    categoryLabel: 'Công nghệ / Web3',
    date: '15 Tháng 11, 2026 • 08:30',
    venue: 'Trung tâm Hội nghị Quốc gia NCC, Hà Nội',
    priceETH: 0.08,
    priceVND: '2.000.000 VNĐ',
    maxSupply: 500,
    soldCount: 385,
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
    hotBadge: '🔥 TOP 1 SỰ KIỆN HOT NHẤT THÁNG',
    tag: 'BÁN CHẠY NHẤT',
  },
  {
    id: 'evt-02',
    title: 'Symphony of Future - EDM Arena',
    categoryLabel: 'Đại nhạc hội EDM',
    date: '28 Tháng 11, 2026 • 19:30',
    venue: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
    priceETH: 0.05,
    priceVND: '1.250.000 VNĐ',
    maxSupply: 1200,
    soldCount: 1110,
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
    hotBadge: '⚡ SẮP CHÁY VÉ (CHỈ CÒN 90 VÉ)',
    tag: 'CỰC HOT',
  },
];

// 2. Danh mục sự kiện phổ biến kèm số lượng
const CATEGORY_ITEMS = [
  {
    key: 'music',
    label: 'Âm nhạc & Lễ hội EDM',
    count: '24 sự kiện',
    icon: <Music size={24} />,
  },
  {
    key: 'technology',
    label: 'Công nghệ & Web3',
    count: '18 sự kiện',
    icon: <Laptop size={24} />,
  },
  {
    key: 'sports',
    label: 'Thể thao & Esports',
    count: '14 sự kiện',
    icon: <Trophy size={24} />,
  },
  {
    key: 'workshop',
    label: 'Hội thảo & Workshop',
    count: '16 sự kiện',
    icon: <Users size={24} />,
  },
];

// 3. Danh sách các sự kiện sắp diễn ra & mở bán
const UPCOMING_EVENTS = [
  {
    id: 'evt-01',
    title: 'Vietnam Blockchain Summit 2026',
    category: 'technology',
    categoryLabel: 'Công nghệ',
    date: '15 Tháng 11, 2026 • 09:00',
    venue: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    organizer: 'Vietnam Blockchain Alliance',
    priceETH: 0.08,
    priceVND: '2.000.000 VNĐ',
    maxSupply: 500,
    soldCount: 385,
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    badge: 'HOT SALE',
  },
  {
    id: 'evt-02',
    title: 'Symphony of Future - EDM Arena',
    category: 'music',
    categoryLabel: 'Âm nhạc',
    date: '28 Tháng 11, 2026 • 19:30',
    venue: 'Sân vận động Mỹ Đình, Hà Nội',
    organizer: 'SpaceSpeakers Live',
    priceETH: 0.05,
    priceVND: '1.250.000 VNĐ',
    maxSupply: 1200,
    soldCount: 1110,
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    badge: 'SẮP CHÁY VÉ',
  },
  {
    id: 'evt-03',
    title: 'Vietnam Gameverse & Esports Championship',
    category: 'sports',
    categoryLabel: 'Thể thao / Esports',
    date: '05 Tháng 12, 2026 • 13:00',
    venue: 'SECC, Quận 7, TP. Hồ Chí Minh',
    organizer: 'GameVN League',
    priceETH: 0.03,
    priceVND: '750.000 VNĐ',
    maxSupply: 800,
    soldCount: 420,
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    badge: 'MỚI MỞ BÁN',
  },
  {
    id: 'evt-04',
    title: 'Indie Acoustic Sunset by the Beach',
    category: 'music',
    categoryLabel: 'Âm nhạc',
    date: '18 Tháng 12, 2026 • 17:00',
    venue: 'Bãi biển Mỹ Khê, Đà Nẵng',
    organizer: 'Chill Soul Acoustic',
    priceETH: 0.04,
    priceVND: '1.000.000 VNĐ',
    maxSupply: 300,
    soldCount: 190,
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
    badge: 'SỐ LƯỢNG CÓ HẠN',
  },
  {
    id: 'evt-05',
    title: 'Web3 & AI Developer Masterclass',
    category: 'workshop',
    categoryLabel: 'Hội thảo',
    date: '22 Tháng 12, 2026 • 08:30',
    venue: 'Innovation Hub, Thủ Đức, TP. HCM',
    organizer: 'Dev3 Community',
    priceETH: 0.02,
    priceVND: '500.000 VNĐ',
    maxSupply: 150,
    soldCount: 95,
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    badge: 'WORKSHOP',
  },
  {
    id: 'evt-06',
    title: 'Tech Marathon 2026 - Run for Green',
    category: 'sports',
    categoryLabel: 'Thể thao',
    date: '10 Tháng 01, 2027 • 05:00',
    venue: 'Hồ Hoàn Kiếm, Hà Nội',
    organizer: 'Green Tech Runners',
    priceETH: 0.025,
    priceVND: '600.000 VNĐ',
    maxSupply: 2000,
    soldCount: 1450,
    bannerUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
    badge: 'CỘNG ĐỒNG',
  },
];

// 4. Các trung tâm sự kiện lớn (Venues / Cities)
const EVENT_CITIES = [
  {
    city: 'Hà Nội',
    count: '32 sự kiện đang mở bán',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80',
    venues: 'SVĐ Mỹ Đình, TT Hội nghị NCC',
  },
  {
    city: 'TP. Hồ Chí Minh',
    count: '48 sự kiện đang mở bán',
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=500&q=80',
    venues: 'SECC Quận 7, Nhà hát Hòa Bình',
  },
  {
    city: 'Đà Nẵng',
    count: '16 sự kiện đang mở bán',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=500&q=80',
    venues: 'Cung Thể thao Tiên Sơn, Bãi biển',
  },
];

const CATEGORY_TABS = [
  { key: 'all', label: 'Tất cả sự kiện' },
  { key: 'music', label: 'Âm nhạc' },
  { key: 'technology', label: 'Công nghệ' },
  { key: 'sports', label: 'Thể thao & Game' },
  { key: 'workshop', label: 'Hội thảo' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredEvents = UPCOMING_EVENTS.filter((evt) => {
    const matchCategory = selectedCategory === 'all' || evt.category === selectedCategory;
    const matchSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh', pb: 8 }}>
      {/* =========================================================================
          1. HERO BANNER & TÌM KIẾM
      ========================================================================= */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 11 },
          pb: { xs: 8, md: 10 },
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(180deg, rgba(37, 99, 235, 0.05) 0%, rgba(248, 250, 252, 0) 100%)'
              : 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(11, 15, 25, 0) 100%)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 840, mx: 'auto', textAlign: 'center' }}>
            <Chip
              label="NỀN TẢNG BÁN VÉ SỰ KIỆN CHÍNH HÃNG & MINH BẠCH"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                mb: 2.5,
                bgcolor:
                  theme.palette.mode === 'light'
                    ? 'rgba(37, 99, 235, 0.08)'
                    : 'rgba(59, 130, 246, 0.15)',
                color: 'primary.main',
                border: 1,
                borderColor:
                  theme.palette.mode === 'light'
                    ? 'rgba(37, 99, 235, 0.2)'
                    : 'rgba(59, 130, 246, 0.3)',
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.25rem', sm: '3.25rem', md: '3.75rem' },
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                mb: 2.5,
              }}
            >
              Khám phá & Đặt vé các sự kiện{' '}
              <Box component="span" sx={{ color: 'primary.main' }}>
                đỉnh cao yêu thích
              </Box>{' '}
              của bạn
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', sm: '1.15rem' },
                color: 'text.secondary',
                lineHeight: 1.7,
                mb: 4,
                maxWidth: 680,
                mx: 'auto',
              }}
            >
              Hàng ngàn sự kiện âm nhạc, giải trí, thể thao và công nghệ hấp dẫn đang mở bán.
              Đặt vé nhanh chóng, bảo đảm vé chính hãng 100% và trải nghiệm check-in tiện lợi chỉ với một chạm.
            </Typography>

            {/* Thanh Tìm kiếm nhanh */}
            <Paper
              elevation={theme.palette.mode === 'light' ? 2 : 0}
              sx={{
                p: 1,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1,
                mb: 4,
                maxWidth: 650,
                mx: 'auto',
                boxShadow:
                  theme.palette.mode === 'light'
                    ? '0 10px 25px -5px rgba(0, 0, 0, 0.06)'
                    : 'none',
              }}
            >
              <TextField
                fullWidth
                placeholder="Tìm tên sự kiện, nghệ sĩ, địa điểm tổ chức..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start" sx={{ pl: 1.5, color: 'text.secondary' }}>
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                sx={{ py: 1 }}
              />
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 3,
                  py: 1.25,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Tìm kiếm
              </Button>
            </Paper>

            {/* Nút tác vụ nhanh */}
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => navigate('/marketplace')}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  },
                }}
              >
                Khám phá Chợ vé chuyển nhượng
              </Button>
              <Button
                variant="text"
                onClick={() => navigate('/organizer')}
                sx={{
                  fontWeight: 600,
                  px: 2,
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                Bạn là Organizer? Tạo sự kiện →
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* =========================================================================
          2. 🎯 CHỦ ĐỀ SỰ KIỆN NỔI BẬT
      ========================================================================= */}
      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '1.75rem' }, fontWeight: 800, mb: 0.5 }}>
            Chủ đề sự kiện nổi bật
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Lựa chọn nhanh những chương trình phù hợp với sở thích và đam mê của bạn
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {CATEGORY_ITEMS.map((cat) => (
            <Grid item xs={6} sm={6} md={3} key={cat.key}>
              <Paper
                elevation={0}
                onClick={() => setSelectedCategory(cat.key)}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: 1,
                  borderColor: selectedCategory === cat.key ? 'primary.main' : 'divider',
                  bgcolor: selectedCategory === cat.key
                    ? theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.06)' : 'rgba(59, 130, 246, 0.12)'
                    : 'background.paper',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor:
                      theme.palette.mode === 'light'
                        ? 'rgba(37, 99, 235, 0.1)'
                        : 'rgba(59, 130, 246, 0.15)',
                    color: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  {cat.icon}
                </Box>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {cat.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {cat.count}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* =========================================================================
          3. 🔥 SỰ KIỆN HOT TRONG THÁNG (TRENDING SPOTLIGHT)
      ========================================================================= */}
      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 5 }, pb: { xs: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' }, fontWeight: 800 }}>
                Sự kiện HOT trong tháng
              </Typography>
              <Chip
                label="THÁNG 11 & 12"
                size="small"
                color="error"
                sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Những sự kiện có lượng quan tâm lớn nhất và tốc độ bán vé nhanh nhất hiện tại
            </Typography>
          </Box>
        </Box>

        {/* 2 Banner Spotlight cỡ lớn cho sự kiện Hot */}
        <Grid container spacing={3}>
          {HOT_EVENTS_MONTH.map((event) => {
            const soldPercentage = Math.round((event.soldCount / event.maxSupply) * 100);

            return (
              <Grid item xs={12} md={6} key={event.id}>
                <Card
                  elevation={0}
                  onClick={() => navigate(`/event/${event.id}`)}
                  sx={{
                    borderRadius: 3,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: 'primary.main',
                      boxShadow:
                        theme.palette.mode === 'light'
                          ? '0 12px 28px rgba(37, 99, 235, 0.12)'
                          : '0 12px 28px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', height: 220 }}>
                    <CardMedia
                      component="img"
                      height="220"
                      image={event.bannerUrl}
                      alt={event.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)',
                      }}
                    />
                    <Chip
                      label={event.hotBadge}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 14,
                        left: 14,
                        bgcolor: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                    <Box sx={{ position: 'absolute', bottom: 14, left: 14, right: 14, color: '#fff' }}>
                      <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                        {event.categoryLabel} • {event.date}
                      </Typography>
                      <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, mt: 0.5 }} noWrap>
                        {event.title}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                      <MapPin size={15} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }} noWrap>
                        {event.venue}
                      </Typography>
                    </Box>

                    {/* Thanh tỷ lệ bán vé */}
                    <Box sx={{ mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          Đã bán {event.soldCount} / {event.maxSupply} vé
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: soldPercentage > 85 ? 'error.main' : 'primary.main' }}>
                          {soldPercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={soldPercentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: theme.palette.mode === 'light' ? '#E2E8F0' : '#334155',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: soldPercentage > 85 ? 'error.main' : 'primary.main',
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Giá vé từ
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                          {event.priceETH} ETH <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>(~{event.priceVND})</Typography>
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        size="medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event/${event.id}`);
                        }}
                        sx={{ fontWeight: 700, borderRadius: 2, px: 2.5 }}
                      >
                        Đặt vé ngay
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>



      {/* =========================================================================
          4. ⚡ SỰ KIỆN NỔI BẬT & SẮP DIỄN RA (UPCOMING SHOWS)
      ========================================================================= */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-end' }, mb: 4, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.5rem', md: '1.9rem' }, fontWeight: 800 }}>
                Sự kiện sắp diễn ra & mở bán
              </Typography>
              <Chip label="CẬP NHẬT MỚI" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
            </Box>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Danh sách các sự kiện chất lượng đang mở bán vé chính hãng
            </Typography>
          </Box>

          {/* Bộ lọc Tab thể loại */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: { xs: 1, md: 0 } }}>
            {CATEGORY_TABS.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                clickable
                onClick={() => setSelectedCategory(cat.key)}
                color={selectedCategory === cat.key ? 'primary' : 'default'}
                variant={selectedCategory === cat.key ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: selectedCategory === cat.key ? 700 : 500,
                  borderRadius: 2,
                  fontSize: '0.85rem',
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Lưới các thẻ sự kiện */}
        <Grid container spacing={3.5}>
          {filteredEvents.map((event) => {
            const soldPercentage = Math.round((event.soldCount / event.maxSupply) * 100);

            return (
              <Grid item xs={12} sm={6} md={4} key={event.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2.5,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow:
                        theme.palette.mode === 'light'
                          ? '0 12px 24px -4px rgba(0, 0, 0, 0.08)'
                          : '0 12px 24px -4px rgba(0, 0, 0, 0.4)',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {/* Poster sự kiện */}
                  <Box
                    sx={{ position: 'relative', cursor: 'pointer' }}
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={event.bannerUrl}
                      alt={event.title}
                      sx={{ objectFit: 'cover' }}
                    />
                    <Chip
                      label={event.badge}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                    <Chip
                      label={event.categoryLabel}
                      size="small"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        fontWeight: 600,
                        fontSize: '0.72rem',
                      }}
                    />
                  </Box>

                  {/* Nội dung thông tin thẻ */}
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                      <Calendar size={15} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {event.date}
                      </Typography>
                    </Box>

                    {/* Tên sự kiện */}
                    <Typography
                      variant="h3"
                      onClick={() => navigate(`/event/${event.id}`)}
                      sx={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        mb: 1.5,
                        color: 'text.primary',
                        cursor: 'pointer',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {event.title}
                    </Typography>

                    {/* Địa điểm */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.secondary', mb: 2 }}>
                      <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }} noWrap>
                        {event.venue}
                      </Typography>
                    </Box>

                    {/* Thanh nguồn cung vé */}
                    <Box sx={{ mt: 'auto', pt: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Đã bán {event.soldCount} / {event.maxSupply} vé
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {soldPercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={soldPercentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: theme.palette.mode === 'light' ? '#E2E8F0' : '#334155',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: soldPercentage > 85 ? 'status.warning' : 'primary.main',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>

                    {/* Giá vé & Nút Mua */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          Giá vé từ
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                          {event.priceETH} ETH
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ~{event.priceVND}
                        </Typography>
                      </Box>

                      <Button
                        variant="contained"
                        onClick={() => navigate(`/event/${event.id}`)}
                        sx={{
                          px: 2.5,
                          py: 1,
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        Mua vé
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* =========================================================================
          5. 📍 SỰ KIỆN THEO ĐỊA ĐIỂM / THÀNH PHỐ NỔI BẬT
      ========================================================================= */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.4rem', md: '1.75rem' }, fontWeight: 800, mb: 0.5 }}>
            Sự kiện tại các thành phố lớn
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Khám phá các đêm diễn âm nhạc và hội nghị tầm cỡ gần bạn nhất
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {EVENT_CITIES.map((item, idx) => (
            <Grid item xs={12} sm={4} key={idx}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: 'primary.main',
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '0 10px 24px rgba(0, 0, 0, 0.08)'
                        : '0 10px 24px rgba(0, 0, 0, 0.4)',
                  },
                }}
              >
                <Box sx={{ position: 'relative', height: 160 }}>
                  <CardMedia component="img" height="160" image={item.image} alt={item.city} sx={{ objectFit: 'cover' }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 70%)',
                    }}
                  />
                  <Box sx={{ position: 'absolute', bottom: 12, left: 16, color: '#fff' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.25rem' }}>
                      {item.city}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {item.count}
                    </Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Địa điểm nổi bật:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {item.venues}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* =========================================================================
          6. 🔄 CHỢ VÉ CHUYỂN NHƯỢNG CHÍNH HÃNG (MARKETPLACE TEASER)
      ========================================================================= */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            bgcolor:
              theme.palette.mode === 'light'
                ? 'rgba(37, 99, 235, 0.04)'
                : 'rgba(59, 130, 246, 0.08)',
            border: 1,
            borderColor:
              theme.palette.mode === 'light'
                ? 'rgba(37, 99, 235, 0.2)'
                : 'rgba(59, 130, 246, 0.25)',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="FAN-TO-FAN RESALE"
                size="small"
                color="primary"
                sx={{ fontWeight: 700, mb: 2, fontSize: '0.72rem' }}
              />
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                Chợ vé chuyển nhượng chính hãng & an toàn
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.7 }}>
                Bạn đã mua vé nhưng có việc bận đột xuất? Nhượng lại vé cho người hâm mộ khác dễ dàng và tiện lợi.
                Mọi giao dịch đều được xác thực tự động, bảo đảm mức giá hợp lý và loại bỏ 100% rủi ro vé giả.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/marketplace')}
                sx={{ px: 3.5, py: 1.25, fontWeight: 600, borderRadius: 2 }}
              >
                Khám phá Chợ vé chuyển nhượng
              </Button>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                elevation={theme.palette.mode === 'light' ? 2 : 0}
                sx={{
                  p: 3,
                  borderRadius: 2.5,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                  Cam kết an toàn từ BlockTickets:
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1.5 }}>
                    <Box sx={{ color: 'status.success', mt: 0.25 }}>
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Vé chính hãng 100%</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Xác thực quyền sở hữu và chuyển giao trực tiếp cho người mua mới.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1.5 }}>
                    <Box sx={{ color: 'primary.main', mt: 0.25 }}>
                      <ShieldCheck size={18} strokeWidth={2.5} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Kiểm soát giá minh bạch</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Giá chuyển nhượng được giới hạn hợp lý, loại bỏ đầu cơ vé chợ đen.</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 1.5 }}>
                    <Box sx={{ color: 'status.success', mt: 0.25 }}>
                      <CreditCard size={18} strokeWidth={2.5} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Thanh toán & Nhận vé tức thì</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Giao dịch bảo đảm an toàn, vé được gửi vào ví ngay sau khi thanh toán.</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
