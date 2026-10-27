import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Home,
  Calendar,
  MapPin,
  Check,
  ExternalLink,
  Copy,
  Minus,
  Plus,
  Ticket,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

// Dữ liệu mẫu phong phú của các sự kiện (khớp với danh sách trang chủ)
const EVENTS_DATABASE = {
  'evt-01': {
    id: 'evt-01',
    title: 'Vietnam Blockchain Summit 2026',
    category: 'technology',
    categoryLabel: 'Công nghệ / Web3',
    status: 'published',
    statusLabel: 'Đang mở bán',
    date: '15 Tháng 11, 2026',
    time: '08:30 - 18:00 (GMT+7)',
    venue: {
      name: 'Trung tâm Hội nghị Quốc gia (NCC)',
      address: 'Đại lộ Thăng Long, Mễ Trì, Nam Từ Liêm',
      city: 'Hà Nội',
    },
    organizer: {
      name: 'Vietnam Blockchain Alliance',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      wallet: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
      bio: 'Tổ chức liên minh thúc đẩy ứng dụng công nghệ chuỗi khối và hợp đồng thông minh tại Việt Nam.',
    },
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    description: `Vietnam Blockchain Summit 2026 là diễn đàn thường niên lớn nhất khu vực về công nghệ chuỗi khối, tài sản số và hệ sinh thái Web3. Sự kiện quy tụ hơn 3.000 chuyên gia, nhà phát triển, quỹ đầu tư mạo hiểm và các nhà lãnh đạo công nghệ hàng đầu thế giới để thảo luận về tương lai của phi tập trung hóa, Layer 2 scaling và tích hợp AI trên On-Chain.

Toàn bộ vé tham dự sự kiện đều được phát hành dưới dạng vé số định danh bảo mật, cam kết minh bạch số lượng và bảo đảm 100% vé chính hãng, bảo vệ quyền lợi người hâm mộ tối đa.`,
    highlights: [
      'Hơn 50+ diễn giả quốc tế từ các quỹ đầu tư Web3 hàng đầu',
      'Workshop thực hành phát triển Smart Contract bảo mật cao',
      'Khu vực Networking Lounge dành riêng cho các Founders & Builders',
      'Vé NFT độc quyền lưu giữ kỷ niệm vĩnh viễn trên On-Chain',
    ],
    agenda: [
      { time: '08:30 - 09:30', title: 'Check-in bằng mã QR động & Khai mạc hội nghị' },
      { time: '09:30 - 11:30', title: 'Keynote: Kỷ nguyên mới của Ethereum L2 & Ứng dụng thực tế' },
      { time: '11:30 - 13:00', title: 'Tiệc trưa Buffet & Networking tại sảnh VIP' },
      { time: '13:00 - 15:30', title: 'Panel thảo luận: RWA (Real World Assets) & Token hóa tài sản' },
      { time: '15:30 - 17:30', title: 'Chung kết Demo Day các dự án Blockchain xuất sắc 2026' },
      { time: '17:30 - 18:00', title: 'Bế mạc, trao giải và tiệc nhẹ After-party' },
    ],
    ticketTypes: [
      {
        id: 'tt-std-01',
        name: 'Vé Tiêu chuẩn (Standard Pass)',
        priceETH: 0.08,
        priceVND: '2.000.000 VNĐ',
        maxSupply: 400,
        soldCount: 310,
        description: 'Dành cho khách tham dự thông thường, bao gồm toàn bộ phiên họp chính.',
        perks: [
          'Tham dự tất cả các phiên thảo luận chung tại Hội trường chính',
          'NFT vé định danh ERC-721 gửi trực tiếp về ví cá nhân',
          'Tài liệu sự kiện và bộ kit chào mừng (Swag bag)',
          'Tea-break giữa giờ sáng & chiều',
        ],
        isAvailable: true,
      },
      {
        id: 'tt-vip-01',
        name: 'Vé VIP Builder (VIP Access)',
        priceETH: 0.15,
        priceVND: '3.750.000 VNĐ',
        maxSupply: 100,
        soldCount: 75,
        description: 'Trải nghiệm đỉnh cao với lối vào ưu tiên và khu vực tiếp khách cấp cao.',
        perks: [
          'Tất cả quyền lợi của Vé Tiêu chuẩn',
          'Ghế ngồi hàng đầu (Front-row VIP seat)',
          'Quyền vào phòng VIP Lounge & Tiệc trưa Networking với diễn giả',
          'NFT VIP Gold Edition với huy hiệu nhà tài trợ kỷ niệm',
          'Vé tham dự tiệc tối VIP After-party riêng tư',
        ],
        isAvailable: true,
      },
    ],
    smartContract: {
      address: '0x9E75C01391Fba9293C856a90D735d4508493B21E',
      tokenStandard: 'ERC-721 (Non-Fungible Token)',
      network: 'Ethereum Sepolia Testnet',
      resaleCap: 'Kiểm soát giá bán lại minh bạch & công bằng',
      royalty: '5% bản quyền chia sẻ cho Ban tổ chức khi bán lại',
    },
  },
  'evt-02': {
    id: 'evt-02',
    title: 'Symphony of Future - EDM Arena',
    category: 'music',
    categoryLabel: 'Âm nhạc',
    status: 'published',
    statusLabel: 'Sắp cháy vé',
    date: '28 Tháng 11, 2026',
    time: '19:30 - 23:30 (GMT+7)',
    venue: {
      name: 'Sân vận động Quốc gia Mỹ Đình',
      address: 'Đường Lê Đức Thọ, Mỹ Đình 1, Nam Từ Liêm',
      city: 'Hà Nội',
    },
    organizer: {
      name: 'SpaceSpeakers Live & Blockchain Music',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      wallet: '0x3F5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
      bio: 'Đơn vị tổ chức đại nhạc hội điện tử hàng đầu kết hợp công nghệ vé NFT chống vé giả.',
    },
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    description: `Đại nhạc hội điện tử EDM ngoài trời quy mô 20.000 khán giả với hệ thống âm thanh ánh sáng đạt chuẩn quốc tế. Cùng bùng nổ năng lượng với dàn DJ hàng đầu thế giới và các nghệ sĩ Hip-hop hàng đầu Việt Nam.

Hệ thống soát vé ứng dụng mã QR động tự động làm mới mỗi 30 giây, kết nối trực tiếp với Token ID trên Blockchain giúp loại bỏ hoàn toàn tình trạng chụp ảnh màn hình bán lại vé giả.`,
    highlights: [
      'Line-up 8 DJ quốc tế và nghệ sĩ hàng đầu Việt Nam',
      'Hệ thống âm thanh L-Acoustics đỉnh cao thế giới',
      'Mã QR động check-in 1 lần chống trùng lặp vé',
      'Chính sách chuyển nhượng vé an toàn & chính hãng',
    ],
    agenda: [
      { time: '17:00 - 19:30', title: 'Mở cửa đón khách & Hoạt động giải trí tương tác tại sảnh' },
      { time: '19:30 - 21:00', title: 'Mở màn: Set nhạc Deep House & Future Bass' },
      { time: '21:00 - 22:45', title: 'Main Stage: Trình diễn chính của dàn Headliner quốc tế' },
      { time: '22:45 - 23:30', title: 'Pháo hoa rực rỡ & Bế mạc Countdown Show' },
    ],
    ticketTypes: [
      {
        id: 'tt-ga-02',
        name: 'Vé GA (General Admission)',
        priceETH: 0.05,
        priceVND: '1.250.000 VNĐ',
        maxSupply: 1000,
        soldCount: 940,
        description: 'Vào cổng khu vực đứng tự do tại khán đài A và B.',
        perks: [
          'Vào cổng khu vực GA tự do',
          'NFT vé độc quyền thiết kế riêng theo chủ đề đại nhạc hội',
          'Tặng 01 đồ uống miễn phí tại quầy Beverage',
        ],
        isAvailable: true,
      },
      {
        id: 'tt-fanzone-02',
        name: 'Vé Fanzone Cận Sân Khấu',
        priceETH: 0.09,
        priceVND: '2.250.000 VNĐ',
        maxSupply: 200,
        soldCount: 170,
        description: 'Khu vực sát hàng rào sân khấu, tận hưởng trọn vẹn màn trình diễn của thần tượng.',
        perks: [
          'Vị trí sát sân khấu chính với góc nhìn đẹp nhất',
          'Lối check-in ưu tiên riêng không cần xếp hàng',
          'Bộ quà tặng Lightstick và áo phông giới hạn',
        ],
        isAvailable: true,
      },
    ],
    smartContract: {
      address: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
      tokenStandard: 'ERC-721 (Non-Fungible Token)',
      network: 'Ethereum Sepolia Testnet',
      resaleCap: 'Kiểm soát giá bán lại minh bạch & công bằng',
      royalty: '5% bản quyền chia sẻ cho Ban tổ chức khi bán lại',
    },
  },
};

