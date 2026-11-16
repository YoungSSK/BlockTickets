import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    InputAdornment,
    Stepper,
    Step,
    StepLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
    LinearProgress,
    CircularProgress,
    Pagination,
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
    Close,
    Save,
    Send,
    Edit,
    Search,
    Refresh,
    Visibility,
    CancelOutlined,
    FiberManualRecord,
    HourglassEmpty,
    MonetizationOn,
    OpenInNew,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { organizerAPI } from '../../services/api';
import { ethers } from 'ethers';
import { EVENT_TICKET_ADDRESS } from '../../constants/contracts';
import EventTicketABI from '../../constants/abi/EventTicket.json';

// Helper rút gọn địa chỉ ví và mã băm
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Helper định dạng ngày giờ cho input type="datetime-local" (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
    'Thời gian & Địa điểm',
    'Thiết lập hạng vé NFT',
    'Xem lại & Gửi duyệt',
];

const INITIAL_EVENT_DATA = {
    title: '',
    category: 'technology',
    description: '',
    bannerUrl: '',
    venueName: '',
    venueAddress: '',
    venueCity: 'Hà Nội',
    startTime: '',
    endTime: '',
};

const INITIAL_TIERS = [
    {
        id: 1,
        name: 'Vé Tiêu Chuẩn (Standard)',
        description: 'Vé vào cổng tiêu chuẩn tham gia toàn bộ sự kiện',
        originalPrice: '0.001',
        maxSupply: '100',
        saleStartTime: '',
        saleEndTime: '',
        perks: 'Vé vào cổng hợp lệ, check-in QR động',
    },
];

const CreateEventPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // Chế độ xem: 'list' (Danh sách sự kiện) hoặc 'create' (Form tạo sự kiện mới)
    const [viewMode, setViewMode] = useState(searchParams.get('mode') === 'create' ? 'create' : 'list');

    // ==========================================
    // STATE CHO DANH SÁCH SỰ KIỆN (LIST VIEW)
    // ==========================================
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusTab, setStatusTab] = useState('all'); // 'all' | 'published' | 'pending' | 'draft' | 'ended'

    // Modal chi tiết sự kiện
    const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);
    const [openDetailModal, setOpenDetailModal] = useState(false);

    // Modal cập nhật sự kiện
    const [editingEvent, setEditingEvent] = useState(null);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);

    // Dialog xác nhận hủy sự kiện
    const [cancellingEvent, setCancellingEvent] = useState(null);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    // Dialog xác nhận xóa vĩnh viễn sự kiện
    const [deletingEvent, setDeletingEvent] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ==========================================
    // STATE CHO FORM TẠO SỰ KIỆN (CREATE VIEW)
    // ==========================================
    const [activeStep, setActiveStep] = useState(0);
    const [eventData, setEventData] = useState(INITIAL_EVENT_DATA);
    const [ticketTiers, setTicketTiers] = useState(INITIAL_TIERS);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openSuccessModal, setOpenSuccessModal] = useState(false);
    const [submittedEventId, setSubmittedEventId] = useState('');

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Tải danh sách sự kiện của Ban Tổ Chức
    const loadMyEvents = useCallback(async () => {
        setLoadingEvents(true);
        try {
            const res = await organizerAPI.getMyEvents({ page: 1, limit: 100 });
            const rawEvents = Array.isArray(res.data?.data?.events) ? res.data.data.events : [];
            const mappedEvents = rawEvents.map((e) => {
                const ticketsSold = e.ticketTypes?.reduce((sum, tt) => sum + (tt.currentSupply || tt.mintedAmount || 0), 0) || 0;
                const maxSupply = e.ticketTypes?.reduce((sum, tt) => sum + (tt.maxSupply || 0), 0) || 0;
                const revEth = +(
                    (e.ticketTypes?.reduce(
                        (sum, tt) => sum + (tt.currentSupply || tt.mintedAmount || 0) * (Number(tt.originalPrice) || 0),
                        0
                    ) || 0)
                ).toFixed(4);

                let statusText = 'ĐANG MỞ BÁN';
                if (e.status === 'approved') statusText = 'ĐÃ DUYỆT';
                else if (e.status === 'pending') statusText = 'CHỜ DUYỆT';
                else if (e.status === 'draft') statusText = 'BẢN NHÁP';
                else if (e.status === 'rejected') statusText = 'BỊ TỪ CHỐI';
                else if (e.status === 'ended') statusText = 'ĐÃ KẾT THÚC';
                else if (e.status === 'cancelled') statusText = 'ĐÃ HỦY';

                return {
                    id: e.id,
                    title: e.title,
                    description: e.description || '',
                    bannerUrl: e.bannerUrl || '',
                    category: e.category || 'technology',
                    categoryLabel:
                        e.category === 'sports' ? 'Thể thao' :
                        e.category === 'technology' ? 'Công nghệ & Web3' :
                        e.category === 'workshop' ? 'Hội thảo' : 'Âm nhạc',
                    venue: e.venueName ? `${e.venueName}, ${e.venueAddress || e.venueCity || ''}` : e.venueCity || 'Hà Nội',
                    venueName: e.venueName || '',
                    venueAddress: e.venueAddress || '',
                    venueCity: e.venueCity || '',
                    date: e.startTime ? new Date(e.startTime).toLocaleDateString('vi-VN') : '',
                    startTime: e.startTime ? new Date(e.startTime).toLocaleString('vi-VN') : '',
                    endTime: e.endTime ? new Date(e.endTime).toLocaleString('vi-VN') : '',
                    rawStartTime: e.startTime,
                    rawEndTime: e.endTime,
                    status: e.status,
                    statusText,
                    onChainEventId: e.onChainEventId,
                    ticketsSold,
                    maxSupply,
                    totalRevenueEth: revEth,
                    ticketTypes: Array.isArray(e.ticketTypes) ? e.ticketTypes : [],
                    raw: e,
                };
            });
            setEvents(mappedEvents);
        } catch (err) {
            console.error('Lỗi khi tải danh sách sự kiện:', err);
            showSnackbar('Không thể tải danh sách sự kiện của bạn.', 'error');
        } finally {
            setLoadingEvents(false);
        }
    }, []);

    useEffect(() => {
        loadMyEvents();
    }, [loadMyEvents]);

    // Lọc sự kiện theo tab trạng thái và từ khóa tìm kiếm
    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query ||
                evt.title.toLowerCase().includes(query) ||
                String(evt.id).includes(query) ||
                evt.venue.toLowerCase().includes(query);

            if (!matchesSearch) return false;

            if (statusTab === 'published') return evt.status === 'published';
            if (statusTab === 'pending') return evt.status === 'pending';
            if (statusTab === 'draft') return evt.status === 'draft' || evt.status === 'rejected';
            if (statusTab === 'ended') return evt.status === 'ended' || evt.status === 'cancelled';
            return true;
        });
    }, [events, statusTab, searchQuery]);

    // Thống kê nhanh số lượng sự kiện
    const eventCounts = useMemo(() => {
        return {
            all: events.length,
            published: events.filter((e) => e.status === 'published').length,
            pending: events.filter((e) => e.status === 'pending').length,
            draft: events.filter((e) => ['draft', 'rejected'].includes(e.status)).length,
            ended: events.filter((e) => ['ended', 'cancelled'].includes(e.status)).length,
        };
    }, [events]);

    // ==========================================
    // THAO TÁC SỰ KIỆN: CHI TIẾT, SỬA, HỦY, XÓA
    // ==========================================
    const handleViewDetail = (evt) => {
        setSelectedDetailEvent(evt);
        setOpenDetailModal(true);
    };

    const handleOpenEdit = (evt) => {
        setEditingEvent(evt);
        setEditFormData({
            title: evt.title || '',
            category: evt.category || 'technology',
            bannerUrl: evt.bannerUrl || '',
            venueName: evt.venueName || '',
            venueAddress: evt.venueAddress || '',
            venueCity: evt.venueCity || 'Hà Nội',
            startTime: toDatetimeLocal(evt.rawStartTime),
            endTime: toDatetimeLocal(evt.rawEndTime),
            description: evt.description || '',
        });
        setOpenEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editFormData.title?.trim()) {
            showSnackbar('Tên sự kiện không được để trống.', 'error');
            return;
        }
        if (!editFormData.description?.trim() || editFormData.description.trim().length < 20) {
            showSnackbar('Mô tả sự kiện tối thiểu 20 ký tự.', 'error');
            return;
        }

        setIsUpdating(true);
        try {
            const payload = {
                title: editFormData.title.trim(),
                category: editFormData.category,
                bannerUrl: editFormData.bannerUrl?.trim() || '',
                venueName: editFormData.venueName?.trim() || '',
                venueAddress: editFormData.venueAddress?.trim() || '',
                venueCity: editFormData.venueCity || 'Hà Nội',
                description: editFormData.description.trim(),
            };

            // Nếu sự kiện đang ở draft hoặc pending, cho phép sửa thời gian
            if (['draft', 'rejected', 'pending'].includes(editingEvent.status)) {
                if (editFormData.startTime) payload.startTime = new Date(editFormData.startTime).toISOString();
                if (editFormData.endTime) payload.endTime = new Date(editFormData.endTime).toISOString();
            }

            await organizerAPI.updateEvent(editingEvent.id, payload);
            showSnackbar('Cập nhật thông tin sự kiện thành công!', 'success');
            setOpenEditModal(false);
            setEditingEvent(null);
            await loadMyEvents();
        } catch (err) {
            console.error('Lỗi cập nhật sự kiện:', err);
            showSnackbar(err?.response?.data?.message || err.message || 'Lỗi khi cập nhật sự kiện.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOpenCancel = (evt) => {
        setCancellingEvent(evt);
        setCancelReason('');
        setOpenCancelDialog(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancellingEvent) return;
        setIsCancelling(true);
        try {
            await organizerAPI.cancelEvent(cancellingEvent.id, cancelReason);
            showSnackbar(`Đã hủy sự kiện "${cancellingEvent.title}" thành công.`, 'success');
            setOpenCancelDialog(false);
            setCancellingEvent(null);
            if (openDetailModal) setOpenDetailModal(false);
            await loadMyEvents();
        } catch (err) {
            console.error('Lỗi khi hủy sự kiện:', err);
            showSnackbar(err?.response?.data?.message || err.message || 'Không thể hủy sự kiện.', 'error');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleOpenDelete = (evt) => {
        setDeletingEvent(evt);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingEvent) return;
        setIsDeleting(true);
        try {
            await organizerAPI.deleteEvent(deletingEvent.id);
            showSnackbar(`Đã xóa vĩnh viễn sự kiện "${deletingEvent.title}".`, 'success');
            setOpenDeleteDialog(false);
            setDeletingEvent(null);
            if (openDetailModal) setOpenDetailModal(false);
            await loadMyEvents();
        } catch (err) {
            console.error('Lỗi khi xóa sự kiện:', err);
            showSnackbar(err?.response?.data?.message || err.message || 'Không thể xóa sự kiện.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    // Gửi duyệt nhanh cho sự kiện đang ở bản nháp
    const handleQuickSubmitReview = async (eventId) => {
        try {
            await organizerAPI.submitReview(eventId);
            showSnackbar('Đã gửi sự kiện lên ban quản trị xét duyệt thành công!', 'success');
            if (openDetailModal) setOpenDetailModal(false);
            await loadMyEvents();
        } catch (err) {
            showSnackbar(err?.response?.data?.message || err.message || 'Lỗi khi gửi duyệt sự kiện.', 'error');
        }
    };

    // ==========================================
    // LOGIC CHO BƯỚC TẠO SỰ KIỆN MỚI (WIZARD)
    // ==========================================
    const resetCreateForm = () => {
        setActiveStep(0);
        setEventData(INITIAL_EVENT_DATA);
        setTicketTiers([
            {
                id: 1,
                name: 'Vé Tiêu Chuẩn (Standard)',
                description: 'Vé vào cổng tiêu chuẩn tham gia toàn bộ sự kiện',
                originalPrice: '0.001',
                maxSupply: '100',
                saleStartTime: '',
                saleEndTime: '',
                perks: 'Vé vào cổng hợp lệ, check-in QR động',
            },
        ]);
        setErrors({});
    };

    const handleEventChange = (field, value) => {
        setEventData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const handleTierChange = (index, field, value) => {
        setTicketTiers((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddTier = () => {
        const now = new Date();
        const eventStart = eventData.startTime ? new Date(eventData.startTime) : null;
        const defaultStart = toDatetimeLocal(now);
        const defaultEnd = eventStart && eventStart > now ? toDatetimeLocal(eventStart) : toDatetimeLocal(new Date(now.getTime() + 7 * 24 * 3600 * 1000));

        const newTier = {
            id: Date.now(),
            name: `Hạng vé mới #${ticketTiers.length + 1}`,
            description: 'Mô tả quyền lợi hạng vé...',
            originalPrice: '0.002',
            maxSupply: '50',
            saleStartTime: defaultStart,
            saleEndTime: defaultEnd,
            perks: 'Quyền lợi vé tiêu chuẩn',
        };
        setTicketTiers((prev) => [...prev, newTier]);
        showSnackbar('Đã thêm một hạng vé mới!', 'info');
    };

    const handleRemoveTier = (index) => {
        if (ticketTiers.length <= 1) {
            showSnackbar('Sự kiện bắt buộc phải có ít nhất 1 hạng vé phát hành!', 'warning');
            return;
        }
        setTicketTiers((prev) => prev.filter((_, i) => i !== index));
        showSnackbar('Đã xóa hạng vé.', 'info');
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 0) {
            if (!eventData.title.trim()) newErrors.title = 'Vui lòng nhập tên sự kiện';
            else if (eventData.title.trim().length < 5) newErrors.title = 'Tên sự kiện tối thiểu 5 ký tự';
            if (!eventData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả chi tiết sự kiện';
            else if (eventData.description.trim().length < 20) newErrors.description = 'Mô tả sự kiện tối thiểu 20 ký tự';
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
            ticketTiers.forEach((tier, index) => {
                if (!tier.name.trim()) newErrors[`tier_${index}_name`] = 'Thiếu tên hạng vé';
                if (!tier.originalPrice || Number(tier.originalPrice) <= 0) {
                    newErrors[`tier_${index}_price`] = 'Giá gốc phát hành phải lớn hơn 0 ETH';
                }
                if (!tier.maxSupply || Number(tier.maxSupply) <= 0) {
                    newErrors[`tier_${index}_supply`] = 'Số lượng phát hành trần phải lớn hơn 0';
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prev) => prev + 1);
        } else {
            showSnackbar('Vui lòng hoàn thành đúng các thông tin được yêu cầu.', 'warning');
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    // Gửi sự kiện mới
    const handleSubmitEvent = async (isDraft = false) => {
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

            if (!isDraft) {
                await organizerAPI.submitReview(createdId);
            }

            setSubmittedEventId(createdId);

            if (isDraft) {
                showSnackbar(`Đã lưu bản nháp sự kiện #${createdId} thành công!`, 'success');
                setViewMode('list');
                await loadMyEvents();
                return;
            }

            showSnackbar('Đã tạo sự kiện và gửi xét duyệt thành công!', 'success');
            setOpenSuccessModal(true);
        } catch (apiErr) {
            console.error('Lỗi khi tạo sự kiện:', apiErr);
            showSnackbar(apiErr?.response?.data?.message || apiErr.message || 'Đã xảy ra lỗi khi tạo sự kiện. Vui lòng kiểm tra lại.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            role="organizer"
            title={viewMode === 'create' ? 'Khởi Tạo Sự Kiện Mới' : 'Tạo & Quản Lý Sự Kiện'}
            subtitle={viewMode === 'create' ? 'Cấu hình thông tin sự kiện, địa điểm và thiết lập các hạng vé NFT' : 'Xem danh sách sự kiện do bạn tổ chức, tạo mới hoặc quản lý chỉnh sửa'}
            hideHeaderActions={true}
        >
            <Box sx={{ width: '100%' }}>

                {/* =========================================================================
                    CHẾ ĐỘ XEM 1: DANH SÁCH SỰ KIỆN CỦA BAN TỔ CHỨC (LIST VIEW)
                ========================================================================= */}
                {viewMode === 'list' && (
                    <Box>
                        {/* KHỐI HEADER TRANG: TIÊU ĐỀ & NÚT TẠO MỚI SỰ KIỆN */}
                        <Box
                            sx={{
                                p: { xs: 2.5, sm: 3 },
                                borderRadius: '16px',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                mb: 3.5,
                            }}
                        >
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                justifyContent="space-between"
                                alignItems={{ xs: 'flex-start', sm: 'center' }}
                                spacing={2}
                            >
                                <Box>
                                    <Typography variant="h2" fontWeight={800} color="text.primary" gutterBottom>
                                        Danh Sách Sự Kiện Ban Tổ Chức
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Tổng số {eventCounts.all} sự kiện • {eventCounts.published} đang mở bán • {eventCounts.pending} chờ duyệt • {eventCounts.draft} bản nháp
                                    </Typography>
                                </Box>

                                {/* NÚT TẠO MỚI SỰ KIỆN NỔI BẬT */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Add />}
                                    onClick={() => {
                                        resetCreateForm();
                                        setViewMode('create');
                                    }}
                                    sx={{
                                        height: 44,
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        px: 3,
                                        boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                                    }}
                                >
                                    Tạo Sự Kiện Mới
                                </Button>
                            </Stack>
                        </Box>

                        {/* THANH TÌM KIẾM & TABS LỌC TRẠNG THÁI */}
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                mb: 3.5,
                                overflow: 'hidden',
                            }}
                        >
                            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={8}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="Tìm kiếm theo tên sự kiện, mã sự kiện, địa điểm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search sx={{ color: 'text.secondary' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{ bgcolor: 'background.subtle', borderRadius: '8px' }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<Refresh />}
                                            onClick={loadMyEvents}
                                            disabled={loadingEvents}
                                            sx={{ borderRadius: '8px', height: 40, fontWeight: 600 }}
                                        >
                                            {loadingEvents ? 'Đang tải...' : 'Làm mới'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ px: 2 }}>
                                <Tabs
                                    value={statusTab}
                                    onChange={(e, val) => setStatusTab(val)}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{ minHeight: 48 }}
                                >
                                    <Tab value="all" label={`Tất cả (${eventCounts.all})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                                    <Tab value="published" label={`Đang mở bán (${eventCounts.published})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                                    <Tab value="pending" label={`Chờ duyệt (${eventCounts.pending})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                                    <Tab value="draft" label={`Bản nháp (${eventCounts.draft})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                                    <Tab value="ended" label={`Đã kết thúc / Hủy (${eventCounts.ended})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
                                </Tabs>
                            </Box>

                            {/* BẢNG DANH SÁCH SỰ KIỆN */}
                            <TableContainer>
                                <Table sx={{ minWidth: 800 }}>
                                    <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Sự kiện & Địa điểm</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Tiến độ vé</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Doanh thu</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loadingEvents ? (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                                                    <CircularProgress size={32} />
                                                    <Typography variant="body2" color="text.secondary" mt={1.5}>
                                                        Đang tải danh sách sự kiện...
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredEvents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                                                    <EventNote sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                                    <Typography variant="body1" fontWeight={700} color="text.secondary">
                                                        Không tìm thấy sự kiện nào phù hợp.
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<Add />}
                                                        onClick={() => {
                                                            resetCreateForm();
                                                            setViewMode('create');
                                                        }}
                                                        sx={{ mt: 2, borderRadius: '8px', fontWeight: 700 }}
                                                    >
                                                        Tạo sự kiện ngay
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredEvents.map((evt) => {
                                                const salesPercent = evt.maxSupply > 0 ? ((evt.ticketsSold / evt.maxSupply) * 100).toFixed(0) : 0;

                                                return (
                                                    <TableRow key={evt.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        {/* 1. Thông tin sự kiện & hình ảnh */}
                                                        <TableCell sx={{ py: 1.8 }}>
                                                            <Stack direction="row" spacing={2} alignItems="center">
                                                                <Box
                                                                    component="img"
                                                                    src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                                                                    alt={evt.title}
                                                                    onClick={() => handleViewDetail(evt)}
                                                                    sx={{
                                                                        width: { xs: 60, sm: 76 },
                                                                        height: { xs: 46, sm: 54 },
                                                                        borderRadius: '8px',
                                                                        objectFit: 'cover',
                                                                        flexShrink: 0,
                                                                        border: 1,
                                                                        borderColor: 'divider',
                                                                        cursor: 'pointer',
                                                                        transition: 'transform 0.2s',
                                                                        '&:hover': { transform: 'scale(1.05)' },
                                                                    }}
                                                                />
                                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                    <Typography
                                                                        variant="subtitle2"
                                                                        fontWeight={700}
                                                                        color="text.primary"
                                                                        onClick={() => handleViewDetail(evt)}
                                                                        sx={{
                                                                            cursor: 'pointer',
                                                                            transition: 'color 0.2s',
                                                                            '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                                                                            fontSize: '0.92rem',
                                                                            lineHeight: 1.3,
                                                                            mb: 0.3,
                                                                        }}
                                                                    >
                                                                        {evt.title}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: { xs: 240, sm: 380 }, mb: 0.3 }}>
                                                                        {evt.venue} • {evt.date} ({evt.startTime})
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                                                                        Mã sự kiện: #{evt.id}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </TableCell>

                                                        {/* 2. Trạng thái */}
                                                        <TableCell>
                                                            <Chip
                                                                label={evt.statusText}
                                                                size="small"
                                                                sx={{
                                                                    fontWeight: 700,
                                                                    fontSize: '0.75rem',
                                                                    bgcolor:
                                                                        evt.status === 'published' ? 'rgba(16, 185, 129, 0.12)' :
                                                                        evt.status === 'approved' ? 'rgba(37, 99, 235, 0.12)' :
                                                                        evt.status === 'pending' ? 'rgba(245, 158, 11, 0.12)' :
                                                                        evt.status === 'cancelled' ? 'rgba(239, 68, 68, 0.12)' :
                                                                        'rgba(100, 116, 139, 0.12)',
                                                                    color:
                                                                        evt.status === 'published' ? '#10B981' :
                                                                        evt.status === 'approved' ? '#2563EB' :
                                                                        evt.status === 'pending' ? '#F59E0B' :
                                                                        evt.status === 'cancelled' ? '#EF4444' :
                                                                        'text.secondary',
                                                                }}
                                                            />
                                                        </TableCell>

                                                        {/* 3. Tiến độ bán vé */}
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {evt.ticketsSold} / {evt.maxSupply} vé
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <LinearProgress variant="determinate" value={Number(salesPercent)} sx={{ height: 5, borderRadius: 3, flexGrow: 1 }} />
                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                    {salesPercent}%
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>

                                                        {/* 4. Doanh thu */}
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={800} color="primary.main">
                                                                {evt.totalRevenueEth} ETH
                                                            </Typography>
                                                        </TableCell>

                                                        {/* 5. Cụm nút thao tác */}
                                                        <TableCell align="right">
                                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                                                                <Tooltip title="Xem chi tiết sự kiện">
                                                                    <IconButton size="small" color="primary" onClick={() => handleViewDetail(evt)}>
                                                                        <Visibility sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                <Tooltip title="Chỉnh sửa thông tin">
                                                                    <IconButton size="small" color="inherit" onClick={() => handleOpenEdit(evt)}>
                                                                        <Edit sx={{ fontSize: 18 }} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                {/* Gửi duyệt nếu là bản nháp */}
                                                                {evt.status === 'draft' && (
                                                                    <Tooltip title="Gửi duyệt lên Ban Quản Trị">
                                                                        <IconButton size="small" color="success" onClick={() => handleQuickSubmitReview(evt.id)}>
                                                                            <Send sx={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {/* Hủy sự kiện nếu đang mở bán hoặc chờ duyệt */}
                                                                {['published', 'approved', 'pending'].includes(evt.status) && (
                                                                    <Tooltip title="Hủy sự kiện">
                                                                        <IconButton size="small" color="warning" onClick={() => handleOpenCancel(evt)}>
                                                                            <CancelOutlined sx={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {/* Xóa vĩnh viễn nếu là bản nháp hoặc bị từ chối */}
                                                                {['draft', 'rejected'].includes(evt.status) && (
                                                                    <Tooltip title="Xóa vĩnh viễn bản nháp">
                                                                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(evt)}>
                                                                            <DeleteOutline sx={{ fontSize: 18 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                )}

                {/* =========================================================================
                    CHẾ ĐỘ XEM 2: FORM TẠO SỰ KIỆN MỚI THEO CÁC BƯỚC (CREATE VIEW)
                ========================================================================= */}
                {viewMode === 'create' && (
                    <Box>
                        {/* HEADER BANNER FORM TẠO SỰ KIỆN */}
                        <Box
                            sx={{
                                p: { xs: 3, md: 4 },
                                borderRadius: '16px',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                mb: 4,
                            }}
                        >
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                                <Box>
                                    <Button
                                        variant="text"
                                        color="inherit"
                                        startIcon={<ArrowBack />}
                                        onClick={() => setViewMode('list')}
                                        sx={{ mb: 1, pl: 0, fontWeight: 700 }}
                                    >
                                        Quay lại danh sách sự kiện
                                    </Button>
                                    <Typography variant="h1" fontWeight={800} color="text.primary" gutterBottom>
                                        Đăng Ký & Phát Hành Sự Kiện Mới
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.6 }}>
                                        Khởi tạo thông tin sự kiện, hình ảnh poster và định cấu hình các hạng vé NFT.
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
                                        ✓ Nhận doanh thu bán vé
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
                            {/* BƯỚC 1: THÔNG TIN SỰ KIỆN CƠ BẢN */}
                            {activeStep === 0 && (
                                <Box>
                                    <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
                                        1. Thông Tin Sự Kiện Cơ Bản
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Nhập tiêu đề, thể loại và tải ảnh poster đại diện sự kiện.
                                    </Typography>

                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={8}>
                                            <TextField
                                                fullWidth
                                                label="Tên sự kiện *"
                                                placeholder="Ví dụ: Vietnam Blockchain Summit 2026, Hòa Nhạc Mùa Thu..."
                                                value={eventData.title}
                                                onChange={(e) => handleEventChange('title', e.target.value)}
                                                error={Boolean(errors.title)}
                                                helperText={errors.title}
                                                sx={{ mb: 3 }}
                                            />

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

                                            <TextField
                                                fullWidth
                                                label="URL Ảnh Poster Sự Kiện *"
                                                placeholder="https://images.unsplash.com/... hoặc link ảnh IPFS"
                                                value={eventData.bannerUrl}
                                                onChange={(e) => handleEventChange('bannerUrl', e.target.value)}
                                                error={Boolean(errors.bannerUrl)}
                                                helperText={errors.bannerUrl || 'Dán link ảnh chất lượng cao hoặc chọn ảnh mẫu bên dưới'}
                                                sx={{ mb: 2 }}
                                            />

                                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                                                Hoặc chọn nhanh ảnh mẫu chất lượng cao:
                                            </Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={3}>
                                                {SAMPLE_POSTERS.map((sample) => (
                                                    <Chip
                                                        key={sample.label}
                                                        label={sample.label}
                                                        onClick={() => handleEventChange('bannerUrl', sample.url)}
                                                        variant={eventData.bannerUrl === sample.url ? 'filled' : 'outlined'}
                                                        color={eventData.bannerUrl === sample.url ? 'primary' : 'default'}
                                                        clickable
                                                    />
                                                ))}
                                            </Stack>

                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={5}
                                                label="Mô tả chi tiết sự kiện *"
                                                placeholder="Mô tả nội dung, diễn giả, khách mời, quy định tham gia (tối thiểu 20 ký tự)..."
                                                value={eventData.description}
                                                onChange={(e) => handleEventChange('description', e.target.value)}
                                                error={Boolean(errors.description)}
                                                helperText={errors.description}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                                Xem trước Poster hiển thị
                                            </Typography>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    borderRadius: '12px',
                                                    overflow: 'hidden',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    bgcolor: 'background.subtle',
                                                    height: 280,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {eventData.bannerUrl ? (
                                                    <Box
                                                        component="img"
                                                        src={eventData.bannerUrl}
                                                        alt="Xem trước poster"
                                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <Stack spacing={1} alignItems="center" color="text.secondary">
                                                        <CloudUpload sx={{ fontSize: 40, opacity: 0.5 }} />
                                                        <Typography variant="caption">Chưa có ảnh poster</Typography>
                                                    </Stack>
                                                )}
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* BƯỚC 2: THỜI GIAN & ĐỊA ĐIỂM */}
                            {activeStep === 1 && (
                                <Box>
                                    <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
                                        2. Thời Gian & Địa Điểm Tổ Chức
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Thiết lập thời gian diễn ra và địa điểm check-in tại cổng.
                                    </Typography>

                                    <Grid container spacing={3}>
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
                                            />
                                        </Grid>
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
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={8}>
                                            <TextField
                                                fullWidth
                                                label="Tên địa điểm / Tòa nhà *"
                                                placeholder="Ví dụ: Trung Tâm Hội Nghị Quốc Gia, Sân Vận Động Mỹ Đình..."
                                                value={eventData.venueName}
                                                onChange={(e) => handleEventChange('venueName', e.target.value)}
                                                error={Boolean(errors.venueName)}
                                                helperText={errors.venueName}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel id="city-select-label">Tỉnh / Thành phố *</InputLabel>
                                                <Select
                                                    labelId="city-select-label"
                                                    value={eventData.venueCity}
                                                    label="Tỉnh / Thành phố *"
                                                    onChange={(e) => handleEventChange('venueCity', e.target.value)}
                                                >
                                                    {CITIES.map((c) => (
                                                        <MenuItem key={c} value={c}>{c}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Địa chỉ chi tiết *"
                                                placeholder="Số nhà, đường phố, phường/xã, quận/huyện..."
                                                value={eventData.venueAddress}
                                                onChange={(e) => handleEventChange('venueAddress', e.target.value)}
                                                error={Boolean(errors.venueAddress)}
                                                helperText={errors.venueAddress}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* BƯỚC 3: HẠNG VÉ NFT & ON-CHAIN */}
                            {activeStep === 2 && (
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Box>
                                            <Typography variant="h3" fontWeight={700} color="text.primary">
                                                3. Thiết Lập Các Hạng Vé Phát Hành (NFT)
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Mỗi hạng vé sẽ tương ứng với một phân cấp token trên Smart Contract Sepolia.
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<Add />}
                                            onClick={handleAddTier}
                                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                                        >
                                            Thêm Hạng Vé
                                        </Button>
                                    </Stack>

                                    <Stack spacing={3} mt={3}>
                                        {ticketTiers.map((tier, index) => (
                                            <Paper
                                                key={tier.id || index}
                                                elevation={0}
                                                sx={{
                                                    p: 3,
                                                    borderRadius: '12px',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    bgcolor: 'background.subtle',
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <ConfirmationNumber color="primary" />
                                                        <Typography variant="subtitle1" fontWeight={700}>
                                                            Hạng vé #{index + 1}: {tier.name || 'Chưa đặt tên'}
                                                        </Typography>
                                                    </Stack>
                                                    {ticketTiers.length > 1 && (
                                                        <IconButton color="error" size="small" onClick={() => handleRemoveTier(index)}>
                                                            <DeleteOutline />
                                                        </IconButton>
                                                    )}
                                                </Stack>

                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Tên hạng vé *"
                                                            placeholder="VIP, VVIP, Standard, Early Bird..."
                                                            value={tier.name}
                                                            onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_name`])}
                                                            helperText={errors[`tier_${index}_name`]}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={3}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            label="Giá vé gốc (ETH) *"
                                                            placeholder="0.001"
                                                            value={tier.originalPrice}
                                                            onChange={(e) => handleTierChange(index, 'originalPrice', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_price`])}
                                                            helperText={errors[`tier_${index}_price`]}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">ETH</InputAdornment> }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={3}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            label="Số lượng vé phát hành *"
                                                            placeholder="100"
                                                            value={tier.maxSupply}
                                                            onChange={(e) => handleTierChange(index, 'maxSupply', e.target.value)}
                                                            error={Boolean(errors[`tier_${index}_supply`])}
                                                            helperText={errors[`tier_${index}_supply`]}
                                                            InputProps={{ endAdornment: <InputAdornment position="end">Vé</InputAdornment> }}
                                                        />
                                                    </Grid>

                                                    <Grid item xs={12}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Mô tả quyền lợi hạng vé"
                                                            placeholder="Bao gồm đồ uống miễn phí, chỗ ngồi hàng đầu, lối đi riêng..."
                                                            value={tier.description}
                                                            onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* BƯỚC 4: XEM LẠI & GỬI DUYỆT */}
                            {activeStep === 3 && (
                                <Box>
                                    <Typography variant="h3" fontWeight={700} color="text.primary" gutterBottom>
                                        4. Xem Lại Thông Tin & Gửi Xét Duyệt
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Kiểm tra kỹ lưỡng các thông số trước khi đưa lên Smart Contract và hệ thống.
                                    </Typography>

                                    <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider', mb: 3 }}>
                                        <Typography variant="subtitle1" fontWeight={800} color="primary.main" gutterBottom>
                                            {eventData.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {eventData.description}
                                        </Typography>

                                        <Divider sx={{ my: 2 }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Schedule color="action" sx={{ fontSize: 20 }} />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">Thời gian diễn ra:</Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {eventData.startTime ? new Date(eventData.startTime).toLocaleString('vi-VN') : ''} → {eventData.endTime ? new Date(eventData.endTime).toLocaleString('vi-VN') : ''}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <LocationOn color="action" sx={{ fontSize: 20 }} />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">Địa điểm tổ chức:</Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {eventData.venueName}, {eventData.venueAddress}, {eventData.venueCity}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                        Các hạng vé phát hành ({ticketTiers.length} hạng vé):
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {ticketTiers.map((tt, i) => (
                                            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: '8px', border: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>{tt.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{tt.description}</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography variant="body2" fontWeight={800} color="primary.main">{tt.originalPrice} ETH</Typography>
                                                    <Typography variant="caption" color="text.secondary">Hạn mức: {tt.maxSupply} vé</Typography>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* CỤM NÚT ĐIỀU HƯỚNG TỪNG BƯỚC */}
                            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={activeStep === 0 ? () => setViewMode('list') : handleBack}
                                    startIcon={<ArrowBack />}
                                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                                >
                                    {activeStep === 0 ? 'Hủy & Quay lại' : 'Quay lại bước trước'}
                                </Button>

                                <Stack direction="row" spacing={1.5}>
                                    {activeStep === 3 && (
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            disabled={isSubmitting}
                                            onClick={() => handleSubmitEvent(true)}
                                            startIcon={<Save />}
                                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                                        >
                                            Lưu Bản Nháp
                                        </Button>
                                    )}

                                    {activeStep < 3 ? (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleNext}
                                            endIcon={<ArrowForward />}
                                            sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}
                                        >
                                            Tiếp tục
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            disabled={isSubmitting}
                                            onClick={() => handleSubmitEvent(false)}
                                            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Send />}
                                            sx={{ borderRadius: '8px', fontWeight: 700, px: 3.5 }}
                                        >
                                            {isSubmitting ? 'Đang gửi duyệt...' : 'Gửi Phê Duyệt Ngay'}
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Card>
                    </Box>
                )}

                {/* =========================================================================
                    MODAL CHI TIẾT SỰ KIỆN (DETAIL MODAL)
                ========================================================================= */}
                <Dialog
                    open={openDetailModal}
                    onClose={() => setOpenDetailModal(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px',
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                        },
                    }}
                >
                    {selectedDetailEvent && (
                        <>
                            {/* Nút đóng X ở góc trên cùng bên phải */}
                            <IconButton
                                onClick={() => setOpenDetailModal(false)}
                                sx={{
                                    position: 'absolute',
                                    right: 12,
                                    top: 12,
                                    zIndex: 1300,
                                    bgcolor: 'rgba(0, 0, 0, 0.65)',
                                    color: '#fff',
                                    backdropFilter: 'blur(4px)',
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.85)',
                                        transform: 'scale(1.08)',
                                    },
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                            >
                                <Close />
                            </IconButton>

                            {/* Banner hình ảnh poster */}
                            {selectedDetailEvent.bannerUrl && (
                                <Box
                                    component="img"
                                    src={selectedDetailEvent.bannerUrl}
                                    alt={selectedDetailEvent.title}
                                    sx={{
                                        width: '100%',
                                        height: { xs: 180, sm: 220 },
                                        objectFit: 'cover',
                                        display: 'block',
                                        bgcolor: 'background.subtle',
                                    }}
                                />
                            )}

                            {/* Tiêu đề & trạng thái */}
                            <Box sx={{ p: 3, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                    <Chip label={selectedDetailEvent.statusText} size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                                    <Chip label={selectedDetailEvent.categoryLabel} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="text.primary">
                                    {selectedDetailEvent.title}
                                </Typography>
                            </Box>

                            <DialogContent sx={{ p: 3 }}>
                                {/* Thông tin thời gian & địa điểm */}
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider', mb: 3 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Schedule color="primary" />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Thời gian diễn ra:</Typography>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {selectedDetailEvent.startTime} → {selectedDetailEvent.endTime}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <LocationOn color="primary" />
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block">Địa điểm tổ chức:</Typography>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {selectedDetailEvent.venue}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* Mô tả sự kiện */}
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Mô tả chi tiết:</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
                                    {selectedDetailEvent.description || 'Chưa có mô tả chi tiết.'}
                                </Typography>

                                {/* Các hạng vé phát hành */}
                                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Các hạng vé phát hành:</Typography>
                                <Stack spacing={1.5} mb={3}>
                                    {selectedDetailEvent.ticketTypes.map((tt) => {
                                        const sold = tt.currentSupply || tt.mintedAmount || 0;
                                        const max = tt.maxSupply || 0;
                                        const percent = max > 0 ? ((sold / max) * 100).toFixed(0) : 0;
                                        return (
                                            <Paper key={tt.id} elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">{tt.name}</Typography>
                                                        {tt.description && (
                                                            <Typography variant="caption" color="text.secondary">{tt.description}</Typography>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="subtitle1" fontWeight={800}>{tt.originalPrice} ETH</Typography>
                                                        <Typography variant="caption" color="text.secondary">Trần bán lại tối đa: {(Number(tt.originalPrice) * 1.2).toFixed(4)} ETH</Typography>
                                                    </Box>
                                                </Stack>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <LinearProgress variant="determinate" value={Number(percent)} sx={{ height: 6, borderRadius: 3, flexGrow: 1 }} />
                                                    <Typography variant="caption" fontWeight={700}>{sold} / {max} vé ({percent}%)</Typography>
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </DialogContent>

                            <DialogActions sx={{ p: 2.5, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={1}>
                                    {selectedDetailEvent.status === 'draft' && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            startIcon={<Send />}
                                            onClick={() => handleQuickSubmitReview(selectedDetailEvent.id)}
                                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                                        >
                                            Gửi Duyệt Ngay
                                        </Button>
                                    )}
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<Edit />}
                                        onClick={() => {
                                            setOpenDetailModal(false);
                                            handleOpenEdit(selectedDetailEvent);
                                        }}
                                        sx={{ borderRadius: '8px', fontWeight: 600 }}
                                    >
                                        Chỉnh Sửa
                                    </Button>
                                    {['draft', 'rejected'].includes(selectedDetailEvent.status) && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteOutline />}
                                            onClick={() => {
                                                handleOpenDelete(selectedDetailEvent);
                                            }}
                                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                                        >
                                            Xóa Sự Kiện
                                        </Button>
                                    )}
                                    {['published', 'approved', 'pending'].includes(selectedDetailEvent.status) && (
                                        <Button
                                            variant="outlined"
                                            color="warning"
                                            startIcon={<CancelOutlined />}
                                            onClick={() => {
                                                handleOpenCancel(selectedDetailEvent);
                                            }}
                                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                                        >
                                            Hủy Sự Kiện
                                        </Button>
                                    )}
                                </Stack>

                                <Button
                                    variant="contained"
                                    color="inherit"
                                    onClick={() => setOpenDetailModal(false)}
                                    sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
                                >
                                    Đóng
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                {/* =========================================================================
                    MODAL CẬP NHẬT SỰ KIỆN (EDIT MODAL)
                ========================================================================= */}
                <Dialog
                    open={openEditModal}
                    onClose={() => setOpenEditModal(false)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: '16px', bgcolor: 'background.paper', p: 1 },
                    }}
                >
                    <DialogTitle>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h3" fontWeight={700}>
                                Chỉnh Sửa Thông Tin Sự Kiện #{editingEvent?.id}
                            </Typography>
                            <IconButton onClick={() => setOpenEditModal(false)}>
                                <Close />
                            </IconButton>
                        </Stack>
                    </DialogTitle>
                    <DialogContent dividers sx={{ py: 2.5 }}>
                        <Grid container spacing={2.5}>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="Tên sự kiện *"
                                    value={editFormData.title || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel id="edit-cat-label">Thể loại sự kiện</InputLabel>
                                    <Select
                                        labelId="edit-cat-label"
                                        value={editFormData.category || 'technology'}
                                        label="Thể loại sự kiện"
                                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                    >
                                        {EVENT_CATEGORIES.map((c) => (
                                            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="URL Ảnh Poster *"
                                    value={editFormData.bannerUrl || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, bannerUrl: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="caption" fontWeight={700} display="block" mb={1}>
                                    Xem trước poster:
                                </Typography>
                                <Box
                                    component="img"
                                    src={editFormData.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                                    alt="Poster"
                                    sx={{
                                        width: '100%',
                                        height: 150,
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: 1,
                                        borderColor: 'divider',
                                        bgcolor: 'background.subtle',
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Tên địa điểm"
                                    value={editFormData.venueName || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, venueName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel id="edit-city-label">Thành phố</InputLabel>
                                    <Select
                                        labelId="edit-city-label"
                                        value={editFormData.venueCity || 'Hà Nội'}
                                        label="Thành phố"
                                        onChange={(e) => setEditFormData({ ...editFormData, venueCity: e.target.value })}
                                    >
                                        {CITIES.map((c) => (
                                            <MenuItem key={c} value={c}>{c}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Địa chỉ cụ thể"
                                    value={editFormData.venueAddress || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, venueAddress: e.target.value })}
                                />
                            </Grid>

                            {/* Cho phép sửa thời gian nếu sự kiện ở trạng thái draft/pending/rejected */}
                            {editingEvent && ['draft', 'rejected', 'pending'].includes(editingEvent.status) && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Thời gian bắt đầu"
                                            value={editFormData.startTime || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Thời gian kết thúc"
                                            value={editFormData.endTime || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Mô tả sự kiện *"
                                    value={editFormData.description || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button color="inherit" onClick={() => setOpenEditModal(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                        >
                            {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* =========================================================================
                    DIALOG XÁC NHẬN HỦY SỰ KIỆN (CANCEL DIALOG)
                ========================================================================= */}
                <Dialog
                    open={openCancelDialog}
                    onClose={() => !isCancelling && setOpenCancelDialog(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}
                >
                    <DialogTitle>
                        <Typography variant="h3" fontWeight={700} color="warning.main">
                            Xác Nhận Hủy Sự Kiện
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>
                            Bạn có chắc chắn muốn hủy sự kiện <strong>"{cancellingEvent?.title}"</strong>?
                            Hành động này sẽ dừng các hoạt động bán vé liên quan.
                        </DialogContentText>
                        <TextField
                            fullWidth
                            size="small"
                            label="Lý do hủy sự kiện (tùy chọn)"
                            placeholder="Ví dụ: Thay đổi lịch trình, bất khả kháng..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button color="inherit" disabled={isCancelling} onClick={() => setOpenCancelDialog(false)}>
                            Quay lại
                        </Button>
                        <Button
                            variant="contained"
                            color="warning"
                            disabled={isCancelling}
                            onClick={handleConfirmCancel}
                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                        >
                            {isCancelling ? 'Đang xử lý...' : 'Xác Nhận Hủy'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* =========================================================================
                    DIALOG XÁC NHẬN XÓA VĨNH VIỄN SỰ KIỆN (DELETE DIALOG)
                ========================================================================= */}
                <Dialog
                    open={openDeleteDialog}
                    onClose={() => !isDeleting && setOpenDeleteDialog(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}
                >
                    <DialogTitle>
                        <Typography variant="h3" fontWeight={700} color="error.main">
                            Xác Nhận Xóa Vĩnh Viễn
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Bạn có chắc chắn muốn xóa bản nháp sự kiện <strong>"{deletingEvent?.title}"</strong>?
                            Hành động này sẽ xóa hoàn toàn sự kiện cùng các hạng vé và <strong>không thể hoàn tác</strong>.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button color="inherit" disabled={isDeleting} onClick={() => setOpenDeleteDialog(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* =========================================================================
                    MODAL THÀNH CÔNG KHI TẠO SỰ KIỆN (SUCCESS MODAL)
                ========================================================================= */}
                <Dialog
                    open={openSuccessModal}
                    onClose={() => {
                        setOpenSuccessModal(false);
                        setViewMode('list');
                        loadMyEvents();
                    }}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '16px', p: 2, textAlign: 'center' } }}
                >
                    <DialogContent sx={{ py: 3 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: 'rgba(16, 185, 129, 0.12)',
                                color: 'success.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            }}
                        >
                            <CheckCircle sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h2" fontWeight={800} gutterBottom>
                            Khởi Tạo Sự Kiện Thành Công!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            Sự kiện <strong>"{eventData.title}"</strong> (Mã #{submittedEventId}) đã được lưu và gửi lên hàng đợi xét duyệt của Ban Quản Trị.
                        </Typography>
                        <Alert severity="info" sx={{ textAlign: 'left', borderRadius: '10px' }}>
                            Ban Quản Trị sẽ thẩm định tính hợp lệ của sự kiện. Sau khi được duyệt, bạn có thể bấm <strong>"Mở Bán Sự Kiện"</strong> để đưa vé lên thị trường Web3.
                        </Alert>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setOpenSuccessModal(false);
                                setViewMode('list');
                                loadMyEvents();
                            }}
                            sx={{ borderRadius: '8px', fontWeight: 700, px: 4, height: 42 }}
                        >
                            Về Danh Sách Sự Kiện
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* SNACKBAR THÔNG BÁO TOAST */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                        severity={snackbar.severity}
                        sx={{ width: '100%', borderRadius: '10px', fontWeight: 600 }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </DashboardLayout>
    );
};

export default CreateEventPage;
