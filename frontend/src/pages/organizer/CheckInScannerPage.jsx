import React, { useState, useEffect, useRef } from 'react';
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
    Switch,
    FormControlLabel,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Badge,
    useTheme,
} from '@mui/material';
import {
    QrCodeScanner,
    CameraAlt,
    FlipCameraAndroid,
    FlashOn,
    FlashOff,
    CheckCircle,
    Cancel,
    Warning,
    History,
    VolumeUp,
    VolumeOff,
    Keyboard,
    Refresh,
    Close,
    ArrowBack,
    EventAvailable,
    MeetingRoom,
    Badge as BadgeIcon,
    HourglassEmpty,
    PlayArrow,
    Stop,
    DoneAll,
    ReportProblem,
    Search,
    Shield,
    FiberManualRecord,
    Check,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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

// Dữ liệu sự kiện mẫu để nhân viên chọn
const EVENTS_LIST = [
    {
        id: 'EVT-2026-002',
        title: 'Vietnam Blockchain Summit 2026',
        venue: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
        date: '28/11/2026',
        totalTickets: 500,
        checkedInCount: 382,
    },
    {
        id: 'EVT-2026-001',
        title: 'Hòa Nhạc Giao Hưởng Mùa Thu 2026',
        venue: 'Nhà Hát Lớn Hà Nội, 01 Tràng Tiền',
        date: '15/11/2026',
        totalTickets: 300,
        checkedInCount: 195,
    },
    {
        id: 'EVT-2026-003',
        title: 'Vietnam Esports Championship 2026',
        venue: 'Nhà thi đấu Phú Thọ, TP. Hồ Chí Minh',
        date: '05/12/2026',
        totalTickets: 1200,
        checkedInCount: 740,
    },
];

const GATES_LIST = [
    'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
    'Cổng A - Khán Đài Phổ Thông Tầng 1',
    'Cổng B - Khán Đài Tầng 2 & Ban Công',
    'Cổng Kỹ Thuật & Khách Mời VIP',
];

// Dữ liệu cơ sở vé mẫu để kiểm chứng soát vé
const KNOWN_TICKETS_DATABASE = {
    1422: {
        tokenId: 1422,
        eventId: 'EVT-2026-002',
        attendeeName: 'Nguyễn Tuấn An',
        walletAddress: '0x789b9102934812301928394819203849102334ef',
        tierName: 'VIP Networking Pass',
        gateAllowed: 'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
        seatNumber: 'Ghế VIP-08 (Hàng 1)',
        isUsed: false,
        usedAt: null,
        usedByStaff: null,
    },
    312: {
        tokenId: 312,
        eventId: 'EVT-2026-001', // Thuộc sự kiện Hòa nhạc
        attendeeName: 'Lê Hoàng Nam',
        walletAddress: '0x812A990812Da7201bF241cba0982E12Da9911910',
        tierName: 'Hạng Standard Pass',
        gateAllowed: 'Cổng B - Khán Đài Tầng 2 & Ban Công',
        seatNumber: 'Ghế B-14',
        isUsed: false,
        usedAt: null,
        usedByStaff: null,
    },
    508: {
        tokenId: 508,
        eventId: 'EVT-2026-002',
        attendeeName: 'Phạm Minh Đức',
        walletAddress: '0x498b9102934812301928394819203849102334EF',
        tierName: 'VIP Networking Pass',
        gateAllowed: 'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
        seatNumber: 'Ghế VIP-12',
        isUsed: true, // Đã check-in trước đó
        usedAt: '16:45:20 - 09/11/2026',
        usedByStaff: 'Trần Văn Bình (STF-08)',
    },
};

const CheckInScannerPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Cấu hình sự kiện và cổng soát vé hiện tại
    const [selectedEventId, setSelectedEventId] = useState('EVT-2026-002');
    const [selectedGate, setSelectedGate] = useState(GATES_LIST[0]);

    // Trạng thái Camera Scanner
    const [isScannerRunning, setIsScannerRunning] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const scannerRef = useRef(null);

    // Trạng thái kết quả quét vé
    // status: null | 'success' | 'already_used' | 'wrong_event' | 'invalid_ticket' | 'expired_hmac'
    const [scanResult, setScanResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Modal nhập mã vé thủ công
    const [openManualModal, setOpenManualModal] = useState(false);
    const [manualTokenInput, setManualTokenInput] = useState('');

    // Ngăn kéo lịch sử soát vé (Recent Activity Log)
    const [openHistoryDrawer, setOpenHistoryDrawer] = useState(false);
    const [checkInLogs, setCheckInLogs] = useState([
        {
            id: 'LOG-1092',
            tokenId: 881,
            attendeeName: 'Trần Bảo Ngọc',
            tierName: 'Standard Pass',
            status: 'success',
            statusText: 'HỢP LỆ',
            gate: 'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
            time: '17:15:22',
        },
        {
            id: 'LOG-1091',
            tokenId: 508,
            attendeeName: 'Phạm Minh Đức',
            tierName: 'VIP Pass',
            status: 'already_used',
            statusText: 'VÉ ĐÃ DÙNG',
            gate: 'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
            time: '17:12:05',
        },
        {
            id: 'LOG-1090',
            tokenId: 994,
            attendeeName: 'Hoàng Quốc Việt',
            tierName: 'VIP Pass',
            status: 'success',
            statusText: 'HỢP LỆ',
            gate: 'Cổng VIP - Sảnh Chính Tầng 1 (Lối Fast-Track)',
            time: '17:08:44',
        },
    ]);

    // Thống kê ca trực
    const [shiftStats, setShiftStats] = useState({
        totalScanned: 42,
        successCount: 39,
        rejectedCount: 3,
    });

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const currentEvent = EVENTS_LIST.find((e) => e.id === selectedEventId) || EVENTS_LIST[0];

    // Xử lý xác thực mã vé khi quét
    const processTicketPayload = (payloadString) => {
        if (isVerifying) return;
        setIsVerifying(true);

        let parsedTokenId = null;
        let isExpiredHmac = false;

        try {
            // Thử phân tích JSON (nếu là payload HMAC động từ MyTicketsPage)
            const data = JSON.parse(payloadString);
            parsedTokenId = data.tokenId;

            // Kiểm tra thời hạn 30s của mã QR HMAC
            if (data.timestamp && Date.now() - data.timestamp > 35000) {
                isExpiredHmac = true;
            }
        } catch {
            // Nếu là chuỗi số đơn thuần hoặc Token ID nhập tay
            parsedTokenId = parseInt(payloadString.replace(/\D/g, ''), 10);
        }

        setTimeout(() => {
            setIsVerifying(false);

            if (isExpiredHmac) {
                if (soundEnabled) playFeedbackSound('error');
                setScanResult({
                    status: 'expired_hmac',
                    title: 'MÃ QR ĐÃ HẾT HẠN (HMAC > 30s)',
                    message: 'Mã QR đã quá hạn 30 giây bảo mật. Yêu cầu khách mở lại ứng dụng để tự tạo mã QR mới.',
                    tokenId: parsedTokenId,
                    time: new Date().toLocaleTimeString('vi-VN'),
                });
                setShiftStats((prev) => ({ ...prev, totalScanned: prev.totalScanned + 1, rejectedCount: prev.rejectedCount + 1 }));
                return;
            }

            const ticket = KNOWN_TICKETS_DATABASE[parsedTokenId];

            if (!ticket) {
                // Vé không tồn tại trên hệ thống
                if (soundEnabled) playFeedbackSound('error');
                setScanResult({
                    status: 'invalid_ticket',
                    title: 'VÉ KHÔNG TỒN TẠI',
                    message: `Mã vé hoặc Token #${parsedTokenId || payloadString} không tồn tại trên Smart Contract hoặc cơ sở dữ liệu.`,
                    tokenId: parsedTokenId || 'N/A',
                    time: new Date().toLocaleTimeString('vi-VN'),
                });
                setShiftStats((prev) => ({ ...prev, totalScanned: prev.totalScanned + 1, rejectedCount: prev.rejectedCount + 1 }));
                return;
            }

            // Kiểm tra sự kiện
            if (ticket.eventId !== selectedEventId) {
                if (soundEnabled) playFeedbackSound('error');
                const wrongEvent = EVENTS_LIST.find((e) => e.id === ticket.eventId);
                setScanResult({
                    status: 'wrong_event',
                    title: 'SAI SỰ KIỆN TỔ CHỨC',
                    message: `Vé này thuộc sự kiện "${wrongEvent?.title || ticket.eventId}", không áp dụng cho sự kiện hiện tại!`,
                    ticket,
                    tokenId: ticket.tokenId,
                    time: new Date().toLocaleTimeString('vi-VN'),
                });
                setShiftStats((prev) => ({ ...prev, totalScanned: prev.totalScanned + 1, rejectedCount: prev.rejectedCount + 1 }));
                return;
            }

            // Kiểm tra đã check-in hay chưa (BR-05)
            if (ticket.isUsed) {
                if (soundEnabled) playFeedbackSound('error');
                setScanResult({
                    status: 'already_used',
                    title: 'VÉ ĐÃ ĐƯỢC CHECK-IN!',
                    message: `Vé này đã được quét thành công lúc ${ticket.usedAt} bởi nhân viên ${ticket.usedByStaff}. Tuyệt đối không cho phép sử dụng lại!`,
                    ticket,
                    tokenId: ticket.tokenId,
                    time: new Date().toLocaleTimeString('vi-VN'),
                });
                setShiftStats((prev) => ({ ...prev, totalScanned: prev.totalScanned + 1, rejectedCount: prev.rejectedCount + 1 }));

                // Ghi vào nhật ký
                addCheckInLog(ticket, 'already_used', 'VÉ ĐÃ DÙNG');
                return;
            }

            // CHECK-IN THÀNH CÔNG (HỢP LỆ)
            if (soundEnabled) playFeedbackSound('success');
            ticket.isUsed = true;
            ticket.usedAt = new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN');
            ticket.usedByStaff = user?.name || 'Trần Văn Bình (STF-08)';

            setScanResult({
                status: 'success',
                title: 'VÉ HỢP LỆ • MỜI VÀO CỔNG',
                message: 'Thông tin hợp lệ, quyền sở hữu NFT đã được xác nhận nguyên tử on-chain.',
                ticket,
                tokenId: ticket.tokenId,
                time: new Date().toLocaleTimeString('vi-VN'),
            });

            setShiftStats((prev) => ({
                ...prev,
                totalScanned: prev.totalScanned + 1,
                successCount: prev.successCount + 1,
            }));

            // Ghi nhật ký thành công
            addCheckInLog(ticket, 'success', 'HỢP LỆ');
        }, 350);
    };

    const addCheckInLog = (ticket, status, statusText) => {
        const newLog = {
            id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
            tokenId: ticket.tokenId,
            attendeeName: ticket.attendeeName,
            tierName: ticket.tierName,
            status,
            statusText,
            gate: selectedGate,
            time: new Date().toLocaleTimeString('vi-VN'),
        };
        setCheckInLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    };

    // Khởi chạy / Tắt camera bằng Html5Qrcode
    useEffect(() => {
        let html5QrCodeInstance = null;

        if (isScannerRunning) {
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
                        processTicketPayload(decodedText);
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
    }, [isScannerRunning, facingMode]);

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

    // Xử lý nhập mã vé thủ công
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualTokenInput.trim()) return;
        setOpenManualModal(false);
        processTicketPayload(manualTokenInput.trim());
        setManualTokenInput('');
    };

    // Thử nghiệm nhanh các kịch bản
    const handleQuickSimulate = (mockType) => {
        if (mockType === 'valid') {
            processTicketPayload(
                JSON.stringify({
                    tokenId: 1422,
                    contract: '0x71C948261901823901928394819203849102A319',
                    nonce: 'mock-valid',
                    timestamp: Date.now(),
                })
            );
        } else if (mockType === 'already_used') {
            processTicketPayload(
                JSON.stringify({
                    tokenId: 508,
                    contract: '0x71C948261901823901928394819203849102A319',
                    nonce: 'mock-used',
                    timestamp: Date.now(),
                })
            );
        } else if (mockType === 'wrong_event') {
            processTicketPayload(
                JSON.stringify({
                    tokenId: 312,
                    contract: '0x71C948261901823901928394819203849102A319',
                    nonce: 'mock-wrong-event',
                    timestamp: Date.now(),
                })
            );
        } else if (mockType === 'expired_hmac') {
            processTicketPayload(
                JSON.stringify({
                    tokenId: 1422,
                    contract: '0x71C948261901823901928394819203849102A319',
                    nonce: 'mock-expired',
                    timestamp: Date.now() - 45000, // Quá 45 giây
                })
            );
        } else {
            processTicketPayload('TOKEN-999999-FAKE');
        }
    };

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {/* VÙNG NỘI DUNG CHÍNH (TỐI ƯU CẢ MOBILE & DESKTOP THEO MỤC 8.1) */}
            <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
                <Container maxWidth="lg">
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
                                    icon={<QrCodeScanner sx={{ fontSize: '1rem !important' }} />}
                                    label="SOÁT VÉ TẠI CỔNG • CHECK-IN TERMINAL"
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                />
                                <Chip
                                    icon={<FiberManualRecord sx={{ fontSize: '0.65rem !important', color: isScannerRunning ? 'success.main' : 'text.disabled' }} />}
                                    label={isScannerRunning ? 'CAMERA ĐANG BẬT' : 'CAMERA ĐANG TẮT'}
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
                                    {soundEnabled ? <VolumeUp /> : <VolumeOff />}
                                </IconButton>
                            </Tooltip>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<History />}
                                onClick={() => setOpenHistoryDrawer(true)}
                                sx={{ borderRadius: '8px', fontWeight: 600, height: 40 }}
                            >
                                Lịch Sử Quét ({checkInLogs.length})
                            </Button>
                        </Stack>
                    </Stack>

                    {/* HÀNG CẤU HÌNH SỰ KIỆN & CỔNG CHECK-IN */}
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
                            <Grid item xs={12} md={6}>
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
                                        {EVENTS_LIST.map((evt) => (
                                            <MenuItem key={evt.id} value={evt.id}>
                                                <strong>{evt.title}</strong> — {evt.venue}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="gate-select-label">Vị trí cổng kiểm soát</InputLabel>
                                    <Select
                                        labelId="gate-select-label"
                                        value={selectedGate}
                                        label="Vị trí cổng kiểm soát"
                                        onChange={(e) => setSelectedGate(e.target.value)}
                                    >
                                        {GATES_LIST.map((gate) => (
                                            <MenuItem key={gate} value={gate}>
                                                {gate}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6} md={2}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<Keyboard />}
                                    onClick={() => setOpenManualModal(true)}
                                    sx={{ height: 40, borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Nhập Thủ Công
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* VÙNG TRỌNG TÂM: CAMERA SCANNER & BANNER PHẢN HỒI KẾT QUẢ */}
                    <Grid container spacing={3}>
                        {/* CỘT TRÁI: CAMERA VIEWPORT */}
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
                                        <CameraAlt color="primary" sx={{ fontSize: 20 }} />
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
                                                    <FlipCameraAndroid fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </Tooltip>

                                        <Button
                                            size="small"
                                            variant={isScannerRunning ? 'outlined' : 'contained'}
                                            color={isScannerRunning ? 'error' : 'primary'}
                                            startIcon={isScannerRunning ? <Stop /> : <PlayArrow />}
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
                                        minHeight: 380,
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
                                                minHeight: '360px',
                                            },
                                        }}
                                    />

                                    {/* Khung ngắm đồ họa Hologram khi Camera đang chạy */}
                                    {isScannerRunning && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                width: 240,
                                                height: 240,
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
                                                    bgcolor: 'rgba(0,0,0,0.6)',
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
                                            <QrCodeScanner sx={{ fontSize: 64, mb: 2, opacity: 0.6, color: 'primary.light' }} />
                                            <Typography variant="h3" fontWeight={700} color="#F8FAFC" gutterBottom>
                                                Camera Đang Tắt
                                            </Typography>
                                            <Typography variant="body2" sx={{ maxWidth: 360, mx: 'auto', mb: 3 }}>
                                                Bấm nút "Bật Camera" bên trên để bắt đầu quét mã QR vé của người tham dự, hoặc sử dụng các nút thử nghiệm kịch bản bên dưới.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={<PlayArrow />}
                                                onClick={() => setIsScannerRunning(true)}
                                                sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
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

                                {/* PHẦN THỬ NGHIỆM KỊCH BẢN CHECK-IN (DEMO & TESTING CONTROLS) */}
                                <CardContent sx={{ p: 2.5, bgcolor: 'background.paper' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1.5}>
                                        THỬ NGHIỆM NHANH KỊCH BẢN SOÁT VÉ (QUICK SIMULATOR):
                                    </Typography>
                                    <Grid container spacing={1}>
                                        <Grid item xs={6} sm={2.4}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                color="success"
                                                onClick={() => handleQuickSimulate('valid')}
                                                sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, py: 0.8 }}
                                            >
                                                ✓ Vé Hợp Lệ (#1422)
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6} sm={2.4}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    py: 0.8,
                                                    color: theme.palette.status?.checkedIn || '#8B5CF6',
                                                    borderColor: theme.palette.status?.checkedIn || '#8B5CF6',
                                                }}
                                                onClick={() => handleQuickSimulate('already_used')}
                                            >
                                                ⚠ Đã Dùng (#508)
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6} sm={2.4}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                color="warning"
                                                onClick={() => handleQuickSimulate('wrong_event')}
                                                sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, py: 0.8 }}
                                            >
                                                ✕ Sai Sự Kiện (#312)
                                            </Button>
                                        </Grid>
                                        <Grid item xs={6} sm={2.4}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleQuickSimulate('expired_hmac')}
                                                sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, py: 0.8 }}
                                            >
                                                ⏳ QR Hết Hạn (&gt;30s)
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} sm={2.4}>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleQuickSimulate('invalid')}
                                                sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, py: 0.8 }}
                                            >
                                                ✕ Vé Giả Mạo
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
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
                                            <HourglassEmpty sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                                            <Typography variant="h3" fontWeight={700} color="text.secondary" gutterBottom>
                                                Đang Chờ Quét Vé...
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
                                                Hướng camera về phía mã QR vé của người tham gia hoặc nhập mã thủ công để bắt đầu xác thực.
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
                                                            : scanResult.status === 'already_used'
                                                            ? theme.palette.status?.checkedInBg || 'rgba(139, 92, 246, 0.12)'
                                                            : scanResult.status === 'wrong_event'
                                                            ? theme.palette.status?.warningBg || 'rgba(249, 115, 22, 0.12)'
                                                            : theme.palette.status?.errorBg || 'rgba(239, 68, 68, 0.12)',
                                                    border: 2,
                                                    borderColor:
                                                        scanResult.status === 'success'
                                                            ? theme.palette.status?.success || 'success.main'
                                                            : scanResult.status === 'already_used'
                                                            ? theme.palette.status?.checkedIn || '#8B5CF6'
                                                            : scanResult.status === 'wrong_event'
                                                            ? theme.palette.status?.warning || 'warning.main'
                                                            : theme.palette.status?.error || 'error.main',
                                                }}
                                            >
                                                {scanResult.status === 'success' && (
                                                    <CheckCircle sx={{ fontSize: 48, color: theme.palette.status?.success || 'success.main', mb: 1 }} />
                                                )}
                                                {scanResult.status === 'already_used' && (
                                                    <Warning sx={{ fontSize: 48, color: theme.palette.status?.checkedIn || '#8B5CF6', mb: 1 }} />
                                                )}
                                                {scanResult.status === 'wrong_event' && (
                                                    <ReportProblem sx={{ fontSize: 48, color: theme.palette.status?.warning || 'warning.main', mb: 1 }} />
                                                )}
                                                {(scanResult.status === 'invalid_ticket' || scanResult.status === 'expired_hmac') && (
                                                    <Cancel sx={{ fontSize: 48, color: theme.palette.status?.error || 'error.main', mb: 1 }} />
                                                )}

                                                <Typography
                                                    variant="h3"
                                                    fontWeight={800}
                                                    sx={{
                                                        color:
                                                            scanResult.status === 'success'
                                                                ? theme.palette.status?.success || 'success.main'
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

                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Vị trí ghế / Khu vực:
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {scanResult.ticket.seatNumber}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Mã Token NFT:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                                Token #{scanResult.ticket.tokenId}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack direction="row" justifyContent="space-between">
                                                            <Typography variant="caption" color="text.secondary">
                                                                Thời gian quét:
                                                            </Typography>
                                                            <Typography variant="caption" fontWeight={600}>
                                                                {scanResult.time}
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Paper>
                                            )}

                                            {/* NÚT THAO TÁC TIẾP TỤC */}
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                fullWidth
                                                size="large"
                                                startIcon={<DoneAll />}
                                                onClick={() => {
                                                    setScanResult(null);
                                                    if (!isScannerRunning) setIsScannerRunning(true);
                                                }}
                                                sx={{ height: 44, borderRadius: '8px', fontWeight: 700 }}
                                            >
                                                Tiếp Tục Quét Người Tiếp Theo
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
                </Container>
            </Box>

            {/* MODAL NHẬP MÃ VÉ THỦ CÔNG KHI CAMERA KHÔNG QUÉT ĐƯỢC */}
            <Dialog
                open={openManualModal}
                onClose={() => setOpenManualModal(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: 1,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Keyboard color="primary" />
                            <Typography variant="h3" fontWeight={700}>
                                Nhập Mã Vé Thủ Công
                            </Typography>
                        </Stack>
                        <IconButton
                            size="small"
                            aria-label="Đóng popup nhập mã vé thủ công"
                            onClick={() => setOpenManualModal(false)}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <Box component="form" onSubmit={handleManualSubmit}>
                    <DialogContent sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Sử dụng trong trường hợp màn hình điện thoại khách bị nứt vỡ hoặc camera không thể đọc mã QR.
                        </Typography>

                        <TextField
                            autoFocus
                            fullWidth
                            label="Mã Token ID vé NFT"
                            placeholder="Ví dụ: 1422, 508, 312..."
                            value={manualTokenInput}
                            onChange={(e) => setManualTokenInput(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        #
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <Alert severity="info" sx={{ fontSize: '0.8rem', borderRadius: '8px' }}>
                            Mẹo: Có thể thử nhập Token ID <strong>1422</strong> (vé hợp lệ) hoặc <strong>508</strong> (vé đã dùng) để kiểm thử.
                        </Alert>
                    </DialogContent>

                    <DialogActions sx={{ p: 2, pt: 0 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => setOpenManualModal(false)}
                            sx={{ borderRadius: '8px' }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={!manualTokenInput.trim()}
                            sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
                        >
                            Kiểm Tra Vé
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

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
                        <History color="primary" />
                        <Typography variant="h3" fontWeight={700}>
                            Nhật Ký Soát Vé Gần Nhất
                        </Typography>
                    </Stack>
                    <IconButton
                        size="small"
                        aria-label="Đóng ngăn kéo lịch sử soát vé"
                        onClick={() => setOpenHistoryDrawer(false)}
                    >
                        <Close />
                    </IconButton>
                </Stack>

                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Ca trực: <strong>{currentEvent.title}</strong>
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
                                {log.tierName} • Token #{log.tokenId}
                            </Typography>

                            <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                    {log.time}
                                </Typography>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                    {log.id}
                                </Typography>
                            </Stack>
                        </Paper>
                    ))}
                </List>
            </Drawer>

            <Footer />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
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

export default CheckInScannerPage;

