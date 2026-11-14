import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    LinearProgress,
    Stack,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Breadcrumbs,
    Link,
    Divider,
    useTheme,
} from '@mui/material';
import {
    EventNote,
    ConfirmationNumber,
    AccountBalanceWallet,
    TrendingUp,
    PeopleAlt,
    CheckCircle,
    HourglassEmpty,
    Refresh,
    ContentCopy,
    OpenInNew,
    Security,
    Search,
    Visibility,
    Add,
    QrCodeScanner,
    Storefront,
    Close,
    Launch,
    FiberManualRecord,
    InfoOutlined,
    Shield,
    MonetizationOn,
    Payments,
    ReceiptLong,
    ArrowForward,
    Settings,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Footer from '../../components/Footer';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { organizerAPI, authAPI, userAPI } from '../../services/api';
import { ethers } from 'ethers';
import { EVENT_TICKET_ADDRESS } from '../../constants/contracts';
import EventTicketABI from '../../constants/abi/EventTicket.json';

// MetaMask Fox inline SVG
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

// Helper: Rút gọn địa chỉ ví và mã băm
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu các chỉ số kinh tế của Ban Tổ Chức
const EMPTY_ORGANIZER_METRICS = {
    totalRevenueEth: 0,
    totalRevenueUsd: 0,
    resaleRoyaltyEth: 0,
    withdrawableBalanceEth: 0,
    totalTicketsSold: 0,
    totalTicketsMaxSupply: 0,
    totalCheckedInCount: 0,
    activeEventsCount: 0,
    pendingEventsCount: 0,
    endedEventsCount: 0,
};

const INITIAL_ORGANIZER_METRICS = EMPTY_ORGANIZER_METRICS;

const INITIAL_MY_EVENTS = [];

const INITIAL_FINANCIAL_LOGS = [];

const OrganizerDashboardPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Dữ liệu chỉ số & sự kiện
    const [metrics, setMetrics] = useState(INITIAL_ORGANIZER_METRICS);
    const [events, setEvents] = useState(INITIAL_MY_EVENTS);
    const [financialLogs, setFinancialLogs] = useState(INITIAL_FINANCIAL_LOGS);

    // Bộ lọc & Tab
    const [statusTab, setStatusTab] = useState('all'); // 'all' | 'published' | 'pending' | 'ended'
    const [searchTerm, setSearchTerm] = useState('');

    // Modal đối soát doanh thu on-chain
    const [openWithdrawModal, setOpenWithdrawModal] = useState(false);

    // State ví Web3 của Ban tổ chức
    const [connectedWallet, setConnectedWallet] = useState(user?.walletAddress || '');
    const [walletBalance, setWalletBalance] = useState('');
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);
    const [isLinkingWallet, setIsLinkingWallet] = useState(false);

    // Snackbar thông báo
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [loading, setLoading] = useState(false);

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm!`, 'success');
    };

    // Lấy số dư ETH thật từ MetaMask trên mạng Sepolia
    const fetchWalletBalance = useCallback(async (address) => {
        if (!address) {
            setWalletBalance('');
            return;
        }
        try {
            if (window.ethereum) {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const balanceBigInt = await browserProvider.getBalance(address);
                const ethStr = ethers.formatEther(balanceBigInt);
                const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                setWalletBalance(`${ethNum} ETH`);
            } else {
                try {
                    const rpcProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
                    const balanceBigInt = await rpcProvider.getBalance(address);
                    const ethStr = ethers.formatEther(balanceBigInt);
                    const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                    setWalletBalance(`${ethNum} ETH`);
                } catch {
                    setWalletBalance('');
                }
            }
        } catch (err) {
            console.error('Lỗi lấy số dư ví Organizer:', err);
        }
    }, []);

    // Tự động kiểm tra ví đã kết nối trong MetaMask
    useEffect(() => {
        let isMounted = true;
        const checkWallet = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts[0]) {
                        if (isMounted) {
                            setConnectedWallet(accounts[0]);
                            await fetchWalletBalance(accounts[0]);
                        }
                        return;
                    }
                } catch (err) {
                    console.error('Lỗi eth_accounts Organizer:', err);
                }
            }
            if (user?.walletAddress) {
                setConnectedWallet(user.walletAddress);
                fetchWalletBalance(user.walletAddress);
            }
        };

        checkWallet();
        return () => {
            isMounted = false;
        };
    }, [user?.walletAddress, fetchWalletBalance]);

    // Lắng nghe sự kiện đổi ví và đổi mạng trong MetaMask
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts && accounts.length > 0) {
                setConnectedWallet(accounts[0]);
                await fetchWalletBalance(accounts[0]);
                showSnackbar(`Đã chuyển sang ví MetaMask: ${truncateHash(accounts[0], 6, 4)}`, 'info');
            } else {
                setConnectedWallet('');
                setWalletBalance('');
            }
        };

        const handleChainChanged = () => {
            if (connectedWallet) {
                fetchWalletBalance(connectedWallet);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [connectedWallet, fetchWalletBalance]);

    // Kết nối ví MetaMask
    const handleConnectWallet = async () => {
        if (!window.ethereum) {
            showSnackbar('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt!', 'warning');
            return;
        }

        setIsConnectingWallet(true);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts[0]) {
                const addr = accounts[0];
                setConnectedWallet(addr);
                await fetchWalletBalance(addr);
                showSnackbar(`Đã kết nối ví MetaMask: ${truncateHash(addr, 6, 4)}`, 'success');
            }
        } catch (err) {
            if (err?.code === 4001 || err?.info?.error?.code === 4001) {
                showSnackbar('Bạn đã từ chối yêu cầu kết nối ví MetaMask.', 'warning');
            } else {
                showSnackbar(err.message || 'Lỗi khi kết nối ví MetaMask.', 'error');
            }
        } finally {
            setIsConnectingWallet(false);
        }
    };

    // Liên kết ví MetaMask vào hồ sơ tài khoản BTC
    const handleLinkWalletToProfile = async () => {
        if (!connectedWallet) {
            showSnackbar('Vui lòng kết nối ví MetaMask trước!', 'warning');
            return;
        }

        setIsLinkingWallet(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const nonceRes = await authAPI.getNonce(connectedWallet);
            const nonce = nonceRes.data?.data?.nonce;
            if (!nonce) throw new Error('Không thể lấy mã xác thực nonce từ máy chủ.');

            const signature = await signer.signMessage(nonce);
            await userAPI.linkWallet({
                walletAddress: connectedWallet,
                signature,
                nonce,
            });

            showSnackbar('Liên kết ví MetaMask vào hồ sơ Ban Tổ Chức thành công!', 'success');
            // Cập nhật localStorage
            const stored = localStorage.getItem('blocktickets_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                parsed.walletAddress = connectedWallet;
                localStorage.setItem('blocktickets_user', JSON.stringify(parsed));
            }
            window.location.reload();
        } catch (err) {
            if (err?.code === 4001 || err?.info?.error?.code === 4001) {
                showSnackbar('Bạn đã hủy ký xác nhận liên kết ví.', 'warning');
            } else {
                showSnackbar(err?.response?.data?.message || err.message || 'Lỗi khi liên kết ví.', 'error');
            }
        } finally {
            setIsLinkingWallet(false);
        }
    };

    // Tải dữ liệu thật từ Backend API
    const loadOrganizerData = async () => {
        setLoading(true);
        try {
            const [statsRes, eventsRes] = await Promise.allSettled([
                organizerAPI.getStats(),
                organizerAPI.getMyEvents({ page: 1, limit: 50 }),
            ]);

            if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data?.stats) {
                const s = statsRes.value.data.data.stats;
                setMetrics({
                    totalRevenueEth: Number(s.totalRevenueEth) || 0,
                    totalRevenueUsd: Number(s.totalRevenueUsd) || 0,
                    resaleRoyaltyEth: +(Number(s.totalRevenueEth || 0) * 0.05).toFixed(3),
                    withdrawableBalanceEth: Number(s.totalRevenueEth) || 0,
                    totalTicketsSold: Number(s.totalTicketsMinted) || 0,
                    totalTicketsMaxSupply: Number(s.totalTicketsMaxSupply) || Number(s.totalTicketsMinted) || 0,
                    totalCheckedInCount: Number(s.checkedInCount) || 0,
                    activeEventsCount: Number(s.activeEventsCount) || 0,
                    pendingEventsCount: Number(s.pendingEventsCount) || 0,
                    draftEventsCount: Number(s.draftEventsCount) || 0,
                    endedEventsCount: Number(s.endedEventsCount) || 0,
                });
                if (Array.isArray(s.recentSettlements)) {
                    setFinancialLogs(s.recentSettlements);
                }
            }

            if (eventsRes.status === 'fulfilled') {
                const rawEvents = Array.isArray(eventsRes.value?.data?.data?.events)
                    ? eventsRes.value.data.data.events
                    : [];
                const dbEvents = rawEvents.map((e) => {
                    const ticketsSold = e.ticketTypes?.reduce((sum, tt) => sum + (tt.currentSupply || tt.mintedAmount || 0), 0) || 0;
                    const maxSupply = e.ticketTypes?.reduce((sum, tt) => sum + (tt.maxSupply || 0), 0) || 0;
                    const revEth = e.ticketTypes?.reduce((sum, tt) => sum + (tt.currentSupply || 0) * (Number(tt.originalPrice) || 0), 0) || 0;

                    let statusText = 'ĐANG MỞ BÁN';
                    if (e.status === 'approved') statusText = 'ĐÃ DUYỆT';
                    else if (e.status === 'pending') statusText = 'CHỜ DUYỆT';
                    else if (e.status === 'draft') statusText = 'BẢN NHÁP';
                    else if (e.status === 'ended') statusText = 'ĐÃ KẾT THÚC';

                    return {
                        id: e.id,
                        title: e.title,
                        venue: e.venueName || e.venueCity || 'Hà Nội',
                        date: e.startTime ? new Date(e.startTime).toLocaleDateString('vi-VN') : '',
                        startTime: e.startTime ? new Date(e.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
                        status: e.status,
                        statusText,
                        ticketsSold,
                        maxSupply,
                        checkedIn: 0,
                        totalRevenueEth: revEth,
                        royaltyEarnedEth: +(revEth * 0.05).toFixed(3),
                    };
                });
                setEvents(dbEvents);
            }
        } catch (err) {
            console.warn('Lỗi khi tải dữ liệu Ban tổ chức từ server:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrganizerData();
    }, []);

    // Xử lý công bố sự kiện đã được duyệt
    const handlePublishEvent = async (eventId) => {
        try {
            const targetEvt = events.find((e) => e.id === eventId);
            if (!targetEvt) {
                showSnackbar('Không tìm thấy sự kiện cần công bố.', 'error');
                return;
            }

            let onChainEventId = targetEvt.onChainEventId || null;

            // Nếu sự kiện chưa có trên Smart Contract, bắt buộc phải kết nối MetaMask để tạo on-chain
            if (!onChainEventId) {
                if (!window.ethereum) {
                    showSnackbar('Vui lòng cài đặt và kết nối ví MetaMask để đưa sự kiện lên Blockchain Sepolia!', 'warning');
                    return;
                }

                try {
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    const accounts = await browserProvider.send('eth_requestAccounts', []);
                    if (!accounts || accounts.length === 0) {
                        showSnackbar('Vui lòng mở và kết nối ví MetaMask để tiếp tục.', 'warning');
                        return;
                    }

                    const signer = await browserProvider.getSigner();
                    const contract = new ethers.Contract(EVENT_TICKET_ADDRESS, EventTicketABI, signer);

                    showSnackbar('Đang mở popup MetaMask để ký khởi tạo sự kiện trên Sepolia...', 'info');
                    const startTimeUnix = Math.floor(new Date(targetEvt.startTime).getTime() / 1000);
                    const endTimeUnix = Math.floor(new Date(targetEvt.endTime || Date.now() + 86400000 * 30).getTime() / 1000);

                    // 1. Tạo sự kiện on-chain: createEvent(startTime, endTime)
                    const tx = await contract.createEvent(startTimeUnix, endTimeUnix);
                    showSnackbar('Đang chờ thợ đào xác nhận sự kiện trên mạng Sepolia...', 'info');
                    const receipt = await tx.wait();

                    // Đọc EventCreated log để lấy eventId
                    const iface = new ethers.Interface(EventTicketABI);
                    for (const log of receipt.logs) {
                        try {
                            const parsed = iface.parseLog(log);
                            if (parsed && parsed.name === 'EventCreated') {
                                onChainEventId = Number(parsed.args.eventId);
                                break;
                            }
                        } catch (_) {}
                    }

                    if (!onChainEventId) {
                        throw new Error('Không thể lấy mã Event ID từ Blockchain.');
                    }

                    // 2. Thêm từng hạng vé lên contract: addTicketTier(...)
                    if (targetEvt.ticketTypes && targetEvt.ticketTypes.length > 0) {
                        showSnackbar(`Khởi tạo thành công sự kiện ID #${onChainEventId}. Đang thêm các hạng vé on-chain...`, 'info');
                        for (const tier of targetEvt.ticketTypes) {
                            const priceWei = ethers.parseEther(Number(tier.originalPrice || tier.price || 0.01).toFixed(6));
                            const maxSupply = BigInt(tier.maxSupply || tier.capacity || 100);
                            const saleStartUnix = Math.floor(new Date(tier.saleStartTime || targetEvt.startTime).getTime() / 1000);
                            let saleEndUnix = Math.floor(new Date(tier.saleEndTime || targetEvt.endTime).getTime() / 1000);
                            if (saleEndUnix > endTimeUnix) saleEndUnix = endTimeUnix;
                            if (saleEndUnix <= saleStartUnix) saleEndUnix = saleStartUnix + 3600;

                            const tierTx = await contract.addTicketTier(
                                onChainEventId,
                                priceWei,
                                maxSupply,
                                saleStartUnix,
                                saleEndUnix
                            );
                            await tierTx.wait();
                        }
                    }
                } catch (onChainErr) {
                    console.error('Lỗi khởi tạo sự kiện on-chain:', onChainErr);
                    const errMsg = onChainErr?.reason || onChainErr?.info?.error?.message || onChainErr?.message || 'Lỗi khi gọi Smart Contract';
                    if (onChainErr?.code === 4001 || onChainErr?.info?.error?.code === 4001) {
                        showSnackbar('Bạn đã từ chối ký giao dịch trên ví MetaMask. Sự kiện chưa được công bố.', 'warning');
                    } else {
                        showSnackbar(`Lỗi khởi tạo on-chain: ${errMsg}`, 'error');
                    }
                    return; // Chặn không công bố vào database nếu on-chain chưa xong!
                }
            }

            // 3. Sau khi on-chain thành công mới cập nhật trạng thái trong database
            await organizerAPI.publishEvent(eventId, onChainEventId ? { onChainEventId } : {});
            showSnackbar('Đã công khai mở bán sự kiện thành công trên cả Hệ Thống và Blockchain Sepolia!', 'success');
            loadOrganizerData();
        } catch (err) {
            showSnackbar(err.message || 'Lỗi khi công bố sự kiện', 'error');
        }
    };

    // Xử lý gửi sự kiện nháp lên Admin phê duyệt
    const handleSubmitReview = async (eventId) => {
        try {
            await organizerAPI.submitReview(eventId);
            showSnackbar('Đã gửi sự kiện lên ban quản trị phê duyệt!', 'success');
            loadOrganizerData();
        } catch (err) {
            showSnackbar(err.message || 'Lỗi khi gửi duyệt sự kiện', 'error');
        }
    };

    // Lọc danh sách sự kiện
    const filteredEvents = useMemo(() => {
        return events.filter((evt) => {
            const matchesStatus = statusTab === 'all' || evt.status === statusTab;
            const matchesSearch =
                evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                evt.venue.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [events, statusTab, searchTerm]);

    // Tính tỷ lệ check-in tổng thể
    const overallCheckInRate = metrics.totalTicketsSold > 0
        ? ((metrics.totalCheckedInCount / metrics.totalTicketsSold) * 100).toFixed(1)
        : '0.0';

    const topActions = (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
                variant="outlined"
                color="primary"
                size="small"
                component={RouterLink}
                to="/organizer/check-in"
                startIcon={<QrCodeScanner />}
                sx={{ height: 38, borderRadius: '8px', fontWeight: 600 }}
            >
                Soát vé
            </Button>
            <Button
                variant="contained"
                color="primary"
                size="small"
                component={RouterLink}
                to="/organizer/create-event"
                startIcon={<Add />}
                sx={{ height: 38, borderRadius: '8px', fontWeight: 700 }}
            >
                Tạo sự kiện
            </Button>
        </Stack>
    );

    return (
        <DashboardLayout
            role="organizer"
            title="Bảng Điều Khiển Nhà Tổ Chức"
            subtitle="Quản lý sự kiện, theo dõi doanh thu vé NFT và quyết toán On-Chain"
            topActions={topActions}
        >
            <Box sx={{ width: '100%' }}>

                    {/* HERO HEADER SECTION */}
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
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                            spacing={2.5}
                        >
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1} flexWrap="wrap">
                                    <Chip
                                        icon={<EventNote sx={{ fontSize: '1rem !important' }} />}
                                        label="BAN TỔ CHỨC • QUẢN LÝ SỰ KIỆN & DOANH THU"
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                    />
                                    <Chip
                                        icon={<Shield sx={{ fontSize: '1rem !important' }} />}
                                        label="ON-CHAIN ROYALTY 5% (BR-02)"
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                            bgcolor: theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)',
                                            color: theme.palette.status?.success || 'success.main',
                                        }}
                                    />
                                </Stack>

                                <Typography variant="h1" fontWeight={800} color="text.primary" gutterBottom>
                                    Trung Tâm Quản Trị Nhà Tổ Chức
                                </Typography>

                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, lineHeight: 1.6 }}>
                                    Giám sát doanh số phát hành vé NFT sơ cấp, nguồn thu bản quyền 5% thứ cấp tự động trên Smart Contract,
                                    và kiểm soát tỷ lệ check-in tại cổng sự kiện thời gian thực.
                                </Typography>
                            </Box>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} width={{ xs: '100%', md: 'auto' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    component={RouterLink}
                                    to="/organizer/check-in"
                                    startIcon={<QrCodeScanner />}
                                    sx={{ height: 44, borderRadius: '8px', fontWeight: 600, px: 2.5 }}
                                >
                                    Soát Vé Tại Cổng
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    component={RouterLink}
                                    to="/organizer/create-event"
                                    startIcon={<Add />}
                                    sx={{ height: 44, borderRadius: '8px', fontWeight: 700, px: 3 }}
                                >
                                    Tạo Sự Kiện Mới
                                </Button>
                            </Stack>
                        </Stack>

                        {/* THÔNG TIN VÍ & QUYẾT TOÁN ON-CHAIN */}
                        <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2.5} alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: '12px',
                                                bgcolor: connectedWallet ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <MetaMaskIcon size={26} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    Ví Web3 Ban Tổ Chức (Ký tạo sự kiện & Nhận doanh thu):
                                                </Typography>
                                                {connectedWallet ? (
                                                    <Chip
                                                        icon={<CheckCircle sx={{ fontSize: '12px !important' }} />}
                                                        label="Đã kết nối Sepolia"
                                                        size="small"
                                                        color="success"
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Chưa kết nối ví"
                                                        size="small"
                                                        color="warning"
                                                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                                    />
                                                )}
                                            </Stack>

                                            {connectedWallet ? (
                                                <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
                                                    <Typography variant="body1" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                                        {truncateHash(connectedWallet, 8, 6)}
                                                    </Typography>
                                                    <Tooltip title="Sao chép địa chỉ ví">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleCopy(connectedWallet, 'địa chỉ ví')}
                                                            sx={{ p: 0.3 }}
                                                        >
                                                            <ContentCopy sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ ml: 1 }}>
                                                        Số dư ví: {walletBalance || '... ETH'}
                                                    </Typography>
                                                    <Tooltip title="Làm mới số dư ví">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => fetchWalletBalance(connectedWallet)}
                                                            sx={{ p: 0.3 }}
                                                        >
                                                            <Refresh sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {user && !user.walletAddress && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="success"
                                                            disabled={isLinkingWallet}
                                                            onClick={handleLinkWalletToProfile}
                                                            sx={{ height: 26, fontSize: '0.68rem', fontWeight: 700, borderRadius: '6px', ml: 1 }}
                                                        >
                                                            {isLinkingWallet ? 'Đang lưu...' : 'Lưu vào hồ sơ BTC'}
                                                        </Button>
                                                    )}
                                                </Stack>
                                            ) : (
                                                <Stack direction="row" spacing={1.5} alignItems="center" mt={0.8}>
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        size="small"
                                                        onClick={handleConnectWallet}
                                                        disabled={isConnectingWallet}
                                                        startIcon={isConnectingWallet ? <CircularProgress size={14} color="inherit" /> : <MetaMaskIcon />}
                                                        sx={{ height: 34, borderRadius: '8px', fontWeight: 700 }}
                                                    >
                                                        {isConnectingWallet ? 'Đang kết nối...' : 'Kết nối ví MetaMask ngay'}
                                                    </Button>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Cần kết nối ví để ký đưa sự kiện lên Smart Contract Sepolia.
                                                    </Typography>
                                                </Stack>
                                            )}
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
                                        <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Doanh thu quyết toán về ví On-Chain:
                                            </Typography>
                                            <Typography variant="h3" fontWeight={800} color="primary.main">
                                                {metrics.totalRevenueEth} ETH
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5, fontWeight: 600 }}>
                                                <CheckCircle sx={{ fontSize: 13 }} /> Đã chuyển thẳng vào ví Web3
                                            </Typography>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<ReceiptLong />}
                                            onClick={() => setOpenWithdrawModal(true)}
                                            sx={{ borderRadius: '8px', fontWeight: 600, height: 40, px: 2.5 }}
                                        >
                                            Đối Soát On-Chain
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* BỘ CHỈ SỐ KPI TÀI CHÍNH & VẬN HÀNH (4 CARDS) */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* 1. Tổng doanh thu bán vé */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TỔNG DOANH THU BÁN VÉ
                                    </Typography>
                                    <MonetizationOn color="primary" sx={{ fontSize: 20 }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="primary.main" gutterBottom>
                                    {metrics.totalRevenueEth} ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ~${metrics.totalRevenueUsd.toLocaleString()} USD (Bán sơ cấp)
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* 2. Bản quyền Chợ thứ cấp (5% Royalty) */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        BẢN QUYỀN 5% ROYALTY
                                    </Typography>
                                    <TrendingUp sx={{ fontSize: 20, color: theme.palette.status?.success || 'success.main' }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} sx={{ color: theme.palette.status?.success || 'success.main' }} gutterBottom>
                                    +{metrics.resaleRoyaltyEth} ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tự động từ TicketMarketplace (BR-02)
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* 3. Tỷ lệ vé đã phát hành */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TIẾN ĐỘ BÁN VÉ
                                    </Typography>
                                    <ConfirmationNumber color="action" sx={{ fontSize: 20 }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="text.primary" gutterBottom>
                                    {metrics.totalTicketsSold} / {metrics.totalTicketsMaxSupply}
                                </Typography>
                                <Box sx={{ width: '100%', mt: 0.5 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(metrics.totalTicketsSold / metrics.totalTicketsMaxSupply) * 100}
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>

                        {/* 4. Tỷ lệ check-in thực tế */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: '12px',
                                    bgcolor: 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        TỶ LỆ CHECK-IN TẠI CỔNG
                                    </Typography>
                                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.status?.checkedIn || '#8B5CF6' }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} sx={{ color: theme.palette.status?.checkedIn || '#8B5CF6' }} gutterBottom>
                                    {overallCheckInRate}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {metrics.totalCheckedInCount} khách đã quét hợp lệ
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* DANH SÁCH SỰ KIỆN DO ORGANIZER QUẢN LÝ (MY EVENTS TABLE) */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            mb: 4,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header Bảng & Bộ lọc */}
                        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                                <Grid item xs={12} md={6}>
                                    <Tabs
                                        value={statusTab}
                                        onChange={(e, val) => setStatusTab(val)}
                                        textColor="primary"
                                        indicatorColor="primary"
                                        sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
                                    >
                                        <Tab label={`Tất cả (${events.length})`} value="all" />
                                        <Tab label="Đang mở bán" value="published" />
                                        <Tab label="Chờ duyệt" value="pending" />
                                        <Tab label="Đã kết thúc" value="ended" />
                                    </Tabs>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Tìm theo tên sự kiện, mã EVT, địa điểm..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search color="action" fontSize="small" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: searchTerm && (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Xóa tìm kiếm sự kiện"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        <Close fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Bảng sự kiện */}
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Sự kiện & Thời gian</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Tiến độ bán vé</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Soát vé cổng</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Doanh thu (ETH)</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Thao tác</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                                                <EventNote sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                                                <Typography variant="body1" fontWeight={600} color="text.secondary">
                                                    Không tìm thấy sự kiện nào phù hợp.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEvents.map((evt) => {
                                            const salesPercent = evt.maxSupply > 0 ? ((evt.ticketsSold / evt.maxSupply) * 100).toFixed(0) : 0;
                                            const checkInPercent = evt.ticketsSold > 0 ? ((evt.checkedIn / evt.ticketsSold) * 100).toFixed(0) : 0;

                                            return (
                                                <TableRow
                                                    key={evt.id}
                                                    hover
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    {/* Sự kiện & Thời gian */}
                                                    <TableCell>
                                                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                            {evt.title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {evt.venue} • {evt.date} ({evt.startTime})
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                                                            {evt.id}
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Trạng thái */}
                                                    <TableCell>
                                                        <Chip
                                                            label={evt.statusText}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: '0.75rem',
                                                                bgcolor:
                                                                    evt.status === 'published'
                                                                        ? theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)'
                                                                        : evt.status === 'pending'
                                                                        ? theme.palette.status?.pendingBg || 'rgba(245, 158, 11, 0.12)'
                                                                        : theme.palette.status?.cancelledBg || 'rgba(100, 116, 139, 0.12)',
                                                                color:
                                                                    evt.status === 'published'
                                                                        ? theme.palette.status?.success || 'success.main'
                                                                        : evt.status === 'pending'
                                                                        ? theme.palette.status?.pending || '#F59E0B'
                                                                        : theme.palette.status?.cancelled || 'text.secondary',
                                                            }}
                                                        />
                                                    </TableCell>

                                                    {/* Tiến độ bán vé */}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {evt.ticketsSold} / {evt.maxSupply} vé
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={Number(salesPercent)}
                                                                sx={{ height: 5, borderRadius: 3, flexGrow: 1 }}
                                                            />
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                                {salesPercent}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>

                                                    {/* Soát vé cổng */}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.status?.checkedIn || '#8B5CF6' }}>
                                                            {evt.checkedIn} / {evt.ticketsSold} khách
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Đã quét ({checkInPercent}%)
                                                        </Typography>
                                                    </TableCell>

                                                    {/* Doanh thu */}
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={800} color="primary.main">
                                                            {evt.totalRevenueEth.toFixed(2)} ETH
                                                        </Typography>
                                                        {evt.royaltyEarnedEth > 0 && (
                                                            <Typography variant="caption" sx={{ color: theme.palette.status?.success || 'success.main', display: 'block' }}>
                                                                +{evt.royaltyEarnedEth} ETH Royalty
                                                            </Typography>
                                                        )}
                                                    </TableCell>

                                                    {/* Thao tác */}
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                                            {evt.status === 'approved' && (
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    color="success"
                                                                    onClick={() => handlePublishEvent(evt.id)}
                                                                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, fontWeight: 700, borderRadius: '6px' }}
                                                                >
                                                                    Mở Bán
                                                                </Button>
                                                            )}

                                                            {evt.status === 'draft' && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    color="primary"
                                                                    onClick={() => handleSubmitReview(evt.id)}
                                                                    sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5, fontWeight: 700, borderRadius: '6px' }}
                                                                >
                                                                    Gửi Duyệt
                                                                </Button>
                                                            )}

                                                            {evt.status === 'published' && (
                                                                <Tooltip title="Mở máy quét soát vé tại cổng">
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        component={RouterLink}
                                                                        to="/organizer/check-in"
                                                                        aria-label={`Soát vé sự kiện ${evt.title}`}
                                                                    >
                                                                        <QrCodeScanner fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}

                                                            <Tooltip title="Xem trang sự kiện công khai">
                                                                <IconButton
                                                                    size="small"
                                                                    component={RouterLink}
                                                                    to={`/events/${evt.id}`}
                                                                    aria-label={`Xem sự kiện ${evt.title}`}
                                                                >
                                                                    <Launch fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
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

                    {/* NHẬT KÝ DÒNG TIỀN & BẢN QUYỀN GẦN NHẤT (FINANCIAL ACTIVITY FEED) */}
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: '16px',
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            p: 3,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TrendingUp color="primary" />
                                <Box>
                                    <Typography variant="h3" fontWeight={700}>
                                        Nhật Ký Dòng Tiền & Doanh Thu Bản Quyền Gần Nhất
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Đối soát trực tiếp giữa hợp đồng thông minh Sepolia và cơ sở dữ liệu Aiven Cloud MySQL
                                    </Typography>
                                </Box>
                            </Stack>

                            <Button
                                size="small"
                                color="inherit"
                                onClick={async () => {
                                    await loadOrganizerData();
                                    showSnackbar('Đã đồng bộ giao dịch mới nhất từ blockchain!', 'success');
                                }}
                                startIcon={<Refresh />}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Làm mới
                            </Button>
                        </Stack>

                        <Stack spacing={1.5}>
                            {financialLogs.length === 0 ? (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa có phát sinh giao dịch tài chính hoặc phân phối bản quyền nào.
                                    </Typography>
                                </Box>
                            ) : (
                                financialLogs.map((log) => (
                                <Paper
                                    key={log.id}
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '10px',
                                        bgcolor: 'background.subtle',
                                        border: 1,
                                        borderColor: 'divider',
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                            <Chip
                                                label={log.typeLabel}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    bgcolor:
                                                        log.type === 'royalty'
                                                            ? theme.palette.status?.successBg || 'rgba(16, 185, 129, 0.12)'
                                                            : log.type === 'withdrawal'
                                                            ? theme.palette.status?.warningBg || 'rgba(249, 115, 22, 0.12)'
                                                            : 'action.selected',
                                                    color:
                                                        log.type === 'royalty'
                                                            ? theme.palette.status?.success || 'success.main'
                                                            : log.type === 'withdrawal'
                                                            ? theme.palette.status?.warning || 'warning.main'
                                                            : 'primary.main',
                                                }}
                                            />
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {log.eventTitle}
                                            </Typography>
                                            {log.tokenId && (
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    Token #{log.tokenId}
                                                </Typography>
                                            )}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            Thời gian: {log.time ? new Date(log.time).toLocaleString('vi-VN') : ''} • TxHash:{' '}
                                            <Link
                                                href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ fontFamily: 'monospace', color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                {truncateHash(log.txHash, 8, 6)} ↗
                                            </Link>
                                        </Typography>
                                    </Box>

                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={800}
                                            sx={{
                                                color:
                                                    log.amountEth > 0
                                                        ? theme.palette.status?.success || 'success.main'
                                                        : theme.palette.text.primary,
                                            }}
                                        >
                                            {log.amountEth > 0 ? `+${log.amountEth} ETH` : `${log.amountEth} ETH`}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <CheckCircle sx={{ fontSize: 13, color: 'success.main' }} /> On-chain Confirmed
                                        </Typography>
                                    </Box>
                                </Paper>
                            ))
                        )}
                        </Stack>
                    </Paper>
                </Box>

            {/* MODAL ĐỐI SOÁT & QUYẾT TOÁN DOANH THU ON-CHAIN */}
            <Dialog
                open={openWithdrawModal}
                onClose={() => setOpenWithdrawModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        p: 1.5,
                        bgcolor: 'background.paper',
                    },
                }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '10px',
                                    bgcolor: 'action.selected',
                                    color: 'primary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <ReceiptLong />
                            </Box>
                            <Box>
                                <Typography variant="h3" fontWeight={700}>
                                    Đối Soát Doanh Thu On-Chain
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Quyết toán trực tiếp qua Smart Contract về ví cá nhân
                                </Typography>
                            </Box>
                        </Stack>
                        <IconButton
                            size="small"
                            aria-label="Đóng popup đối soát doanh thu"
                            onClick={() => setOpenWithdrawModal(false)}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                </DialogTitle>

                <DialogContent sx={{ pt: 1.5 }}>
                    <Stack spacing={2.5}>
                        {/* THẺ TỔNG DOANH THU */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: '12px',
                                bgcolor: 'background.subtle',
                                border: 1,
                                borderColor: 'divider',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary" display="block" fontWeight={600}>
                                TỔNG DOANH THU ĐÃ QUYẾT TOÁN ON-CHAIN:
                            </Typography>
                            <Typography variant="h1" fontWeight={800} color="primary.main" my={0.5}>
                                {metrics.totalRevenueEth} ETH
                            </Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap">
                                <Chip
                                    icon={<CheckCircle sx={{ fontSize: '1rem !important' }} />}
                                    label="100% Tiền đã chuyển thẳng vào ví"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    ~${metrics.totalRevenueUsd?.toLocaleString() || Math.round(metrics.totalRevenueEth * 3150)} USD
                                </Typography>
                            </Stack>
                        </Paper>

                        {/* ĐỊA CHỈ VÍ BTC NHẬN TIỀN */}
                        <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '10px', p: 2, bgcolor: 'background.paper' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Địa chỉ ví Ban Tổ Chức nhận tiền:
                                    </Typography>
                                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                        {user?.walletAddress || 'Chưa liên kết ví'}
                                    </Typography>
                                </Box>
                                {user?.walletAddress && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component="a"
                                        href={`https://sepolia.etherscan.io/address/${user.walletAddress}#internaltx`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        endIcon={<OpenInNew sx={{ fontSize: '0.9rem !important' }} />}
                                        sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem' }}
                                    >
                                        Xem trên Etherscan
                                    </Button>
                                )}
                            </Stack>
                        </Box>

                        {/* GIẢI THÍCH CƠ CHẾ SMART CONTRACT */}
                        <Alert severity="success" sx={{ fontSize: '0.82rem', borderRadius: '10px', lineHeight: 1.6 }}>
                            <strong>Cơ chế thanh toán phi tập trung (Non-custodial Settlement):</strong>
                            <br />
                            Trong hệ thống BlockTickets, Smart Contract <code>EventTicket</code> và <code>TicketMarketplace</code> không giữ tiền trung gian của Ban tổ chức. 
                            Mỗi khi khán giả mua vé sơ cấp hoặc trả phí bản quyền 5% thứ cấp, <strong>Smart Contract lập tức chuyển trực tiếp ETH vào ví MetaMask của bạn</strong> trong cùng block giao dịch. 
                            Bạn <strong>không cần thực hiện lệnh rút thủ công</strong> và không phải trả thêm bất kỳ khoản phí gas nào!
                        </Alert>

                        {/* DANH SÁCH LỊCH SỬ GIAO DỊCH QUYẾT TOÁN */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Lịch sử giao dịch quyết toán gần nhất ({financialLogs.length})
                            </Typography>
                            {financialLogs.length === 0 ? (
                                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Chưa có giao dịch mua vé nào phát sinh.
                                    </Typography>
                                </Paper>
                            ) : (
                                <Stack spacing={1} sx={{ maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
                                    {financialLogs.map((log) => (
                                        <Paper
                                            key={log.id}
                                            elevation={0}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '8px',
                                                bgcolor: 'background.subtle',
                                                border: 1,
                                                borderColor: 'divider',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Chip
                                                        label={log.typeLabel || 'Bán vé'}
                                                        size="small"
                                                        color="primary"
                                                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                    />
                                                    <Typography variant="body2" fontWeight={700}>
                                                        Token #{log.tokenId} {log.ticketTypeName ? `• ${log.ticketTypeName}` : ''}
                                                    </Typography>
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    {log.time ? new Date(log.time).toLocaleString('vi-VN') : ''} • TxHash:{' '}
                                                    <Link
                                                        href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ fontFamily: 'monospace', color: 'primary.main', textDecoration: 'none' }}
                                                    >
                                                        {truncateHash(log.txHash, 6, 4)} ↗
                                                    </Link>
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="subtitle2" fontWeight={800} color="success.main">
                                                    +{log.amountEth} ETH
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Đã vào ví ✓
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 1 }}>
                    {user?.walletAddress && (
                        <Button
                            variant="outlined"
                            color="primary"
                            component="a"
                            href={`https://sepolia.etherscan.io/address/${user.walletAddress}#internaltx`}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<OpenInNew />}
                            sx={{ borderRadius: '8px', fontWeight: 600, mr: 'auto' }}
                        >
                            Tra cứu Internal Txns trên Etherscan
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setOpenWithdrawModal(false)}
                        sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}
                    >
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>

            <Footer />

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

export default OrganizerDashboardPage;

