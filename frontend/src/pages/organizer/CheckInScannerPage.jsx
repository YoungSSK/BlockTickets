import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    Tabs,
    Tab,
    CircularProgress,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Badge,
    useTheme,
} from '@mui/material';
import {
    Circle,
    Volume2,
    VolumeX,
    History,
    Keyboard,
    Camera,
    SwitchCamera,
    Play,
    Square,
    QrCode,
    Hourglass,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    XCircle,
    CheckCheck,
    X,
    Ticket,
    Search,
    Hash,
    Sparkles,
    RefreshCw,
    ArrowRight,
    DoorOpen,
    Armchair,
} from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { checkInAPI, organizerAPI } from '../../services/api';

// Helper phát âm thanh phản hồi Web Audio API
const playFeedbackSound = (type = 'success') => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
            // Âm bíp đôi cao báo hiệu vé hợp lệ
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.28);
        } else {
            // Âm buzzer trầm báo hiệu vé lỗi/đã dùng
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
        }
    } catch {
        // Bỏ qua nếu trình duyệt chặn âm thanh tự động
    }
};

const GATES_LIST = [
    'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
    'Cổng A - Khán Đài Phổ Thông Tầng 1',
    'Cổng B - Khán Đài Tầng 2 & Ban Công',
    'Cổng Kỹ Thuật & Khách Mời VIP',
];

const CheckInScannerPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Phương thức soát vé: 'token' (Nhập thủ công Token ID) hoặc 'qr' (Quét mã QR qua Camera)
    const [checkInMode, setCheckInMode] = useState('token');

    // Danh sách sự kiện & Cấu hình soát vé
    const [eventsList, setEventsList] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedGate, setSelectedGate] = useState(GATES_LIST[0]);

    // Trạng thái Camera Scanner
    const [isScannerRunning, setIsScannerRunning] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const scannerRef = useRef(null);
    const isVerifyingRef = useRef(false);
    const lastQrScanRef = useRef({ text: '', time: 0 });
    const processTicketCheckInRef = useRef(null);

    // Trạng thái nhập Token ID thủ công & Dữ liệu cổng soát vé
    const [manualTokenInput, setManualTokenInput] = useState('');
    const [sampleTickets, setSampleTickets] = useState([]);
    const [serverGates, setServerGates] = useState([]);

    // Trạng thái kết quả soát vé
    // status: null | 'success' | 'already_used' | 'wrong_event' | 'invalid_ticket' | 'expired_hmac'
    const [scanResult, setScanResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Ngăn kéo lịch sử soát vé (Recent Activity Log)
    const [openHistoryDrawer, setOpenHistoryDrawer] = useState(false);
    const [checkInLogs, setCheckInLogs] = useState([]);

    // Thống kê ca trực
    const [shiftStats, setShiftStats] = useState({
        totalScanned: 0,
        successCount: 0,
        rejectedCount: 0,
    });

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Tải danh sách sự kiện của riêng Ban Tổ Chức đang đăng nhập
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await organizerAPI.getMyEvents({ page: 1, limit: 100 });
                const rawEvents = res.data?.data?.events || [];
                if (Array.isArray(rawEvents) && rawEvents.length > 0) {
                    const myEvents = rawEvents.map((e) => ({
                        id: e.id,
                        title: e.title,
                        venue: e.venueName || e.venueCity || 'Địa điểm tổ chức',
                        date: e.startTime ? new Date(e.startTime).toLocaleDateString('vi-VN') : '',
                        status: e.status,
                        ticketTypes: e.ticketTypes || [],
                        totalTickets: e.ticketTypes?.reduce((s, tt) => s + (Number(tt.maxSupply) || 0), 0) || 0,
                        checkedInCount: 0,
                    }));
                    setEventsList(myEvents);
                    // Mặc định ưu tiên chọn sự kiện đang mở bán hoặc đã duyệt
                    const activeEvent = myEvents.find((evt) => ['published', 'approved'].includes(evt.status)) || myEvents[0];
                    setSelectedEventId(activeEvent.id);
                } else {
                    setEventsList([]);
                    setSelectedEventId('');
                }
            } catch (err) {
                console.warn('Lỗi khi tải danh sách sự kiện của ban tổ chức cho máy quét:', err);
                setEventsList([]);
                setSelectedEventId('');
            }
        };
        fetchEvents();
    }, []);

    // Tải số liệu thống kê check-in & danh sách vé mẫu theo sự kiện đang chọn
    useEffect(() => {
        setServerGates([]);
        setSampleTickets([]);
        const fetchCheckInStats = async () => {
            try {
                const res = await checkInAPI.getStats(selectedEventId);
                if (res.data?.data) {
                    const s = res.data.data;
                    setShiftStats((prev) => ({
                        ...prev,
                        totalScanned: (s.checkedInCount || s.usedCount || 0) + prev.rejectedCount,
                        successCount: s.checkedInCount || s.usedCount || 0,
                    }));
                    if (Array.isArray(s.sampleTickets)) {
                        setSampleTickets(s.sampleTickets);
                    }
                    if (Array.isArray(s.availableGates)) {
                        setServerGates(s.availableGates);
                    }
                }
            } catch {
                // ignore
            }
        };
        if (selectedEventId) fetchCheckInStats();
    }, [selectedEventId]);

    const currentEvent = eventsList.find((e) => e.id === selectedEventId) || eventsList[0] || null;

    // Danh sách cổng check-in lấy động từ: cấu hình hạng vé, vé đã bán, và API server
    const availableGates = useMemo(() => {
        const set = new Set();
        // 1. Lấy từ cấu hình các hạng vé của sự kiện
        if (currentEvent?.ticketTypes?.length) {
            currentEvent.ticketTypes.forEach((tt) => {
                if (tt.entryGate?.trim()) set.add(tt.entryGate.trim());
            });
        }
        // 2. Lấy từ danh sách các vé đã phát hành của sự kiện
        if (sampleTickets?.length) {
            sampleTickets.forEach((t) => {
                if (t.entryGate?.trim()) set.add(t.entryGate.trim());
            });
        }
        // 3. Lấy từ backend API getCheckInStats
        if (serverGates?.length) {
            serverGates.forEach((g) => {
                if (g?.trim()) set.add(g.trim());
            });
        }
        const extracted = Array.from(set).filter(Boolean);
        return extracted.length > 0 ? extracted : GATES_LIST;
    }, [currentEvent, sampleTickets, serverGates]);

    // Đồng bộ cổng kiểm soát đang chọn khi đổi sự kiện hoặc khi danh sách cổng thay đổi
    useEffect(() => {
        if (availableGates.length > 0 && !availableGates.includes(selectedGate)) {
            setSelectedGate(availableGates[0]);
        }
    }, [availableGates, selectedGate]);

    // Xử lý xác thực và soát vé (hỗ trợ cả Quét QR và Nhập Token ID)
    const processTicketCheckIn = async ({ qrData, tokenId } = {}) => {
        if (isVerifyingRef.current) return;

        // Chống quét trùng cùng một mã QR liên tục từ camera (12fps) trong vòng 3 giây
        if (qrData !== undefined && qrData !== null && (tokenId === undefined || tokenId === null)) {
            const qrStr = typeof qrData === 'string' ? qrData.trim() : JSON.stringify(qrData);
            const now = Date.now();
            if (lastQrScanRef.current.text === qrStr && now - lastQrScanRef.current.time < 3000) {
                return;
            }
            lastQrScanRef.current = { text: qrStr, time: now };
        }

        isVerifyingRef.current = true;
        setIsVerifying(true);

        try {
            const payload = {
                eventId: selectedEventId,
                gate: selectedGate,
            };

            if (tokenId !== undefined && tokenId !== null && String(tokenId).trim() !== '') {
                payload.tokenId = String(tokenId).trim();
            } else if (qrData !== undefined && qrData !== null) {
                payload.qrData = qrData;
            } else {
                showSnackbar('Vui lòng nhập Token ID hoặc quét mã QR hợp lệ.', 'warning');
                return;
            }

            // 1. Gọi API Kiểm tra tính hợp lệ của vé và đối soát cổng
            const res = await checkInAPI.verifyTicket(payload);
            const data = res.data?.data;

            if (data) {
                if (data.valid) {
                    // Vé hợp lệ trên database -> Ghi nhận check-in kèm Cổng
                    const confirmRes = await checkInAPI.confirmCheckIn({
                        ticketId: data.ticket?.id,
                        tokenId: data.ticket?.tokenId,
                        eventId: selectedEventId,
                        gate: selectedGate,
                        staffNote: `Soát tại ${selectedGate} bởi ${user?.fullName || user?.name || 'Nhân viên cổng'} (${checkInMode === 'token' ? 'Nhập Thủ Công' : 'Quét QR'})`,
                    });

                    if (soundEnabled) playFeedbackSound(data.gateMismatch ? 'warning' : 'success');
                    const confirmedTicket = confirmRes.data?.data?.ticket || data.ticket;

                    setScanResult({
                        status: data.gateMismatch ? 'wrong_gate_warning' : 'success',
                        gateMismatch: Boolean(data.gateMismatch),
                        assignedGate: data.assignedGate || confirmedTicket?.entryGate,
                        scannedGate: selectedGate,
                        title: data.gateMismatch ? '⚠️ CẢNH BÁO: KHÁCH ĐI NHẦM CỔNG' : 'VÉ HỢP LỆ • MỜI VÀO CỔNG',
                        message: data.message || 'Thông tin hợp lệ, vé NFT đã được ghi nhận check-in thành công.',
                        ticket: {
                            tokenId: confirmedTicket?.tokenId || confirmedTicket?.id,
                            seatNumber: confirmedTicket?.seatNumber || data.seatNumber || 'Ghế Tự Do',
                            entryGate: confirmedTicket?.entryGate || data.assignedGate || 'Cổng A',
                            attendeeName: confirmedTicket?.attendeeName || confirmedTicket?.owner?.fullName || 'Khách tham dự',
                            walletAddress: confirmedTicket?.owner?.walletAddress || confirmedTicket?.ownerAddress || confirmedTicket?.ownerWallet,
                            tierName: data.ticketType?.name || confirmedTicket?.ticketType?.name || 'Standard Pass',
                            gateAllowed: selectedGate,
                        },
                        tokenId: confirmedTicket?.tokenId || confirmedTicket?.id,
                        method: checkInMode === 'token' ? 'Nhập Thủ Công' : 'Quét Mã QR',
                        time: new Date().toLocaleTimeString('vi-VN'),
                    });

                    setShiftStats((prev) => ({
                        ...prev,
                        totalScanned: prev.totalScanned + 1,
                        successCount: prev.successCount + 1,
                    }));

                    addCheckInLog({
                        tokenId: confirmedTicket?.tokenId || confirmedTicket?.id,
                        seatNumber: confirmedTicket?.seatNumber || data.seatNumber || 'Ghế Tự Do',
                        attendeeName: confirmedTicket?.attendeeName || confirmedTicket?.owner?.fullName || 'Khách tham dự',
                        tierName: data.ticketType?.name || confirmedTicket?.ticketType?.name || 'Standard Pass',
                        gate: selectedGate,
                    }, data.gateMismatch ? 'warning' : 'success', data.gateMismatch ? 'SAI CỔNG' : 'HỢP LỆ');

                    // Cập nhật trạng thái vé trong danh sách gợi ý nếu có
                    setSampleTickets((prev) =>
                        prev.map((item) =>
                            item.tokenId === (confirmedTicket?.tokenId || confirmedTicket?.id)
                                ? { ...item, isUsed: true }
                                : item
                        )
                    );

                    setManualTokenInput('');
                    return;
                } else {
                    // Backend trả về vé không hợp lệ (hết hạn HMAC, đã dùng, sai sự kiện,...)
                    if (soundEnabled) playFeedbackSound('error');

                    const statusMap = {
                        expired: { status: 'expired_hmac', title: 'MÃ QR ĐÃ HẾT HẠN (HMAC > 60s)' },
                        already_used: { status: 'already_used', title: 'VÉ ĐÃ ĐƯỢC CHECK-IN!' },
                        wrong_event: { status: 'wrong_event', title: 'SAI SỰ KIỆN TỔ CHỨC' },
                        invalid_ticket: { status: 'invalid_ticket', title: 'VÉ KHÔNG TỒN TẠI' },
                    };

                    const matched = statusMap[data.status] || {
                        status: 'invalid_ticket',
                        title: 'VÉ KHÔNG HỢP LỆ',
                    };

                    setScanResult({
                        status: matched.status,
                        title: matched.title,
                        message: data.message || 'Mã vé không hợp lệ.',
                        ticket: data.ticket,
                        tokenId: data.ticket?.tokenId || data.ticket?.id || payload.tokenId || 'N/A',
                        method: checkInMode === 'token' ? 'Nhập Thủ Công' : 'Quét Mã QR',
                        time: new Date().toLocaleTimeString('vi-VN'),
                    });

                    setShiftStats((prev) => ({
                        ...prev,
                        totalScanned: prev.totalScanned + 1,
                        rejectedCount: prev.rejectedCount + 1,
                    }));

                    if (data.ticket) {
                        addCheckInLog({
                            tokenId: data.ticket?.tokenId || data.ticket?.id,
                            seatNumber: data.ticket?.seatNumber || 'N/A',
                            attendeeName: data.ticket?.attendeeName || data.ticket?.owner?.fullName || 'Khách tham dự',
                            tierName: data.ticket?.ticketType?.name || 'Standard Pass',
                            gate: selectedGate,
                        }, matched.status, matched.title);
                    }

                    return;
                }
            }
        } catch (apiError) {
            console.warn('Lỗi khi gọi API Check-in:', apiError);
            if (soundEnabled) playFeedbackSound('error');
            const errMsg = apiError.response?.data?.message || apiError.message || 'Không thể xác thực vé với máy chủ.';
            setScanResult({
                status: 'invalid_ticket',
                title: 'LỖI XÁC THỰC VÉ',
                message: errMsg,
                tokenId: 'N/A',
                time: new Date().toLocaleTimeString('vi-VN'),
            });
            setShiftStats((prev) => ({
                ...prev,
                totalScanned: prev.totalScanned + 1,
                rejectedCount: prev.rejectedCount + 1,
            }));
        } finally {
            isVerifyingRef.current = false;
            setIsVerifying(false);
        }
    };

    // Luôn giữ tham chiếu hàm mới nhất để callback Camera QR không bị stale closure
    processTicketCheckInRef.current = processTicketCheckIn;

    const addCheckInLog = (ticket, status, statusText) => {
        const newLog = {
            id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
            tokenId: ticket.tokenId,
            seatNumber: ticket.seatNumber || 'Ghế Tự Do',
            attendeeName: ticket.attendeeName,
            tierName: ticket.tierName,
            status,
            statusText,
            gate: ticket.gate || selectedGate,
            time: new Date().toLocaleTimeString('vi-VN'),
        };
        setCheckInLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    };

    // Khởi chạy / Tắt camera bằng Html5Qrcode khi ở chế độ Quét QR
    useEffect(() => {
        let html5QrCodeInstance = null;

        if (checkInMode === 'qr' && isScannerRunning) {
            html5QrCodeInstance = new Html5Qrcode('qr-reader-viewport');
            scannerRef.current = html5QrCodeInstance;

            const config = {
                fps: 12,
                qrbox: { width: 260, height: 260 },
                aspectRatio: 1.0,
            };

            html5QrCodeInstance
                .start(
                    { facingMode },
                    config,
                    (decodedText) => {
                        processTicketCheckInRef.current?.({ qrData: decodedText });
                    },
                    () => {
                        // Lỗi quét từng frame bỏ qua để tránh spam console
                    }
                )
                .catch((err) => {
                    setCameraError('Không thể mở Camera thiết bị: ' + (err.message || 'Quyền truy cập bị từ chối'));
                    setIsScannerRunning(false);
                });
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current
                    .stop()
                    .then(() => scannerRef.current.clear())
                    .catch(() => {});
            }
        };
    }, [checkInMode, isScannerRunning, facingMode]);

    // Xử lý đổi camera trước / sau
    const handleToggleFacingMode = () => {
        if (isScannerRunning) {
            setIsScannerRunning(false);
            setTimeout(() => {
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                setIsScannerRunning(true);
            }, 300);
        } else {
            setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
        }
    };

    // Xử lý khi nhấn Submit form nhập Token ID thủ công
    const handleManualTokenSubmit = (e) => {
        if (e) e.preventDefault();
        if (!manualTokenInput.trim()) {
            showSnackbar('Vui lòng nhập mã Token ID vé NFT.', 'warning');
            return;
        }
        processTicketCheckIn({ tokenId: manualTokenInput.trim() });
    };

    // Chọn nhanh Token ID từ danh sách mẫu
    const handleSelectSampleToken = (token) => {
        setManualTokenInput(String(token.tokenId));
        processTicketCheckIn({ tokenId: token.tokenId });
    };

    return (
        <DashboardLayout
            role="organizer"
            title="Soát Vé Tại Cổng Sự Kiện"
            subtitle="Quét mã QR hoặc Nhập Token ID vé NFT để đối soát và ghi nhận check-in"
            hideHeaderActions={true}
        >
            <Box sx={{ width: '100%' }}>
                {/* THANH ĐIỀU HƯỚNG VÀ TRẠNG THÁI CA TRỰC */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                    mb={3}
                >
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <Chip
                                icon={<Circle size={8} fill="currentColor" style={{ color: checkInMode === 'qr' && isScannerRunning ? '#10B981' : '#94A3B8', marginRight: 4 }} />}
                                label={checkInMode === 'qr' ? (isScannerRunning ? 'CAMERA ĐANG BẬT' : 'CAMERA ĐANG TẮT') : 'CHẾ ĐỘ NHẬP THỦ CÔNG'}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                        </Stack>
                        <Typography variant="h2" fontWeight={800} color="text.primary">
                            Soát Vé Sự Kiện Check-in Scanner
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Tooltip title={soundEnabled ? 'Tắt âm thanh báo' : 'Bật âm thanh báo'}>
                            <IconButton
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                color={soundEnabled ? 'primary' : 'default'}
                                aria-label="Bật tắt âm thanh phản hồi"
                                sx={{ border: 1, borderColor: 'divider' }}
                            >
                                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </IconButton>
                        </Tooltip>

                        <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<History size={16} />}
                            onClick={() => setOpenHistoryDrawer(true)}
                            sx={{ borderRadius: '8px', fontWeight: 600, height: 40 }}
                        >
                            Lịch Sử Quét ({checkInLogs.length})
                        </Button>
                    </Stack>
                </Stack>

                {/* HÀNG CẤU HÌNH SỰ KIỆN, VỊ TRÍ CỔNG & BỘ CHỌN HÌNH THỨC SOÁT VÉ */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        mb: 3,
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="event-select-label">Sự kiện đang soát vé</InputLabel>
                                <Select
                                    labelId="event-select-label"
                                    value={selectedEventId}
                                    label="Sự kiện đang soát vé"
                                    onChange={(e) => {
                                        setSelectedEventId(e.target.value);
                                        setScanResult(null);
                                    }}
                                >
                                    {eventsList.length === 0 ? (
                                        <MenuItem value="" disabled>Bạn chưa có sự kiện nào</MenuItem>
                                    ) : (
                                        eventsList.map((evt) => (
                                            <MenuItem key={evt.id} value={evt.id}>
                                                <strong>{evt.title}</strong> — {evt.venue} {evt.status === 'published' ? '(Đang mở bán)' : evt.status === 'approved' ? '(Đã duyệt)' : ''}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="gate-select-label">Vị trí cổng kiểm soát</InputLabel>
                                <Select
                                    labelId="gate-select-label"
                                    value={availableGates.includes(selectedGate) ? selectedGate : (availableGates[0] || '')}
                                    label="Vị trí cổng kiểm soát"
                                    onChange={(e) => setSelectedGate(e.target.value)}
                                >
                                    {availableGates.map((gate) => (
                                        <MenuItem key={gate} value={gate}>
                                            {gate}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* VÙNG TRỌNG TÂM: CỘT TRÁI (NHẬP THỦ CÔNG HOẶC QUÉT QR) & CỘT PHẢI (KẾT QUẢ SOÁT VÉ) */}
                <Grid container spacing={3}>
                    {/* CỘT TRÁI: DUAL-MODE SCANNER (NHẬP THỦ CÔNG / QUÉT QR) */}
                    <Grid item xs={12} md={7}>
                        <Card
                            sx={{
                                borderRadius: '16px',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                overflow: 'hidden',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* THANH CHUYỂN TAB HÌNH THỨC SOÁT VÉ */}
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.subtle' }}>
                                <Tabs
                                    value={checkInMode}
                                    onChange={(_, newMode) => {
                                        setCheckInMode(newMode);
                                        if (newMode === 'token' && isScannerRunning) {
                                            setIsScannerRunning(false);
                                        }
                                    }}
                                    textColor="primary"
                                    indicatorColor="primary"
                                    sx={{
                                        px: 2,
                                        '& .MuiTab-root': {
                                            fontWeight: 700,
                                            fontSize: '0.875rem',
                                            textTransform: 'none',
                                            minHeight: 48,
                                        },
                                    }}
                                >
                                    <Tab
                                        value="token"
                                        label="Hình Thức 1: Nhập Thủ Công (Token ID)"
                                        icon={<Keyboard size={18} />}
                                        iconPosition="start"
                                    />
                                    <Tab
                                        value="qr"
                                        label="Hình Thức 2: Quét Mã QR"
                                        icon={<QrCode size={18} />}
                                        iconPosition="start"
                                    />
                                </Tabs>
                            </Box>

                            {/* =========================================================================
                                HÌNH THỨC 1: NHẬP TOKEN ID THỦ CÔNG TRỰC TIẾP
                            ========================================================================= */}
                            {checkInMode === 'token' && (
                                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                                    <Box>
                                        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                                            <Box
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '8px',
                                                    bgcolor: 'primary.main',
                                                    color: '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ticket size={20} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h3" fontWeight={700}>
                                                    Soát Vé Bằng Mã Token ID On-Chain
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Dành cho khách cung cấp mã số vé NFT hoặc khi thiết bị không quét được mã QR.
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Divider sx={{ my: 2 }} />

                                        {/* FORM NHẬP TOKEN ID */}
                                        <Box component="form" onSubmit={handleManualTokenSubmit} sx={{ mb: 3 }}>
                                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                                Mã Số Token ID (ERC-721):
                                            </Typography>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="stretch">
                                                <TextField
                                                    autoFocus
                                                    fullWidth
                                                    placeholder="Nhập Token ID (ví dụ: 1, 2, 3, 10...)"
                                                    value={manualTokenInput}
                                                    onChange={(e) => setManualTokenInput(e.target.value)}
                                                    disabled={isVerifying}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Hash size={18} style={{ opacity: 0.6 }} />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '10px',
                                                            fontFamily: 'monospace',
                                                            fontSize: '1.05rem',
                                                            fontWeight: 700,
                                                        },
                                                    }}
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    disabled={isVerifying || !manualTokenInput.trim()}
                                                    startIcon={isVerifying ? <CircularProgress size={18} color="inherit" /> : <CheckCircle2 size={18} />}
                                                    sx={{
                                                        borderRadius: '10px',
                                                        fontWeight: 700,
                                                        px: 3.5,
                                                        minWidth: 160,
                                                        height: { xs: 44, sm: 'auto' },
                                                    }}
                                                >
                                                    {isVerifying ? 'Đang Soát...' : 'Kiểm Tra & Soát'}
                                                </Button>
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Mẹo: Bạn có thể nhấn phím <strong>Enter</strong> để đối soát và check-in ngay lập tức.
                                            </Typography>
                                        </Box>

                                        {/* GỢI Ý DANH SÁCH VÉ TRONG SỰ KIỆN ĐỂ TEST / SOÁT NHANH */}
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: '10px',
                                                bgcolor: 'background.subtle',
                                                border: 1,
                                                borderColor: 'divider',
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                                                <Sparkles size={16} color={theme.palette.primary.main} />
                                                <Typography variant="caption" fontWeight={700} color="text.primary">
                                                    DANH SÁCH VÉ NFT PHÁT HÀNH TRONG SỰ KIỆN ({sampleTickets.length} vé):
                                                </Typography>
                                            </Stack>

                                            {sampleTickets.length === 0 ? (
                                                <Typography variant="caption" color="text.secondary">
                                                    Chưa có vé nào được phát hành cho sự kiện này.
                                                </Typography>
                                            ) : (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {sampleTickets.map((t) => (
                                                        <Chip
                                                            key={t.id || t.tokenId}
                                                            label={`Token #${t.tokenId}${t.isUsed ? ' (Đã Soát)' : ' (Sẵn Sàng)'}`}
                                                            size="small"
                                                            clickable
                                                            onClick={() => handleSelectSampleToken(t)}
                                                            color={t.isUsed ? 'default' : 'primary'}
                                                            variant={t.isUsed ? 'outlined' : 'filled'}
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontFamily: 'monospace',
                                                                cursor: 'pointer',
                                                                '&:hover': { transform: 'scale(1.03)' },
                                                                transition: 'transform 0.15s ease',
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Paper>
                                    </Box>
                                </Box>
                            )}

                            {/* =========================================================================
                                HÌNH THỨC 2: CAMERA SCANNER QUÉT MÃ QR
                            ========================================================================= */}
                            {checkInMode === 'qr' && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: 'background.subtle',
                                            borderBottom: 1,
                                            borderColor: 'divider',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Camera size={20} color={theme.palette.primary.main} />
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                Khung Ngắm Quét Mã QR Vé
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" spacing={1}>
                                            <Tooltip title="Đổi camera trước / sau">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Chuyển đổi camera"
                                                        onClick={handleToggleFacingMode}
                                                        disabled={!isScannerRunning}
                                                    >
                                                        <SwitchCamera size={16} />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            <Button
                                                size="small"
                                                variant={isScannerRunning ? 'outlined' : 'contained'}
                                                color={isScannerRunning ? 'error' : 'primary'}
                                                startIcon={isScannerRunning ? <Square size={16} /> : <Play size={16} />}
                                                onClick={() => setIsScannerRunning(!isScannerRunning)}
                                                sx={{ borderRadius: '6px', fontWeight: 600, px: 2 }}
                                            >
                                                {isScannerRunning ? 'Dừng Camera' : 'Bật Camera'}
                                            </Button>
                                        </Stack>
                                    </Box>

                                    {/* KHUNG CAMERA SCANNER TRỰC QUAN */}
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            minHeight: 400,
                                            flexGrow: 1,
                                            bgcolor: '#0B0F19',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {/* HTML5 QrCode Reader Mounting Element */}
                                        <Box
                                            id="qr-reader-viewport"
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                display: isScannerRunning ? 'block' : 'none',
                                                '& video': {
                                                    width: '100% !important',
                                                    height: '100% !important',
                                                    objectFit: 'cover',
                                                },
                                                '& #qr-reader-viewport__scan_region': {
                                                    minHeight: '380px',
                                                },
                                            }}
                                        />

                                        {/* Khung ngắm đồ họa Hologram khi Camera đang chạy */}
                                        {isScannerRunning && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    width: 250,
                                                    height: 250,
                                                    border: `2px dashed ${theme.palette.primary.main}`,
                                                    borderRadius: '16px',
                                                    pointerEvents: 'none',
                                                    boxShadow: `0 0 20px ${theme.palette.primary.main}40`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    animation: 'pulse 2s infinite',
                                                }}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: '#FFFFFF',
                                                        bgcolor: 'rgba(0,0,0,0.65)',
                                                        px: 1.5,
                                                        py: 0.5,
                                                        borderRadius: '4px',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Căn chỉnh mã QR vào ô vuông
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Màn hình chờ khi chưa bật camera */}
                                        {!isScannerRunning && (
                                            <Box sx={{ textAlign: 'center', p: 4, color: '#94A3B8' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                                    <QrCode size={64} style={{ opacity: 0.6, color: theme.palette.primary.light }} />
                                                </Box>
                                                <Typography variant="h3" fontWeight={700} color="#F8FAFC" gutterBottom>
                                                    Camera Đang Tắt
                                                </Typography>
                                                <Typography variant="body2" sx={{ maxWidth: 360, mx: 'auto', mb: 3 }}>
                                                    Bấm nút "Bật Camera" bên dưới để bắt đầu quét mã QR vé của người tham dự, hoặc chuyển sang tab "Nhập Thủ Công" để kiểm tra vé.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<Play size={16} />}
                                                    onClick={() => setIsScannerRunning(true)}
                                                    sx={{ borderRadius: '8px', fontWeight: 600, px: 3, py: 1 }}
                                                >
                                                    Bật Camera Ngay
                                                </Button>
                                            </Box>
                                        )}

                                        {cameraError && (
                                            <Alert
                                                severity="error"
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 16,
                                                    left: 16,
                                                    right: 16,
                                                    borderRadius: '8px',
                                                }}
                                            >
                                                {cameraError}
                                            </Alert>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Card>
                    </Grid>

                    {/* CỘT PHẢI: KẾT QUẢ SOÁT VÉ TỨC THÌ (STATUS HERO DISPLAY) */}
                    <Grid item xs={12} md={5}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: '16px',
                                bgcolor: 'background.paper',
                                border: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.subtle',
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Kết Quả Soát Vé Tức Thì
                                </Typography>
                                {scanResult && (
                                    <Button
                                        size="small"
                                        color="inherit"
                                        onClick={() => setScanResult(null)}
                                        sx={{ fontSize: '0.75rem' }}
                                    >
                                        Xóa Kết Quả
                                    </Button>
                                )}
                            </Box>

                            <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                {!scanResult ? (
                                    /* TRẠNG THÁI CHỜ QUÉT */
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                            <Hourglass size={48} style={{ opacity: 0.4 }} />
                                        </Box>
                                        <Typography variant="h3" fontWeight={700} color="text.secondary" gutterBottom>
                                            Đang Chờ Soát Vé...
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                                            Hướng camera về phía mã QR vé của người tham gia hoặc nhập mã Token ID để bắt đầu đối soát tức thì.
                                        </Typography>
                                    </Box>
                                ) : (
                                    /* HIỂN THỊ KẾT QUẢ SOÁT VÉ THEO BUSINESS STATUS TOKENS */
                                    <Box>
                                        {/* BANNER TRẠNG THÁI */}
                                        <Box
                                            sx={{
                                                p: 2.5,
                                                borderRadius: '12px',
                                                textAlign: 'center',
                                                mb: 3,
                                                bgcolor:
                                                    scanResult.status === 'success'
                                                        ? theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)'
                                                        : scanResult.status === 'wrong_gate_warning'
                                                        ? 'rgba(245, 158, 11, 0.12)'
                                                        : scanResult.status === 'already_used'
                                                        ? theme.palette.status?.checkedInBg || 'rgba(139, 92, 246, 0.12)'
                                                        : scanResult.status === 'wrong_event'
                                                        ? theme.palette.status?.warningBg || 'rgba(249, 115, 22, 0.12)'
                                                        : theme.palette.status?.errorBg || 'rgba(239, 68, 68, 0.12)',
                                                border: 2,
                                                borderColor:
                                                    scanResult.status === 'success'
                                                        ? theme.palette.status?.success || 'success.main'
                                                        : scanResult.status === 'wrong_gate_warning'
                                                        ? 'warning.main'
                                                        : scanResult.status === 'already_used'
                                                        ? theme.palette.status?.checkedIn || '#8B5CF6'
                                                        : scanResult.status === 'wrong_event'
                                                        ? theme.palette.status?.warning || 'warning.main'
                                                        : theme.palette.status?.error || 'error.main',
                                            }}
                                        >
                                            {scanResult.status === 'success' && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                    <CheckCircle2 size={48} color={theme.palette.status?.success || '#10B981'} />
                                                </Box>
                                            )}
                                            {scanResult.status === 'wrong_gate_warning' && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                    <AlertTriangle size={48} color="#F59E0B" />
                                                </Box>
                                            )}
                                            {scanResult.status === 'already_used' && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                    <AlertCircle size={48} color={theme.palette.status?.checkedIn || '#8B5CF6'} />
                                                </Box>
                                            )}
                                            {scanResult.status === 'wrong_event' && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                    <AlertTriangle size={48} color={theme.palette.status?.warning || '#F59E0B'} />
                                                </Box>
                                            )}
                                            {(scanResult.status === 'invalid_ticket' || scanResult.status === 'expired_hmac') && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                                    <XCircle size={48} color={theme.palette.status?.error || '#EF4444'} />
                                                </Box>
                                            )}

                                            <Typography
                                                variant="h3"
                                                fontWeight={800}
                                                sx={{
                                                    color:
                                                        scanResult.status === 'success'
                                                            ? theme.palette.status?.success || 'success.main'
                                                            : scanResult.status === 'wrong_gate_warning'
                                                            ? 'warning.main'
                                                            : scanResult.status === 'already_used'
                                                            ? theme.palette.status?.checkedIn || '#8B5CF6'
                                                            : scanResult.status === 'wrong_event'
                                                            ? theme.palette.status?.warning || 'warning.main'
                                                            : theme.palette.status?.error || 'error.main',
                                                    mb: 0.5,
                                                }}
                                            >
                                                {scanResult.title}
                                            </Typography>

                                            <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                                {scanResult.message}
                                            </Typography>
                                        </Box>

                                        {/* THÔNG TIN CHI TIẾT VÉ NẾU CÓ */}
                                        {scanResult.ticket && (
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: '10px',
                                                    bgcolor: 'background.subtle',
                                                    border: 1,
                                                    borderColor: 'divider',
                                                    mb: 3,
                                                }}
                                            >
                                                <Stack spacing={1.25}>
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Người tham dự:
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color="text.primary">
                                                            {scanResult.ticket.attendeeName}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Hạng vé:
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600} color="primary.main">
                                                            {scanResult.ticket.tierName}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Armchair size={14} /> Số ghế ngồi:
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={800} color="text.primary">
                                                            {scanResult.ticket.seatNumber}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <DoorOpen size={14} /> Cổng chỉ định:
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={700} color={scanResult.gateMismatch ? 'warning.main' : 'success.main'}>
                                                            {scanResult.ticket.entryGate || scanResult.assignedGate}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Cổng đang kiểm soát:
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                            {selectedGate}
                                                        </Typography>
                                                    </Stack>

                                                    <Divider sx={{ my: 0.5 }} />

                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Mã Token NFT (on-chain):
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                                                            Token #{scanResult.ticket.tokenId}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Hình thức soát:
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                                                            {scanResult.method || 'Mã QR'} • {scanResult.time}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>

                                                {scanResult.gateMismatch && (
                                                    <Alert severity="warning" sx={{ mt: 1.5, borderRadius: '8px', fontSize: '0.8rem' }}>
                                                        <strong>Lưu ý cổng:</strong> Khách đang vào cổng khác với cổng chỉ định trên vé. Hãy hướng dẫn khách hoặc xác nhận cho qua theo quy chế BTC.
                                                    </Alert>
                                                )}
                                            </Paper>
                                        )}

                                        {/* NÚT THAO TÁC TIẾP TỤC */}
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            size="large"
                                            startIcon={<CheckCheck size={18} />}
                                            onClick={() => {
                                                setScanResult(null);
                                                lastQrScanRef.current = { text: '', time: 0 };
                                                if (checkInMode === 'qr' && !isScannerRunning) {
                                                    setIsScannerRunning(true);
                                                }
                                            }}
                                            sx={{ height: 44, borderRadius: '8px', fontWeight: 700 }}
                                        >
                                            Tiếp Tục Soát Người Tiếp Theo
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>

                            {/* BỘ CHỈ SỐ CA TRỰC TẠI CỔNG */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.subtle',
                                    borderTop: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Grid container spacing={1} textAlign="center">
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            ĐÃ QUÉT
                                        </Typography>
                                        <Typography variant="h3" fontWeight={800} color="text.primary">
                                            {shiftStats.totalScanned}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            HỢP LỆ
                                        </Typography>
                                        <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.status?.success || 'success.main' }}>
                                            {shiftStats.successCount}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            TỪ CHỐI
                                        </Typography>
                                        <Typography variant="h3" fontWeight={800} sx={{ color: theme.palette.status?.error || 'error.main' }}>
                                            {shiftStats.rejectedCount}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>

            {/* DRAWER XEM NHẬT KÝ SOÁT VÉ GẦN NHẤT (RECENT CHECK-IN ACTIVITY LOG) */}
            <Drawer
                anchor="right"
                open={openHistoryDrawer}
                onClose={() => setOpenHistoryDrawer(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 400 },
                        p: 2.5,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} pb={1} borderBottom={1} borderColor="divider">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <History size={20} color={theme.palette.primary.main} />
                        <Typography variant="h3" fontWeight={700}>
                            Nhật Ký Soát Vé Gần Nhất
                        </Typography>
                    </Stack>
                    <IconButton
                        size="small"
                        aria-label="Đóng ngăn kéo lịch sử soát vé"
                        onClick={() => setOpenHistoryDrawer(false)}
                    >
                        <X size={20} />
                    </IconButton>
                </Stack>

                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Ca trực: <strong>{currentEvent?.title || "Chưa chọn sự kiện"}</strong>
                </Typography>

                <List sx={{ p: 0 }}>
                    {checkInLogs.map((log) => (
                        <Paper
                            key={log.id}
                            elevation={0}
                            sx={{
                                p: 1.5,
                                mb: 1.5,
                                borderRadius: '10px',
                                bgcolor: 'background.subtle',
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    {log.attendeeName}
                                </Typography>
                                <Chip
                                    label={log.statusText}
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        bgcolor:
                                            log.status === 'success'
                                                ? theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)'
                                                : theme.palette.status?.checkedInBg || 'rgba(139, 92, 246, 0.12)',
                                        color:
                                            log.status === 'success'
                                                ? theme.palette.status?.success || 'success.main'
                                                : theme.palette.status?.checkedIn || '#8B5CF6',
                                    }}
                                />
                            </Stack>

                            <Typography variant="caption" color="text.secondary" display="block">
                                {log.tierName} • Ghế: {log.seatNumber || 'N/A'} • Token #{log.tokenId}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.75, fontSize: '0.7rem' }}>
                                Cổng: {log.gate} • Lúc {log.time}
                            </Typography>
                        </Paper>
                    ))}

                    {checkInLogs.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            <History size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                            <Typography variant="body2">Chưa có lượt soát vé nào trong ca làm việc này.</Typography>
                        </Box>
                    )}
                </List>
            </Drawer>

            {/* SNACKBAR THÔNG BÁO TỔNG QUAN */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ zIndex: 99999 }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
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
        </DashboardLayout>
    );
};

export default CheckInScannerPage;
