import React, { useState, useMemo } from 'react';
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
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Breadcrumbs,
    Link,
    Paper,
    useTheme,
} from '@mui/material';
import {
    Storefront,
    LocalOffer,
    Search,
    FilterList,
    SwapHoriz,
    CheckCircle,
    Warning,
    Shield,
    Security,
    OpenInNew,
    ContentCopy,
    Close,
    Refresh,
    ArrowForward,
    HelpOutline,
    ConfirmationNumber,
    AccountBalanceWallet,
    Schedule,
    LocationOn,
    TrendingUp,
    InfoOutlined,
    Gavel,
    MonetizationOn,
    Verified,
    Check,
    HourglassEmpty,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

// MetaMask SVG Icon
const MetaMaskIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 318 318" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M274.1 35.5L174.6 108.7L193.5 64.3L274.1 35.5Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44.4 35.5L143.1 109.4L125.1 64.3L44.4 35.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M238.3 206.8L211.8 248.1L268.5 263.4L284.5 207.7L238.3 206.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34.1 207.7L49.9 263.4L106.6 248.1L80.1 206.8L34.1 207.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M103.6 138.2L88.1 161.7L144.4 164.2L142.5 103.8L103.6 138.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M214.9 138.2L175.5 103.1L174.6 164.2L230.5 161.7L214.9 138.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M106.6 248.1L141 232.7L111.4 208.1L106.6 248.1Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M177.5 232.7L211.8 248.1L207.1 208.1L177.5 232.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// Helper rút gọn địa chỉ ví & hash
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu danh sách vé niêm yết bán lại trên sàn thứ cấp (Resale Listings)
const INITIAL_RESALE_LISTINGS = [
    {
        id: 1,
        tokenId: 1422,
        eventId: 'EVT-2026-002',
        eventTitle: 'Vietnam Blockchain Summit 2026',
        category: 'technology',
        categoryLabel: 'Công nghệ & Web3',
        tierName: 'VIP Networking Pass',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        venue: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
        startTime: '28/11/2026 - 08:30',
        organizerName: 'TechChain Foundation',
        sellerWallet: '0x3F8a1b920194812301928394819203849102334A',
        originalPrice: 0.25, // ETH
        resalePrice: 0.28,   // ETH (+12% so với giá gốc, hợp lệ <= 0.30)
        maxAllowedPrice: 0.30, // 0.25 * 1.2
        royaltyFeePercent: 5,  // 5% cho Organizer
        listedAt: '35 phút trước',
        txHash: '0x9a8f3b12dc089148b39019284918239018294018234810239481902371ef8923',
    },
    {
        id: 2,
        tokenId: 312,
        eventId: 'EVT-2026-001',
        eventTitle: 'Hòa Nhạc Giao Hưởng Mùa Thu 2026',
        category: 'music',
        categoryLabel: 'Âm nhạc cổ điển',
        tierName: 'Hạng Standard Pass',
        bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
        venue: 'Nhà Hát Lớn Hà Nội, 01 Tràng Tiền',
        startTime: '15/11/2026 - 20:00',
        organizerName: 'Hanoi Philharmonic Orchestra',
        sellerWallet: '0x812A990812Da7201bF241cba0982E12Da9911910',
        originalPrice: 0.08,
        resalePrice: 0.075,  // ETH (-6.25% Giá tốt dưới giá gốc)
        maxAllowedPrice: 0.096,
        royaltyFeePercent: 5,
        listedAt: '2 giờ trước',
        txHash: '0x5c7e19283019284918239018294018234810239481902371ef892312dc089148',
    },
    {
        id: 3,
        tokenId: 508,
        eventId: 'EVT-2026-003',
        eventTitle: 'Vietnam Esports Championship 2026',
        category: 'esports',
        categoryLabel: 'Thể thao điện tử',
        tierName: 'Khán Đài A - Ghế Trung Tâm',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        venue: 'Nhà thi đấu Phú Thọ, TP. Hồ Chí Minh',
        startTime: '05/12/2026 - 14:00',
        organizerName: 'Vietnam Esports Association (VIRESA)',
        sellerWallet: '0x498b9102934812301928394819203849102334EF',
        originalPrice: 0.15,
        resalePrice: 0.18,   // ETH (+20% Chạm trần 120%)
        maxAllowedPrice: 0.18,
        royaltyFeePercent: 5,
        listedAt: '4 giờ trước',
        txHash: '0x3d2b918239018294018234810239481902371ef892312dc089148b3901928491',
    },
    {
        id: 4,
        tokenId: 904,
        eventId: 'EVT-2026-004',
        eventTitle: 'EDM Sunset Festival Hanoi 2026',
        category: 'music',
        categoryLabel: 'Lễ hội âm nhạc EDM',
        tierName: 'Early Bird Pass (Zone A)',
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        venue: 'Công viên Yên Sở, Hoàng Mai, Hà Nội',
        startTime: '10/12/2026 - 16:30',
        organizerName: 'SoundWave Entertainment',
        sellerWallet: '0x629c910293481230192839481920384910233481',
        originalPrice: 0.12,
        resalePrice: 0.14,   // ETH (+16.6%)
        maxAllowedPrice: 0.144,
        royaltyFeePercent: 5,
        listedAt: '5 giờ trước',
        txHash: '0x7f1a3b12dc089148b39019284918239018294018234810239481902371ef8923',
    },
    {
        id: 5,
        tokenId: 771,
        eventId: 'EVT-2026-005',
        eventTitle: 'Chung Kết Cúp Bóng Đá V-League 2026',
        category: 'sports',
        categoryLabel: 'Thể thao & Bóng đá',
        tierName: 'Khán Đài VIP Khán Giả',
        bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
        venue: 'Sân vận động Quốc gia Mỹ Đình, Hà Nội',
        startTime: '20/12/2026 - 19:00',
        organizerName: 'VPF Football Association',
        sellerWallet: '0x109e910293481230192839481920384910233423',
        originalPrice: 0.35,
        resalePrice: 0.40,   // ETH (+14.3%)
        maxAllowedPrice: 0.42,
        royaltyFeePercent: 5,
        listedAt: '8 giờ trước',
        txHash: '0x4e6c3b12dc089148b39019284918239018294018234810239481902371ef8923',
    },
    {
        id: 6,
        tokenId: 219,
        eventId: 'EVT-2026-006',
        eventTitle: 'Tech AI & Big Data Expo 2026',
        category: 'technology',
        categoryLabel: 'Công nghệ & AI',
        tierName: 'Standard Conference Pass',
        bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        venue: 'Trung tâm Triển lãm SECC, Quận 7, TP.HCM',
        startTime: '18/01/2027 - 09:00',
        organizerName: 'AI Innovation Hub Vietnam',
        sellerWallet: '0x992d910293481230192839481920384910233488',
        originalPrice: 0.10,
        resalePrice: 0.11,   // ETH (+10%)
        maxAllowedPrice: 0.12,
        royaltyFeePercent: 5,
        listedAt: '1 ngày trước',
        txHash: '0x1a2b3c12dc089148b39019284918239018294018234810239481902371ef8923',
    },
];

const CATEGORIES = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'technology', label: 'Công nghệ & Web3' },
    { value: 'music', label: 'Âm nhạc & Lễ hội' },
    { value: 'esports', label: 'Thể thao điện tử' },
    { value: 'sports', label: 'Thể thao & Bóng đá' },
];

