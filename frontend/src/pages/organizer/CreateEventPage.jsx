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
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    CalendarDays,
    MapPin,
    Clock,
    Ticket,
    Plus,
    Trash2,
    CheckCircle2,
    ArrowLeft,
    ArrowRight,
    UploadCloud,
    X,
    Save,
    Send,
    Edit3,
    Search,
    RefreshCw,
    Eye,
    Ban,
    XCircle,
    DoorOpen,
    Armchair,
    Crown,
    Layers,
    LayoutGrid,
    AlertTriangle,
    Lock,
} from 'lucide-react';
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

// Danh sách cổng check-in mặc định
const DEFAULT_EVENT_GATES = [
    'Cổng VIP - Sảnh Chính Tầng 1',
    'Cổng A - Khán Đài Phổ Thông Tầng 1',
    'Cổng B - Khán Đài Tầng 2 & Ban Công',
];

// Helper tự động sinh danh sách dãy ghế từ tên khán đài, số dãy và số ghế/dãy
const generateStandRows = (standName, rowCount, seatsPerRow) => {
    const count = Math.max(1, parseInt(rowCount, 10) || 1);
    const seats = Math.max(1, parseInt(seatsPerRow, 10) || 1);
    const cleanName = standName || 'A';
    const match = cleanName.match(/[A-Za-z0-9]+/g);
    const prefix = match ? match[match.length - 1] : 'A';
    return Array.from({ length: count }, (_, i) => ({
        id: `row-${prefix.toLowerCase()}-${i + 1}`,
        name: `Dãy ${prefix}${i + 1}`,
        seatCount: seats,
    }));
};

// Sơ đồ khán đài mặc định (3 khán đài A, B, C cấu hình bằng điền số)
const DEFAULT_SEATING_MAP = [
    {
        id: 'zone-a',
        name: 'Khán đài A',
        rowCount: 3,
        seatsPerRow: 20,
        rows: generateStandRows('Khán đài A', 3, 20),
    },
    {
        id: 'zone-b',
        name: 'Khán đài B',
        rowCount: 3,
        seatsPerRow: 20,
        rows: generateStandRows('Khán đài B', 3, 20),
    },
    {
        id: 'zone-c',
        name: 'Khán đài C',
        rowCount: 3,
        seatsPerRow: 20,
        rows: generateStandRows('Khán đài C', 3, 20),
    },
];

const STEPS = [
    'Thông tin sự kiện cơ bản',
    'Thời gian & Địa điểm',
    'Sơ đồ khán đài & Hạng vé NFT',
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
    saleStartTime: '',
    saleEndTime: '',
};

const ensureAllocations = (tier, defaultStand, defaultRowObj) => {
    if (Array.isArray(tier?.seatAllocations) && tier.seatAllocations.length > 0) {
        return tier.seatAllocations;
    }
    if (Array.isArray(tier?.seatConfig) && tier.seatConfig.length > 0) {
        return tier.seatConfig;
    }
    return [
        {
            id: `alloc-${tier?.id || 1}-1`,
            zone: tier?.seatZone || defaultStand?.name || 'Khán đài A',
            row: tier?.seatRow || defaultRowObj?.name || 'Dãy A1',
            seatStart: Number(tier?.seatStart) || 1,
            seatEnd: Number(tier?.seatEnd) || Number(tier?.maxSupply) || defaultRowObj?.seatCount || 20,
        },
    ];
};

