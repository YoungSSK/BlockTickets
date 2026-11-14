import React, { useState } from 'react';
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
    DialogActions,
    Tooltip,
    Alert,
    Snackbar,
    Stack,
    Divider,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    Breadcrumbs,
    Link,
    Stepper,
    Step,
    StepLabel,
    useTheme,
} from '@mui/material';
import {
    EventNote,
    LocationOn,
    Schedule,
    ConfirmationNumber,
    Add,
    DeleteOutline,
    CheckCircle,
    ArrowBack,
    ArrowForward,
    CloudUpload,
    Shield,
    Gavel,
    AccountBalanceWallet,
    InfoOutlined,
    Close,
    Save,
    Send,
    Preview,
    LocalOffer,
    Image,
    VerifiedUser,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Footer from '../../components/Footer';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { organizerAPI } from '../../services/api';

// Helper rút gọn địa chỉ ví
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Các danh mục sự kiện chuẩn hóa
const EVENT_CATEGORIES = [
    { value: 'technology', label: 'Công nghệ & Web3' },
    { value: 'music', label: 'Âm nhạc & Hòa nhạc' },
    { value: 'sports', label: 'Thể thao & Esports' },
    { value: 'workshop', label: 'Hội thảo & Triển lãm' },
];

// Danh sách các thành phố phổ biến
const CITIES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang'];

// Ảnh poster mẫu chất lượng cao để chọn nhanh
const SAMPLE_POSTERS = [
    {
        label: 'Hội nghị Công nghệ Web3',
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    },
    {
        label: 'Đại nhạc hội EDM / Concert',
        url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    },
    {
        label: 'Hòa nhạc Giao hưởng Cổ điển',
        url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    },
    {
        label: 'Giải đấu Thể thao / Esports',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    },
];

const STEPS = [
    'Thông tin sự kiện cơ bản',
    'Thời gian & Địa điểm tổ chức',
    'Cấu hình hạng vé NFT (BR-01, BR-02)',
    'Xem trước & Gửi duyệt hệ thống',
];

const CreateEventPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Bước hiện tại trong Stepper
    const [activeStep, setActiveStep] = useState(0);

    // Dữ liệu Form Sự kiện
    const [eventData, setEventData] = useState({
        title: '',
        category: 'technology',
        description: '',
        bannerUrl: '',
        venueName: '',
        venueAddress: '',
        venueCity: 'Hà Nội',
        startTime: '',
        endTime: '',
    });

    // Danh sách các hạng vé phát hành (Ticket Types)
    const [ticketTiers, setTicketTiers] = useState([
        {
            id: 1,
            name: '',
            description: '',
            originalPrice: '',
            maxSupply: '',
            saleStartTime: '',
            saleEndTime: '',
            perks: '',
        },
    ]);

    // Validation errors
    const [errors, setErrors] = useState({});

    // Modal xác nhận thành công
    const [openSuccessModal, setOpenSuccessModal] = useState(false);
    const [submittedEventId, setSubmittedEventId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Xử lý thay đổi trường sự kiện
    const handleEventChange = (field, value) => {
        setEventData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    // Xử lý thay đổi thông tin hạng vé
    const handleTierChange = (index, field, value) => {
        setTicketTiers((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    // Helper định dạng ngày giờ cho input type="datetime-local" (YYYY-MM-DDTHH:mm)
    const toDatetimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Thêm hạng vé mới
    const handleAddTier = () => {
        const now = new Date();
        const eventStart = eventData.startTime ? new Date(eventData.startTime) : null;
        const defaultStart = toDatetimeLocal(now);
        const defaultEnd = eventStart && eventStart > now ? toDatetimeLocal(eventStart) : toDatetimeLocal(new Date(now.getTime() + 7 * 24 * 3600 * 1000));

        const newTier = {
            id: Date.now(),
            name: `Hạng vé mới #${ticketTiers.length + 1}`,
            description: 'Mô tả quyền lợi hạng vé...',
            originalPrice: 0.05,
            maxSupply: 100,
            saleStartTime: defaultStart,
            saleEndTime: defaultEnd,
            perks: 'Quyền lợi vé tiêu chuẩn',
        };
        setTicketTiers((prev) => [...prev, newTier]);
        showSnackbar('Đã thêm một hạng vé mới!', 'info');
    };

    // Xóa hạng vé
    const handleRemoveTier = (index) => {
        if (ticketTiers.length <= 1) {
            showSnackbar('Sự kiện bắt buộc phải có ít nhất 1 hạng vé phát hành!', 'warning');
            return;
        }
        setTicketTiers((prev) => prev.filter((_, i) => i !== index));
        showSnackbar('Đã xóa hạng vé.', 'info');
    };

    // Kiểm tra tính hợp lệ của từng bước
    const validateStep = (step) => {
        const newErrors = {};

        if (step === 0) {
            if (!eventData.title.trim()) newErrors.title = 'Vui lòng nhập tên sự kiện';
            else if (eventData.title.trim().length < 5) newErrors.title = 'Tên sự kiện tối thiểu 5 ký tự';
            if (!eventData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả chi tiết sự kiện';
            else if (eventData.description.trim().length < 20) newErrors.description = 'Mô tả sự kiện tối thiểu 20 ký tự (theo quy chuẩn xét duyệt)';
            if (!eventData.bannerUrl.trim()) newErrors.bannerUrl = 'Vui lòng chọn hoặc nhập URL ảnh poster';
        } else if (step === 1) {
            if (!eventData.venueName.trim()) newErrors.venueName = 'Vui lòng nhập tên địa điểm tổ chức';
            if (!eventData.venueAddress.trim()) newErrors.venueAddress = 'Vui lòng nhập địa chỉ cụ thể';
            if (!eventData.startTime) newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu';
            else if (new Date(eventData.startTime) <= new Date()) newErrors.startTime = 'Thời gian bắt đầu sự kiện phải ở tương lai';
            if (!eventData.endTime) newErrors.endTime = 'Vui lòng chọn thời gian kết thúc';
            if (eventData.startTime && eventData.endTime && new Date(eventData.endTime) <= new Date(eventData.startTime)) {
                newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
            }
        } else if (step === 2) {
            if (ticketTiers.length === 0) {
                showSnackbar('Cần ít nhất một hạng vé!', 'error');
                return false;
            }
            const eventEnd = eventData.endTime ? new Date(eventData.endTime) : null;
            ticketTiers.forEach((tier, index) => {
                if (!tier.name.trim()) newErrors[`tier_${index}_name`] = 'Thiếu tên hạng vé';
                if (!tier.originalPrice || Number(tier.originalPrice) <= 0) {
                    newErrors[`tier_${index}_price`] = 'Giá gốc phát hành phải lớn hơn 0 ETH';
                }
                if (!tier.maxSupply || Number(tier.maxSupply) <= 0) {
                    newErrors[`tier_${index}_supply`] = 'Số lượng phát hành trần phải lớn hơn 0';
                }
                if (!tier.saleStartTime) {
                    newErrors[`tier_${index}_saleStart`] = 'Vui lòng chọn thời gian bắt đầu mở bán vé';
                }
                if (!tier.saleEndTime) {
                    newErrors[`tier_${index}_saleEnd`] = 'Vui lòng chọn thời gian kết thúc bán vé';
                } else if (tier.saleStartTime && new Date(tier.saleEndTime) <= new Date(tier.saleStartTime)) {
                    newErrors[`tier_${index}_saleEnd`] = 'Thời gian kết thúc bán vé phải sau thời gian mở bán';
                } else if (eventEnd && new Date(tier.saleEndTime) > eventEnd) {
                    newErrors[`tier_${index}_saleEnd`] = 'Thời gian kết thúc bán vé không được sau khi sự kiện kết thúc';
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Chuyển sang bước kế tiếp
    const handleNext = () => {
        if (validateStep(activeStep)) {
            // Khi từ bước 1 sang bước 2, nếu hạng vé đầu tiên chưa có ngày mở/đóng bán thì tự điền gợi ý
            if (activeStep === 1 && ticketTiers.length > 0 && !ticketTiers[0].saleStartTime) {
                const now = new Date();
                const eventStart = eventData.startTime ? new Date(eventData.startTime) : null;
                const defaultStart = toDatetimeLocal(now);
                const defaultEnd = eventStart && eventStart > now ? toDatetimeLocal(eventStart) : toDatetimeLocal(new Date(now.getTime() + 7 * 24 * 3600 * 1000));
                setTicketTiers((prev) => {
                    const updated = [...prev];
                    updated[0] = {
                        ...updated[0],
                        saleStartTime: defaultStart,
                        saleEndTime: defaultEnd,
                    };
                    return updated;
                });
            }
            setActiveStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showSnackbar('Vui lòng kiểm tra và điền đầy đủ các thông tin bắt buộc!', 'error');
        }
    };

    // Quay lại bước trước
    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Tổng số vé và tổng doanh thu kỳ vọng
    const totalMaxSupply = ticketTiers.reduce((sum, t) => sum + (Number(t.maxSupply) || 0), 0);
    const totalEstimatedRevenue = ticketTiers.reduce(
        (sum, t) => sum + (Number(t.originalPrice) || 0) * (Number(t.maxSupply) || 0),
        0
    );

    // Gửi sự kiện để Admin phê duyệt hoặc lưu bản nháp
    const handleSubmitEvent = async (isDraft = false) => {
        // Kiểm tra hợp lệ cả 3 bước trước khi gửi
        const isStep0Valid = validateStep(0);
        const isStep1Valid = validateStep(1);
        const isStep2Valid = validateStep(2);

        if (!isStep0Valid || !isStep1Valid || !isStep2Valid) {
            showSnackbar('Vui lòng kiểm tra lại thông tin ở các bước trước khi gửi duyệt!', 'error');
            if (!isStep0Valid) setActiveStep(0);
            else if (!isStep1Valid) setActiveStep(1);
            else if (!isStep2Valid) setActiveStep(2);
            return;
        }

        setIsSubmitting(true);
        try {
            const eventStart = new Date(eventData.startTime);
            const now = new Date();
            const defaultSaleStart = now < eventStart ? now.toISOString() : new Date(eventStart.getTime() - 24 * 3600 * 1000).toISOString();
            const defaultSaleEnd = eventStart.toISOString();

            const preparedTicketTiers = ticketTiers.map((tier) => ({
                name: tier.name.trim(),
                description: tier.description?.trim() || `${tier.name.trim()} - Vé sự kiện NFT`,
                originalPrice: Number(tier.originalPrice),
                currency: 'ETH',
                maxSupply: Number(tier.maxSupply),
                saleStartTime: tier.saleStartTime ? new Date(tier.saleStartTime).toISOString() : defaultSaleStart,
                saleEndTime: tier.saleEndTime ? new Date(tier.saleEndTime).toISOString() : defaultSaleEnd,
            }));

            const eventPayload = {
                title: eventData.title.trim(),
                description: eventData.description.trim(),
                category: eventData.category || 'technology',
                bannerUrl: eventData.bannerUrl.trim(),
                venueName: eventData.venueName.trim(),
                venueAddress: eventData.venueAddress.trim(),
                venueCity: eventData.venueCity || 'Hà Nội',
                startTime: eventStart.toISOString(),
                endTime: new Date(eventData.endTime).toISOString(),
                ticketTypes: preparedTicketTiers,
            };

            const res = await organizerAPI.createEvent(eventPayload);
            const createdId = res.data?.data?.event?.id;
            if (!createdId) {
                throw new Error('Không nhận được mã sự kiện từ máy chủ.');
            }

            // Nếu không phải draft thì gửi duyệt luôn
            if (!isDraft) {
                await organizerAPI.submitReview(createdId);
            }

            setSubmittedEventId(createdId);

            if (isDraft) {
                showSnackbar(`Đã lưu bản nháp sự kiện #${createdId} thành công!`, 'success');
                navigate('/organizer/dashboard');
                return;
            }

            showSnackbar('Đã gửi sự kiện lên ban quản trị xét duyệt thành công!', 'success');
            setOpenSuccessModal(true);
        } catch (apiErr) {
            console.error('Lỗi khi gửi duyệt sự kiện:', apiErr);
            showSnackbar(apiErr.message || 'Đã xảy ra lỗi khi tạo sự kiện. Vui lòng kiểm tra lại.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            role="organizer"
            title="Tạo Sự Kiện Mới"
            subtitle="Khởi tạo sự kiện, cấu hình địa điểm và thiết lập các hạng vé NFT"
        >
            <Box sx={{ width: '100%' }}>

                    {/* HEADER BANNER */}
                    <Box
                        sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            mb: 4,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                                    <Chip
                                        icon={<EventNote sx={{ fontSize: '1rem !important' }} />}
                                        label="BAN TỔ CHỨC • TẠO SỰ KIỆN MỚI"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                    />
                                    <Chip
                                        icon={<Shield sx={{ fontSize: '1rem !important' }} />}
                                        label="CHUẨN ERC-721 NFT • SEPOLIA"
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            bgcolor: theme.palette.status?.onchainBg || 'rgba(99, 102, 241, 0.12)',
                                            color: theme.palette.status?.onchain || 'primary.main',
                                        }}
                                    />
                                </Stack>

                                <Typography variant="h1" fontWeight={800} color="text.primary" gutterBottom>
                                    Đăng Ký & Phát Hành Sự Kiện Mới
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.6 }}>
                                    Khởi tạo thông tin sự kiện, hình ảnh poster và định cấu hình các hạng vé NFT. Smart Contract sẽ tự động
                                    áp dụng quy tắc trần giá bán lại 120% (BR-03) và trích 5% phí bản quyền (BR-02) cho Ban Tổ Chức.
                                </Typography>
                            </Box>

                            {/* Organizer Wallet Pill */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: 'background.subtle',
                                    border: 1,
                                    borderColor: 'divider',
                                    minWidth: 220,
                                }}
                            >
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Ví Ban Tổ Chức (Organizer):
                                </Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                    {user?.walletAddress ? truncateHash(user.walletAddress, 8, 6) : 'Chưa liên kết ví Web3'}
                                </Typography>
                                <Typography variant="caption" color="primary.main" fontWeight={600} display="block" mt={0.5}>
                                    ✓ Nhận doanh thu & 5% Royalty
                                </Typography>
                            </Paper>
                        </Stack>

                        {/* STEPPER PROGRESS */}
                        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                            <Stepper activeStep={activeStep} alternativeLabel>
                                {STEPS.map((label, index) => (
                                    <Step key={label}>
                                        <StepLabel>
                                            <Typography variant="caption" fontWeight={activeStep === index ? 700 : 500}>
                                                {label}
                                            </Typography>
                                        </StepLabel>
                                    </Step>
                                ))}
                            </Stepper>
                        </Box>
                    </Box>

                    {/* NỘI DUNG FORM TỪNG BƯỚC */}
                    <Card
                        sx={{
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            p: { xs: 2.5, sm: 4 },
                            mb: 4,
                        }}
                    >
                        {/* ==================== BƯỚC 1: THÔNG TIN SỰ KIỆN CƠ BẢN ==================== */}
                        {activeStep === 0 && (
                            <Box>
                                <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
                                    1. Thông Tin Sự Kiện Cơ Bản
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Nhập tiêu đề, thể loại và tải ảnh poster đại diện sự kiện.
                                </Typography>

                                <Grid container spacing={3}>
                                    {/* Tiêu đề sự kiện */}
                                    <Grid item xs={12} md={8}>
                                        <TextField
                                            fullWidth
                                            label="Tên sự kiện *"
                                            placeholder="Ví dụ: Vietnam Blockchain Summit 2026, Hòa Nhạc Giao Hưởng Mùa Thu..."
                                            value={eventData.title}
                                            onChange={(e) => handleEventChange('title', e.target.value)}
                                            error={Boolean(errors.title)}
                                            helperText={errors.title}
                                            sx={{ mb: 3 }}
                                        />

                                        {/* Danh mục sự kiện */}
                                        <FormControl fullWidth sx={{ mb: 3 }}>
                                            <InputLabel id="category-select-label">Thể loại / Danh mục sự kiện *</InputLabel>
                                            <Select
                                                labelId="category-select-label"
                                                value={eventData.category}
                                                label="Thể loại / Danh mục sự kiện *"
                                                onChange={(e) => handleEventChange('category', e.target.value)}
                                            >
                                                {EVENT_CATEGORIES.map((cat) => (
                                                    <MenuItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Mô tả chi tiết sự kiện */}
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={5}
                                            label="Mô tả nội dung sự kiện *"
                                            placeholder="Giới thiệu về mục tiêu sự kiện, lịch trình diễn giả, khách mời danh dự và các chính sách quy định tham dự..."
                                            value={eventData.description}
                                            onChange={(e) => handleEventChange('description', e.target.value)}
                                            error={Boolean(errors.description)}
                                            helperText={errors.description}
                                        />
                                    </Grid>

                                    {/* Ảnh Poster Banner & Xem trước */}
                                    <Grid item xs={12} md={4}>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                            Ảnh Poster Banner Sự Kiện *
                                        </Typography>

                                        {/* Khung xem trước ảnh tỷ lệ 16:9 */}
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: 180,
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                border: 1,
                                                borderColor: 'divider',
                                                mb: 2,
                                                position: 'relative',
                                                bgcolor: 'background.subtle',
                                            }}
                                        >
                                            {eventData.bannerUrl ? (
                                                <CardMedia
                                                    component="img"
                                                    image={eventData.bannerUrl}
                                                    alt="Poster Preview"
                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                    <Image sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Ô nhập đường dẫn ảnh */}
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="URL hình ảnh poster (16:9)"
                                            value={eventData.bannerUrl}
                                            onChange={(e) => handleEventChange('bannerUrl', e.target.value)}
                                            error={Boolean(errors.bannerUrl)}
                                            helperText={errors.bannerUrl || 'Hỗ trợ JPG, PNG chất lượng cao'}
                                            sx={{ mb: 2 }}
                                        />

                                        {/* Chọn nhanh ảnh mẫu */}
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                                            HOẶC CHỌN ẢNH MẪU THEO CHỦ ĐỀ:
                                        </Typography>
                                        <Stack spacing={1}>
                                            {SAMPLE_POSTERS.map((poster, idx) => (
                                                <Button
                                                    key={idx}
                                                    size="small"
                                                    variant={eventData.bannerUrl === poster.url ? 'contained' : 'outlined'}
                                                    color="primary"
                                                    onClick={() => handleEventChange('bannerUrl', poster.url)}
                                                    sx={{
                                                        justifyContent: 'flex-start',
                                                        textTransform: 'none',
                                                        fontSize: '0.75rem',
                                                        py: 0.5,
                                                    }}
                                                >
                                                    {poster.label}
                                                </Button>
                                            ))}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* ==================== BƯỚC 2: THỜI GIAN & ĐỊA ĐIỂM ==================== */}
                        {activeStep === 1 && (
                            <Box>
                                <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
                                    2. Thời Gian & Địa Điểm Tổ Chức
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Xác định vị trí địa lý, thời gian bắt đầu và kết thúc sự kiện để người tham gia check-in.
                                </Typography>

                                <Grid container spacing={3}>
                                    {/* Tên địa điểm */}
                                    <Grid item xs={12} md={7}>
                                        <TextField
                                            fullWidth
                                            label="Tên địa điểm / Khán phòng *"
                                            placeholder="Ví dụ: Trung tâm Hội nghị Quốc gia, Nhà Hát Lớn Hà Nội, Sân vận động Mỹ Đình..."
                                            value={eventData.venueName}
                                            onChange={(e) => handleEventChange('venueName', e.target.value)}
                                            error={Boolean(errors.venueName)}
                                            helperText={errors.venueName}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationOn color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ mb: 3 }}
                                        />
                                    </Grid>

                                    {/* Thành phố */}
                                    <Grid item xs={12} md={5}>
                                        <FormControl fullWidth sx={{ mb: 3 }}>
                                            <InputLabel id="city-select-label">Tỉnh / Thành phố *</InputLabel>
                                            <Select
                                                labelId="city-select-label"
                                                value={eventData.venueCity}
                                                label="Tỉnh / Thành phố *"
                                                onChange={(e) => handleEventChange('venueCity', e.target.value)}
                                            >
                                                {CITIES.map((city) => (
                                                    <MenuItem key={city} value={city}>
                                                        {city}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/* Địa chỉ chi tiết */}
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Địa chỉ cụ thể (Số nhà, Tên đường, Quận/Huyện) *"
                                            placeholder="Ví dụ: Đại lộ Thăng Long, Mễ Trì, Nam Từ Liêm, Hà Nội"
                                            value={eventData.venueAddress}
                                            onChange={(e) => handleEventChange('venueAddress', e.target.value)}
                                            error={Boolean(errors.venueAddress)}
                                            helperText={errors.venueAddress}
                                            sx={{ mb: 3 }}
                                        />
                                    </Grid>

                                    {/* Thời gian bắt đầu */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Thời gian bắt đầu sự kiện *"
                                            value={eventData.startTime}
                                            onChange={(e) => handleEventChange('startTime', e.target.value)}
                                            error={Boolean(errors.startTime)}
                                            helperText={errors.startTime}
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Schedule color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    {/* Thời gian kết thúc */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Thời gian kết thúc sự kiện *"
                                            value={eventData.endTime}
                                            onChange={(e) => handleEventChange('endTime', e.target.value)}
                                            error={Boolean(errors.endTime)}
                                            helperText={errors.endTime}
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Schedule color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* ==================== BƯỚC 3: CẤU HÌNH HẠNG VÉ NFT ==================== */}
                        {activeStep === 2 && (
                            <Box>
                                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2}>
                                    <Box>
                                        <Typography variant="h3" fontWeight={700} color="text.primary">
                                            3. Cấu Hình Các Hạng Vé NFT Phát Hành
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Quy tắc bất biến trên Smart Contract: Giá gốc không đổi (BR-02) và Nguồn cung trần cố định (BR-01).
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Add />}
                                        onClick={handleAddTier}
                                        sx={{ borderRadius: '8px', fontWeight: 600, mt: { xs: 1.5, sm: 0 } }}
                                    >
                                        Thêm Hạng Vé
                                    </Button>
                                </Stack>

                                {/* Alert cam kết Anti-Scalping 120% */}
                                <Alert
                                    severity="info"
                                    icon={<Shield />}
                                    sx={{ mb: 3, borderRadius: '10px', fontSize: '0.85rem' }}
                                >
                                    <strong>Quy tắc BR-03 tự động kích hoạt:</strong> Khách mua vé chỉ được phép chuyển nhượng lại trên Marketplace
                                    với giá tối đa bằng <strong>120% giá gốc phát hành</strong>. Ban Tổ Chức sẽ nhận <strong>5% Royalty Fee</strong> cho mỗi giao dịch bán lại.
                                </Alert>

                                <Stack spacing={3}>
                                    {ticketTiers.map((tier, index) => {
                                        const maxResaleCap = ((Number(tier.originalPrice) || 0) * 1.2).toFixed(4);

                                        return (
                                            <Paper
                                                key={tier.id}
                                                elevation={0}
                                                sx={{
                                                    p: 3,
                                                    borderRadius: '12px',
                                                    bgcolor: 'background.subtle',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    position: 'relative',
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            label={`Hạng Vé #${index + 1}`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{ fontWeight: 700 }}
                                                        />
                                                        <Typography variant="subtitle1" fontWeight={700}>
                                                            {tier.name || 'Hạng vé chưa đặt tên'}
                                                        </Typography>
                                                    </Stack>

                                                    {ticketTiers.length > 1 && (
                                                        <Tooltip title="Xóa hạng vé này">
                                                            <IconButton
                                                                color="error"
                                                                size="small"
                                                                aria-label={`Xóa hạng vé #${index + 1}`}
                                                                onClick={() => handleRemoveTier(index)}
                                                            >
                                                                <DeleteOutline fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>

                                                <Grid container spacing={2}>
                                                    {/* Tên hạng vé */}
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Tên hạng vé *"
                                                            placeholder="Ví dụ: Early Bird, VIP Pass, Standard..."
                                                            value={tier.name}
                                                            onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_name`])}
                                                            helperText={errors[`tier_${index}_name`]}
                                                        />
                                                    </Grid>

                                                    {/* Giá phát hành ban đầu (originalPrice) */}
                                                    <Grid item xs={12} sm={3}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            label="Giá phát hành gốc (ETH) *"
                                                            value={tier.originalPrice}
                                                            onChange={(e) => handleTierChange(index, 'originalPrice', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_price`])}
                                                            helperText={errors[`tier_${index}_price`]}
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                                                            }}
                                                        />
                                                    </Grid>

                                                    {/* Nguồn cung trần tối đa (maxSupply) */}
                                                    <Grid item xs={12} sm={3}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            label="Số vé phát hành tối đa *"
                                                            value={tier.maxSupply}
                                                            onChange={(e) => handleTierChange(index, 'maxSupply', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_supply`])}
                                                            helperText={errors[`tier_${index}_supply`]}
                                                            InputProps={{
                                                                endAdornment: <InputAdornment position="end">Vé</InputAdornment>,
                                                            }}
                                                        />
                                                    </Grid>

                                                    {/* Thời gian bắt đầu mở bán vé */}
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="datetime-local"
                                                            label="Thời gian bắt đầu mở bán vé *"
                                                            value={tier.saleStartTime || ''}
                                                            onChange={(e) => handleTierChange(index, 'saleStartTime', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_saleStart`])}
                                                            helperText={errors[`tier_${index}_saleStart`] || 'Thời điểm bắt đầu cho phép mua vé'}
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    </Grid>

                                                    {/* Thời gian kết thúc bán vé */}
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="datetime-local"
                                                            label="Thời gian kết thúc bán vé *"
                                                            value={tier.saleEndTime || ''}
                                                            onChange={(e) => handleTierChange(index, 'saleEndTime', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_saleEnd`])}
                                                            helperText={errors[`tier_${index}_saleEnd`] || 'Hạn chót mua vé (không được sau giờ sự kiện kết thúc)'}
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    </Grid>

                                                    {/* Tóm tắt tính toán trần giá 120% */}
                                                    <Grid item xs={12}>
                                                        <Box
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: '8px',
                                                                bgcolor: 'background.paper',
                                                                border: 1,
                                                                borderColor: 'divider',
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: 3,
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            <Typography variant="caption" color="text.secondary">
                                                                Trần giá bán lại thứ cấp (120%):{' '}
                                                                <strong style={{ color: theme.palette.primary.main }}>
                                                                    {maxResaleCap} ETH
                                                                </strong>
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Phí bản quyền BTC khi giao dịch lại:{' '}
                                                                <strong style={{ color: theme.palette.status?.success || '#10B981' }}>
                                                                    5% ({(tier.originalPrice * 0.05).toFixed(4)} ETH)
                                                                </strong>
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Doanh thu kỳ vọng từ hạng vé:{' '}
                                                                <strong>
                                                                    {(tier.originalPrice * tier.maxSupply).toFixed(2)} ETH
                                                                </strong>
                                                            </Typography>
                                                        </Box>
                                                    </Grid>

                                                    {/* Quyền lợi hạng vé */}
                                                    <Grid item xs={12}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Quyền lợi & Đặc quyền của hạng vé"
                                                            placeholder="Ví dụ: Ghế VIP hàng đầu, Lối đi riêng, Quà lưu niệm NFT..."
                                                            value={tier.perks}
                                                            onChange={(e) => handleTierChange(index, 'perks', e.target.value)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}

                        {/* ==================== BƯỚC 4: XEM TRƯỚC & GỬI DUYỆT ==================== */}
                        {activeStep === 3 && (
                            <Box>
                                <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
                                    4. Xem Trước & Gửi Phê Duyệt Hệ Thống
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Kiểm tra kỹ thông tin trước khi gửi lên hàng đợi xét duyệt của Quản trị viên (Admin).
                                </Typography>

                                <Grid container spacing={3}>
                                    {/* THẺ SỰ KIỆN XEM TRƯỚC (LIVE PREVIEW) */}
                                    <Grid item xs={12} md={5}>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                            Mẫu Thẻ Sự Kiện Hiển Thị Trên Trang Chủ:
                                        </Typography>

                                        <Card
                                            sx={{
                                                borderRadius: '16px',
                                                bgcolor: 'background.paper',
                                                border: 1,
                                                borderColor: 'divider',
                                                overflow: 'hidden',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={eventData.bannerUrl}
                                                alt={eventData.title}
                                                sx={{ objectFit: 'cover' }}
                                            />
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Stack direction="row" spacing={1} mb={1}>
                                                    <Chip
                                                        label={EVENT_CATEGORIES.find((c) => c.value === eventData.category)?.label}
                                                        size="small"
                                                        color="primary"
                                                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                    <Chip
                                                        label="Chờ Duyệt"
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            bgcolor: theme.palette.status?.pendingBg || 'rgba(245, 158, 11, 0.12)',
                                                            color: theme.palette.status?.pending || '#F59E0B',
                                                        }}
                                                    />
                                                </Stack>

                                                <Typography variant="h3" fontWeight={700} gutterBottom noWrap>
                                                    {eventData.title || 'Tên sự kiện chưa cập nhật'}
                                                </Typography>

                                                <Stack spacing={1} sx={{ my: 1.5 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {eventData.startTime ? new Date(eventData.startTime).toLocaleString('vi-VN') : '---'}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary" noWrap>
                                                            {eventData.venueName}, {eventData.venueCity}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>

                                                <Divider sx={{ my: 1.5 }} />

                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Giá phát hành từ:
                                                </Typography>
                                                <Typography variant="h3" fontWeight={800} color="primary.main">
                                                    {ticketTiers[0]?.originalPrice || 0} ETH
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    {/* BẢNG TỔNG HỢP CHỈ SỐ KINH TẾ BLOCKCHAIN */}
                                    <Grid item xs={12} md={7}>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                            Bảng Tổng Hợp Tham Số Phát Hành NFT:
                                        </Typography>

                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: '12px',
                                                bgcolor: 'background.subtle',
                                                border: 1,
                                                borderColor: 'divider',
                                                mb: 3,
                                            }}
                                        >
                                            <Grid container spacing={2} mb={2}>
                                                <Grid item xs={6} sm={4}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tổng số vé phát hành:
                                                    </Typography>
                                                    <Typography variant="h3" fontWeight={800} color="primary.main">
                                                        {totalMaxSupply} Vé
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={4}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Số hạng vé NFT:
                                                    </Typography>
                                                    <Typography variant="h3" fontWeight={800}>
                                                        {ticketTiers.length} Hạng
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={4}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Doanh thu kỳ vọng:
                                                    </Typography>
                                                    <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.status?.success || '#10B981' }}>
                                                        {totalEstimatedRevenue.toFixed(2)} ETH
                                                    </Typography>
                                                </Grid>
                                            </Grid>

                                            <Divider sx={{ my: 2 }} />

                                            <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                                                DANH SÁCH HẠNG VÉ CHI TIẾT:
                                            </Typography>

                                            <Stack spacing={1}>
                                                {ticketTiers.map((tier, idx) => (
                                                    <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {tier.name} ({tier.maxSupply} vé):
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                                            {tier.originalPrice} ETH{' '}
                                                            <span style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
                                                                (Trần: {(tier.originalPrice * 1.2).toFixed(4)} ETH)
                                                            </span>
                                                        </Typography>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </Paper>

                                        {/* Hộp cam kết pháp lý & quy tắc Web3 */}
                                        <Alert
                                            severity="warning"
                                            icon={<Gavel />}
                                            sx={{ borderRadius: '10px', fontSize: '0.85rem' }}
                                        >
                                            Sau khi được Quản trị viên duyệt, thông tin hạng vé và giá gốc phát hành sẽ được
                                            triển khai lên Smart Contract Sepolia và <strong>không thể chỉnh sửa</strong> để đảm bảo tính bất biến của blockchain.
                                        </Alert>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* THANH ĐIỀU HƯỚNG BƯỚC BẤM NÚT (FORM NAVIGATION BUTTONS) */}
                        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                disabled={activeStep === 0}
                                startIcon={<ArrowBack />}
                                onClick={handleBack}
                                sx={{ borderRadius: '8px', fontWeight: 600, height: 44, px: 3 }}
                            >
                                Quay Lại
                            </Button>

                            <Stack direction="row" spacing={1.5}>
                                {activeStep === STEPS.length - 1 ? (
                                    <>
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            disabled={isSubmitting}
                                            startIcon={<Save />}
                                            onClick={() => handleSubmitEvent(true)}
                                            sx={{ borderRadius: '8px', fontWeight: 600, height: 44 }}
                                        >
                                            {isSubmitting ? 'Đang lưu...' : 'Lưu Bản Nháp'}
                                        </Button>

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            disabled={isSubmitting}
                                            startIcon={<Send />}
                                            onClick={() => handleSubmitEvent(false)}
                                            sx={{ borderRadius: '8px', fontWeight: 700, height: 44, px: 3 }}
                                        >
                                            {isSubmitting ? 'Đang gửi...' : 'Gửi Duyệt Sự Kiện'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        endIcon={<ArrowForward />}
                                        onClick={handleNext}
                                        sx={{ borderRadius: '8px', fontWeight: 700, height: 44, px: 3 }}
                                    >
                                        Tiếp Tục
                                    </Button>
                                )}
                            </Stack>
                        </Box>
                    </Card>
                </Box>

            {/* MODAL THÔNG BÁO GỬI PHÊ DUYỆT THÀNH CÔNG */}
            <Dialog
                open={openSuccessModal}
                onClose={() => setOpenSuccessModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogContent>
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
                        Gửi Phê Duyệt Thành Công!
                    </Typography>

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Sự kiện <strong>{eventData.title}</strong> (Mã: <code>{submittedEventId}</code>) đã được chuyển đến
                        hàng đợi thẩm định của Quản trị viên hệ thống BlockTickets.
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: 'background.subtle',
                            border: 1,
                            borderColor: 'divider',
                            mb: 2,
                            textAlign: 'left',
                        }}
                    >
                        <Stack spacing={0.75}>
                            <Typography variant="caption" color="text.secondary">
                                Trạng thái hiện tại:
                            </Typography>
                            <Chip
                                label="Chờ Duyệt (Pending Review)"
                                size="small"
                                sx={{
                                    height: 22,
                                    width: 'fit-content',
                                    fontWeight: 700,
                                    bgcolor: theme.palette.status?.pendingBg || 'rgba(245, 158, 11, 0.12)',
                                    color: theme.palette.status?.pending || '#F59E0B',
                                }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Sau khi được duyệt, sự kiện sẽ tự động hiển thị trên trang chủ và mở bán vé NFT cho công chúng.
                            </Typography>
                        </Stack>
                    </Paper>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 0, justifyContent: 'center', gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                            setOpenSuccessModal(false);
                            navigate('/organizer/dashboard');
                        }}
                        sx={{ borderRadius: '8px', fontWeight: 600 }}
                    >
                        Đóng
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setOpenSuccessModal(false);
                            navigate('/organizer/dashboard');
                        }}
                        sx={{ borderRadius: '8px', fontWeight: 600, px: 2.5 }}
                    >
                        Quản Lý Sự Kiện Của Tôi
                    </Button>
                </DialogActions>
            </Dialog>

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
        </DashboardLayout>
    );
};

export default CreateEventPage;