// Dữ liệu fallback nếu ID không tồn tại trong danh sách mẫu
const FALLBACK_EVENT = {
  id: 'evt-general',
  title: 'Sự kiện Công nghệ & Đổi mới sáng tạo Blockchain 2026',
  category: 'technology',
  categoryLabel: 'Sự kiện tiêu biểu',
  status: 'published',
  statusLabel: 'Đang mở bán',
  date: '20 Tháng 12, 2026',
  time: '09:00 - 17:00 (GMT+7)',
  venue: {
    name: 'Trung tâm Hội nghị & Triển lãm SECC',
    address: '799 Nguyễn Văn Linh, Tân Phú, Quận 7',
    city: 'TP. Hồ Chí Minh',
  },
  organizer: {
    name: 'BlockTickets Ecosystem Partner',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    wallet: '0x71C...492E',
    bio: 'Ban tổ chức sự kiện chuyên nghiệp ứng dụng công nghệ vé NFT phi tập trung.',
  },
  bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  description: `Sự kiện chuyên đề kết hợp giữa giao lưu cộng đồng, hội thảo chuyên sâu và triển lãm các giải pháp chuyển đổi số đột phá. Toàn bộ vé tham dự được bảo chứng minh bạch qua Smart Contract Ethereum Sepolia, cam kết chống giả mạo tuyệt đối.`,
  highlights: [
    'Quy tụ hơn 1.000 đại biểu và khách mời doanh nghiệp',
    'Minh bạch nguồn cung vé 100% trên On-Chain',
    'Chính sách chuyển nhượng vé an toàn & minh bạch',
  ],
  agenda: [
    { time: '09:00 - 10:00', title: 'Đón khách & Check-in mã QR động' },
    { time: '10:00 - 12:00', title: 'Phiên hội thảo công nghệ' },
    { time: '13:30 - 16:30', title: 'Trình diễn giải pháp & Tọa đàm mở' },
    { time: '16:30 - 17:00', title: 'Giao lưu và bế mạc sự kiện' },
  ],
  ticketTypes: [
    {
      id: 'tt-gen-01',
      name: 'Vé Tham dự Tiêu chuẩn',
      priceETH: 0.05,
      priceVND: '1.250.000 VNĐ',
      maxSupply: 300,
      soldCount: 180,
      description: 'Quyền vào cửa toàn bộ các phiên hội nghị.',
      perks: ['Tham dự phiên họp', 'Vé NFT trên Sepolia', 'Tea-break'],
      isAvailable: true,
    },
  ],
  smartContract: {
    address: '0x9E75C01391Fba9293C856a90D735d4508493B21E',
    tokenStandard: 'ERC-721',
    network: 'Ethereum Sepolia Testnet',
    resaleCap: 'Kiểm soát giá bán lại minh bạch',
    royalty: '5%',
  },
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // Lấy dữ liệu sự kiện từ ID hoặc dùng fallback
  const event = EVENTS_DATABASE[id] || { ...FALLBACK_EVENT, id: id || 'evt-demo' };

  // Tab thông tin chi tiết
  const [activeTab, setActiveTab] = useState(0);

  // Loại vé đang được chọn
  const [selectedTicketId, setSelectedTicketId] = useState(
    event.ticketTypes && event.ticketTypes.length > 0 ? event.ticketTypes[0].id : ''
  );

  // Số lượng vé muốn mua (tối đa 4 vé để chống bot thu gom vé)
  const [quantity, setQuantity] = useState(1);

  // Modal thanh toán & mint NFT
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0: Xem đơn, 1: Đang mint on-chain, 2: Thành công
  const [mintTxHash, setMintTxHash] = useState('');
  const [mintTokenId, setMintTokenId] = useState(null);

  // Thông báo copy địa chỉ contract
  const [toastMessage, setToastMessage] = useState('');

  // Lấy chi tiết vé được chọn
  const selectedTicket =
    event.ticketTypes.find((t) => t.id === selectedTicketId) || event.ticketTypes[0];

  const subtotalETH = Number((selectedTicket.priceETH * quantity).toFixed(4));
  const estimatedGasETH = 0.0012; // Phí gas ước tính trên Sepolia testnet
  const totalETH = Number((subtotalETH + estimatedGasETH).toFixed(4));

  // Tỷ giá quy đổi ước tính (1 ETH ~ 25.000.000 VNĐ)
  const totalVND = (totalETH * 25000000).toLocaleString('vi-VN') + ' VNĐ';

  const handleCopyContract = (text) => {
    navigator.clipboard.writeText(text);
    setToastMessage('Đã sao chép địa chỉ Smart Contract vào bộ nhớ tạm!');
  };

  const handleStartPurchase = () => {
    setCheckoutStep(0);
    setIsCheckoutOpen(true);
  };

  const handleConfirmMint = () => {
    // Bước 1: Giả lập gửi giao dịch lên Ethereum Sepolia
    setCheckoutStep(1);

    setTimeout(() => {
      // Bước 2: Hoàn tất đúc vé NFT
      const fakeTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const fakeTokenId = Math.floor(1000 + Math.random() * 9000);
      setMintTxHash(fakeTx);
      setMintTokenId(fakeTokenId);
      setCheckoutStep(2);
    }, 2500);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 140px)', pb: 8 }}>
      {/* =========================================================================
          1. BREADCRUMBS & BANNER HERO SỰ KIỆN
      ========================================================================= */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          pt: 3,
          pb: 4,
        }}
      >
        <Container maxWidth="lg">
          {/* Breadcrumb điều hướng */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2.5, fontSize: '0.875rem' }}>
            <Link
              component={RouterLink}
              underline="hover"
              color="inherit"
              to="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Home size={15} />
              Trang chủ
            </Link>
            <Typography sx={{ color: 'text.secondary' }}>Khám phá sự kiện</Typography>
            <Typography sx={{ color: 'primary.main', fontWeight: 600 }}>{event.title}</Typography>
          </Breadcrumbs>

          {/* Banner chính của sự kiện */}
          <Box
            sx={{
              position: 'relative',
              borderRadius: 3,
              overflow: 'hidden',
              height: { xs: 260, sm: 380, md: 440 },
              border: 1,
              borderColor: 'divider',
              boxShadow:
                theme.palette.mode === 'light'
                  ? '0 10px 30px -5px rgba(0, 0, 0, 0.1)'
                  : '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Box
              component="img"
              src={event.bannerUrl}
              alt={event.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Lớp phủ dải màu bảo đảm tương phản */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(11, 15, 25, 0.9) 0%, rgba(11, 15, 25, 0.3) 50%, rgba(11, 15, 25, 0.1) 100%)',
              }}
            />

            {/* Badges thông tin trên ảnh banner */}
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                display: 'flex',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={event.categoryLabel}
                color="primary"
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
              <Chip
                label={event.statusLabel}
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.9)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              />
              <Chip
                label="ERC-721 NFT Vé"
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              />
            </Box>

            {/* Tiêu đề & tóm tắt nổi bật đè góc dưới banner */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: { xs: 2.5, sm: 4 },
                color: '#fff',
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '2.2rem', md: '2.6rem' },
                  fontWeight: 800,
                  lineHeight: 1.25,
                  mb: 1.5,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {event.title}
              </Typography>

              {/* Thông tin nhanh: Thời gian & Địa điểm */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 3 }}
                divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255, 255, 255, 0.25)' }} />}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calendar size={18} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event.date} • {event.time}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapPin size={18} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {event.venue.name}, {event.venue.city}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* =========================================================================
          2. NỘI DUNG CHÍNH (2 CỘT: 8 CỘT CHI TIẾT + 4 CỘT CHỌN MUA VÉ)
      ========================================================================= */}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          {/* CỘT TRÁI (8 Cột): THÔNG TIN CHI TIẾT SỰ KIỆN */}
          <Grid item xs={12} md={8}>
            {/* Card thông tin Ban tổ chức */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                component="img"
                src={event.organizer.avatar}
                alt={event.organizer.name}
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: 2,
                  borderColor: 'primary.main',
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {event.organizer.name}
                  </Typography>
                  {event.organizer.verified && (
                    <Chip
                      size="small"
                      label="Organizer đã xác thực"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {event.organizer.bio}
                </Typography>
              </Box>
            </Paper>

            {/* Thanh Tab chuyển đổi nội dung */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                mb: 3,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, val) => setActiveTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  px: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    py: 2,
                  },
                }}
              >
                <Tab label="Giới thiệu sự kiện" />
                <Tab label="Lịch trình chi tiết" />
                <Tab label="Chính sách vé & Chuyển nhượng" />
                <Tab label="Minh bạch Blockchain" />
              </Tabs>

              {/* NỘI DUNG TAB 0: GIỚI THIỆU SỰ KIỆN */}
              {activeTab === 0 && (
                <Box sx={{ p: 3.5 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 2 }}>
                    Về sự kiện này
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-line',
                      mb: 3.5,
                    }}
                  >
                    {event.description}
                  </Typography>

                  {/* Các điểm nhấn nổi bật */}
                  <Typography variant="h4" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 2 }}>
                    Điểm nổi bật không thể bỏ lỡ
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    {event.highlights.map((highlight, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor:
                              theme.palette.mode === 'light'
                                ? 'rgba(37, 99, 235, 0.04)'
                                : 'rgba(59, 130, 246, 0.06)',
                            border: 1,
                            borderColor:
                              theme.palette.mode === 'light'
                                ? 'rgba(37, 99, 235, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ color: 'primary.main', mt: 0.25 }}>
                            <Check size={18} strokeWidth={2.5} />
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {highlight}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Địa điểm & Bản đồ chỉ dẫn */}
                  <Typography variant="h4" sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1.5 }}>
                    Địa điểm tổ chức
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      {event.venue.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                      {event.venue.address}, {event.venue.city}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        event.venue.name + ', ' + event.venue.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<ExternalLink size={16} />}
                      sx={{ borderRadius: 1.5, fontWeight: 600 }}
                    >
                      Mở Google Maps chỉ đường
                    </Button>
                  </Paper>
                </Box>
              )}

              {/* NỘI DUNG TAB 1: LỊCH TRÌNH CHI TIẾT */}
              {activeTab === 1 && (
                <Box sx={{ p: 3.5 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 3 }}>
                    Chương trình sự kiện
                  </Typography>

                  <Stack spacing={2.5}>
                    {event.agenda.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2.5,
                          pb: 2.5,
                          borderBottom: index < event.agenda.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <Chip
                          label={item.time}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            bgcolor: 'action.hover',
                            color: 'text.primary',
                            borderRadius: 1.5,
                            minWidth: 120,
                            py: 1.75,
                          }}
                        />
                        <Box sx={{ pt: 0.25 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Phiên chính thức tại sảnh sự kiện
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* NỘI DUNG TAB 2: CƠ CHẾ CHỐNG PHE VÉ & CHECK-IN */}
              {activeTab === 2 && (
                <Box sx={{ p: 3.5 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 2 }}>
                    Cơ chế bảo vệ người mua vé & Công nghệ Chống Phe Vé
                  </Typography>

                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    BlockTickets sử dụng Smart Contract độc quyền trên Ethereum Sepolia để chấm dứt hoàn toàn vấn nạn phe vé, vé giả và thổi giá chợ đen.
                  </Alert>

                  <Stack spacing={2.5}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          1
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Chuyển nhượng vé an toàn & Kiểm soát giá minh bạch
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 5.5 }}>
                        Quy định mức giá chuyển nhượng được hệ thống kiểm soát tự động nhằm bảo đảm tính công bằng, loại bỏ hoàn toàn nạn phe vé đầu cơ và bảo vệ quyền lợi chính đáng của người hâm mộ.
                      </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          2
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Mã QR Động Check-in (Dynamic QR & TOTP)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 5.5 }}>
                        Vé NFT khi check-in sẽ hiển thị mã QR động được ký mã hóa bằng thuật toán TOTP làm mới liên tục mỗi 30 giây. Người mua hoàn toàn không thể chụp ảnh màn hình để bán một vé cho nhiều người.
                      </Typography>
                    </Paper>

                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                          }}
                        >
                          3
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Soát vé nguyên tử (Atomic Check-in on Blockchain)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 5.5 }}>
                        Khi ban tổ chức quét mã QR tại cổng vào, trạng thái vé chuyển sang `isUsed = true` vĩnh viễn trên On-Chain. Vé đã sử dụng không thể chuyển nhượng hoặc quét lại lần thứ hai.
                      </Typography>
                    </Paper>
                  </Stack>
                </Box>
              )}

              {/* NỘI DUNG TAB 3: MINH BẠCH BLOCKCHAIN */}
              {activeTab === 3 && (
                <Box sx={{ p: 3.5 }}>
                  <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 700, mb: 2 }}>
                    Thông số Kỹ thuật & Smart Contract
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Mỗi vé phát hành tại BlockTickets đều tương ứng với một Token ID duy nhất trên mạng thử nghiệm Sepolia. Mọi người đều có thể kiểm tra nguồn cung và quyền sở hữu công khai trên Etherscan.
                  </Typography>

                  <Stack spacing={2}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        ĐỊA CHỈ SMART CONTRACT (EVENT TICKET)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', wordBreak: 'break-all' }}
                        >
                          {event.smartContract.address}
                        </Typography>
                        <Tooltip title="Sao chép địa chỉ">
                          <IconButton size="small" onClick={() => handleCopyContract(event.smartContract.address)}>
                            <Copy size={18} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Chuẩn Token
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25 }}>
                            {event.smartContract.tokenStandard}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Mạng Blockchain
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25 }}>
                            {event.smartContract.network}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Quy định Trần giá bán lại
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25, color: 'status.warning' }}>
                            {event.smartContract.resaleCap}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Phí bản quyền cho Organizer
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 0.25, color: 'status.success' }}>
                            {event.smartContract.royalty}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* CỘT PHẢI (4 Cột): CARD CHỌN LOẠI VÉ & THANH TOÁN (STICKY) */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 90 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: 2,
                  borderColor: 'primary.main',
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? '0 12px 32px -4px rgba(37, 99, 235, 0.12)'
                      : '0 12px 32px -4px rgba(0, 0, 0, 0.4)',
                }}
              >
                <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, mb: 0.5 }}>
                  Chọn vé tham dự
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                  Vé đúc thành NFT trực tiếp vào ví Web3 của bạn
                </Typography>

                {/* Danh sách các hạng vé */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  {event.ticketTypes.map((ticket) => {
                    const isSelected = ticket.id === selectedTicketId;
                    const remaining = ticket.maxSupply - ticket.soldCount;
                    const soldPercent = Math.round((ticket.soldCount / ticket.maxSupply) * 100);

                    return (
                      <Card
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        elevation={0}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          borderRadius: 2,
                          border: 2,
                          borderColor: isSelected ? 'primary.main' : 'divider',
                          bgcolor: isSelected
                            ? theme.palette.mode === 'light'
                              ? 'rgba(37, 99, 235, 0.04)'
                              : 'rgba(59, 130, 246, 0.08)'
                            : 'background.default',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {ticket.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Còn lại {remaining} / {ticket.maxSupply} vé
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
                              {ticket.priceETH} ETH
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              ~{ticket.priceVND}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Thanh tỷ lệ đã bán */}
                        <LinearProgress
                          variant="determinate"
                          value={soldPercent}
                          sx={{
                            height: 5,
                            borderRadius: 2,
                            mb: 1.5,
                            bgcolor: theme.palette.mode === 'light' ? '#E2E8F0' : '#334155',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: soldPercent > 80 ? 'status.warning' : 'primary.main',
                            },
                          }}
                        />

                        {/* Danh sách quyền lợi kèm theo vé */}
                        <Stack spacing={0.5}>
                          {ticket.perks.slice(0, 2).map((perk, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ color: 'status.success', display: 'flex' }}>
                                <Check size={14} strokeWidth={3} />
                              </Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {perk}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Card>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Chọn số lượng vé */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Số lượng vé
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Tối đa 4 vé / ví (Chống bot)
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      p: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    >
                      <Minus size={16} strokeWidth={2.5} />
                    </IconButton>

                    <Typography sx={{ width: 36, textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                      {quantity}
                    </Typography>

                    <IconButton
                      size="small"
                      disabled={quantity >= 4}
                      onClick={() => setQuantity((prev) => Math.min(4, prev + 1))}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Chi tiết tính giá thanh toán */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: 1,
                    borderColor: 'divider',
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Giá vé ({quantity} x {selectedTicket.priceETH} ETH)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {subtotalETH} ETH
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Ước tính phí gas Sepolia
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ~{estimatedGasETH} ETH
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Tổng thanh toán
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h3" sx={{ fontSize: '1.35rem', fontWeight: 800, color: 'primary.main' }}>
                        {totalETH} ETH
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ~{totalVND}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* NÚT MUA VÉ NGAY */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleStartPurchase}
                  startIcon={<Ticket size={20} />}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  Mua vé ngay (Mint NFT)
                </Button>

                {/* Cam kết bảo vệ từ hợp đồng thông minh */}
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <ShieldCheck size={14} style={{ color: '#10B981' }} />
                    Cam kết 100% vé chính hãng • Chuyển nhượng an toàn
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* =========================================================================
          3. DIALOG XÁC NHẬN MINT VÉ NFT TRÊN BLOCKCHAIN
      ========================================================================= */}
      <Dialog
        open={isCheckoutOpen}
        onClose={() => {
          if (checkoutStep !== 1) setIsCheckoutOpen(false);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
          },
        }}
      >
        {checkoutStep === 0 && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', pb: 1 }}>
              Xác nhận Mua Vé NFT
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
                Vui lòng kiểm tra lại thông tin vé trước khi ký giao dịch trên ví Web3 (Sepolia Testnet).
              </Typography>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  {event.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  {event.date} • {event.venue.name}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Hạng vé:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedTicket.name}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Số lượng:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {quantity} vé
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Tổng tiền:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {totalETH} ETH (~{totalVND})
                  </Typography>
                </Box>
              </Paper>

              <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
                Giao dịch sẽ đúc trực tiếp Token ERC-721 vào địa chỉ ví của bạn và không thể hủy sau khi đã ghi lên khối.
              </Alert>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setIsCheckoutOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Hủy bỏ
              </Button>
              <Button variant="contained" onClick={handleConfirmMint} sx={{ fontWeight: 700, px: 3 }}>
                Xác nhận & Ký ví
              </Button>
            </DialogActions>
          </>
        )}

        {checkoutStep === 1 && (
          <DialogContent sx={{ py: 6, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'rgba(37, 99, 235, 0.1)',
                  color: 'primary.main',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Loader2
                  size={32}
                  strokeWidth={2.5}
                  style={{
                    animation: 'spin 1s linear infinite',
                  }}
                />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontSize: '1.25rem', fontWeight: 800, mb: 1 }}>
              Đang xác thực giao dịch...
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, mx: 'auto', mb: 3 }}>
              Vui lòng không tắt trình duyệt. Smart Contract đang tiến hành đúc vé NFT trên Ethereum Sepolia.
            </Typography>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </DialogContent>
        )}

        {checkoutStep === 2 && (
          <>
            <DialogContent sx={{ py: 4, textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: 'status.success',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </Box>

              <Typography variant="h3" sx={{ fontSize: '1.35rem', fontWeight: 800, mb: 1, color: 'text.primary' }}>
                Đúc Vé NFT Thành Công!
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                Vé tham dự của bạn đã được ghi nhận bất biến trên On-Chain.
              </Typography>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', textAlign: 'left', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Token ID (NFT):
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>
                    #{mintTokenId}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Số lượng:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {quantity} vé ({selectedTicket.name})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Mã băm giao dịch (TxHash):
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {mintTxHash.slice(0, 8)}...{mintTxHash.slice(-6)}
                  </Typography>
                </Box>
              </Paper>

              <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.82rem', textAlign: 'left' }}>
                Bạn có thể xem mã QR động check-in bất kỳ lúc nào tại kho vé của mình.
              </Alert>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setIsCheckoutOpen(false)}
                sx={{ fontWeight: 600, borderRadius: 2 }}
              >
                Đóng
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  navigate('/');
                }}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              >
                Về trang chủ
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage('')}
        message={toastMessage}
      />
    </Box>
  );
}