const INITIAL_TIERS = [
    {
        id: 1,
        tierType: 'vip',
        name: 'Vé VIP Khán Đài A',
        description: 'Vé VIP hàng ghế đầu tiên, lối đi ưu tiên',
        originalPrice: '0.002',
        entryGate: 'Cổng VIP - Sảnh Chính Tầng 1',
        seatAllocations: [
            { id: 'alloc-1-1', zone: 'Khán đài A', row: 'Dãy A1', seatStart: 1, seatEnd: 20 },
        ],
        seatZone: 'Khán đài A',
        seatRow: 'Dãy A1',
        seatStart: 1,
        seatEnd: 20,
        maxSupply: 20,
        saleStartTime: '',
        saleEndTime: '',
        perks: 'Vé vào cổng VIP, check-in QR động',
    },
    {
        id: 2,
        tierType: 'standard',
        name: 'Vé Tiêu Chuẩn Khán Đài B',
        description: 'Vé tiêu chuẩn tham gia toàn bộ sự kiện',
        originalPrice: '0.001',
        entryGate: 'Cổng B - Khán Đài Tầng 2 & Ban Công',
        seatAllocations: [
            { id: 'alloc-2-1', zone: 'Khán đài B', row: 'Dãy B1', seatStart: 1, seatEnd: 20 },
        ],
        seatZone: 'Khán đài B',
        seatRow: 'Dãy B1',
        seatStart: 1,
        seatEnd: 20,
        maxSupply: 20,
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
    const [eventGates, setEventGates] = useState(DEFAULT_EVENT_GATES);
    const [seatingMap, setSeatingMap] = useState(DEFAULT_SEATING_MAP);
    const [newGateName, setNewGateName] = useState('');
    const [openAddGateDialog, setOpenAddGateDialog] = useState(false);
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
        const gates = Array.isArray(evt.raw?.checkInGates) && evt.raw.checkInGates.length > 0
            ? evt.raw.checkInGates
            : (Array.isArray(evt.checkInGates) && evt.checkInGates.length > 0 ? evt.checkInGates : DEFAULT_EVENT_GATES);
        const seating = Array.isArray(evt.raw?.seatingMap) && evt.raw.seatingMap.length > 0
            ? evt.raw.seatingMap
            : (Array.isArray(evt.seatingMap) && evt.seatingMap.length > 0 ? evt.seatingMap : DEFAULT_SEATING_MAP);

        const mappedTiers = (evt.ticketTypes || []).map((tt) => {
            const sold = tt.currentSupply || tt.mintedAmount || 0;
            const allocs = Array.isArray(tt.seatConfig) && tt.seatConfig.length > 0
                ? tt.seatConfig
                : [{
                    id: `alloc-${tt.id}-1`,
                    zone: tt.seatZone || seating[0]?.name || 'Khán đài A',
                    row: tt.seatRow || 'Dãy A1',
                    seatStart: Number(tt.seatStart) || 1,
                    seatEnd: Number(tt.seatEnd) || Number(tt.maxSupply) || 20,
                }];
            return {
                id: tt.id,
                tierType: tt.tierType || (tt.name?.toLowerCase().includes('vip') ? 'vip' : 'standard'),
                name: tt.name || '',
                description: tt.description || '',
                originalPrice: tt.originalPrice || '0.001',
                entryGate: tt.entryGate || gates[0],
                seatAllocations: allocs,
                seatZone: tt.seatZone || [...new Set(allocs.map((a) => a.zone))].join(', '),
                seatRow: tt.seatRow || allocs.map((a) => a.row).join(', '),
                seatStart: allocs[0]?.seatStart || tt.seatStart || 1,
                seatEnd: allocs[allocs.length - 1]?.seatEnd || tt.seatEnd || tt.maxSupply || 20,
                maxSupply: tt.maxSupply || allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0),
                currentSupply: sold,
            };
        });

        const firstTier = evt.ticketTypes?.[0];
        const initialSaleStart = firstTier?.saleStartTime ? toDatetimeLocal(firstTier.saleStartTime) : '';
        const initialSaleEnd = firstTier?.saleEndTime ? toDatetimeLocal(firstTier.saleEndTime) : toDatetimeLocal(evt.rawStartTime);

        setEditFormData({
            title: evt.title || '',
            category: evt.category || 'technology',
            bannerUrl: evt.bannerUrl || '',
            venueName: evt.venueName || '',
            venueAddress: evt.venueAddress || '',
            venueCity: evt.venueCity || 'Hà Nội',
            startTime: toDatetimeLocal(evt.rawStartTime),
            endTime: toDatetimeLocal(evt.rawEndTime),
            saleStartTime: initialSaleStart,
            saleEndTime: initialSaleEnd,
            description: evt.description || '',
            ticketTypes: mappedTiers,
            checkInGates: gates,
            seatingMap: seating,
        });
        setOpenEditModal(true);
    };

    const handleEditTierChange = (index, field, value) => {
        setEditFormData((prev) => {
            const updatedTiers = [...(prev.ticketTypes || [])];
            const tier = { ...updatedTiers[index], [field]: value };

            if (field === 'tierType') {
                if (value === 'vip') {
                    if (!tier.name || tier.name.startsWith('Vé Tiêu Chuẩn')) {
                        tier.name = 'Vé VIP Khán Đài A';
                    }
                    const vipGate = prev.checkInGates?.find((g) => g.toLowerCase().includes('vip')) || prev.checkInGates?.[0];
                    if (vipGate) tier.entryGate = vipGate;
                } else {
                    if (!tier.name || tier.name.startsWith('Vé VIP')) {
                        tier.name = 'Vé Tiêu Chuẩn Khán Đài B';
                    }
                    const stdGate = prev.checkInGates?.find((g) => !g.toLowerCase().includes('vip')) || prev.checkInGates?.[0];
                    if (stdGate) tier.entryGate = stdGate;
                }
            }

            if (field === 'seatZone') {
                const stand = prev.seatingMap?.find((s) => s.name === value);
                if (stand && stand.rows?.length > 0) {
                    tier.seatRow = stand.rows[0].name;
                    tier.seatStart = 1;
                    tier.seatEnd = stand.rows[0].seatCount || 20;
                    tier.maxSupply = tier.seatEnd;
                }
            }

            if (field === 'seatRow') {
                const stand = prev.seatingMap?.find((s) => s.name === tier.seatZone);
                const rowObj = stand?.rows?.find((r) => r.name === value);
                if (rowObj) {
                    tier.seatStart = 1;
                    tier.seatEnd = rowObj.seatCount || 20;
                    tier.maxSupply = tier.seatEnd;
                }
            }

            if (field === 'seatStart' || field === 'seatEnd') {
                const rawStart = field === 'seatStart' ? value : tier.seatStart;
                const rawEnd = field === 'seatEnd' ? value : tier.seatEnd;
                tier.seatStart = rawStart === '' ? '' : (parseInt(rawStart, 10) || '');
                tier.seatEnd = rawEnd === '' ? '' : (parseInt(rawEnd, 10) || '');

                const s = parseInt(tier.seatStart, 10);
                const e = parseInt(tier.seatEnd, 10);
                if (!isNaN(s) && !isNaN(e) && e >= s) {
                    tier.maxSupply = e - s + 1;
                } else {
                    tier.maxSupply = 0;
                }
            }

            updatedTiers[index] = tier;
            return { ...prev, ticketTypes: updatedTiers };
        });
    };

    const handleAddTierInEdit = () => {
        setEditFormData((prev) => {
            const gates = prev.checkInGates || DEFAULT_EVENT_GATES;
            const seating = prev.seatingMap || DEFAULT_SEATING_MAP;
            const defaultZone = seating[0]?.name || 'Khán đài A';
            const defaultRowObj = seating[0]?.rows?.[0] || { name: 'Dãy A1', seatCount: 20 };

            const defaultAlloc = {
                id: `alloc-new-${Date.now()}-1`,
                zone: defaultZone,
                row: defaultRowObj.name,
                seatStart: 1,
                seatEnd: defaultRowObj.seatCount || 20,
            };

            const newTier = {
                id: `new-${Date.now()}`,
                tierType: 'standard',
                name: `Hạng vé #${(prev.ticketTypes?.length || 0) + 1}`,
                description: 'Mô tả quyền lợi hạng vé...',
                originalPrice: '0.001',
                entryGate: gates[0],
                seatAllocations: [defaultAlloc],
                seatZone: defaultZone,
                seatRow: defaultRowObj.name,
                seatStart: 1,
                seatEnd: defaultRowObj.seatCount || 20,
                maxSupply: defaultRowObj.seatCount || 20,
                currentSupply: 0,
            };

            return { ...prev, ticketTypes: [...(prev.ticketTypes || []), newTier] };
        });
    };

    const handleAddAllocationInEdit = (tierIndex) => {
        setEditFormData((prev) => {
            const updatedTiers = [...(prev.ticketTypes || [])];
            const tier = { ...updatedTiers[tierIndex] };
            const seating = prev.seatingMap || DEFAULT_SEATING_MAP;
            const allocs = [...ensureAllocations(tier, seating[0], seating[0]?.rows?.[0])];

            const lastAlloc = allocs[allocs.length - 1];
            const currentStand = seating.find((s) => s.name === lastAlloc?.zone) || seating[0];
            const availableRows = currentStand?.rows || [];

            let nextZone = currentStand.name;
            let nextRowObj = availableRows[0];
            const currentRowIdx = availableRows.findIndex((r) => r.name === lastAlloc?.row);
            if (currentRowIdx >= 0 && currentRowIdx + 1 < availableRows.length) {
                nextRowObj = availableRows[currentRowIdx + 1];
            } else {
                const currentStandIdx = seating.findIndex((s) => s.name === currentStand.name);
                if (currentStandIdx >= 0 && currentStandIdx + 1 < seating.length) {
                    const nextStand = seating[currentStandIdx + 1];
                    nextZone = nextStand.name;
                    nextRowObj = nextStand.rows?.[0] || { name: 'Dãy A1', seatCount: 20 };
                }
            }

            allocs.push({
                id: `alloc-edit-${tier.id || tierIndex}-${Date.now()}-${allocs.length + 1}`,
                zone: nextZone,
                row: nextRowObj?.name || 'Dãy A1',
                seatStart: 1,
                seatEnd: nextRowObj?.seatCount || 20,
            });

            tier.seatAllocations = allocs;
            tier.maxSupply = allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
            tier.seatZone = [...new Set(allocs.map((a) => a.zone))].join(', ');
            tier.seatRow = allocs.map((a) => a.row).join(', ');
            tier.seatStart = Number(allocs[0]?.seatStart) || 1;
            tier.seatEnd = Number(allocs[allocs.length - 1]?.seatEnd) || 20;

            updatedTiers[tierIndex] = tier;
            return { ...prev, ticketTypes: updatedTiers };
        });
    };

    const handleRemoveAllocationInEdit = (tierIndex, allocIndex) => {
        setEditFormData((prev) => {
            const updatedTiers = [...(prev.ticketTypes || [])];
            const tier = { ...updatedTiers[tierIndex] };
            const seating = prev.seatingMap || DEFAULT_SEATING_MAP;
            const allocs = ensureAllocations(tier, seating[0], seating[0]?.rows?.[0]);
            if (allocs.length <= 1) {
                showSnackbar('Hạng vé phải có ít nhất 1 khu vực / dãy ghế phân bổ!', 'warning');
                return prev;
            }
            const filteredAllocs = allocs.filter((_, idx) => idx !== allocIndex);
            tier.seatAllocations = filteredAllocs;
            tier.maxSupply = filteredAllocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
            tier.seatZone = [...new Set(filteredAllocs.map((a) => a.zone))].join(', ');
            tier.seatRow = filteredAllocs.map((a) => a.row).join(', ');
            tier.seatStart = Number(filteredAllocs[0]?.seatStart) || 1;
            tier.seatEnd = Number(filteredAllocs[filteredAllocs.length - 1]?.seatEnd) || 20;

            updatedTiers[tierIndex] = tier;
            return { ...prev, ticketTypes: updatedTiers };
        });
    };

    const handleAllocationChangeInEdit = (tierIndex, allocIndex, field, value) => {
        setEditFormData((prev) => {
            const updatedTiers = [...(prev.ticketTypes || [])];
            const tier = { ...updatedTiers[tierIndex] };
            const seating = prev.seatingMap || DEFAULT_SEATING_MAP;
            const allocs = [...ensureAllocations(tier, seating[0], seating[0]?.rows?.[0])];
            const alloc = { ...allocs[allocIndex] };

            if (field === 'zone') {
                alloc.zone = value;
                const stand = seating.find((s) => s.name === value) || seating[0];
                const firstRow = stand?.rows?.[0] || { name: 'Dãy A1', seatCount: 20 };
                alloc.row = firstRow.name;
                alloc.seatStart = 1;
                alloc.seatEnd = firstRow.seatCount || 20;
            } else if (field === 'row') {
                alloc.row = value;
                const stand = seating.find((s) => s.name === alloc.zone) || seating[0];
                const rowObj = stand?.rows?.find((r) => r.name === value);
                alloc.seatStart = 1;
                alloc.seatEnd = rowObj?.seatCount || 20;
            } else if (field === 'seatStart' || field === 'seatEnd') {
                alloc[field] = value === '' ? '' : (parseInt(value, 10) || '');
            }

            allocs[allocIndex] = alloc;
            tier.seatAllocations = allocs;
            tier.maxSupply = allocs.reduce((sum, a) => {
                const s = Number(a.seatStart) || 0;
                const e = Number(a.seatEnd) || 0;
                return sum + (e >= s && s > 0 ? e - s + 1 : 0);
            }, 0);
            tier.seatZone = [...new Set(allocs.map((a) => a.zone))].join(', ');
            tier.seatRow = allocs.map((a) => a.row).join(', ');
            tier.seatStart = Number(allocs[0]?.seatStart) || 1;
            tier.seatEnd = Number(allocs[allocs.length - 1]?.seatEnd) || 20;

            updatedTiers[tierIndex] = tier;
            return { ...prev, ticketTypes: updatedTiers };
        });
    };

    const handleRemoveTierInEdit = (index) => {
        setEditFormData((prev) => {
            if ((prev.ticketTypes || []).length <= 1) {
                showSnackbar('Sự kiện phải có ít nhất 1 hạng vé!', 'warning');
                return prev;
            }
            const tier = prev.ticketTypes[index];
            if (tier.currentSupply > 0) {
                showSnackbar(`Hạng vé "${tier.name}" đã bán ${tier.currentSupply} vé, không thể xóa!`, 'error');
                return prev;
            }
            const updated = prev.ticketTypes.filter((_, i) => i !== index);
            return { ...prev, ticketTypes: updated };
        });
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

            // Chỉ kiểm tra và gửi thời gian nếu người dùng thực sự thay đổi thời gian bắt đầu/kết thúc
            const origStart = toDatetimeLocal(editingEvent?.rawStartTime);
            const origEnd = toDatetimeLocal(editingEvent?.rawEndTime);
            const isStartChanged = Boolean(editFormData.startTime && editFormData.startTime !== origStart);
            const isEndChanged = Boolean(editFormData.endTime && editFormData.endTime !== origEnd);

            if (isStartChanged) {
                const startDate = new Date(editFormData.startTime);
                const now = new Date();
                if (startDate <= now) {
                    showSnackbar('Thời gian bắt đầu sự kiện mới phải ở tương lai, không thể chọn thời điểm trong quá khứ.', 'error');
                    setIsUpdating(false);
                    return;
                }
                payload.startTime = startDate.toISOString();
            }

            if (isEndChanged || isStartChanged) {
                const effectiveStart = new Date(editFormData.startTime || editingEvent.rawStartTime);
                const effectiveEnd = new Date(editFormData.endTime || editingEvent.rawEndTime);
                if (effectiveEnd <= effectiveStart) {
                    showSnackbar('Thời gian kết thúc sự kiện phải sau thời gian bắt đầu.', 'error');
                    setIsUpdating(false);
                    return;
                }
                if (isEndChanged) {
                    payload.endTime = effectiveEnd.toISOString();
                }
            }

            if (editFormData.saleStartTime && editFormData.saleEndTime) {
                const sStart = new Date(editFormData.saleStartTime);
                const sEnd = new Date(editFormData.saleEndTime);
                const evStart = new Date(editFormData.startTime || editingEvent.rawStartTime);

                if (sEnd <= sStart) {
                    showSnackbar('Thời gian kết thúc bán vé phải sau thời gian bắt đầu mở bán.', 'error');
                    setIsUpdating(false);
                    return;
                }
                if (sEnd > evStart) {
                    showSnackbar('Thời gian kết thúc bán vé phải trước hoặc bằng thời gian sự kiện bắt đầu.', 'error');
                    setIsUpdating(false);
                    return;
                }
                payload.saleStartTime = sStart.toISOString();
                payload.saleEndTime = sEnd.toISOString();
            }

            // Kiểm tra và đính kèm danh sách hạng vé
            if (Array.isArray(editFormData.ticketTypes)) {
                for (let i = 0; i < editFormData.ticketTypes.length; i++) {
                    const tt = editFormData.ticketTypes[i];
                    if (!tt.name?.trim()) {
                        showSnackbar(`Vui lòng nhập tên cho hạng vé số #${i + 1}`, 'error');
                        setIsUpdating(false);
                        return;
                    }
                    if (!tt.originalPrice || Number(tt.originalPrice) <= 0) {
                        showSnackbar(`Giá vé cho hạng "${tt.name}" phải lớn hơn 0 ETH`, 'error');
                        setIsUpdating(false);
                        return;
                    }
                    const allocs = ensureAllocations(tt, (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0]);
                    const supply = allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
                    if (supply <= 0) {
                        showSnackbar(`Số lượng vé cho hạng "${tt.name}" phải lớn hơn 0`, 'error');
                        setIsUpdating(false);
                        return;
                    }
                }

                // Kiểm tra overlap giữa các phân bổ ghế
                const flattenedEditAllocs = [];
                editFormData.ticketTypes.forEach((tier, tIdx) => {
                    const allocs = ensureAllocations(tier, (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0]);
                    allocs.forEach((alloc, aIdx) => {
                        flattenedEditAllocs.push({
                            tierIdx: tIdx,
                            tierName: tier.name,
                            allocIdx: aIdx,
                            zone: alloc.zone,
                            row: alloc.row,
                            start: Number(alloc.seatStart) || 1,
                            end: Number(alloc.seatEnd) || 0,
                        });
                    });
                });

                for (let i = 0; i < flattenedEditAllocs.length; i++) {
                    const a1 = flattenedEditAllocs[i];
                    for (let j = i + 1; j < flattenedEditAllocs.length; j++) {
                        const a2 = flattenedEditAllocs[j];
                        if (a1.zone === a2.zone && a1.row === a2.row) {
                            const overlapStart = Math.max(a1.start, a2.start);
                            const overlapEnd = Math.min(a1.end, a2.end);
                            if (overlapStart <= overlapEnd) {
                                showSnackbar(`Trùng dải ghế (${overlapStart} - ${overlapEnd}) giữa "${a1.tierName}" và "${a2.tierName}" trên cùng ${a1.row}!`, 'error');
                                setIsUpdating(false);
                                return;
                            }
                        }
                    }
                }

                payload.ticketTypes = editFormData.ticketTypes.map((tier) => {
                    const allocs = ensureAllocations(tier, (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0]);
                    const computedSupply = allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
                    const zoneSummary = [...new Set(allocs.map((a) => a.zone))].join(', ');
                    const rowSummary = allocs.map((a) => a.row).join(', ');
                    return {
                        id: tier.id,
                        name: tier.name.trim(),
                        tierType: tier.tierType || 'standard',
                        description: tier.description?.trim() || `${tier.name.trim()} - Vé sự kiện NFT`,
                        originalPrice: Number(tier.originalPrice),
                        currency: 'ETH',
                        maxSupply: computedSupply || Number(tier.maxSupply),
                        entryGate: tier.entryGate?.trim() || (editFormData.checkInGates || DEFAULT_EVENT_GATES)[0],
                        seatZone: zoneSummary || tier.seatZone || 'Khán đài A',
                        seatRow: rowSummary || tier.seatRow || 'Dãy A1',
                        seatStart: Number(allocs[0]?.seatStart) || 1,
                        seatEnd: Number(allocs[allocs.length - 1]?.seatEnd) || 20,
                        seatConfig: allocs,
                        saleStartTime: tier.saleStartTime ? new Date(tier.saleStartTime).toISOString() : (payload.saleStartTime || undefined),
                        saleEndTime: tier.saleEndTime ? new Date(tier.saleEndTime).toISOString() : (payload.saleEndTime || undefined),
                    };
                });
            }

            await organizerAPI.updateEvent(editingEvent.id, payload);
            showSnackbar('Cập nhật thông tin sự kiện và các hạng vé thành công!', 'success');
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
        setEventData({ ...INITIAL_EVENT_DATA });
        setEventGates([...DEFAULT_EVENT_GATES]);
        setSeatingMap(
            DEFAULT_SEATING_MAP.map((s) => ({
                ...s,
                rows: Array.isArray(s.rows) ? s.rows.map((r) => ({ ...r })) : [],
            }))
        );
        setTicketTiers(
            INITIAL_TIERS.map((t) => ({
                ...t,
                seatAllocations: Array.isArray(t.seatAllocations)
                    ? t.seatAllocations.map((a) => ({ ...a }))
                    : [],
            }))
        );
        setErrors({});
    };

    const handleEventChange = (field, value) => {
        setEventData((prev) => {
            const next = { ...prev, [field]: value };
            if (field === 'startTime' && value) {
                if (!next.saleStartTime) {
                    next.saleStartTime = toDatetimeLocal(new Date());
                }
                if (!next.saleEndTime || new Date(next.saleEndTime) > new Date(value)) {
                    next.saleEndTime = value;
                }
            }
            return next;
        });
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    // ==========================================
    // QUẢN LÝ CỔNG CHECK-IN SỰ KIỆN
    // ==========================================
    const handleAddGate = () => {
        const trimmed = newGateName.trim();
        if (!trimmed) {
            showSnackbar('Vui lòng nhập tên cổng check-in', 'warning');
            return;
        }
        if (eventGates.includes(trimmed)) {
            showSnackbar('Cổng này đã tồn tại trong danh sách', 'warning');
            return;
        }
        setEventGates((prev) => [...prev, trimmed]);
        setNewGateName('');
        setOpenAddGateDialog(false);
        showSnackbar(`Đã thêm cổng "${trimmed}" thành công!`, 'success');
    };

    const handleRemoveGate = (index) => {
        if (eventGates.length <= 1) {
            showSnackbar('Sự kiện cần có ít nhất 1 cổng kiểm soát', 'warning');
            return;
        }
        const removed = eventGates[index];
        const remainingGates = eventGates.filter((_, i) => i !== index);
        const fallbackGate = remainingGates[0] || '';
        setEventGates(remainingGates);
        setTicketTiers((tiers) =>
            tiers.map((t) => (t.entryGate === removed ? { ...t, entryGate: fallbackGate } : t))
        );
        showSnackbar(`Đã xóa cổng "${removed}"`, 'info');
    };

    // ==========================================
    // QUẢN LÝ SƠ ĐỒ KHÁN ĐÀI & DÃY GHẾ
    // ==========================================
    const handleAddStand = () => {
        const nextChar = String.fromCharCode(65 + seatingMap.length);
        const name = `Khán đài ${nextChar}`;
        const newStand = {
            id: `zone-${Date.now()}`,
            name,
            rowCount: 3,
            seatsPerRow: 20,
            rows: generateStandRows(name, 3, 20),
        };
        setSeatingMap((prev) => [...prev, newStand]);
        showSnackbar(`Đã tạo mới "${newStand.name}"!`, 'success');
    };

    const handleUpdateStandName = (standIndex, newName) => {
        setSeatingMap((prev) => {
            const next = [...prev];
            const oldStand = next[standIndex];
            const oldName = oldStand.name;
            const oldRows = oldStand.rows || [];
            const newRows = generateStandRows(newName, oldStand.rowCount || 3, oldStand.seatsPerRow || 20);
            const updated = {
                ...oldStand,
                name: newName,
                rows: newRows,
            };
            next[standIndex] = updated;
            setTicketTiers((tiers) =>
                tiers.map((t) => {
                    const allocs = ensureAllocations(t, updated, newRows[0]).map((a) => {
                        if (a.zone !== oldName) return a;
                        const oldRowIdx = oldRows.findIndex((r) => r.name === a.row);
                        const mappedRow =
                            oldRowIdx >= 0 && newRows[oldRowIdx]
                                ? newRows[oldRowIdx].name
                                : newRows[0]?.name || a.row;
                        return { ...a, zone: newName, row: mappedRow };
                    });
                    return {
                        ...t,
                        seatAllocations: allocs,
                        seatZone: [...new Set(allocs.map((a) => a.zone))].join(', '),
                        seatRow: allocs.map((a) => a.row).join(', '),
                    };
                })
            );
            return next;
        });
    };

    const handleRemoveStand = (standIndex) => {
        if (seatingMap.length <= 1) {
            showSnackbar('Cần có ít nhất 1 khán đài trong sơ đồ', 'warning');
            return;
        }
        const removedStand = seatingMap[standIndex];
        const remainingStands = seatingMap.filter((_, i) => i !== standIndex);
        const fallbackStand = remainingStands[0];
        const fallbackRow = fallbackStand?.rows?.[0];
        setSeatingMap(remainingStands);
        setTicketTiers((tiers) =>
            tiers.map((t) => {
                const currentAllocs = ensureAllocations(t, fallbackStand, fallbackRow);
                let nextAllocs = currentAllocs.filter((a) => a.zone !== removedStand?.name);
                if (nextAllocs.length === 0) {
                    const maxSeats = fallbackRow?.seatCount || 20;
                    nextAllocs = [
                        {
                            id: `alloc-${t.id || Date.now()}-1`,
                            zone: fallbackStand?.name || 'Khán đài A',
                            row: fallbackRow?.name || 'Dãy A1',
                            seatStart: 1,
                            seatEnd: Math.min(20, maxSeats),
                        },
                    ];
                }
                const totalMax = nextAllocs.reduce((sum, a) => {
                    const s = Number(a.seatStart);
                    const e = Number(a.seatEnd);
                    return sum + (Number.isFinite(s) && Number.isFinite(e) && e >= s ? e - s + 1 : 0);
                }, 0);
                return {
                    ...t,
                    seatAllocations: nextAllocs,
                    seatZone: [...new Set(nextAllocs.map((a) => a.zone))].join(', '),
                    seatRow: nextAllocs.map((a) => a.row).join(', '),
                    seatStart: nextAllocs[0]?.seatStart || 1,
                    seatEnd: nextAllocs[nextAllocs.length - 1]?.seatEnd || totalMax,
                    maxSupply: totalMax,
                };
            })
        );
        showSnackbar(`Đã xóa "${removedStand?.name || 'khán đài'}".`, 'info');
    };

    const handleUpdateStandConfig = (standIndex, field, value) => {
        setSeatingMap((prev) => {
            const next = [...prev];
            const stand = { ...next[standIndex] };
            const numVal = Math.max(1, parseInt(value, 10) || 1);
            stand[field] = numVal;
            const rowCount = field === 'rowCount' ? numVal : (stand.rowCount || 3);
            const seatsPerRow = field === 'seatsPerRow' ? numVal : (stand.seatsPerRow || 20);
            stand.rows = generateStandRows(stand.name, rowCount, seatsPerRow);
            next[standIndex] = stand;

            // Tự động đồng bộ các hạng vé nếu số dãy hoặc số ghế giảm xuống
            setTicketTiers((tiers) =>
                tiers.map((t) => {
                    const allocs = ensureAllocations(t, stand, stand.rows?.[0]).map((a) => {
                        if (a.zone !== stand.name) return a;
                        const availableRowNames = stand.rows.map((r) => r.name);
                        let row = a.row;
                        if (!availableRowNames.includes(row)) {
                            row = stand.rows[0]?.name || 'Dãy A1';
                        }
                        const s = Math.min(Number(a.seatStart) || 1, seatsPerRow);
                        const e = Math.min(Math.max(s, Number(a.seatEnd) || seatsPerRow), seatsPerRow);
                        return {
                            ...a,
                            row,
                            seatStart: s,
                            seatEnd: e,
                        };
                    });
                    const computedMaxSupply = allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
                    return {
                        ...t,
                        seatAllocations: allocs,
                        seatZone: [...new Set(allocs.map((a) => a.zone))].join(', '),
                        seatRow: allocs.map((a) => a.row).join(', '),
                        seatStart: Number(allocs[0]?.seatStart) || 1,
                        seatEnd: Number(allocs[allocs.length - 1]?.seatEnd) || seatsPerRow,
                        maxSupply: computedMaxSupply,
                    };
                })
            );

            return next;
        });
    };

    // ==========================================
    // QUẢN LÝ HẠNG VÉ (TICKET TIERS)
    // ==========================================
    const handleTierChange = (index, field, value) => {
        setTicketTiers((prev) => {
            const updated = [...prev];
            const tier = { ...updated[index], [field]: value };

            if (field === 'tierType') {
                if (value === 'vip') {
                    if (!tier.name || tier.name.startsWith('Vé Tiêu Chuẩn')) {
                        tier.name = `Vé VIP Khán Đài A`;
                    }
                    const vipGate = eventGates.find((g) => g.toLowerCase().includes('vip')) || eventGates[0];
                    if (vipGate) tier.entryGate = vipGate;
                } else {
                    if (!tier.name || tier.name.startsWith('Vé VIP')) {
                        tier.name = `Vé Tiêu Chuẩn Khán Đài B`;
                    }
                    const stdGate = eventGates.find((g) => !g.toLowerCase().includes('vip')) || eventGates[0];
                    if (stdGate) tier.entryGate = stdGate;
                }
            }

            updated[index] = tier;
            return updated;
        });
    };

    const handleAddAllocation = (tierIndex) => {
        setTicketTiers((prev) => {
            const updated = [...prev];
            const tier = { ...updated[tierIndex] };
            const allocs = [...ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0])];

            const lastAlloc = allocs[allocs.length - 1];
            const currentStand = seatingMap.find((s) => s.name === lastAlloc?.zone) || seatingMap[0];
            const availableRows = currentStand?.rows || [];

            let nextZone = currentStand.name;
            let nextRowObj = availableRows[0];
            const currentRowIdx = availableRows.findIndex((r) => r.name === lastAlloc?.row);
            if (currentRowIdx >= 0 && currentRowIdx + 1 < availableRows.length) {
                nextRowObj = availableRows[currentRowIdx + 1];
            } else {
                const currentStandIdx = seatingMap.findIndex((s) => s.name === currentStand.name);
                if (currentStandIdx >= 0 && currentStandIdx + 1 < seatingMap.length) {
                    const nextStand = seatingMap[currentStandIdx + 1];
                    nextZone = nextStand.name;
                    nextRowObj = nextStand.rows?.[0] || { name: 'Dãy A1', seatCount: 20 };
                }
            }

            allocs.push({
                id: `alloc-${tier.id || tierIndex}-${Date.now()}-${allocs.length + 1}`,
                zone: nextZone,
                row: nextRowObj?.name || 'Dãy A1',
                seatStart: 1,
                seatEnd: nextRowObj?.seatCount || 20,
            });

            tier.seatAllocations = allocs;
            tier.maxSupply = allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
            tier.seatZone = [...new Set(allocs.map((a) => a.zone))].join(', ');
            tier.seatRow = allocs.map((a) => a.row).join(', ');
            tier.seatStart = Number(allocs[0]?.seatStart) || 1;
            tier.seatEnd = Number(allocs[allocs.length - 1]?.seatEnd) || 20;

            updated[tierIndex] = tier;
            return updated;
        });
    };

    const handleRemoveAllocation = (tierIndex, allocIndex) => {
        setTicketTiers((prev) => {
            const updated = [...prev];
            const tier = { ...updated[tierIndex] };
            const allocs = ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]);
            if (allocs.length <= 1) {
                showSnackbar('Hạng vé phải có ít nhất 1 khu vực / dãy ghế phân bổ!', 'warning');
                return prev;
            }
            const filteredAllocs = allocs.filter((_, idx) => idx !== allocIndex);
            tier.seatAllocations = filteredAllocs;
            tier.maxSupply = filteredAllocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
            tier.seatZone = [...new Set(filteredAllocs.map((a) => a.zone))].join(', ');
            tier.seatRow = filteredAllocs.map((a) => a.row).join(', ');
            tier.seatStart = Number(filteredAllocs[0]?.seatStart) || 1;
            tier.seatEnd = Number(filteredAllocs[filteredAllocs.length - 1]?.seatEnd) || 20;

            updated[tierIndex] = tier;
            return updated;
        });
    };

    const handleAllocationChange = (tierIndex, allocIndex, field, value) => {
        setTicketTiers((prev) => {
            const updated = [...prev];
            const tier = { ...updated[tierIndex] };
            const allocs = [...ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0])];
            const alloc = { ...allocs[allocIndex] };

            if (field === 'zone') {
                alloc.zone = value;
                const stand = seatingMap.find((s) => s.name === value) || seatingMap[0];
                const firstRow = stand?.rows?.[0] || { name: 'Dãy A1', seatCount: 20 };
                alloc.row = firstRow.name;
                alloc.seatStart = 1;
                alloc.seatEnd = firstRow.seatCount || 20;
            } else if (field === 'row') {
                alloc.row = value;
                const stand = seatingMap.find((s) => s.name === alloc.zone) || seatingMap[0];
                const rowObj = stand?.rows?.find((r) => r.name === value);
                alloc.seatStart = 1;
                alloc.seatEnd = rowObj?.seatCount || 20;
            } else if (field === 'seatStart' || field === 'seatEnd') {
                alloc[field] = value === '' ? '' : (parseInt(value, 10) || '');
            }

            allocs[allocIndex] = alloc;
            tier.seatAllocations = allocs;
            tier.maxSupply = allocs.reduce((sum, a) => {
                const s = Number(a.seatStart) || 0;
                const e = Number(a.seatEnd) || 0;
                return sum + (e >= s && s > 0 ? e - s + 1 : 0);
            }, 0);
            tier.seatZone = [...new Set(allocs.map((a) => a.zone))].join(', ');
            tier.seatRow = allocs.map((a) => a.row).join(', ');
            tier.seatStart = Number(allocs[0]?.seatStart) || 1;
            tier.seatEnd = Number(allocs[allocs.length - 1]?.seatEnd) || 20;

            updated[tierIndex] = tier;
            return updated;
        });
    };

    const handleAddTier = () => {
        const now = new Date();
        const eventStart = eventData.startTime ? new Date(eventData.startTime) : null;
        const defaultStart = toDatetimeLocal(now);
        const defaultEnd = eventStart && eventStart > now ? toDatetimeLocal(eventStart) : toDatetimeLocal(new Date(now.getTime() + 7 * 24 * 3600 * 1000));

        const defaultZone = seatingMap[0]?.name || 'Khán đài A';
        const defaultRowObj = seatingMap[0]?.rows?.[0] || { name: 'Dãy A1', seatCount: 20 };
        const defaultRow = defaultRowObj.name;
        const defaultGate = eventGates[0] || 'Cổng VIP - Sảnh Chính Tầng 1';

        const defaultAlloc = {
            id: `alloc-${Date.now()}-1`,
            zone: defaultZone,
            row: defaultRow,
            seatStart: 1,
            seatEnd: defaultRowObj.seatCount || 20,
        };

        const newTier = {
            id: Date.now(),
            tierType: 'standard',
            name: `Hạng vé #${ticketTiers.length + 1}`,
            description: 'Mô tả quyền lợi hạng vé...',
            originalPrice: '0.001',
            entryGate: defaultGate,
            seatAllocations: [defaultAlloc],
            seatZone: defaultZone,
            seatRow: defaultRow,
            seatStart: 1,
            seatEnd: defaultRowObj.seatCount || 20,
            maxSupply: defaultRowObj.seatCount || 20,
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

            // 1. Kiểm tra thời gian diễn ra sự kiện
            if (!eventData.startTime) {
                newErrors.startTime = 'Vui lòng chọn thời gian bắt đầu sự kiện';
            } else if (new Date(eventData.startTime) <= new Date()) {
                newErrors.startTime = 'Thời gian bắt đầu sự kiện phải ở tương lai';
            }

            if (!eventData.endTime) {
                newErrors.endTime = 'Vui lòng chọn thời gian kết thúc sự kiện';
            } else if (eventData.startTime && new Date(eventData.endTime) <= new Date(eventData.startTime)) {
                newErrors.endTime = 'Thời gian kết thúc sự kiện phải sau thời gian bắt đầu';
            }

            // 2. Kiểm tra khung giờ mở bán vé
            if (!eventData.saleStartTime) {
                newErrors.saleStartTime = 'Vui lòng chọn thời gian bắt đầu mở bán vé';
            }

            if (!eventData.saleEndTime) {
                newErrors.saleEndTime = 'Vui lòng chọn thời gian kết thúc bán vé';
            } else if (eventData.saleStartTime && new Date(eventData.saleEndTime) <= new Date(eventData.saleStartTime)) {
                newErrors.saleEndTime = 'Thời gian kết thúc bán vé phải sau thời gian bắt đầu mở bán';
            } else if (eventData.startTime && new Date(eventData.saleEndTime) > new Date(eventData.startTime)) {
                newErrors.saleEndTime = 'Thời gian kết thúc bán vé phải trước hoặc bằng thời gian sự kiện bắt đầu';
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

                const allocs = ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]);
                if (allocs.length === 0) {
                    newErrors[`tier_${index}_allocations`] = 'Hạng vé phải có ít nhất 1 phân bổ chỗ ngồi';
                }

                allocs.forEach((alloc, allocIdx) => {
                    const stand = seatingMap.find((s) => s.name === alloc.zone);
                    const rowObj = stand?.rows?.find((r) => r.name === alloc.row);
                    const maxRowSeats = rowObj?.seatCount || stand?.seatsPerRow || 20;

                    const s = Number(alloc.seatStart) || 1;
                    const e = Number(alloc.seatEnd) || 0;

                    if (s < 1) {
                        newErrors[`tier_${index}_alloc_${allocIdx}_seats`] = 'Số ghế bắt đầu phải từ 1 trở lên';
                    } else if (e < s) {
                        newErrors[`tier_${index}_alloc_${allocIdx}_seats`] = `Ghế kết thúc (${e}) phải >= ghế bắt đầu (${s})`;
                    } else if (e > maxRowSeats) {
                        newErrors[`tier_${index}_alloc_${allocIdx}_seats`] = `${alloc.row} chỉ có ${maxRowSeats} ghế. Ghế kết thúc (${e}) không được vượt quá ${maxRowSeats}!`;
                    }
                });

                if (!tier.maxSupply || Number(tier.maxSupply) <= 0) {
                    newErrors[`tier_${index}_supply`] = 'Số lượng phát hành trần phải lớn hơn 0';
                }
            });

            // Kiểm tra tổng sức chứa của từng khán đài
            seatingMap.forEach((stand) => {
                const standCapacity = stand.rows?.reduce((sum, r) => sum + (Number(r.seatCount) || 0), 0) || ((stand.rowCount || 3) * (stand.seatsPerRow || 20));
                const allocatedSeats = ticketTiers.reduce((total, tier) => {
                    const allocs = ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]);
                    const standAllocs = allocs.filter((a) => a.zone === stand.name);
                    return total + standAllocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
                }, 0);

                if (allocatedSeats > standCapacity) {
                    newErrors[`stand_${stand.name}`] = `${stand.name} có tổng ${standCapacity} ghế nhưng các hạng vé gán tới ${allocatedSeats} vé (vượt quá ${allocatedSeats - standCapacity} vé)!`;
                }
            });

            // Kiểm tra chống trùng ghế trên cùng Khán đài và Dãy ghế giữa tất cả các phân bổ
            const flattenedAllocs = [];
            ticketTiers.forEach((tier, tIdx) => {
                const allocs = ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]);
                allocs.forEach((alloc, aIdx) => {
                    flattenedAllocs.push({
                        tierIdx: tIdx,
                        tierName: tier.name,
                        allocIdx: aIdx,
                        zone: alloc.zone,
                        row: alloc.row,
                        start: Number(alloc.seatStart) || 1,
                        end: Number(alloc.seatEnd) || 0,
                    });
                });
            });

            for (let i = 0; i < flattenedAllocs.length; i++) {
                const a1 = flattenedAllocs[i];
                for (let j = i + 1; j < flattenedAllocs.length; j++) {
                    const a2 = flattenedAllocs[j];
                    if (a1.zone === a2.zone && a1.row === a2.row) {
                        const overlapStart = Math.max(a1.start, a2.start);
                        const overlapEnd = Math.min(a1.end, a2.end);
                        if (overlapStart <= overlapEnd) {
                            if (a1.tierIdx === a2.tierIdx) {
                                newErrors[`tier_${a1.tierIdx}_alloc_${a1.allocIdx}_overlap`] = `Trùng dải ghế (${overlapStart} - ${overlapEnd}) với phân bổ khác trên cùng ${a1.row}!`;
                                newErrors[`tier_${a2.tierIdx}_alloc_${a2.allocIdx}_overlap`] = `Trùng dải ghế (${overlapStart} - ${overlapEnd}) với phân bổ khác trên cùng ${a2.row}!`;
                            } else {
                                newErrors[`tier_${a1.tierIdx}_alloc_${a1.allocIdx}_overlap`] = `Trùng dải ghế (${overlapStart} - ${overlapEnd}) với hạng vé "${a2.tierName}" trên cùng ${a1.row}!`;
                                newErrors[`tier_${a2.tierIdx}_alloc_${a2.allocIdx}_overlap`] = `Trùng dải ghế (${overlapStart} - ${overlapEnd}) với hạng vé "${a1.tierName}" trên cùng ${a1.row}!`;
                            }
                        }
                    }
                }
            }
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
            const saleStart = eventData.saleStartTime ? new Date(eventData.saleStartTime) : (now < eventStart ? now : new Date(eventStart.getTime() - 24 * 3600 * 1000));
            const saleEnd = eventData.saleEndTime ? new Date(eventData.saleEndTime) : eventStart;

            const preparedTicketTiers = ticketTiers.map((tier) => {
                const allocs = ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]);
                const computedSupply = allocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
                const zoneSummary = [...new Set(allocs.map((a) => a.zone))].join(', ');
                const rowSummary = allocs.map((a) => a.row).join(', ');
                return {
                    name: tier.name.trim(),
                    tierType: tier.tierType || 'standard',
                    description: tier.description?.trim() || `${tier.name.trim()} - Vé sự kiện NFT`,
                    originalPrice: Number(tier.originalPrice),
                    currency: 'ETH',
                    maxSupply: computedSupply || Number(tier.maxSupply),
                    entryGate: tier.entryGate?.trim() || eventGates[0] || 'Cổng A - Khán Đài Phổ Thông Tầng 1',
                    seatZone: zoneSummary || tier.seatZone || 'Khán đài A',
                    seatRow: rowSummary || tier.seatRow || 'Dãy A1',
                    seatStart: Number(allocs[0]?.seatStart) || 1,
                    seatEnd: Number(allocs[allocs.length - 1]?.seatEnd) || 20,
                    seatConfig: allocs,
                    saleStartTime: tier.saleStartTime ? new Date(tier.saleStartTime).toISOString() : saleStart.toISOString(),
                    saleEndTime: tier.saleEndTime ? new Date(tier.saleEndTime).toISOString() : saleEnd.toISOString(),
                };
            });

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
                saleStartTime: saleStart.toISOString(),
                saleEndTime: saleEnd.toISOString(),
                checkInGates: eventGates,
                seatingMap: seatingMap,
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
                                    startIcon={<Plus size={18} />}
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
                                                        <Search size={18} style={{ opacity: 0.6 }} />
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
                                            startIcon={<RefreshCw size={15} />}
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
                                                    <CalendarDays size={48} style={{ opacity: 0.4, marginBottom: 8, color: 'currentColor' }} />
                                                    <Typography variant="body1" fontWeight={700} color="text.secondary">
                                                        Không tìm thấy sự kiện nào phù hợp.
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        startIcon={<Plus size={16} />}
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
                                                                        <Eye size={18} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                <Tooltip title="Chỉnh sửa thông tin">
                                                                    <IconButton size="small" color="inherit" onClick={() => handleOpenEdit(evt)}>
                                                                        <Edit3 size={18} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                {/* Gửi duyệt nếu là bản nháp */}
                                                                {evt.status === 'draft' && (
                                                                    <Tooltip title="Gửi duyệt lên Ban Quản Trị">
                                                                        <IconButton size="small" color="success" onClick={() => handleQuickSubmitReview(evt.id)}>
                                                                            <Send size={18} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {/* Hủy sự kiện nếu đang mở bán hoặc chờ duyệt */}
                                                                {['published', 'approved', 'pending'].includes(evt.status) && (
                                                                    <Tooltip title={evt.ticketsSold > 0 ? "Sự kiện đã bán vé (không thể hủy - nhấn để xem giải pháp dời lịch)" : "Hủy sự kiện"}>
                                                                        <IconButton size="small" color={evt.ticketsSold > 0 ? "default" : "warning"} onClick={() => handleOpenCancel(evt)}>
                                                                            <Ban size={18} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                                {/* Xóa vĩnh viễn nếu là bản nháp hoặc bị từ chối */}
                                                                {['draft', 'rejected'].includes(evt.status) && (
                                                                    <Tooltip title="Xóa vĩnh viễn bản nháp">
                                                                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(evt)}>
                                                                            <Trash2 size={18} />
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
                                        startIcon={<ArrowLeft size={16} />}
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
                                                helperText={errors.bannerUrl || 'Dán liên kết (URL) ảnh chất lượng cao hoặc đường dẫn IPFS'}
                                                sx={{ mb: 2 }}
                                            />

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
                                                        <UploadCloud size={40} style={{ opacity: 0.5 }} />
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
                                                label="Thời gian sự kiện bắt đầu *"
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
                                                label="Thời gian sự kiện kết thúc *"
                                                value={eventData.endTime}
                                                onChange={(e) => handleEventChange('endTime', e.target.value)}
                                                error={Boolean(errors.endTime)}
                                                helperText={errors.endTime}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>

                                        {/* Khung giờ mở bán vé */}
                                        <Grid item xs={12}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: '10px',
                                                    border: 1,
                                                    borderColor: errors.saleStartTime || errors.saleEndTime ? 'error.main' : 'divider',
                                                    bgcolor: 'background.paper',
                                                }}
                                            >
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Clock size={16} color={theme.palette.primary.main} /> Khung Giờ Mở Bán Vé (Ticket Sales Window)
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                                    Khách hàng chỉ có thể bấm mua vé trong khoảng thời gian này. Bắt buộc: <strong>Mở bán vé &lt; Kết thúc bán vé ≤ Sự kiện bắt đầu</strong>.
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            type="datetime-local"
                                                            label="Thời gian bắt đầu mở bán vé *"
                                                            value={eventData.saleStartTime}
                                                            onChange={(e) => handleEventChange('saleStartTime', e.target.value)}
                                                            error={Boolean(errors.saleStartTime)}
                                                            helperText={errors.saleStartTime}
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <TextField
                                                            fullWidth
                                                            type="datetime-local"
                                                            label="Thời gian kết thúc bán vé *"
                                                            value={eventData.saleEndTime}
                                                            onChange={(e) => handleEventChange('saleEndTime', e.target.value)}
                                                            error={Boolean(errors.saleEndTime)}
                                                            helperText={errors.saleEndTime || 'Phải trước hoặc bằng thời gian sự kiện bắt đầu'}
                                                            InputLabelProps={{ shrink: true }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Paper>
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

                                        {/* CẤU HÌNH CỔNG CHECK-IN SỰ KIỆN */}
                                        <Grid item xs={12}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2.5,
                                                    borderRadius: '12px',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    bgcolor: 'background.subtle',
                                                    mt: 1,
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <DoorOpen size={18} color={theme.palette.primary.main} /> Cổng Check-In Của Sự Kiện ({eventGates.length} cổng)
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Tạo danh sách các cổng kiểm soát soát vé thực tế tại địa điểm. Các cổng này sẽ được dùng để gán vào từng hạng vé.
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Plus size={14} />}
                                                        onClick={() => setOpenAddGateDialog(true)}
                                                        sx={{ borderRadius: '8px', fontWeight: 700 }}
                                                    >
                                                        + Thêm Cổng Soát Vé
                                                    </Button>
                                                </Stack>

                                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                                    {eventGates.map((gate, gIdx) => (
                                                        <Chip
                                                            key={gIdx}
                                                            icon={<DoorOpen size={14} style={{ marginLeft: 6 }} />}
                                                            label={gate}
                                                            onDelete={eventGates.length > 1 ? () => handleRemoveGate(gIdx) : undefined}
                                                            sx={{
                                                                fontWeight: 600,
                                                                py: 2,
                                                                px: 0.5,
                                                                borderRadius: '8px',
                                                                border: 1,
                                                                borderColor: 'divider',
                                                                bgcolor: 'background.paper',
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* BƯỚC 3: SƠ ĐỒ KHÁN ĐÀI & THIẾT LẬP HẠNG VÉ */}
                            {activeStep === 2 && (
                                <Box>
                                    {/* PHẦN 1: SƠ ĐỒ KHÁN ĐÀI & CHỖ NGỒI */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            mb: 4,
                                            borderRadius: '12px',
                                            border: 1,
                                            borderColor: 'divider',
                                            bgcolor: 'background.subtle',
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                            <Box>
                                                <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LayoutGrid size={22} color={theme.palette.primary.main} /> 1. Sơ Đồ Khán Đài & Chỗ Ngồi
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Mặc định thiết lập sẵn 3 khán đài A, B, C. Bạn có thể sửa tên, thêm khán đài, thêm dãy và cấu hình số ghế mỗi dãy.
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                startIcon={<Plus size={16} />}
                                                onClick={handleAddStand}
                                                sx={{ borderRadius: '8px', fontWeight: 700 }}
                                            >
                                                + Thêm Khán Đài
                                            </Button>
                                        </Stack>

                                        <Grid container spacing={2}>
                                            {seatingMap.map((stand, sIdx) => {
                                                const standCap = (stand.rowCount || 3) * (stand.seatsPerRow || 20);
                                                const allocated = ticketTiers.reduce((total, tier) => {
                                                    const allocs = ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]);
                                                    const standAllocs = allocs.filter((a) => a.zone === stand.name);
                                                    return total + standAllocs.reduce((sum, a) => sum + Math.max(0, (Number(a.seatEnd) || 0) - (Number(a.seatStart) || 1) + 1), 0);
                                                }, 0);
                                                const isOver = allocated > standCap;
                                                const hasError = Boolean(errors[`stand_${stand.name}`]) || isOver;

                                                return (
                                                    <Grid item xs={12} md={4} key={stand.id || sIdx}>
                                                        <Paper
                                                            elevation={0}
                                                            sx={{
                                                                p: 2.5,
                                                                borderRadius: '12px',
                                                                bgcolor: 'background.paper',
                                                                border: 1,
                                                                borderColor: hasError ? 'error.main' : 'divider',
                                                                height: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                            }}
                                                        >
                                                            {/* Tên khán đài & Nút Xóa */}
                                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                                                <TextField
                                                                    size="small"
                                                                    variant="standard"
                                                                    label="Tên khán đài"
                                                                    value={stand.name}
                                                                    onChange={(e) => handleUpdateStandName(sIdx, e.target.value)}
                                                                    InputProps={{
                                                                        disableUnderline: false,
                                                                        sx: { fontWeight: 700, fontSize: '0.98rem' },
                                                                    }}
                                                                />
                                                                {seatingMap.length > 1 && (
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleRemoveStand(sIdx)}
                                                                        title="Xóa khán đài"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </IconButton>
                                                                )}
                                                            </Stack>

                                                            {/* Cơ chế điền số: Số dãy ghế & Số ghế mỗi dãy */}
                                                            <Grid container spacing={1.5} mb={2}>
                                                                <Grid item xs={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        type="number"
                                                                        label="Số dãy ghế"
                                                                        value={stand.rowCount || stand.rows?.length || 3}
                                                                        onChange={(e) => handleUpdateStandConfig(sIdx, 'rowCount', e.target.value)}
                                                                        InputProps={{
                                                                            endAdornment: <InputAdornment position="end">dãy</InputAdornment>,
                                                                        }}
                                                                        inputProps={{ min: 1, max: 50 }}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={6}>
                                                                    <TextField
                                                                        fullWidth
                                                                        size="small"
                                                                        type="number"
                                                                        label="Số ghế mỗi dãy"
                                                                        value={stand.seatsPerRow || stand.rows?.[0]?.seatCount || 20}
                                                                        onChange={(e) => handleUpdateStandConfig(sIdx, 'seatsPerRow', e.target.value)}
                                                                        InputProps={{
                                                                            endAdornment: <InputAdornment position="end">ghế</InputAdornment>,
                                                                        }}
                                                                        inputProps={{ min: 1, max: 300 }}
                                                                    />
                                                                </Grid>
                                                            </Grid>

                                                            {/* Sức chứa và dãy ghế tự động sinh */}
                                                            <Box sx={{ p: 1.5, bgcolor: 'background.subtle', borderRadius: '8px', border: 1, borderColor: 'divider', mb: 2 }}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                        SỨC CHỨA KHÁN ĐÀI:
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        color="primary"
                                                                        label={`${standCap} ghế`}
                                                                        sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                                                                    />
                                                                </Stack>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Dãy tự động: <strong>{stand.rows?.[0]?.name || 'Dãy 1'}</strong> → <strong>{stand.rows?.[stand.rows.length - 1]?.name || `Dãy ${stand.rowCount || 3}`}</strong>
                                                                </Typography>
                                                            </Box>

                                                            {/* Thống kê vé đã gán & Cảnh báo quá tải */}
                                                            <Box mt="auto">
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="caption" color={isOver ? 'error.main' : 'text.secondary'} fontWeight={600}>
                                                                        Vé đã phân bổ:
                                                                    </Typography>
                                                                    <Chip
                                                                        size="small"
                                                                        color={isOver ? 'error' : allocated > 0 ? 'success' : 'default'}
                                                                        variant={isOver ? 'filled' : 'outlined'}
                                                                        label={`${allocated} / ${standCap} vé`}
                                                                        sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                                                                    />
                                                                </Stack>
                                                                {isOver && (
                                                                    <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5, fontWeight: 700 }}>
                                                                        ⚠️ Quá tải: Vượt sức chứa {allocated - standCap} vé!
                                                                    </Typography>
                                                                )}
                                                                {errors[`stand_${stand.name}`] && (
                                                                    <Alert severity="error" sx={{ mt: 1, py: 0.5, px: 1, fontSize: '0.75rem' }}>
                                                                        {errors[`stand_${stand.name}`]}
                                                                    </Alert>
                                                                )}
                                                            </Box>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Paper>

                                    {/* PHẦN 2: THIẾT LẬP CÁC HẠNG VÉ */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                        <Box>
                                            <Typography variant="h3" fontWeight={700} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Ticket size={22} color={theme.palette.primary.main} /> 2. Thiết Lập Các Hạng Vé Phát Hành (NFT)
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Chọn phân loại vé (VIP / Tiêu Chuẩn), gán cổng check-in và vị trí chỗ ngồi cụ thể.
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Plus size={16} />}
                                            onClick={handleAddTier}
                                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                                        >
                                            + Thêm Hạng Vé
                                        </Button>
                                    </Stack>

                                    <Stack spacing={3} mt={3}>
                                        {ticketTiers.map((tier, index) => {
                                            return (
                                                <Paper
                                                    key={tier.id || index}
                                                    elevation={0}
                                                    sx={{
                                                        p: 3,
                                                        borderRadius: '12px',
                                                        border: 1,
                                                        borderColor: tier.tierType === 'vip' ? 'warning.main' : 'divider',
                                                        bgcolor: 'background.subtle',
                                                        boxShadow: tier.tierType === 'vip' ? '0 0 0 1px rgba(245, 158, 11, 0.2)' : 'none',
                                                    }}
                                                >
                                                    {/* Hàng Header: Phân loại VIP / Tiêu Chuẩn & Nút Xóa */}
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1}>
                                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                                            <ToggleButtonGroup
                                                                value={tier.tierType || 'standard'}
                                                                exclusive
                                                                size="small"
                                                                onChange={(_, newType) => {
                                                                    if (newType) handleTierChange(index, 'tierType', newType);
                                                                }}
                                                            >
                                                                <ToggleButton value="vip" sx={{ px: 2, fontWeight: 700 }}>
                                                                    <Crown size={15} style={{ marginRight: 6, color: '#F59E0B' }} /> Hạng VIP
                                                                </ToggleButton>
                                                                <ToggleButton value="standard" sx={{ px: 2, fontWeight: 700 }}>
                                                                    <Ticket size={15} style={{ marginRight: 6 }} /> Tiêu Chuẩn
                                                                </ToggleButton>
                                                            </ToggleButtonGroup>
                                                            <Typography variant="subtitle1" fontWeight={700}>
                                                                #{index + 1}: {tier.name || 'Chưa đặt tên'}
                                                            </Typography>
                                                        </Stack>

                                                        {ticketTiers.length > 1 && (
                                                            <IconButton color="error" size="small" onClick={() => handleRemoveTier(index)}>
                                                                <Trash2 size={18} />
                                                            </IconButton>
                                                        )}
                                                    </Stack>

                                                    {/* Thông báo lỗi trùng dải ghế nếu có */}
                                                    {errors[`tier_${index}_overlap`] && (
                                                        <Alert severity="error" icon={<AlertTriangle size={18} />} sx={{ mb: 2, borderRadius: '8px' }}>
                                                            {errors[`tier_${index}_overlap`]}
                                                        </Alert>
                                                    )}

                                                    <Grid container spacing={2}>
                                                        {/* 1. Tên hạng vé */}
                                                        <Grid item xs={12} sm={4}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Tên hạng vé *"
                                                                placeholder="Ví dụ: VIP Khán Đài A, Tiêu Chuẩn B1..."
                                                                value={tier.name}
                                                                onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                                                                error={Boolean(errors[`tier_${index}_name`])}
                                                                helperText={errors[`tier_${index}_name`]}
                                                            />
                                                        </Grid>

                                                        {/* 2. Giá vé gốc */}
                                                        <Grid item xs={12} sm={4}>
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

                                                        {/* 3. Cổng check-in gán cho vé */}
                                                        <Grid item xs={12} sm={4}>
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel id={`gate-label-${index}`}>Cổng check-in chỉ định</InputLabel>
                                                                <Select
                                                                    labelId={`gate-label-${index}`}
                                                                    label="Cổng check-in chỉ định"
                                                                    value={tier.entryGate || eventGates[0]}
                                                                    onChange={(e) => handleTierChange(index, 'entryGate', e.target.value)}
                                                                >
                                                                    {eventGates.map((gate) => (
                                                                        <MenuItem key={gate} value={gate}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                <DoorOpen size={14} /> {gate}
                                                                            </Box>
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Grid>

                                                        {/* Khối gán Chỗ ngồi & Tự động tính số lượng vé */}
                                                        <Grid item xs={12}>
                                                            <Paper
                                                                elevation={0}
                                                                sx={{
                                                                    p: 2,
                                                                    borderRadius: '8px',
                                                                    bgcolor: 'background.paper',
                                                                    border: 1,
                                                                    borderColor: 'divider',
                                                                }}
                                                            >
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                                                    <Box>
                                                                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <Armchair size={14} /> PHÂN BỔ CHỖ NGỒI & DẢI GHẾ PHÁT HÀNH
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Hạng vé có thể gán nhiều khán đài và dãy ghế khác nhau. Tổng số lượng vé sẽ được tính tự động từ tất cả các phân bổ.
                                                                        </Typography>
                                                                    </Box>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        startIcon={<Plus size={14} />}
                                                                        onClick={() => handleAddAllocation(index)}
                                                                        sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', py: 0.25 }}
                                                                    >
                                                                        + Thêm Khu Vực / Dãy Ghế
                                                                    </Button>
                                                                </Box>

                                                                <Stack spacing={1.5}>
                                                                    {ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]).map((alloc, allocIdx, allAllocations) => {
                                                                        const currentStand = seatingMap.find((s) => s.name === alloc.zone) || seatingMap[0];
                                                                        const availableRows = currentStand?.rows || [];
                                                                        const currentRow = availableRows.find((r) => r.name === alloc.row) || availableRows[0];
                                                                        const maxRowSeats = currentRow?.seatCount || currentStand?.seatsPerRow || 20;
                                                                        const seatStartNum = Number(alloc.seatStart) || 1;
                                                                        const seatEndNum = Number(alloc.seatEnd) || 0;
                                                                        const allocTickets = Math.max(0, seatEndNum - seatStartNum + 1);

                                                                        const seatError = errors[`tier_${index}_alloc_${allocIdx}_seats`];
                                                                        const overlapError = errors[`tier_${index}_alloc_${allocIdx}_overlap`];

                                                                        return (
                                                                            <Paper
                                                                                key={alloc.id || allocIdx}
                                                                                variant="outlined"
                                                                                sx={{
                                                                                    p: 1.5,
                                                                                    borderRadius: '6px',
                                                                                    bgcolor: 'background.subtle',
                                                                                    borderColor: overlapError || seatError ? 'error.main' : 'divider',
                                                                                }}
                                                                            >
                                                                                <Grid container spacing={1.5} alignItems="center">
                                                                                    {/* Phân bổ thứ mấy */}
                                                                                    <Grid item xs={12} sm="auto">
                                                                                        <Chip
                                                                                            label={`#${allocIdx + 1}`}
                                                                                            size="small"
                                                                                            color={tier.tierType === 'vip' ? 'warning' : 'default'}
                                                                                            sx={{ fontWeight: 700, minWidth: 32 }}
                                                                                        />
                                                                                    </Grid>

                                                                                    {/* Chọn Khán đài */}
                                                                                    <Grid item xs={12} sm={3}>
                                                                                        <FormControl fullWidth size="small">
                                                                                            <InputLabel id={`stand-label-${index}-${allocIdx}`}>Khán đài</InputLabel>
                                                                                            <Select
                                                                                                labelId={`stand-label-${index}-${allocIdx}`}
                                                                                                label="Khán đài"
                                                                                                value={alloc.zone || seatingMap[0]?.name}
                                                                                                onChange={(e) => handleAllocationChange(index, allocIdx, 'zone', e.target.value)}
                                                                                            >
                                                                                                {seatingMap.map((s) => (
                                                                                                    <MenuItem key={s.id || s.name} value={s.name}>
                                                                                                        {s.name}
                                                                                                    </MenuItem>
                                                                                                ))}
                                                                                            </Select>
                                                                                        </FormControl>
                                                                                    </Grid>

                                                                                    {/* Chọn Dãy */}
                                                                                    <Grid item xs={12} sm={3}>
                                                                                        <FormControl fullWidth size="small">
                                                                                            <InputLabel id={`row-label-${index}-${allocIdx}`}>Dãy ghế</InputLabel>
                                                                                            <Select
                                                                                                labelId={`row-label-${index}-${allocIdx}`}
                                                                                                label="Dãy ghế"
                                                                                                value={alloc.row || availableRows[0]?.name || ''}
                                                                                                onChange={(e) => handleAllocationChange(index, allocIdx, 'row', e.target.value)}
                                                                                            >
                                                                                                {availableRows.map((r) => (
                                                                                                    <MenuItem key={r.id || r.name} value={r.name}>
                                                                                                        {r.name} (tối đa {r.seatCount} ghế)
                                                                                                    </MenuItem>
                                                                                                ))}
                                                                                            </Select>
                                                                                        </FormControl>
                                                                                    </Grid>

                                                                                    {/* Dải số ghế: Từ ghế -> Đến ghế */}
                                                                                    <Grid item xs={5} sm={2}>
                                                                                        <TextField
                                                                                            fullWidth
                                                                                            size="small"
                                                                                            type="number"
                                                                                            label="Từ ghế số"
                                                                                            value={alloc.seatStart === '' ? '' : (alloc.seatStart ?? 1)}
                                                                                            onChange={(e) => handleAllocationChange(index, allocIdx, 'seatStart', e.target.value)}
                                                                                            inputProps={{ min: 1, max: maxRowSeats }}
                                                                                        />
                                                                                    </Grid>

                                                                                    <Grid item xs={5} sm={2}>
                                                                                        <TextField
                                                                                            fullWidth
                                                                                            size="small"
                                                                                            type="number"
                                                                                            label="Đến ghế số"
                                                                                            value={alloc.seatEnd === '' ? '' : (alloc.seatEnd ?? maxRowSeats)}
                                                                                            onChange={(e) => handleAllocationChange(index, allocIdx, 'seatEnd', e.target.value)}
                                                                                            error={Boolean(seatError) || (Number(alloc.seatEnd) > maxRowSeats) || (Number(alloc.seatStart) > Number(alloc.seatEnd))}
                                                                                            helperText={
                                                                                                seatError ||
                                                                                                (Number(alloc.seatEnd) > maxRowSeats
                                                                                                    ? `Tối đa ${maxRowSeats} ghế`
                                                                                                    : (Number(alloc.seatStart) > Number(alloc.seatEnd) ? 'Phải >= Từ ghế' : `Tối đa ${maxRowSeats} ghế`))
                                                                                            }
                                                                                            inputProps={{ min: 1, max: maxRowSeats }}
                                                                                        />
                                                                                    </Grid>

                                                                                    {/* Nút xóa phân bổ */}
                                                                                    <Grid item xs={2} sm="auto" sx={{ textAlign: 'center' }}>
                                                                                        <Tooltip title={allAllocations.length > 1 ? "Xóa khu vực/dãy này" : "Mỗi hạng vé phải có ít nhất 1 phân bổ"}>
                                                                                            <span>
                                                                                                <IconButton
                                                                                                    size="small"
                                                                                                    color="error"
                                                                                                    disabled={allAllocations.length <= 1}
                                                                                                    onClick={() => handleRemoveAllocation(index, allocIdx)}
                                                                                                >
                                                                                                    <Trash2 size={16} />
                                                                                                </IconButton>
                                                                                            </span>
                                                                                        </Tooltip>
                                                                                    </Grid>
                                                                                </Grid>

                                                                                {/* Cảnh báo trùng dải ghế nếu có */}
                                                                                {overlapError && (
                                                                                    <Alert severity="error" icon={<AlertTriangle size={14} />} sx={{ mt: 1, py: 0.25, fontSize: '0.75rem' }}>
                                                                                        {overlapError}
                                                                                    </Alert>
                                                                                )}
                                                                            </Paper>
                                                                        );
                                                                    })}
                                                                </Stack>

                                                                {/* Tổng kết số lượng vé tự động tính */}
                                                                <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Gồm <strong>{ensureAllocations(tier, seatingMap[0], seatingMap[0]?.rows?.[0]).length}</strong> khu vực phân bổ ghế
                                                                    </Typography>
                                                                    <Chip
                                                                        color="primary"
                                                                        variant="filled"
                                                                        label={`Tổng vé phát hành: ${tier.maxSupply || 0} vé`}
                                                                        sx={{ fontWeight: 700, fontSize: '0.85rem' }}
                                                                    />
                                                                </Box>
                                                            </Paper>
                                                        </Grid>

                                                        {/* Mô tả quyền lợi */}
                                                        <Grid item xs={12}>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                label="Mô tả quyền lợi hạng vé"
                                                                placeholder="Bao gồm đồ uống miễn phí, lối đi riêng..."
                                                                value={tier.description}
                                                                onChange={(e) => handleTierChange(index, 'description', e.target.value)}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            );
                                        })}
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
                                                    <Clock size={18} style={{ marginRight: 4, color: 'text.secondary' }} />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">Thời gian sự kiện diễn ra:</Typography>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {eventData.startTime ? new Date(eventData.startTime).toLocaleString('vi-VN') : ''} → {eventData.endTime ? new Date(eventData.endTime).toLocaleString('vi-VN') : ''}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Ticket size={18} style={{ marginRight: 4, color: 'text.secondary' }} />
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" display="block">Khung giờ mở bán vé:</Typography>
                                                        <Typography variant="body2" fontWeight={700} color="primary.main">
                                                            {eventData.saleStartTime ? new Date(eventData.saleStartTime).toLocaleString('vi-VN') : ''} → {eventData.saleEndTime ? new Date(eventData.saleEndTime).toLocaleString('vi-VN') : ''}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <MapPin size={18} style={{ marginRight: 4, color: 'text.secondary' }} />
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

                                    {/* TÓM TẮT SƠ ĐỒ KHÁN ĐÀI */}
                                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider', mb: 3 }}>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LayoutGrid size={16} /> Sơ đồ khán đài ({seatingMap.length} khán đài, {seatingMap.reduce((s, st) => s + st.rows.reduce((rSum, r) => rSum + (Number(r.seatCount) || 0), 0), 0)} ghế):
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mt={1}>
                                            {seatingMap.map((st, sIdx) => {
                                                const sSeats = st.rows.reduce((sum, r) => sum + (Number(r.seatCount) || 0), 0);
                                                return (
                                                    <Chip
                                                        key={sIdx}
                                                        size="small"
                                                        label={`${st.name}: ${st.rows.length} dãy (${sSeats} ghế)`}
                                                        sx={{ fontWeight: 600, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                                                    />
                                                );
                                            })}
                                        </Stack>
                                    </Paper>

                                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                                        Các hạng vé phát hành ({ticketTiers.length} hạng vé):
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {ticketTiers.map((tt, i) => (
                                            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: '8px', border: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="subtitle2" fontWeight={700}>{tt.name}</Typography>
                                                        {tt.tierType === 'vip' ? (
                                                            <Chip icon={<Crown size={12} />} label="Hạng VIP" size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                                        ) : (
                                                            <Chip icon={<Ticket size={12} />} label="Tiêu Chuẩn" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                                        )}
                                                    </Stack>
                                                    {Array.isArray(tt.seatAllocations) && tt.seatAllocations.length > 0 ? (
                                                        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                            {tt.seatAllocations.map((al, aIdx) => (
                                                                <Typography key={aIdx} variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Armchair size={12} /> {al.zone} • {al.row} (Ghế {al.seatStart} - {al.seatEnd}: {Math.max(0, (Number(al.seatEnd) || 0) - (Number(al.seatStart) || 1) + 1)} vé)
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                            <Armchair size={13} /> {tt.seatZone} • {tt.seatRow} (Ghế {tt.seatStart} - {tt.seatEnd})
                                                        </Typography>
                                                    )}
                                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                        <DoorOpen size={13} /> {tt.entryGate}
                                                    </Typography>
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
                                    startIcon={<ArrowLeft size={16} />}
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
                                            startIcon={<Save size={16} />}
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
                                            endIcon={<ArrowRight size={16} />}
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
                                            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Send size={18} />}
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
                                <X size={20} />
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
                                                <Clock size={16} color={theme.palette.primary.main} />
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
                                                <MapPin size={16} color={theme.palette.primary.main} />
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
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight={700}>Các hạng vé phát hành:</Typography>
                                    {selectedDetailEvent.ticketsSold === 0 && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<Edit3 size={14} />}
                                            onClick={() => {
                                                setOpenDetailModal(false);
                                                handleOpenEdit(selectedDetailEvent);
                                            }}
                                            sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                                        >
                                            Chỉnh sửa hạng vé
                                        </Button>
                                    )}
                                </Stack>
                                <Stack spacing={1.5} mb={3}>
                                    {selectedDetailEvent.ticketTypes.map((tt) => {
                                        const sold = tt.currentSupply || tt.mintedAmount || 0;
                                        const max = tt.maxSupply || 0;
                                        const percent = max > 0 ? ((sold / max) * 100).toFixed(0) : 0;
                                        return (
                                            <Paper key={tt.id} elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Box>
                                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                                                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">{tt.name}</Typography>
                                                            {tt.tierType === 'vip' ? (
                                                                <Chip icon={<Crown size={12} />} label="VIP" size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                                            ) : (
                                                                <Chip icon={<Ticket size={12} />} label="Tiêu Chuẩn" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                                            )}
                                                            {sold === 0 ? (
                                                                <Chip size="small" color="success" variant="outlined" label="Chưa có người mua • Được phép sửa" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                                            ) : (
                                                                <Chip size="small" icon={<Lock size={11} />} color="default" label={`Đã bán ${sold} vé`} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                                                            )}
                                                        </Stack>
                                                        {Array.isArray(tt.seatConfig) && tt.seatConfig.length > 0 ? (
                                                            <Box sx={{ mt: 0.25, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                                {tt.seatConfig.map((al, aIdx) => (
                                                                    <Typography key={aIdx} variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                                                        <Armchair size={12} /> {al.zone} • {al.row} (Ghế {al.seatStart} - {al.seatEnd})
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        ) : tt.seatZone ? (
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mt: 0.25 }}>
                                                                <Armchair size={12} /> {tt.seatZone} • {tt.seatRow} (Ghế {tt.seatStart} - {tt.seatEnd})
                                                            </Typography>
                                                        ) : null}
                                                        {tt.description && (
                                                            <Typography variant="caption" color="text.secondary" display="block">{tt.description}</Typography>
                                                        )}
                                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                                                            <DoorOpen size={13} /> Cổng check-in: {tt.entryGate || 'Cổng A - Khán Đài Phổ Thông Tầng 1'}
                                                        </Typography>
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
                                            startIcon={<Send size={16} />}
                                            onClick={() => handleQuickSubmitReview(selectedDetailEvent.id)}
                                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                                        >
                                            Gửi Duyệt Ngay
                                        </Button>
                                    )}
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<Edit3 size={16} />}
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
                                            startIcon={<Trash2 size={16} />}
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
                                            color={selectedDetailEvent.ticketsSold > 0 ? "inherit" : "warning"}
                                            startIcon={<Ban size={16} />}
                                            onClick={() => {
                                                handleOpenCancel(selectedDetailEvent);
                                            }}
                                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                                        >
                                            {selectedDetailEvent.ticketsSold > 0 ? "Hủy Sự Kiện (Đã Bán Vé)" : "Hủy Sự Kiện"}
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
                                <X size={20} />
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

                            {/* Cho phép sửa thời gian và dời lịch sự kiện */}
                            {editingEvent && ['draft', 'rejected', 'pending', 'approved', 'published'].includes(editingEvent.status) && (
                                <>
                                    {['approved', 'published'].includes(editingEvent.status) && (
                                        <Grid item xs={12}>
                                            <Alert severity="info" sx={{ borderRadius: '8px', py: 0.5, fontSize: '0.82rem' }}>
                                                💡 <strong>Cập nhật lịch trình:</strong> Sự kiện đã được duyệt/mở bán. Bạn có thể thay đổi thời gian dời lịch hoặc đổi địa điểm. Thời gian bắt đầu mới bắt buộc phải ở tương lai.
                                            </Alert>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Thời gian sự kiện bắt đầu *"
                                            value={editFormData.startTime || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Thời gian sự kiện kết thúc *"
                                            value={editFormData.endTime || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Bắt đầu mở bán vé *"
                                            value={editFormData.saleStartTime || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, saleStartTime: e.target.value })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="datetime-local"
                                            label="Kết thúc bán vé *"
                                            value={editFormData.saleEndTime || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, saleEndTime: e.target.value })}
                                            helperText="Phải trước hoặc bằng thời gian sự kiện bắt đầu"
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

                        {/* PHẦN 2 TRONG MODAL SỬA: QUẢN LÝ CÁC HẠNG VÉ */}
                        <Box mt={3}>
                            <Divider sx={{ mb: 2.5 }} />
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Ticket size={18} color={theme.palette.primary.main} /> Cấu Hình Các Hạng Vé Phát Hành ({(editFormData.ticketTypes || []).length} hạng vé)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Đối với các hạng vé <strong>chưa có người mua</strong>, người tổ chức được toàn quyền chỉnh sửa giá vé, tên, vị trí chỗ ngồi hoặc cổng soát vé.
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<Plus size={14} />}
                                    onClick={handleAddTierInEdit}
                                    sx={{ borderRadius: '6px', fontWeight: 700 }}
                                >
                                    + Thêm Hạng Vé
                                </Button>
                            </Stack>

                            <Stack spacing={2}>
                                {(editFormData.ticketTypes || []).map((tier, index) => {
                                    const isLocked = Number(tier.currentSupply) > 0;

                                    return (
                                        <Paper
                                            key={tier.id || index}
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: '10px',
                                                border: 1,
                                                borderColor: isLocked ? 'divider' : tier.tierType === 'vip' ? 'warning.main' : 'divider',
                                                bgcolor: isLocked ? 'action.hover' : 'background.subtle',
                                            }}
                                        >
                                            {/* Header hạng vé: Trạng thái bán & Loại vé */}
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    {isLocked ? (
                                                        <Chip
                                                            size="small"
                                                            icon={<Lock size={12} />}
                                                            label={`Đã bán ${tier.currentSupply} vé (Đã khóa chỉnh sửa)`}
                                                            color="default"
                                                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            size="small"
                                                            icon={<CheckCircle2 size={12} />}
                                                            label="Chưa có người mua • Được phép chỉnh sửa"
                                                            color="success"
                                                            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                                        />
                                                    )}
                                                    <ToggleButtonGroup
                                                        value={tier.tierType || 'standard'}
                                                        exclusive
                                                        size="small"
                                                        disabled={isLocked}
                                                        onChange={(_, newType) => {
                                                            if (newType) handleEditTierChange(index, 'tierType', newType);
                                                        }}
                                                    >
                                                        <ToggleButton value="vip" sx={{ px: 1.5, py: 0.25, fontWeight: 700, fontSize: '0.72rem' }}>
                                                            <Crown size={13} style={{ marginRight: 4, color: '#F59E0B' }} /> VIP
                                                        </ToggleButton>
                                                        <ToggleButton value="standard" sx={{ px: 1.5, py: 0.25, fontWeight: 700, fontSize: '0.72rem' }}>
                                                            <Ticket size={13} style={{ marginRight: 4 }} /> Tiêu Chuẩn
                                                        </ToggleButton>
                                                    </ToggleButtonGroup>
                                                </Stack>

                                                {!isLocked && (editFormData.ticketTypes || []).length > 1 && (
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleRemoveTierInEdit(index)}
                                                        title="Xóa hạng vé này"
                                                    >
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                )}
                                            </Stack>

                                            <Grid container spacing={1.5}>
                                                {/* Tên hạng vé */}
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Tên hạng vé *"
                                                        value={tier.name || ''}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleEditTierChange(index, 'name', e.target.value)}
                                                    />
                                                </Grid>

                                                {/* Giá vé gốc */}
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        type="number"
                                                        label="Giá vé gốc (ETH) *"
                                                        value={tier.originalPrice || ''}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleEditTierChange(index, 'originalPrice', e.target.value)}
                                                        InputProps={{ endAdornment: <InputAdornment position="end">ETH</InputAdornment> }}
                                                    />
                                                </Grid>

                                                {/* Cổng check-in */}
                                                <Grid item xs={12} sm={4}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id={`edit-gate-${index}`}>Cổng check-in</InputLabel>
                                                        <Select
                                                            labelId={`edit-gate-${index}`}
                                                            label="Cổng check-in"
                                                            value={tier.entryGate || (editFormData.checkInGates || DEFAULT_EVENT_GATES)[0]}
                                                            disabled={isLocked}
                                                            onChange={(e) => handleEditTierChange(index, 'entryGate', e.target.value)}
                                                        >
                                                            {(editFormData.checkInGates || DEFAULT_EVENT_GATES).map((gate) => (
                                                                <MenuItem key={gate} value={gate}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                        <DoorOpen size={13} /> {gate}
                                                                    </Box>
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                {/* Khối phân bổ chỗ ngồi & Dải ghế phát hành */}
                                                <Grid item xs={12}>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: '8px',
                                                            bgcolor: isLocked ? 'action.hover' : 'background.paper',
                                                            border: 1,
                                                            borderColor: 'divider',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                                            <Box>
                                                                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Armchair size={13} /> PHÂN BỔ CHỖ NGỒI & DẢI GHẾ PHÁT HÀNH
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {isLocked ? 'Vé đã có người mua nên các vị trí ghế đã được cố định' : 'Hạng vé có thể gán nhiều khán đài & dãy ghế khác nhau'}
                                                                </Typography>
                                                            </Box>
                                                            {!isLocked && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<Plus size={13} />}
                                                                    onClick={() => handleAddAllocationInEdit(index)}
                                                                    sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '0.72rem', py: 0.2 }}
                                                                >
                                                                    + Thêm Khu Vực / Dãy Ghế
                                                                </Button>
                                                            )}
                                                        </Box>

                                                        <Stack spacing={1.25}>
                                                            {ensureAllocations(tier, (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0]).map((alloc, allocIdx, allAllocations) => {
                                                                const currentStand = (editFormData.seatingMap || DEFAULT_SEATING_MAP).find((s) => s.name === alloc.zone) || (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0];
                                                                const availableRows = currentStand?.rows || [];
                                                                const currentRow = availableRows.find((r) => r.name === alloc.row) || availableRows[0];
                                                                const maxRowSeats = currentRow?.seatCount || currentStand?.seatsPerRow || 20;

                                                                return (
                                                                    <Paper
                                                                        key={alloc.id || allocIdx}
                                                                        variant="outlined"
                                                                        sx={{
                                                                            p: 1.25,
                                                                            borderRadius: '6px',
                                                                            bgcolor: isLocked ? 'action.hover' : 'background.subtle',
                                                                        }}
                                                                    >
                                                                        <Grid container spacing={1} alignItems="center">
                                                                            <Grid item xs={12} sm="auto">
                                                                                <Chip
                                                                                    label={`#${allocIdx + 1}`}
                                                                                    size="small"
                                                                                    color={tier.tierType === 'vip' ? 'warning' : 'default'}
                                                                                    sx={{ fontWeight: 700, minWidth: 28, height: 22, fontSize: '0.68rem' }}
                                                                                />
                                                                            </Grid>

                                                                            {/* Khán đài */}
                                                                            <Grid item xs={12} sm={3}>
                                                                                <FormControl fullWidth size="small">
                                                                                    <InputLabel id={`edit-stand-${index}-${allocIdx}`}>Khán đài</InputLabel>
                                                                                    <Select
                                                                                        labelId={`edit-stand-${index}-${allocIdx}`}
                                                                                        label="Khán đài"
                                                                                        value={alloc.zone || (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0]?.name}
                                                                                        disabled={isLocked}
                                                                                        onChange={(e) => handleAllocationChangeInEdit(index, allocIdx, 'zone', e.target.value)}
                                                                                    >
                                                                                        {(editFormData.seatingMap || DEFAULT_SEATING_MAP).map((s) => (
                                                                                            <MenuItem key={s.id || s.name} value={s.name}>
                                                                                                {s.name}
                                                                                            </MenuItem>
                                                                                        ))}
                                                                                    </Select>
                                                                                </FormControl>
                                                                            </Grid>

                                                                            {/* Dãy ghế */}
                                                                            <Grid item xs={12} sm={3}>
                                                                                <FormControl fullWidth size="small">
                                                                                    <InputLabel id={`edit-row-${index}-${allocIdx}`}>Dãy ghế</InputLabel>
                                                                                    <Select
                                                                                        labelId={`edit-row-${index}-${allocIdx}`}
                                                                                        label="Dãy ghế"
                                                                                        value={alloc.row || availableRows[0]?.name || ''}
                                                                                        disabled={isLocked}
                                                                                        onChange={(e) => handleAllocationChangeInEdit(index, allocIdx, 'row', e.target.value)}
                                                                                    >
                                                                                        {availableRows.map((r) => (
                                                                                            <MenuItem key={r.id || r.name} value={r.name}>
                                                                                                {r.name} (tối đa {r.seatCount} ghế)
                                                                                            </MenuItem>
                                                                                        ))}
                                                                                    </Select>
                                                                                </FormControl>
                                                                            </Grid>

                                                                            {/* Từ ghế -> Đến ghế */}
                                                                            <Grid item xs={5} sm={2}>
                                                                                <TextField
                                                                                    fullWidth
                                                                                    size="small"
                                                                                    type="number"
                                                                                    label="Từ ghế"
                                                                                    value={alloc.seatStart === '' ? '' : (alloc.seatStart ?? 1)}
                                                                                    disabled={isLocked}
                                                                                    onChange={(e) => handleAllocationChangeInEdit(index, allocIdx, 'seatStart', e.target.value)}
                                                                                    inputProps={{ min: 1, max: maxRowSeats }}
                                                                                />
                                                                            </Grid>
                                                                            <Grid item xs={5} sm={2}>
                                                                                <TextField
                                                                                    fullWidth
                                                                                    size="small"
                                                                                    type="number"
                                                                                    label="Đến ghế"
                                                                                    value={alloc.seatEnd === '' ? '' : (alloc.seatEnd ?? maxRowSeats)}
                                                                                    disabled={isLocked}
                                                                                    onChange={(e) => handleAllocationChangeInEdit(index, allocIdx, 'seatEnd', e.target.value)}
                                                                                    error={Number(alloc.seatEnd) > maxRowSeats || Number(alloc.seatStart) > Number(alloc.seatEnd)}
                                                                                    helperText={
                                                                                        Number(alloc.seatEnd) > maxRowSeats
                                                                                            ? `Tối đa ${maxRowSeats} ghế`
                                                                                            : (Number(alloc.seatStart) > Number(alloc.seatEnd) ? 'Phải >= Từ ghế' : `Tối đa ${maxRowSeats}`)
                                                                                    }
                                                                                    inputProps={{ min: 1, max: maxRowSeats }}
                                                                                />
                                                                            </Grid>

                                                                            {/* Nút xóa phân bổ */}
                                                                            {!isLocked && (
                                                                                <Grid item xs={2} sm="auto" sx={{ textAlign: 'center' }}>
                                                                                    <Tooltip title={allAllocations.length > 1 ? "Xóa khu vực/dãy này" : "Phải có ít nhất 1 phân bổ"}>
                                                                                        <span>
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                color="error"
                                                                                                disabled={allAllocations.length <= 1}
                                                                                                onClick={() => handleRemoveAllocationInEdit(index, allocIdx)}
                                                                                            >
                                                                                                <Trash2 size={15} />
                                                                                            </IconButton>
                                                                                        </span>
                                                                                    </Tooltip>
                                                                                </Grid>
                                                                            )}
                                                                        </Grid>
                                                                    </Paper>
                                                                );
                                                            })}
                                                        </Stack>

                                                        {/* Tổng kết số lượng vé */}
                                                        <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Gồm <strong>{ensureAllocations(tier, (editFormData.seatingMap || DEFAULT_SEATING_MAP)[0]).length}</strong> khu vực phân bổ ghế
                                                            </Typography>
                                                            <Chip
                                                                color="primary"
                                                                variant="filled"
                                                                size="small"
                                                                label={`Tổng vé phát hành: ${tier.maxSupply || 0} vé`}
                                                                sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                                                            />
                                                        </Box>
                                                    </Paper>
                                                </Grid>

                                                {/* Mô tả quyền lợi */}
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        label="Mô tả quyền lợi hạng vé"
                                                        value={tier.description || ''}
                                                        disabled={isLocked}
                                                        onChange={(e) => handleEditTierChange(index, 'description', e.target.value)}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button color="inherit" onClick={() => setOpenEditModal(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
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
                    maxWidth={cancellingEvent?.ticketsSold > 0 ? "sm" : "xs"}
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            p: { xs: 1.5, sm: 2 },
                            border: 1,
                            borderColor: 'divider',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        },
                    }}
                >
                    {cancellingEvent?.ticketsSold > 0 ? (
                        <>
                            <DialogTitle sx={{ pb: 1, pt: 1 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: '10px',
                                                bgcolor: 'rgba(239, 68, 68, 0.12)',
                                                color: '#EF4444',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Ban size={22} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h3" fontWeight={700} color="text.primary">
                                                Không thể hủy sự kiện
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Chính sách bảo vệ quyền lợi người mua vé
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <IconButton size="small" onClick={() => setOpenCancelDialog(false)} sx={{ color: 'text.secondary' }}>
                                        <X size={18} />
                                    </IconButton>
                                </Stack>
                            </DialogTitle>

                            <DialogContent sx={{ py: 2 }}>
                                {/* Thẻ thông tin sự kiện */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        mb: 2.5,
                                        borderRadius: '12px',
                                        bgcolor: 'background.subtle',
                                        border: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" gutterBottom>
                                        {cancellingEvent?.title}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                        <Chip
                                            label={`${cancellingEvent?.ticketsSold} vé NFT đã bán`}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '0.72rem',
                                                bgcolor: 'rgba(59, 130, 246, 0.12)',
                                                color: 'primary.main',
                                                borderRadius: '6px',
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            Doanh thu: <strong>{cancellingEvent?.totalRevenueEth} ETH</strong>
                                        </Typography>
                                    </Stack>
                                </Paper>

                                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                                    Sự kiện này đã phát sinh giao dịch mua vé của khán giả và các token vé NFT đã được phát hành bất biến trên Blockchain.
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                    Để bảo vệ quyền lợi và tài sản của người mua vé, hệ thống <strong>không cho phép hủy sự kiện</strong>. Nếu cần thay đổi lịch trình tổ chức, bạn có thể sử dụng chức năng chỉnh sửa để cập nhật thời gian dời lịch hoặc địa điểm mới.
                                </Typography>
                            </DialogContent>

                            <DialogActions sx={{ px: 3, pb: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                                <Button
                                    variant="contained"
                                    color="inherit"
                                    onClick={() => setOpenCancelDialog(false)}
                                    sx={{
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        px: 4,
                                        bgcolor: 'action.selected',
                                        '&:hover': { bgcolor: 'action.hover' },
                                        ml: 'auto',
                                    }}
                                >
                                    Đóng
                                </Button>
                            </DialogActions>
                        </>
                    ) : (
                        <>
                            <DialogTitle sx={{ pb: 1, pt: 1 }}>
                                <Typography variant="h3" fontWeight={700} color="warning.main">
                                    Xác Nhận Hủy Sự Kiện
                                </Typography>
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText sx={{ mb: 2, color: 'text.secondary' }}>
                                    Bạn có chắc chắn muốn hủy sự kiện <strong>"{cancellingEvent?.title}"</strong>?
                                    Sự kiện chưa bán vé nào nên có thể hủy an toàn.
                                </DialogContentText>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Lý do hủy sự kiện (tùy chọn)"
                                    placeholder="Ví dụ: Thay đổi kế hoạch..."
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
                        </>
                    )}
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
                            <CheckCircle2 size={40} />
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

                {/* DIALOG THÊM CỔNG CHECK-IN MỚI */}
                <Dialog
                    open={openAddGateDialog}
                    onClose={() => setOpenAddGateDialog(false)}
                    maxWidth="xs"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
                >
                    <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                        Thêm Cổng Check-In Mới
                    </DialogTitle>
                    <DialogContent sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Nhập tên cổng vào hoặc lối kiểm soát vé (ví dụ: <em>Cổng VIP 2 - Sảnh Đông</em>, <em>Cổng Khán Đài A</em>...).
                        </Typography>
                        <TextField
                            autoFocus
                            fullWidth
                            size="small"
                            label="Tên cổng kiểm soát *"
                            placeholder="Ví dụ: Cổng C - Sảnh Khách Mời"
                            value={newGateName}
                            onChange={(e) => setNewGateName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddGate();
                                }
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => {
                                setNewGateName('');
                                setOpenAddGateDialog(false);
                            }}
                            sx={{ borderRadius: '8px' }}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleAddGate}
                            sx={{ borderRadius: '8px', fontWeight: 700 }}
                        >
                            Xác Nhận Thêm
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* SNACKBAR THÔNG BÁO TOAST */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={2000}
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    sx={{ zIndex: 99999 }}
                >
                    <Alert
                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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
                            '& .MuiAlert-icon': {
                                fontSize: '1.4rem',
                                color: '#ffffff',
                            },
                        }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </DashboardLayout>
    );
};

export default CreateEventPage;