const SORT_OPTIONS = [
    { value: 'newest', label: 'Mới niêm yết nhất' },
    { value: 'price_asc', label: 'Giá: Thấp đến cao' },
    { value: 'price_desc', label: 'Giá: Cao đến thấp' },
    { value: 'discount', label: 'Giá tốt nhất so với giá gốc' },
];

const MarketplacePage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Danh sách vé niêm yết
    const [listings, setListings] = useState(INITIAL_RESALE_LISTINGS);

    // Bộ lọc & Tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under_01' | '01_to_025' | 'above_025'

    // Ví MetaMask & Số dư
    const [walletAddress] = useState(user?.walletAddress || '0x789b9102934812301928394819203849102334ef');
    const [walletBalance] = useState('1.45 ETH');

    // Dialog giải thích BR-02
    const [openRuleDialog, setOpenRuleDialog] = useState(false);

    // Dialog Mua vé thứ cấp
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [openBuyModal, setOpenBuyModal] = useState(false);
    const [buyStep, setBuyStep] = useState('initial'); // 'initial' | 'pending_signature' | 'verifying_block' | 'confirmed'
    const [generatedTxHash, setGeneratedTxHash] = useState('');

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
    };

    // Lọc và sắp xếp danh sách vé
    const filteredListings = useMemo(() => {
        return listings.filter((item) => {
            // Lọc theo từ khóa (tên sự kiện, Token ID, địa điểm, hạng vé)
            const matchesSearch =
                item.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.tokenId.toString().includes(searchTerm.trim());

            // Lọc theo danh mục
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

            // Lọc theo khoảng giá
            let matchesPrice = true;
            if (priceRange === 'under_01') {
                matchesPrice = item.resalePrice < 0.1;
            } else if (priceRange === '01_to_025') {
                matchesPrice = item.resalePrice >= 0.1 && item.resalePrice <= 0.25;
            } else if (priceRange === 'above_025') {
                matchesPrice = item.resalePrice > 0.25;
            }

            return matchesSearch && matchesCategory && matchesPrice;
        }).sort((a, b) => {
            if (sortBy === 'price_asc') return a.resalePrice - b.resalePrice;
            if (sortBy === 'price_desc') return b.resalePrice - a.resalePrice;
            if (sortBy === 'discount') {
                const diffA = (a.resalePrice - a.originalPrice) / a.originalPrice;
                const diffB = (b.resalePrice - b.originalPrice) / b.originalPrice;
                return diffA - diffB; // Ưu tiên vé có giá rẻ hơn hoặc tăng ít hơn
            }
            // 'newest' default
            return b.id - a.id;
        });
    }, [listings, searchTerm, selectedCategory, sortBy, priceRange]);

    // Mở modal mua vé
    const handleOpenBuyModal = (ticket) => {
        setSelectedTicket(ticket);
        setBuyStep('initial');
        setOpenBuyModal(true);
    };

    // Tiến hành mua vé qua Web3 (Quy trình 3 bước)
    const handleConfirmBuy = () => {
        // Bước 1: Yêu cầu ký ví MetaMask
        setBuyStep('pending_signature');

        setTimeout(() => {
            // Bước 2: Ký thành công, gửi giao dịch lên mạng Sepolia
            const mockTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            setGeneratedTxHash(mockTx);
            setBuyStep('verifying_block');

            setTimeout(() => {
                // Bước 3: Đóng block thành công trên Sepolia
                setBuyStep('confirmed');

                // Xóa vé đã bán khỏi danh sách thị trường
                setListings((prev) => prev.filter((item) => item.tokenId !== selectedTicket.tokenId));
            }, 3000);
        }, 2000);
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Thanh điều hướng toàn cục */}
            <Navbar />

            {/* VÙNG NỘI DUNG CHÍNH */}
            <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
                <Container maxWidth="lg">
                    {/* BREADCRUMB */}
                    <Breadcrumbs
                        aria-label="breadcrumb"
                        sx={{ mb: 2.5, '& a': { textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } } }}
                    >
                        <Link component={RouterLink} to="/">Trang chủ</Link>
                        <Typography color="text.primary" fontWeight={600}>
                            Chợ vé thứ cấp (Marketplace)
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
                            boxShadow: theme.palette.mode === 'light' ? '0 4px 20px rgba(0, 0, 0, 0.05)' : 'none',
                            mb: 4,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative Background Accent */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -60,
                                right: -60,
                                width: 220,
                                height: 220,
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${theme.palette.primary.main}15 0%, transparent 70%)`,
                                pointerEvents: 'none',
                            }}
                        />

                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={8}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1.5} flexWrap="wrap" useFlexGap>
                                    <Chip
                                        icon={<Storefront sx={{ fontSize: '1rem !important' }} />}
                                        label="CHỢ THỨ CẤP MINH BẠCH • ERC-721 RESALE"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em' }}
                                    />
                                    <Chip
                                        icon={<Shield sx={{ fontSize: '1rem !important' }} />}
                                        label="QUY TẮC BR-02: TRẦN GIÁ 120%"
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            bgcolor: theme.palette.status?.warningBg || 'rgba(249, 115, 22, 0.12)',
                                            color: theme.palette.status?.warning || 'warning.main',
                                            border: 1,
                                            borderColor: 'warning.main',
                                        }}
                                    />
                                </Stack>

                                <Typography
                                    variant="h1"
                                    color="text.primary"
                                    fontWeight={800}
                                    sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, lineHeight: 1.25, mb: 1.5 }}
                                >
                                    Sàn Chuyển Nhượng Vé NFT BlockTickets
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, lineHeight: 1.65, mb: 3 }}>
                                    Mua lại vé sự kiện chính chủ từ người tham gia khác với sự bảo đảm tuyệt đối của Smart Contract Ethereum Sepolia.
                                    Không phe vé chợ đen, không đội giá cắt cổ — mọi giao dịch đều tuân thủ trần giá tối đa <strong>120% giá gốc</strong>.
                                </Typography>

                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        component={RouterLink}
                                        to="/my-tickets"
                                        startIcon={<ConfirmationNumber />}
                                        sx={{ height: 44, px: 3, borderRadius: '8px', fontWeight: 600 }}
                                    >
                                        Niêm Yết Bán Vé Của Tôi
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<HelpOutline />}
                                        onClick={() => setOpenRuleDialog(true)}
                                        sx={{ height: 44, px: 2.5, borderRadius: '8px', fontWeight: 600 }}
                                    >
                                        Cách Hoạt Động & Quy Tắc BR-02
                                    </Button>
                                </Stack>
                            </Grid>

                            {/* Tóm tắt ví & Mạng lưới */}
                            <Grid item xs={12} md={4}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '12px',
                                        bgcolor: 'background.subtle',
                                        border: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                                        <MetaMaskIcon size={24} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Ví giao dịch đang kết nối
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                                {truncateHash(walletAddress, 8, 6)}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="caption" color="text.secondary">
                                            Số dư khả dụng:
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                            {walletBalance}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            Mạng lưới Blockchain:
                                        </Typography>
                                        <Chip
                                            label="Sepolia Testnet"
                                            size="small"
                                            sx={{
                                                height: 22,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                bgcolor: theme.palette.status?.onchainBg || 'rgba(99, 102, 241, 0.12)',
                                                color: theme.palette.status?.onchain || 'primary.main',
                                            }}
                                        />
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* LIVE MARKET STATS BAR */}
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        <Grid item xs={6} sm={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                    VÉ ĐANG NIÊM YẾT
                                </Typography>
                                <Typography variant="h3" fontWeight={800} color="primary.main">
                                    {listings.length} Vé
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Sẵn sàng chuyển nhượng
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                    TRẦN GIÁ BẢO VỆ
                                </Typography>
                                <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.status?.warning || 'warning.main' }}>
                                    120% Max
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Smart Contract Revert
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                    BẢN QUYỀN BAN TỔ CHỨC
                                </Typography>
                                <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.status?.success || 'success.main' }}>
                                    5% Royalty
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tự động trích chia BTC
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
                                    KHỐI LƯỢNG 24H
                                </Typography>
                                <Typography variant="h3" fontWeight={800} color="text.primary">
                                    14.85 ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ~$48,500 USD Sepolia
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* SEARCH & FILTERS TOOLBAR */}
                    <Paper
                        elevation={0}
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
                            {/* Ô tìm kiếm */}
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Tìm theo sự kiện, Token ID, địa điểm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchTerm && (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    aria-label="Xóa từ khóa tìm kiếm"
                                                    onClick={() => setSearchTerm('')}
                                                >
                                                    <Close fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Danh mục sự kiện */}
                            <Grid item xs={6} sm={4} md={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="category-filter-label">Danh mục</InputLabel>
                                    <Select
                                        labelId="category-filter-label"
                                        value={selectedCategory}
                                        label="Danh mục"
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <MenuItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Khoảng giá */}
                            <Grid item xs={6} sm={4} md={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="price-range-label">Khoảng giá ETH</InputLabel>
                                    <Select
                                        labelId="price-range-label"
                                        value={priceRange}
                                        label="Khoảng giá ETH"
                                        onChange={(e) => setPriceRange(e.target.value)}
                                    >
                                        <MenuItem value="all">Tất cả mức giá</MenuItem>
                                        <MenuItem value="under_01">&lt; 0.1 ETH</MenuItem>
                                        <MenuItem value="01_to_025">0.1 - 0.25 ETH</MenuItem>
                                        <MenuItem value="above_025">&gt; 0.25 ETH</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Sắp xếp */}
                            <Grid item xs={12} sm={4} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="sort-filter-label">Sắp xếp theo</InputLabel>
                                    <Select
                                        labelId="sort-filter-label"
                                        value={sortBy}
                                        label="Sắp xếp theo"
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {/* Thanh chỉ số kết quả lọc */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2} pt={1.5} borderTop={1} borderColor="divider">
                            <Typography variant="body2" color="text.secondary">
                                Hiển thị <strong>{filteredListings.length}</strong> vé phù hợp
                            </Typography>

                            {(searchTerm || selectedCategory !== 'all' || priceRange !== 'all') && (
                                <Button
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                        setPriceRange('all');
                                    }}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Đặt lại bộ lọc
                                </Button>
                            )}
                        </Stack>
                    </Paper>

                    {/* DANH SÁCH THẺ VÉ NIÊM YẾT (RESALE TICKET CARDS GRID) */}
                    {filteredListings.length === 0 ? (
                        /* Trạng thái không tìm thấy vé phù hợp */
                        <Paper
                            elevation={0}
                            sx={{
                                p: 6,
                                textAlign: 'center',
                                borderRadius: '16px',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Storefront sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h3" fontWeight={700} gutterBottom>
                                Không tìm thấy vé phù hợp
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 3 }}>
                                Không có vé NFT nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn. Hãy thử thay đổi từ khóa hoặc khoảng giá.
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                    setPriceRange('all');
                                }}
                                sx={{ borderRadius: '8px', fontWeight: 600 }}
                            >
                                Hiển Thị Tất Cả Vé Niêm Yết
                            </Button>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredListings.map((ticket) => {
                                // Tính phần trăm chênh lệch so với giá gốc
                                const priceDiff = ((ticket.resalePrice - ticket.originalPrice) / ticket.originalPrice) * 100;
                                const isDiscount = priceDiff < 0;
                                const isMaxCap = Math.abs(ticket.resalePrice - ticket.maxAllowedPrice) < 0.0001;

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={ticket.id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: '16px',
                                                bgcolor: 'background.paper',
                                                border: 1,
                                                borderColor: 'divider',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: theme.palette.mode === 'light'
                                                        ? '0 12px 24px -4px rgba(0, 0, 0, 0.1)'
                                                        : '0 12px 24px -4px rgba(0, 0, 0, 0.4)',
                                                },
                                            }}
                                        >
                                            {/* Poster Sự Kiện & Badges */}
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component="img"
                                                    height="180"
                                                    image={ticket.bannerUrl}
                                                    alt={ticket.eventTitle}
                                                    sx={{ objectFit: 'cover' }}
                                                />

                                                {/* Chip Danh mục */}
                                                <Chip
                                                    label={ticket.categoryLabel}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        left: 12,
                                                        bgcolor: 'rgba(15, 23, 42, 0.75)',
                                                        color: '#FFFFFF',
                                                        backdropFilter: 'blur(4px)',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />

                                                {/* Badge Chênh lệch giá so với giá gốc */}
                                                <Chip
                                                    label={
                                                        isDiscount
                                                            ? `${priceDiff.toFixed(1)}% (Giá tốt)`
                                                            : isMaxCap
                                                            ? `+${priceDiff.toFixed(0)}% (Kịch trần 120%)`
                                                            : `+${priceDiff.toFixed(1)}% vs gốc`
                                                    }
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        right: 12,
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        bgcolor: isDiscount
                                                            ? theme.palette.status?.success || 'success.main'
                                                            : isMaxCap
                                                            ? theme.palette.status?.warning || 'warning.main'
                                                            : 'primary.main',
                                                        color: '#FFFFFF',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                                    }}
                                                />

                                                {/* Token ID Pill góc dưới banner */}
                                                <Chip
                                                    icon={<ConfirmationNumber sx={{ fontSize: '0.9rem !important', color: 'inherit' }} />}
                                                    label={`Token #${ticket.tokenId}`}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 12,
                                                        left: 12,
                                                        bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                        color: '#F8FAFC',
                                                        backdropFilter: 'blur(4px)',
                                                        fontFamily: 'monospace',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            </Box>

                                            {/* Nội dung chi tiết Thẻ */}
                                            <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
                                                {/* Tên sự kiện & Hạng vé */}
                                                <Typography
                                                    variant="h3"
                                                    component={RouterLink}
                                                    to={`/events/${ticket.eventId}`}
                                                    sx={{
                                                        fontSize: '1.1rem',
                                                        fontWeight: 700,
                                                        color: 'text.primary',
                                                        textDecoration: 'none',
                                                        lineHeight: 1.35,
                                                        mb: 0.5,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        '&:hover': { color: 'primary.main' },
                                                    }}
                                                >
                                                    {ticket.eventTitle}
                                                </Typography>

                                                <Typography
                                                    variant="subtitle2"
                                                    color="primary.main"
                                                    fontWeight={600}
                                                    sx={{ mb: 1.5 }}
                                                >
                                                    {ticket.tierName}
                                                </Typography>

                                                {/* Ngày giờ & Địa điểm */}
                                                <Stack spacing={0.75} sx={{ mb: 2 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {ticket.startTime}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            noWrap
                                                            title={ticket.venue}
                                                        >
                                                            {ticket.venue}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>

                                                <Divider sx={{ my: 1.5 }} />

                                                {/* Thông tin ví người bán */}
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Người bán:
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}
                                                        >
                                                            {truncateHash(ticket.sellerWallet, 6, 4)}
                                                        </Typography>
                                                        <Tooltip title="Sao chép địa chỉ ví người bán">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Sao chép ví người bán"
                                                                onClick={() => handleCopy(ticket.sellerWallet, 'địa chỉ ví')}
                                                            >
                                                                <ContentCopy sx={{ fontSize: 13 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Stack>

                                                {/* Khung So sánh Giá Vé Minh Bạch (Quy tắc BR-02) */}
                                                <Box
                                                    sx={{
                                                        p: 1.75,
                                                        borderRadius: '10px',
                                                        bgcolor: 'background.subtle',
                                                        border: 1,
                                                        borderColor: 'divider',
                                                        mb: 2.5,
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.5}>
                                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                            Giá bán lại:
                                                        </Typography>
                                                        <Typography variant="h3" fontWeight={800} color="primary.main">
                                                            {ticket.resalePrice} ETH
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Giá gốc: {ticket.originalPrice} ETH
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                            Trần 120%: {ticket.maxAllowedPrice} ETH
                                                        </Typography>
                                                    </Stack>
                                                </Box>

                                                {/* Nút Mua Vé Ngay */}
                                                <Box sx={{ mt: 'auto' }}>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        fullWidth
                                                        size="large"
                                                        startIcon={<SwapHoriz />}
                                                        onClick={() => handleOpenBuyModal(ticket)}
                                                        sx={{
                                                            height: 44,
                                                            borderRadius: '8px',
                                                            fontWeight: 600,
                                                            fontSize: '0.95rem',
                                                        }}
                                                    >
                                                        Mua Lại Vé Ngay
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Container>
            </Box>

            {/* MODAL MUA LẠI VÉ THỨ CẤP (BUY RESALE TICKET MODAL - FLOW 3 BƯỚC WEB3) */}
            <Dialog
                open={openBuyModal}
                onClose={() => {
                    if (buyStep !== 'verifying_block') {
                        setOpenBuyModal(false);
                    }
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: { xs: 1, sm: 2 },
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
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
                                <SwapHoriz />
                            </Box>
                            <Box>
                                <Typography variant="h3" fontWeight={700}>
                                    Xác Nhận Mua Vé Thứ Cấp
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Thanh toán on-chain qua Smart Contract TicketMarketplace
                                </Typography>
                            </Box>
                        </Stack>
                        {buyStep !== 'verifying_block' && (
                            <IconButton
                                size="small"
                                aria-label="Đóng popup xác nhận mua vé"
                                onClick={() => setOpenBuyModal(false)}
                            >
                                <Close />
                            </IconButton>
                        )}
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    {selectedTicket && (
                        <>
                            {/* BƯỚC 0: TÓM TẮT ĐƠN HÀNG TRƯỚC KHI KÝ VÍ */}
                            {buyStep === 'initial' && (
                                <Stack spacing={2.5}>
                                    {/* Thông tin vé mua */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: '12px',
                                            bgcolor: 'background.subtle',
                                            border: 1,
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight={700} color="text.primary" gutterBottom>
                                            {selectedTicket.eventTitle}
                                        </Typography>
                                        <Typography variant="body2" color="primary.main" fontWeight={600} mb={1}>
                                            {selectedTicket.tierName} • Token ID #{selectedTicket.tokenId}
                                        </Typography>

                                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                            <Schedule sx={{ fontSize: 15, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {selectedTicket.startTime}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <LocationOn sx={{ fontSize: 15, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {selectedTicket.venue}
                                            </Typography>
                                        </Stack>
                                    </Paper>

                                    {/* Bảng phân bổ tài chính minh bạch (Royalty Fee 5%) */}
                                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', p: 2 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1.5}>
                                            CHI TIẾT PHÂN BỔ THANH TOÁN (ON-CHAIN)
                                        </Typography>

                                        <Stack spacing={1}>
                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Giá niêm yết vé:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedTicket.resalePrice} ETH
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Phí bản quyền BTC (5% Royalty):
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.status?.success || 'success.main' }}>
                                                    +{(selectedTicket.resalePrice * 0.05).toFixed(4)} ETH
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Người bán thực nhận (95%):
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {(selectedTicket.resalePrice * 0.95).toFixed(4)} ETH
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" justifyContent="space-between">
                                                <Typography variant="body2" color="text.secondary">
                                                    Ước tính phí Gas (Sepolia):
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ~0.0021 ETH
                                                </Typography>
                                            </Stack>

                                            <Divider sx={{ my: 1 }} />

                                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    Tổng số tiền thanh toán:
                                                </Typography>
                                                <Typography variant="h3" fontWeight={800} color="primary.main">
                                                    {(selectedTicket.resalePrice + 0.0021).toFixed(4)} ETH
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    {/* Cảnh báo an toàn Smart Contract */}
                                    <Alert
                                        severity="info"
                                        icon={<Shield />}
                                        sx={{ borderRadius: '10px', fontSize: '0.85rem' }}
                                    >
                                        Vé NFT sẽ được chuyển giao tức thì (Atomic Swap) vào ví MetaMask của bạn ngay khi khối giao dịch được thợ đào Sepolia xác nhận.
                                    </Alert>
                                </Stack>
                            )}

                            {/* BƯỚC 1: ĐANG CHỜ KÝ VÍ METAMASK */}
                            {buyStep === 'pending_signature' && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Box sx={{ mb: 2 }}>
                                        <MetaMaskIcon size={56} />
                                    </Box>
                                    <Typography variant="h3" fontWeight={700} gutterBottom>
                                        Vui lòng ký giao dịch trên MetaMask
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
                                        Cửa sổ ví MetaMask đang yêu cầu bạn xác nhận chuyển {selectedTicket.resalePrice} ETH để hoàn tất thủ tục mua vé.
                                    </Typography>
                                    <LinearProgress sx={{ width: '60%', mx: 'auto', borderRadius: 4, height: 6 }} />
                                </Box>
                            )}

                            {/* BƯỚC 2: CHỜ ĐÓNG BLOCK SEPOLIA ON-CHAIN */}
                            {buyStep === 'verifying_block' && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            bgcolor: theme.palette.status?.onchainBg || 'rgba(99, 102, 241, 0.12)',
                                            color: theme.palette.status?.onchain || 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 2,
                                        }}
                                    >
                                        <HourglassEmpty sx={{ fontSize: 32 }} />
                                    </Box>
                                    <Typography variant="h3" fontWeight={700} gutterBottom>
                                        Đang gửi giao dịch lên mạng Sepolia...
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Thợ đào đang xác thực khối giao dịch chuyển nhượng NFT và phân phối doanh thu bản quyền.
                                    </Typography>

                                    {generatedTxHash && (
                                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={3}>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                TxHash: {truncateHash(generatedTxHash, 10, 8)}
                                            </Typography>
                                            <Tooltip title="Sao chép TxHash">
                                                <IconButton
                                                    size="small"
                                                    aria-label="Sao chép TxHash giao dịch"
                                                    onClick={() => handleCopy(generatedTxHash, 'TxHash')}
                                                >
                                                    <ContentCopy sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    )}

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

                            {/* BƯỚC 3: XÁC NHẬN THÀNH CÔNG */}
                            {buyStep === 'confirmed' && (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '50%',
                                            bgcolor: theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)',
                                            color: theme.palette.status?.success || 'success.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mx: 'auto',
                                            mb: 2,
                                        }}
                                    >
                                        <CheckCircle sx={{ fontSize: 40 }} />
                                    </Box>

                                    <Typography variant="h3" fontWeight={800} color="text.primary" gutterBottom>
                                        Mua Vé Thành Công!
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
                                        Vé NFT Token #{selectedTicket.tokenId} đã được chuyển quyền sở hữu vào ví của bạn. Bạn có thể mở mã QR soát vé bất kỳ lúc nào tại kho vé cá nhân.
                                    </Typography>

                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: '10px',
                                            bgcolor: 'background.subtle',
                                            textAlign: 'left',
                                            mb: 3,
                                            border: 1,
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" color="text.secondary">
                                                Mã giao dịch (TxHash):
                                            </Typography>
                                            <Link
                                                href={`https://sepolia.etherscan.io/tx/${generatedTxHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'monospace',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {truncateHash(generatedTxHash, 8, 6)}
                                                <OpenInNew sx={{ fontSize: 13 }} />
                                            </Link>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">
                                                Trạng thái Blockchain:
                                            </Typography>
                                            <Chip
                                                label="Đã Xác Thực (1 Block Confirmation)"
                                                size="small"
                                                color="success"
                                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                                            />
                                        </Stack>
                                    </Paper>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 0 }}>
                    {buyStep === 'initial' && (
                        <Stack direction="row" spacing={1.5} width="100%" justifyContent="flex-end">
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => setOpenBuyModal(false)}
                                sx={{ borderRadius: '8px', fontWeight: 600 }}
                            >
                                Hủy Bỏ
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AccountBalanceWallet />}
                                onClick={handleConfirmBuy}
                                sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
                            >
                                Ký Ví & Mua Vé
                            </Button>
                        </Stack>
                    )}

                    {buyStep === 'confirmed' && (
                        <Stack direction="row" spacing={1.5} width="100%" justifyContent="center">
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                    setOpenBuyModal(false);
                                    showSnackbar('Bạn có thể tiếp tục mua sắm các vé khác!', 'info');
                                }}
                                sx={{ borderRadius: '8px', fontWeight: 600 }}
                            >
                                Tiếp Tục Khám Phá
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                component={RouterLink}
                                to="/my-tickets"
                                startIcon={<ConfirmationNumber />}
                                sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
                            >
                                Xem Trong Kho Vé Của Tôi
                            </Button>
                        </Stack>
                    )}
                </DialogActions>
            </Dialog>

            {/* DIALOG GIẢI THÍCH QUY TẮC BR-02 & ANTI-SCALPING */}
            <Dialog
                open={openRuleDialog}
                onClose={() => setOpenRuleDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: { xs: 1, sm: 2 },
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '10px',
                                    bgcolor: 'warning.light',
                                    color: 'warning.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Gavel />
                            </Box>
                            <Typography variant="h3" fontWeight={700}>
                                Quy Tắc Trần Giá 120% (BR-02)
                            </Typography>
                        </Stack>
                        <IconButton
                            size="small"
                            aria-label="Đóng popup giải thích quy tắc"
                            onClick={() => setOpenRuleDialog(false)}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2.5}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                            Hệ thống BlockTickets cam kết loại bỏ hoàn toàn nạn đầu cơ và phe vé chợ đen bằng công nghệ Smart Contract Ethereum.
                            Dưới đây là các cơ chế cốt lõi bảo vệ cộng đồng:
                        </Typography>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                borderRadius: '12px',
                                bgcolor: 'background.subtle',
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
                                <CheckCircle color="primary" sx={{ fontSize: 20, mt: 0.2 }} />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                        1. Giá Gốc Bất Biến (originalPrice)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: 'block' }}>
                                        Giá phát hành ban đầu của vé được ghi nhận cố định trên blockchain tại thời điểm tạo hạng vé. Không một cá nhân nào có thể chỉnh sửa giá gốc này.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
                                <CheckCircle color="primary" sx={{ fontSize: 20, mt: 0.2 }} />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                        2. Trần Giá Tối Đa 120% (Anti-Scalping Cap)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: 'block' }}>
                                        Mọi lượt niêm yết bán lại bắt buộc thỏa mãn: <code>resalePrice &le; originalPrice &times; 1.2</code>. Nếu vượt trần, giao dịch sẽ bị Smart Contract hủy bỏ (Revert) lập tức.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <CheckCircle color="primary" sx={{ fontSize: 20, mt: 0.2 }} />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                        3. Phí Bản Quyền 5% Cho Nhà Tổ Chức (Royalty Fee)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6, display: 'block' }}>
                                        Mỗi khi một vé được chuyển nhượng thành công, 5% giá trị giao dịch sẽ tự động trích gửi về ví ban tổ chức, tạo nguồn thu bền vững cho nghệ sĩ và đơn vị sản xuất.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Alert severity="success" sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
                            Vé chỉ được phép chuyển nhượng khi <strong>chưa check-in tại cổng</strong> và sự kiện vẫn còn hiệu lực.
                        </Alert>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenRuleDialog(false)}
                        sx={{ borderRadius: '8px', fontWeight: 600, width: '100%' }}
                    >
                        Đã Hiểu & Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            {/* CHÂN TRANG FOOTER */}
            <Footer />

            {/* TOAST THÔNG BÁO TỨC THỜI */}
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

export default MarketplacePage;

