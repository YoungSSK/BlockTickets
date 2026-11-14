import React, { useState, useMemo, useEffect } from 'react';
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
    Tooltip,
    Alert,
    Snackbar,
    Stack,
    Divider,
    LinearProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    RadioGroup,
    Radio,
    FormControlLabel,
    CircularProgress,
} from '@mui/material';
import {
    ArrowBack,
    ConfirmationNumber,
    LocationOn,
    Schedule,
    Share,
    BookmarkBorder,
    Bookmark,
    CheckCircle,
    Security,
    DarkMode,
    LightMode,
    Add,
    Remove,
    ContentCopy,
    OpenInNew,
    VerifiedUser,
    ExpandMore,
    FiberManualRecord,
    HourglassBottom,
    Shield,
    InfoOutlined,
    Lan,
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { eventAPI } from '../../services/api';

// Helper rút gọn địa chỉ ví
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu các sự kiện chi tiết
const EVENTS_DATABASE = {
    'EVT-2026-002': {
        id: 'EVT-2026-002',
        title: 'Vietnam Blockchain Summit 2026',
        subtitle: 'Hội nghị thượng đỉnh công nghệ Blockchain, Web3, Smart Contract & Tokenization lớn nhất năm 2026 tại Việt Nam.',
        category: 'technology',
        categoryLabel: 'Công nghệ & Web3',
        status: 'published',
        bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        venue: {
            name: 'Trung tâm Hội nghị Quốc gia',
            address: 'Đại lộ Thăng Long, Phường Mễ Trì, Quận Nam Từ Liêm',
            city: 'Hà Nội',
            notes: 'Cổng vào số 1 trên Đại lộ Thăng Long. Bãi đỗ xe ô tô và xe máy tại hầm B1, cổng check-in vé NFT tại sảnh chính Tầng 1.',
        },
        startTime: '28/11/2026 - 08:30',
        endTime: '29/11/2026 - 17:30',
        countdownDays: 24,
        contractAddress: '0x71C948261901823901928394819203849102A319',
        marketplaceAddress: '0x48D11894aB01029384910293849102938491B281',
        network: 'Ethereum Sepolia Testnet (ChainId 11155111)',
        tokenStandard: 'ERC-721 (Non-Fungible Token)',
        organizer: {
            name: 'TechChain Foundation',
            email: 'events@techchain.io',
            wallet: '0x8F4211A990812Da7201bF241cba0982E12Da9911',
            previousEventsCount: 12,
            trustScore: '99%',
            avatarText: 'TC',
            bio: 'Tổ chức phi lợi nhuận thúc đẩy nghiên cứu, kiểm toán bảo mật và phổ cập công nghệ Blockchain tại Đông Nam Á.',
        },
        highlights: [
            'Hơn 50 diễn giả là sáng lập gia Web3, quỹ đầu tư mạo hiểm và chuyên gia bảo mật hàng đầu',
            'Không gian triển lãm với hơn 80 gian hàng công nghệ Blockchain tiên tiến',
            'Toàn bộ vé phát hành độc bản dưới dạng NFT trên Ethereum Sepolia, tích hợp mã QR HMAC',
            'Áp dụng quy tắc trần giá 120% bất biến (BR-02) bảo vệ người tham dự khỏi nạn phe vé',
        ],
        description: `Vietnam Blockchain Summit 2026 là sự kiện công nghệ thường niên quy mô quốc tế, nơi hội tụ các nhà lãnh đạo tư tưởng, nhà phát triển phần mềm, chuyên gia kinh tế và nhà đầu tư mạo hiểm nhằm thảo luận về tương lai của Web3, tài sản thực mã hóa (RWA), trí tuệ nhân tạo phi tập trung (DeAI) và ứng dụng Smart Contract trong quản trị doanh nghiệp.

Sự kiện diễn ra trong 2 ngày với hơn 30 phiên tham luận chuyên sâu, 10 phiên thảo luận bàn tròn và cuộc thi Hackathon công nghệ. Toàn bộ hệ thống vé tham dự được số hóa hoàn toàn bằng Smart Contract ERC-721 trên mạng thử nghiệm Sepolia, đảm bảo không thể làm giả và có thể chuyển nhượng minh bạch với trần giá tối đa 120%.`,
        ticketTypes: [
            {
                id: 'TT-03',
                name: 'Standard Pass',
                originalPrice: 0.15,
                maxResalePrice: 0.18,
                currency: 'ETH',
                remainingSupply: 358,
                maxSupply: 1000,
                badge: 'Phổ biến',
                description: 'Dành cho cá nhân quan tâm đến công nghệ, muốn tham gia các phiên thuyết trình chính và khu vực triển lãm demo.',
                perks: [
                    'Tham dự toàn bộ các phiên hội thảo chính trong 2 ngày',
                    'Bộ tài liệu hội nghị kỹ thuật số & quyền xem lại video quay phát',
                    'Teabreak và tiệc trà giải lao giữa giờ miễn phí',
                    'Huy hiệu NFT tham dự (Proof of Attendance POAP) sau sự kiện',
                ],
            },
            {
                id: 'TT-04',
                name: 'VIP Networking Pass',
                originalPrice: 0.25,
                maxResalePrice: 0.30,
                currency: 'ETH',
                remainingSupply: 142,
                maxSupply: 500,
                badge: 'Khuyên dùng',
                description: 'Dành cho các nhà sáng lập, quản lý cấp cao và nhà đầu tư cần kết nối đối tác chiến lược và quỹ mạo hiểm.',
                perks: [
                    'Bao gồm toàn bộ quyền lợi của hạng Standard Pass',
                    'Lối vào ưu tiên riêng tại cổng soát vé (Fast-track QR Scan)',
                    'Quyền truy cập phòng VIP Lounge với tiệc buffet trưa cao cấp',
                    'Vé mời tham dự dạ tiệc kết nối độc quyền với diễn giả và 50+ quỹ đầu tư Web3',
                    'Ưu tiên đặt câu hỏi trực tiếp trong các phiên bàn tròn Q&A',
                ],
            },
            {
                id: 'TT-05',
                name: 'Developer & Student Pass',
                originalPrice: 0.08,
                maxResalePrice: 0.096,
                currency: 'ETH',
                remainingSupply: 45,
                maxSupply: 200,
                badge: 'Ưu đãi',
                description: 'Hạng vé hỗ trợ lập trình viên trẻ, sinh viên các ngành công nghệ thông tin và khoa học máy tính.',
                perks: [
                    'Tham dự hội thảo chính và phòng Lab thực hành Smart Contract',
                    'Đăng ký miễn phí cuộc thi Web3 Builder Hackathon',
                    'Cơ hội phỏng vấn tuyển dụng trực tiếp với các kỳ lân công nghệ',
                ],
            },
        ],
        faqs: [
            {
                q: 'Vé NFT được chuyển giao cho tôi như thế nào sau khi thanh toán?',
                a: 'Sau khi bạn ký giao dịch trên ví MetaMask và giao dịch được thợ đào Sepolia đóng block, Smart Contract sẽ tự động mint vé NFT (ERC-721) trực tiếp vào địa chỉ ví của bạn. Vé sẽ xuất hiện ngay trong trang "Kho vé của tôi".',
            },
            {
                q: 'Làm thế nào để soát vé khi tôi đến cổng sự kiện?',
                a: 'Tại cổng sự kiện, bạn chỉ cần mở trang "Kho vé của tôi", chọn vé và nhấn hiển thị mã QR. Hệ thống sử dụng mã QR động có chữ ký số HMAC thay đổi liên tục mỗi 30 giây, chống hoàn toàn việc chụp ảnh màn hình chuyển cho người khác.',
            },
            {
                q: 'Tôi có thể bán lại vé cho người khác nếu bận không tham gia được không?',
                a: 'Hoàn toàn được. Bạn có thể niêm yết vé lên sàn chuyển nhượng thứ cấp (Marketplace) của BlockTickets. Smart Contract đảm bảo quy tắc trần giá bất biến: giá bán lại tối đa không vượt quá 120% giá gốc bạn đã mua (BR-02).',
            },
            {
                q: 'Tôi cần chuẩn bị gì trước khi mua vé?',
                a: 'Bạn chỉ cần cài đặt tiện ích mở rộng ví MetaMask trên trình duyệt hoặc điện thoại và sở hữu một lượng nhỏ ETH trên mạng thử nghiệm Ethereum Sepolia Testnet để chi trả tiền vé và phí gas giao dịch.',
            },
        ],
    },
    'EVT-2026-001': {
        id: 'EVT-2026-001',
        title: 'Hòa Nhạc Giao Hưởng Mùa Thu 2026',
        subtitle: 'Đêm hòa nhạc cổ điển quốc tế với các kiệt tác bất hủ của Beethoven và Mozart.',
        category: 'music',
        categoryLabel: 'Âm nhạc',
        status: 'published',
        bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80',
        venue: {
            name: 'Nhà Hát Lớn Hà Nội',
            address: '01 Tràng Tiền, Phường Phan Chu Trinh, Quận Hoàn Kiếm',
            city: 'Hà Nội',
            notes: 'Trang phục lịch sự (Smart Casual hoặc Formal). Quý khán giả vui lòng có mặt trước giờ biểu diễn 20 phút.',
        },
        startTime: '15/11/2026 - 20:00',
        endTime: '15/11/2026 - 22:30',
        countdownDays: 12,
        contractAddress: '0x71C948261901823901928394819203849102A319',
        marketplaceAddress: '0x48D11894aB01029384910293849102938491B281',
        network: 'Ethereum Sepolia Testnet (ChainId 11155111)',
        tokenStandard: 'ERC-721 (Non-Fungible Token)',
        organizer: {
            name: 'Hanoi Symphony Orchestra',
            email: 'contact@hanoisymphony.vn',
            wallet: '0x3A2198Ccfa31E4082218901Dfb8293aa7e9B1102',
            previousEventsCount: 8,
            trustScore: '98%',
            avatarText: 'HS',
            bio: 'Dàn nhạc giao hưởng thành phố Hà Nội với hơn 20 năm cống hiến các tác phẩm âm nhạc cổ điển thính phòng.',
        },
        highlights: [
            'Sự góp mặt của nghệ sĩ dương cầm khách mời danh tiếng từ Nhạc viện Paris',
            'Không gian âm thanh chuẩn thính phòng quốc tế tại Nhà Hát Lớn Hà Nội',
            'Vé NFT độc bản lưu niệm bất biến trên chuỗi khối',
        ],
        description: 'Đêm hòa nhạc cổ điển quốc tế với sự tham gia của dàn nhạc giao hưởng danh tiếng và nghệ sĩ dương cầm khách mời hàng đầu châu Âu. Đêm diễn hứa hẹn mang đến những kiệt tác âm nhạc bất hủ của Beethoven, Mozart và Chopin.',
        ticketTypes: [
            {
                id: 'TT-01',
                name: 'Hạng Standard',
                originalPrice: 0.08,
                maxResalePrice: 0.096,
                currency: 'ETH',
                remainingSupply: 180,
                maxSupply: 500,
                badge: 'Phổ biến',
                description: 'Ghế ngồi tầng 2 khán phòng, góc nhìn bao quát toàn bộ dàn nhạc sân khấu.',
                perks: ['Vị trí ngồi tầng 2', 'Tập sách giới thiệu chương trình biểu diễn'],
            },
            {
                id: 'TT-02',
                name: 'Hạng VIP Premiere',
                originalPrice: 0.25,
                maxResalePrice: 0.30,
                currency: 'ETH',
                remainingSupply: 65,
                maxSupply: 300,
                badge: 'VIP',
                description: 'Ghế ngồi tầng 1 khu vực trung tâm với trải nghiệm âm thanh sống động và chi tiết nhất.',
                perks: ['Vị trí ngồi tầng 1 trung tâm', 'Tiệc cocktail giải lao tại phòng khánh tiết', 'Tặng kèm đĩa nhạc lưu niệm'],
            },
        ],
        faqs: [],
    },
};

const EventDetailPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();
    const { id } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    // State chọn vé
    const [selectedTierId, setSelectedTierId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Snackbar thông báo
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

    // Tải chi tiết sự kiện thật từ Backend
    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            try {
                const res = await eventAPI.getEventDetail(id);
                const backendEvent = res.data?.data?.event;
                if (backendEvent) {
                    const ticketTypes = Array.isArray(backendEvent.ticketTypes)
                        ? backendEvent.ticketTypes.map((tt) => ({
                            id: tt.id,
                            name: tt.name,
                            badge: tt.name.toUpperCase().includes('VIP') ? 'VIP' : 'Phổ thông',
                            originalPrice: Number(tt.originalPrice || 0),
                            maxResalePrice: Number(tt.maxResalePrice || (Number(tt.originalPrice || 0) * 1.2).toFixed(4)),
                            currency: tt.currency || 'ETH',
                            maxSupply: Number(tt.maxSupply || 100),
                            currentSupply: Number(tt.currentSupply || 0),
                            description: tt.description || 'Hạng vé chính thức của sự kiện.',
                            perks: ['Vé NFT độc bản', 'QR Check-in động', 'Bảo hiểm trần giá 120%'],
                        }))
                        : [];

                    const normalized = {
                        ...backendEvent,
                        id: backendEvent.id,
                        title: backendEvent.title,
                        subtitle: backendEvent.description?.slice(0, 150) + '...',
                        category: backendEvent.category || 'music',
                        categoryLabel:
                            backendEvent.category === 'technology' ? 'Công nghệ & Web3' :
                            backendEvent.category === 'sports' ? 'Thể thao' :
                            backendEvent.category === 'workshop' ? 'Hội thảo' : 'Âm nhạc',
                        bannerUrl: backendEvent.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
                        venue: {
                            name: backendEvent.venueName || 'Địa điểm tổ chức',
                            address: backendEvent.venueAddress || '',
                            city: backendEvent.venueCity || 'Việt Nam',
                            notes: 'Vui lòng xuất trình mã QR động tại cổng soát vé.',
                        },
                        startTime: backendEvent.startTime ? new Date(backendEvent.startTime).toLocaleString('vi-VN') : '',
                        endTime: backendEvent.endTime ? new Date(backendEvent.endTime).toLocaleString('vi-VN') : '',
                        countdownDays: 14,
                        contractAddress: backendEvent.contractAddress || '0x71C948261901823901928394819203849102A319',
                        marketplaceAddress: '0x48D11894aB01029384910293849102938491B281',
                        network: 'Ethereum Sepolia Testnet (ChainId 11155111)',
                        tokenStandard: 'ERC-721 (Non-Fungible Token)',
                        organizer: {
                            name: backendEvent.organizer?.fullName || 'Nhà tổ chức',
                            email: backendEvent.organizer?.email || '',
                            wallet: backendEvent.organizer?.walletAddress || '0x0000...0000',
                            previousEventsCount: 1,
                            trustScore: '99%',
                            avatarText: (backendEvent.organizer?.fullName || 'BT').slice(0, 2).toUpperCase(),
                            bio: 'Nhà tổ chức sự kiện chuyên nghiệp trên BlockTickets.',
                        },
                        highlights: [
                            'Vé NFT độc bản ERC-721 bảo chứng trên Ethereum Sepolia',
                            'Soát vé tại cổng tức thì qua mã QR HMAC động',
                            'Chống phe vé chợ đen với quy tắc trần giá bán lại 120%',
                        ],
                        description: backendEvent.description,
                        ticketTypes,
                        faqs: [],
                    };

                    setEvent(normalized);
                    if (ticketTypes.length > 0) {
                        setSelectedTierId(ticketTypes[0].id);
                    }
                }
            } catch (err) {
                console.error('Lỗi khi tải chi tiết sự kiện:', err.message);
                setEvent(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    // Lấy hạng vé đang chọn
    const activeTier = useMemo(() => {
        if (!event || !Array.isArray(event.ticketTypes)) return null;
        return event.ticketTypes.find((t) => t.id === selectedTierId) || event.ticketTypes[0] || null;
    }, [event, selectedTierId]);

    // Tính toán giá tiền
    const subtotalEth = activeTier ? activeTier.originalPrice * quantity : 0;
    const ethToUsdRate = 3140;
    const subtotalUsd = Math.round(subtotalEth * ethToUsdRate);

    // Sao chép clipboard
    const handleCopy = (text, label = 'mã') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 8, 6)}`, 'success');
    };

    // Chia sẻ sự kiện
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showSnackbar('Đã sao chép liên kết sự kiện vào bộ nhớ tạm! Bạn có thể gửi cho bạn bè.', 'success');
    };

    // Chuyển sang trang thanh toán CheckoutPage
    const handleProceedToCheckout = () => {
        if (!activeTier) return;
        navigate('/checkout', {
            state: {
                eventData: {
                    id: event.id,
                    title: event.title,
                    organizer: event.organizer.name,
                    organizerWallet: event.organizer.wallet,
                    category: event.category,
                    categoryLabel: event.categoryLabel,
                    venue: `${event.venue.name}, ${event.venue.address}`,
                    startTime: event.startTime,
                    bannerUrl: event.bannerUrl,
                    selectedTier: {
                        id: activeTier.id,
                        name: activeTier.name,
                        originalPrice: activeTier.originalPrice,
                        maxResalePrice: activeTier.maxResalePrice,
                        currency: activeTier.currency,
                        remainingSupply: activeTier.remainingSupply,
                        maxSupply: activeTier.maxSupply,
                        perks: activeTier.perks,
                    },
                },
            },
        });
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress />
                    <Typography variant="body1" color="text.secondary">Đang tải chi tiết sự kiện...</Typography>
                </Stack>
            </Box>
        );
    }

    if (!event) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 10, textAlign: 'center' }}>
                <Container maxWidth="sm">
                    <Card sx={{ p: 4, borderRadius: '16px' }}>
                        <Typography variant="h3" fontWeight={700} gutterBottom>
                            Không tìm thấy sự kiện
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Sự kiện này không tồn tại hoặc chưa được công bố công khai.
                        </Typography>
                        <Button variant="contained" component={RouterLink} to="/">
                            Quay về Trang chủ
                        </Button>
                    </Card>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
            {/* ═══════════════════════════════════════════════════════════════════
                1. TOP APP BAR & SUB-NAV
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 1.5,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Container maxWidth="lg">
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={2}
                    >
                        {/* Nút quay lại */}
                        <Button
                            size="small"
                            startIcon={<ArrowBack />}
                            onClick={() => navigate(-1)}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                        >
                            Quay lại
                        </Button>

                        {/* Network Badge & Actions */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip
                                icon={<FiberManualRecord sx={{ color: 'status.success', fontSize: 10 }} />}
                                label="Sepolia Testnet"
                                size="small"
                                sx={{
                                    bgcolor: 'status.successBg',
                                    color: 'status.success',
                                    fontWeight: 600,
                                    height: 26,
                                }}
                            />

                            <Tooltip title={isBookmarked ? 'Bỏ lưu sự kiện' : 'Lưu sự kiện vào yêu thích'}>
                                <IconButton
                                    aria-label="Lưu sự kiện"
                                    onClick={() => {
                                        setIsBookmarked(!isBookmarked);
                                        showSnackbar(isBookmarked ? 'Đã bỏ lưu sự kiện.' : 'Đã lưu sự kiện vào danh sách yêu thích!', 'info');
                                    }}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: '8px',
                                        width: 36,
                                        height: 36,
                                        color: isBookmarked ? 'primary.main' : 'text.secondary',
                                    }}
                                >
                                    {isBookmarked ? <Bookmark fontSize="small" /> : <BookmarkBorder fontSize="small" />}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Chia sẻ sự kiện này">
                                <IconButton
                                    aria-label="Chia sẻ sự kiện"
                                    onClick={handleShare}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: '8px',
                                        width: 36,
                                        height: 36,
                                        color: 'text.secondary',
                                    }}
                                >
                                    <Share fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title={mode === 'light' ? 'Chuyển Dark Mode' : 'Chuyển Light Mode'}>
                                <IconButton
                                    aria-label="Chuyển đổi giao diện sáng tối"
                                    onClick={toggleTheme}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: '8px',
                                        width: 36,
                                        height: 36,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 3 }}>
                {/* ═══════════════════════════════════════════════════════════════════
                    2. HERO BANNER SỰ KIỆN (EVENT HERO BANNER)
                ═══════════════════════════════════════════════════════════════════ */}
                <Card sx={{ bgcolor: 'background.paper', mb: 4, overflow: 'hidden' }}>
                    <Box sx={{ position: 'relative' }}>
                        <Box
                            component="img"
                            src={event.bannerUrl}
                            alt={event.title}
                            sx={{
                                width: '100%',
                                height: { xs: 220, sm: 360, md: 440 },
                                objectFit: 'cover',
                            }}
                        />

                        {/* Top Badges Overlay */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 16,
                                left: 16,
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Chip
                                label={event.categoryLabel}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(0, 0, 0, 0.75)',
                                    color: '#fff',
                                    backdropFilter: 'blur(6px)',
                                    fontWeight: 700,
                                }}
                            />
                            <Chip
                                icon={<CheckCircle sx={{ fontSize: '13px !important', color: '#10B981' }} />}
                                label="Đang Mở Bán On-Chain"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10B981',
                                    backdropFilter: 'blur(6px)',
                                    fontWeight: 700,
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Tiêu đề & Thông tin nhanh dưới Banner */}
                    <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                        <Typography
                            variant="h1"
                            color="text.primary"
                            fontWeight={700}
                            sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem', md: '2.4rem' }, lineHeight: 1.25, mb: 1.5 }}
                        >
                            {event.title}
                        </Typography>

                        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.05rem', lineHeight: 1.6, mb: 3 }}>
                            {event.subtitle}
                        </Typography>

                        <Grid container spacing={2.5} sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Grid item xs={12} sm={4}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '8px',
                                            bgcolor: 'action.selected',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Schedule />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>THỜI GIAN TỔ CHỨC</Typography>
                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                            {event.startTime}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Đến {event.endTime}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} sm={5}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '8px',
                                            bgcolor: 'action.selected',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <LocationOn />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>ĐỊA ĐIỂM SỰ KIỆN</Typography>
                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                            {event.venue.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 300 }}>
                                            {event.venue.address}, {event.venue.city}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '8px',
                                            bgcolor: 'status.successBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.success',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <ConfirmationNumber />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>GIÁ PHÁT HÀNH TỪ</Typography>
                                        <Typography variant="h3" color="primary.main" fontWeight={700}>
                                            {event.ticketTypes[0]?.originalPrice} ETH
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ~${Math.round(event.ticketTypes[0]?.originalPrice * ethToUsdRate)} USD / vé
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════════
                    3. BỐ CỤC 2 CỘT CHI TIẾT SỰ KIỆN & SIDEBAR ĐẶT VÉ
                ═══════════════════════════════════════════════════════════════════ */}
                <Grid container spacing={4}>
                    {/* ── CỘT TRÁI: NỘI DUNG SỰ KIỆN & HẠNG VÉ ── */}
                    <Grid item xs={12} md={7} lg={8}>
                        <Stack spacing={4}>
                            {/* Khối 1: Điểm nổi bật & Mô tả */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 3.5 }}>
                                    <Typography variant="h2" color="text.primary" fontWeight={700} gutterBottom>
                                        Giới Thiệu Sự Kiện
                                    </Typography>
                                    <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, mb: 3 }}>
                                        {event.description}
                                    </Typography>

                                    <Typography variant="h3" color="text.primary" fontWeight={600} mb={2}>
                                        Điểm Nhấn Đáng Chú Ý
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {event.highlights.map((highlight, index) => (
                                            <Stack key={index} direction="row" spacing={1.5} alignItems="flex-start">
                                                <CheckCircle sx={{ color: 'status.success', fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                    {highlight}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Khối 2: Danh sách các Hạng vé NFT Mở bán */}
                            <Box>
                                <Typography variant="h2" color="text.primary" fontWeight={700} mb={1}>
                                    Các Hạng Vé NFT Mở Bán
                                </Typography>
                                <Typography variant="body2" color="text.secondary" mb={3}>
                                    Chọn hạng vé phù hợp với nhu cầu tham dự của bạn. Vé được đúc trực tiếp thành NFT ERC-721 vào ví cá nhân.
                                </Typography>

                                <Stack spacing={2.5}>
                                    {event.ticketTypes.map((tier) => {
                                        const isSelected = selectedTierId === tier.id;
                                        const soldPercentage = Math.round(((tier.maxSupply - tier.remainingSupply) / tier.maxSupply) * 100);

                                        return (
                                            <Card
                                                key={tier.id}
                                                sx={{
                                                    bgcolor: 'background.paper',
                                                    border: 2,
                                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                    },
                                                }}
                                            >
                                                <CardContent sx={{ p: 3 }}>
                                                    <Stack
                                                        direction={{ xs: 'column', sm: 'row' }}
                                                        justifyContent="space-between"
                                                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                                                        spacing={2}
                                                        mb={2}
                                                    >
                                                        <Box>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <Typography variant="h3" color="text.primary" fontWeight={700}>
                                                                    {tier.name}
                                                                </Typography>
                                                                {tier.badge && (
                                                                    <Chip
                                                                        label={tier.badge}
                                                                        size="small"
                                                                        color={isSelected ? 'primary' : 'default'}
                                                                        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                                                                    />
                                                                )}
                                                            </Stack>
                                                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                                                {tier.description}
                                                            </Typography>
                                                        </Box>

                                                        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                            <Typography variant="h2" color="primary.main" fontWeight={700}>
                                                                {tier.originalPrice} ETH
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                ~${Math.round(tier.originalPrice * ethToUsdRate)} USD
                                                            </Typography>
                                                        </Box>
                                                    </Stack>

                                                    {/* Thanh tình trạng số lượng vé */}
                                                    <Box sx={{ mb: 2.5, p: 1.5, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Số lượng còn lại: <strong>{tier.remainingSupply}</strong> / {tier.maxSupply} vé
                                                            </Typography>
                                                            <Typography variant="caption" color="text.primary" fontWeight={600}>
                                                                Đã bán {soldPercentage}%
                                                            </Typography>
                                                        </Stack>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={soldPercentage}
                                                            sx={{ height: 6, borderRadius: 3 }}
                                                        />
                                                    </Box>

                                                    {/* Quyền lợi chi tiết */}
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                                                        QUYỀN LỢI ĐÍNH KÈM:
                                                    </Typography>
                                                    <Stack spacing={0.75} mb={2.5}>
                                                        {tier.perks.map((perk, i) => (
                                                            <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                                                                <CheckCircle sx={{ color: 'status.success', fontSize: 16, mt: 0.2 }} />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {perk}
                                                                </Typography>
                                                            </Stack>
                                                        ))}
                                                    </Stack>

                                                    {/* Cảnh báo trần giá 120% BR-02 */}
                                                    <Stack
                                                        direction="row"
                                                        alignItems="center"
                                                        justifyContent="space-between"
                                                        sx={{
                                                            p: 1.5,
                                                            border: 1,
                                                            borderColor: 'divider',
                                                            borderRadius: '8px',
                                                            bgcolor: 'action.hover',
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Security sx={{ fontSize: 16, color: 'primary.main' }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                Trần giá chuyển nhượng tối đa (BR-02):
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="caption" color="status.success" fontWeight={700}>
                                                            {tier.maxResalePrice} ETH (+120%)
                                                        </Typography>
                                                    </Stack>

                                                    {/* Nút chọn vé */}
                                                    <Box sx={{ mt: 2.5, textAlign: 'right' }}>
                                                        <Button
                                                            variant={isSelected ? 'contained' : 'outlined'}
                                                            color="primary"
                                                            onClick={() => setSelectedTierId(tier.id)}
                                                            sx={{ minWidth: 140 }}
                                                        >
                                                            {isSelected ? 'Đang chọn hạng này' : 'Chọn hạng vé này'}
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            </Box>

                            {/* Khối 3: Thông tin Nhà tổ chức & Xác thực */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 3.5 }}>
                                    <Typography variant="h3" color="text.primary" fontWeight={700} mb={2}>
                                        Nhà Tổ Chức Sự Kiện
                                    </Typography>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="flex-start">
                                        <Avatar
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                bgcolor: 'action.selected',
                                                color: 'primary.main',
                                                fontWeight: 700,
                                                fontSize: '1.2rem',
                                                border: 1,
                                                borderColor: 'divider',
                                            }}
                                        >
                                            {event.organizer.avatarText}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                                                <Typography variant="h3" color="text.primary" fontWeight={600}>
                                                    {event.organizer.name}
                                                </Typography>
                                                <Chip
                                                    icon={<VerifiedUser sx={{ fontSize: '13px !important' }} />}
                                                    label={`Uy tín: ${event.organizer.trustScore}`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                                                />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                {event.organizer.bio}
                                            </Typography>

                                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Ví Web3 Organizer:
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}
                                                >
                                                    {truncateHash(event.organizer.wallet, 8, 6)}
                                                </Typography>
                                                <Tooltip title="Sao chép địa chỉ ví">
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
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Khối 4: Câu hỏi thường gặp (FAQs) */}
                            {event.faqs && event.faqs.length > 0 && (
                                <Card sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ p: 3.5 }}>
                                        <Typography variant="h3" color="text.primary" fontWeight={700} mb={2}>
                                            Câu Hỏi Thường Gặp (FAQs)
                                        </Typography>
                                        {event.faqs.map((faq, idx) => (
                                            <Accordion key={idx} sx={{ bgcolor: 'transparent', boxShadow: 'none', '&:before': { display: 'none' } }}>
                                                <AccordionSummary expandIcon={<ExpandMore />}>
                                                    <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                                        {faq.q}
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                                        {faq.a}
                                                    </Typography>
                                                </AccordionDetails>
                                            </Accordion>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </Stack>
                    </Grid>

                    {/* ── CỘT PHẢI: STICKY BOOKING CARD & SMART CONTRACT ── */}
                    <Grid item xs={12} md={5} lg={4}>
                        <Stack spacing={3} sx={{ position: { md: 'sticky' }, top: { md: 80 } }}>
                            {/* Card Đặt Vé Nhanh */}
                            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            ĐẶT VÉ NHANH
                                        </Typography>
                                        <Chip
                                            icon={<HourglassBottom sx={{ fontSize: '13px !important' }} />}
                                            label={`Còn ${event.countdownDays} ngày`}
                                            size="small"
                                            sx={{ bgcolor: 'status.pendingBg', color: 'status.pending', fontWeight: 600, height: 22 }}
                                        />
                                    </Stack>

                                    {/* Hạng vé đang chọn */}
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px', mb: 2.5 }}>
                                        <Typography variant="caption" color="text.secondary">HẠNG VÉ ĐANG CHỌN</Typography>
                                        <Typography variant="subtitle1" color="text.primary" fontWeight={700} mt={0.5}>
                                            {activeTier.name}
                                        </Typography>
                                        <Typography variant="h3" color="primary.main" fontWeight={700} mt={0.5}>
                                            {activeTier.originalPrice} ETH{' '}
                                            <Typography component="span" variant="body2" color="text.secondary">
                                                / vé
                                            </Typography>
                                        </Typography>
                                    </Box>

                                    {/* Số lượng vé */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                                        <Box>
                                            <Typography variant="body2" color="text.primary" fontWeight={600}>
                                                Số lượng vé
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Tối đa 4 vé / ví
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <IconButton
                                                size="small"
                                                aria-label="Giảm vé"
                                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                            >
                                                <Remove fontSize="small" />
                                            </IconButton>
                                            <Typography variant="h3" color="text.primary" fontWeight={700} sx={{ minWidth: 24, textAlign: 'center' }}>
                                                {quantity}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                aria-label="Tăng vé"
                                                onClick={() => setQuantity((q) => Math.min(4, q + 1))}
                                                disabled={quantity >= 4}
                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Tạm tính */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={2.5}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">TỔNG TẠM TÍNH</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                ~${subtotalUsd.toLocaleString('en-US')} USD
                                            </Typography>
                                        </Box>
                                        <Typography variant="h2" color="primary.main" fontWeight={700}>
                                            {subtotalEth.toFixed(4)} ETH
                                        </Typography>
                                    </Stack>

                                    {/* Nút hành động Mua Vé Ngay */}
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        size="large"
                                        onClick={handleProceedToCheckout}
                                        sx={{
                                            py: 1.5,
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            borderRadius: '8px',
                                            mb: 2,
                                        }}
                                    >
                                        Mua Vé NFT Ngay
                                    </Button>

                                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                        <Shield sx={{ fontSize: 16, color: 'status.success' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Bảo vệ giao dịch an toàn 100% trên Smart Contract
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Card Minh Bạch Smart Contract */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1.5}>
                                        THÔNG TIN SMART CONTRACT SEPOLIA
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Chuẩn Token</Typography>
                                            <Typography variant="body2" color="text.primary" fontWeight={600}>
                                                {event.tokenStandard}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Hợp đồng Vé NFT (EventTicket.sol)</Typography>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.2}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {truncateHash(event.contractAddress, 8, 6)}
                                                </Typography>
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Sao chép contract"
                                                        onClick={() => handleCopy(event.contractAddress, 'Hợp đồng')}
                                                        sx={{ p: 0.2 }}
                                                    >
                                                        <ContentCopy sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Xem trên Etherscan"
                                                        component="a"
                                                        href={`https://sepolia.etherscan.io/address/${event.contractAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ p: 0.2, color: 'primary.main' }}
                                                    >
                                                        <OpenInNew sx={{ fontSize: 13 }} />
                                                    </IconButton>
                                                </Stack>
                                            </Stack>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Mạng Blockchain</Typography>
                                            <Typography variant="body2" color="status.success" fontWeight={600}>
                                                {event.network}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                4. TOAST SNACKBAR THÔNG BÁO
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

export default EventDetailPage;

