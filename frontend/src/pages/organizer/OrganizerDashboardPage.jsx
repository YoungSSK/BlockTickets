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
    CircularProgress,
    Pagination,
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
    LocationOn,
    Schedule,
    ReceiptLong,
    ArrowForward,
    Settings,
    SwapHoriz,
    LinkOff,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
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

    // Modal đối soát doanh thu on-chain
    const [openWithdrawModal, setOpenWithdrawModal] = useState(false);

    // Modal xem chi tiết sự kiện cho Ban tổ chức
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [openDetailModal, setOpenDetailModal] = useState(false);

    // State ví Web3 của Ban tổ chức
    const [connectedWallet, setConnectedWallet] = useState(user?.walletAddress || '');
    const [walletBalance, setWalletBalance] = useState('');
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);
    const [isLinkingWallet, setIsLinkingWallet] = useState(false);

    // Phân trang nhật ký giao dịch (10 transactions/trang)
    const [logsPage, setLogsPage] = useState(1);
    const LOGS_PER_PAGE = 10;

    const totalLogsPages = Math.ceil(financialLogs.length / LOGS_PER_PAGE) || 1;
    const paginatedLogs = useMemo(() => {
        const start = (logsPage - 1) * LOGS_PER_PAGE;
        return financialLogs.slice(start, start + LOGS_PER_PAGE);
    }, [financialLogs, logsPage]);

    useEffect(() => {
        if (logsPage > totalLogsPages) {
            setLogsPage(1);
        }
    }, [totalLogsPages, logsPage]);

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
            if (sessionStorage.getItem('blocktickets_wallet_disconnected') === 'true') {
                return;
            }
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
                sessionStorage.removeItem('blocktickets_wallet_disconnected');
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
            sessionStorage.removeItem('blocktickets_wallet_disconnected');
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

    // Đổi tài khoản ví MetaMask bằng EIP-2255 wallet_requestPermissions
    const handleSwitchWallet = async () => {
        if (!window.ethereum) {
            showSnackbar('Vui lòng cài đặt tiện ích mở rộng MetaMask trên trình duyệt!', 'warning');
            return;
        }

        setIsConnectingWallet(true);
        try {
            sessionStorage.removeItem('blocktickets_wallet_disconnected');
            // Yêu cầu quyền truy cập tài khoản mới -> MetaMask bắt buộc mở popup chọn tài khoản
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });

            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts[0]) {
                const addr = accounts[0];
                setConnectedWallet(addr);
                await fetchWalletBalance(addr);
                showSnackbar(`Đã chuyển sang ví MetaMask: ${truncateHash(addr, 6, 4)}`, 'success');
            }
        } catch (err) {
            if (err?.code === 4001 || err?.info?.error?.code === 4001) {
                showSnackbar('Bạn đã đóng popup đổi tài khoản MetaMask.', 'info');
            } else {
                console.error('Lỗi khi đổi tài khoản ví MetaMask:', err);
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    if (accounts && accounts[0]) {
                        const addr = accounts[0];
                        setConnectedWallet(addr);
                        await fetchWalletBalance(addr);
                        showSnackbar(`Đã kết nối ví: ${truncateHash(addr, 6, 4)}`, 'success');
                    }
                } catch (fallbackErr) {
                    showSnackbar(fallbackErr.message || 'Lỗi khi kết nối ví.', 'error');
                }
            }
        } finally {
            setIsConnectingWallet(false);
        }
    };

    // Ngắt kết nối ví MetaMask
    const handleDisconnectWallet = async () => {
        sessionStorage.setItem('blocktickets_wallet_disconnected', 'true');
        try {
            if (window.ethereum?.request) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_revokePermissions',
                        params: [{ eth_accounts: {} }],
                    });
                } catch {
                    // ignore
                }
            }
        } finally {
            setConnectedWallet('');
            setWalletBalance('');
            showSnackbar('Đã ngắt kết nối ví MetaMask.', 'info');
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
                    else if (e.status === 'ended') statusText = 'ĐÃ KẾT THÚC';

                    return {
                        id: e.id,
                        title: e.title,
                        description: e.description || '',
                        bannerUrl: e.bannerUrl || '',
                        category: e.category || 'sports',
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
                        status: e.status,
                        statusText,
                        onChainEventId: e.onChainEventId,
                        ticketsSold,
                        maxSupply,
                        checkedIn: 0,
                        totalRevenueEth: revEth,
                        royaltyEarnedEth: +(revEth * 0.05).toFixed(3),
                        ticketTypes: Array.isArray(e.ticketTypes) ? e.ticketTypes : [],
                        raw: e,
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

    // Xử lý mở modal xem chi tiết sự kiện dành cho Ban tổ chức
    const handleViewEventDetail = (eventItem) => {
        setSelectedEvent(eventItem);
        setOpenDetailModal(true);
    };

    // Top 5 sự kiện gần đây hiển thị trên Dashboard
    const recentEvents = useMemo(() => {
        return events.slice(0, 5);
    }, [events]);

    // Tính tỷ lệ check-in tổng thể
    const overallCheckInRate = metrics.totalTicketsSold > 0
        ? ((metrics.totalCheckedInCount / metrics.totalTicketsSold) * 100).toFixed(1)
        : '0.0';

    return (
        <DashboardLayout
            role="organizer"
            title="Trung Tâm Điều Hành Ban Tổ Chức"
            hideHeaderActions={true}
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
                        <Box>
                            <Typography variant="h1" fontWeight={800} color="text.primary">
                                Báo Cáo Hiệu Suất & Doanh Thu
                            </Typography>
                        </Box>

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
                                                    Ví Web3 Nhận Doanh Thu & Ký Smart Contract:
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
                                                <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap" sx={{ gap: 1 }}>
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
                                                    <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ ml: 0.5 }}>
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

                                                    {/* Nút Đổi tài khoản ví MetaMask */}
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                        disabled={isConnectingWallet}
                                                        onClick={handleSwitchWallet}
                                                        startIcon={<SwapHoriz sx={{ fontSize: 14 }} />}
                                                        sx={{ height: 28, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
                                                    >
                                                        Đổi ví MetaMask
                                                    </Button>

                                                    {/* Nút Ngắt kết nối ví */}
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={handleDisconnectWallet}
                                                        startIcon={<LinkOff sx={{ fontSize: 14 }} />}
                                                        sx={{ height: 28, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
                                                    >
                                                        Ngắt kết nối
                                                    </Button>

                                                    {/* Lưu hoặc Cập nhật ví vào hồ sơ BTC */}
                                                    {user && (!user.walletAddress || user.walletAddress.toLowerCase() !== connectedWallet.toLowerCase()) && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            disabled={isLinkingWallet}
                                                            onClick={handleLinkWalletToProfile}
                                                            sx={{ height: 28, fontSize: '0.72rem', fontWeight: 700, borderRadius: '6px' }}
                                                        >
                                                            {isLinkingWallet ? 'Đang lưu...' : user.walletAddress ? 'Cập nhật ví vào hồ sơ BTC' : 'Lưu vào hồ sơ BTC'}
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
                                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Doanh Thu Quyết Toán Trực Tiếp (On-Chain):
                                        </Typography>
                                        <Typography variant="h3" fontWeight={800} color="primary.main">
                                            {metrics.totalRevenueEth} ETH
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5, fontWeight: 600 }}>
                                            <CheckCircle sx={{ fontSize: 13 }} /> 100% Doanh thu đã thanh khoản vào ví Web3
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>

                    {/* BỘ CHỈ SỐ KPI TÀI CHÍNH & VẬN HÀNH (3 CARDS) */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* 1. Tổng doanh thu bán vé */}
                        <Grid item xs={12} sm={6} md={4}>
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
                                        TỔNG DOANH THU PHÁT HÀNH
                                    </Typography>
                                    <MonetizationOn color="primary" sx={{ fontSize: 20 }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="primary.main" gutterBottom>
                                    {metrics.totalRevenueEth} ETH
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Doanh số từ vé mở bán chính thức
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* 2. Tổng số vé NFT đã bán ra */}
                        <Grid item xs={12} sm={6} md={4}>
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
                                        VÉ NFT ĐÃ PHÁT HÀNH
                                    </Typography>
                                    <ConfirmationNumber color="primary" sx={{ fontSize: 20 }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} color="text.primary" gutterBottom>
                                    {metrics.totalTicketsSold} Vé
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Phân phối trên toàn bộ sự kiện
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* 3. Tỷ lệ check-in thực tế */}
                        <Grid item xs={12} sm={6} md={4}>
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
                                        HIỆU SUẤT CHECK-IN THỰC TẾ
                                    </Typography>
                                    <CheckCircle sx={{ fontSize: 20, color: theme.palette.status?.checkedIn || '#8B5CF6' }} />
                                </Stack>
                                <Typography variant="h2" fontWeight={800} sx={{ color: theme.palette.status?.checkedIn || '#8B5CF6' }} gutterBottom>
                                    {overallCheckInRate}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {metrics.totalCheckedInCount} lượt soát vé hợp lệ tại cổng
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
                        {/* Header Tiêu đề & Nút Xem tất cả */}
                        <Box
                            sx={{
                                p: 2.5,
                                borderBottom: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <EventNote color="primary" sx={{ fontSize: 26 }} />
                                <Box>
                                    <Typography variant="h3" fontWeight={700} color="text.primary">
                                        Sự Kiện Hoạt Động Gần Đây
                                    </Typography>
                                </Box>
                            </Stack>

                            <Button
                                component={RouterLink}
                                to="/organizer/events"
                                endIcon={<ArrowForward />}
                                color="primary"
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                Xem tất cả ({events.length})
                            </Button>
                        </Box>

                        {/* Bảng sự kiện */}
                        <TableContainer>
                            <Table sx={{ minWidth: 800 }}>
                                <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Sự kiện & Địa điểm</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Tiến độ phát hành</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Soát vé tại cổng</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>Doanh thu (ETH)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6 }}>
                                                <EventNote sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                                                <Typography variant="body1" fontWeight={600} color="text.secondary">
                                                    Bạn chưa có sự kiện nào được tạo.
                                                </Typography>
                                                <Button
                                                    component={RouterLink}
                                                    to="/organizer/events"
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<Add />}
                                                    sx={{ mt: 1.5, borderRadius: '8px', fontWeight: 700 }}
                                                >
                                                    Tạo sự kiện ngay
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentEvents.map((evt) => {
                                            const salesPercent = evt.maxSupply > 0 ? ((evt.ticketsSold / evt.maxSupply) * 100).toFixed(0) : 0;
                                            const checkInPercent = evt.ticketsSold > 0 ? ((evt.checkedIn / evt.ticketsSold) * 100).toFixed(0) : 0;

                                            return (
                                                <TableRow
                                                    key={evt.id}
                                                    hover
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    {/* Sự kiện & Thời gian */}
                                                    <TableCell
                                                        onClick={() => handleViewEventDetail(evt)}
                                                        sx={{ cursor: 'pointer', py: 1.8 }}
                                                    >
                                                        <Stack direction="row" spacing={2} alignItems="center">
                                                            {/* Banner ảnh bên trái */}
                                                            <Box
                                                                component="img"
                                                                src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
                                                                alt={evt.title}
                                                                sx={{
                                                                    width: { xs: 60, sm: 76 },
                                                                    height: { xs: 46, sm: 54 },
                                                                    borderRadius: '8px',
                                                                    objectFit: 'cover',
                                                                    flexShrink: 0,
                                                                    border: 1,
                                                                    borderColor: 'divider',
                                                                    bgcolor: 'background.subtle',
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                                                                    transition: 'transform 0.2s',
                                                                    '&:hover': {
                                                                        transform: 'scale(1.05)',
                                                                    },
                                                                }}
                                                            />

                                                            {/* Nội dung chữ bên phải */}
                                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                <Typography
                                                                    variant="subtitle2"
                                                                    fontWeight={700}
                                                                    color="text.primary"
                                                                    sx={{
                                                                        transition: 'color 0.2s',
                                                                        '&:hover': { color: 'primary.main', textDecoration: 'underline' },
                                                                        fontSize: '0.92rem',
                                                                        lineHeight: 1.3,
                                                                        mb: 0.3,
                                                                    }}
                                                                >
                                                                    {evt.title}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    display="block"
                                                                    noWrap
                                                                    sx={{ maxWidth: { xs: 260, sm: 380, md: 460 }, mb: 0.3 }}
                                                                >
                                                                    {evt.venue} • {evt.date} ({evt.startTime})
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                                                                    Mã sự kiện: #{evt.id}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
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
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight={800} color="primary.main">
                                                            {Number(evt.totalRevenueEth || 0).toFixed(4).replace(/\.?0+$/, '')} ETH
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {events.length > 5 && (
                            <Box
                                sx={{
                                    p: 1.5,
                                    textAlign: 'center',
                                    bgcolor: 'background.subtle',
                                    borderTop: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Button
                                    component={RouterLink}
                                    to="/organizer/events"
                                    endIcon={<ArrowForward />}
                                    size="small"
                                    color="inherit"
                                    sx={{ fontWeight: 600, textTransform: 'none' }}
                                >
                                    Xem thêm {events.length - 5} sự kiện khác tại trang Quản lý sự kiện →
                                </Button>
                            </Box>
                        )}
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
                                        Nhật Ký Giao Dịch
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
                                        Chưa có phát sinh giao dịch tài chính nào.
                                    </Typography>
                                </Box>
                            ) : (
                                paginatedLogs.map((log) => (
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

                        {/* Phân trang 10 giao dịch / trang */}
                        {financialLogs.length > LOGS_PER_PAGE && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Pagination
                                    count={totalLogsPages}
                                    page={logsPage}
                                    onChange={(e, val) => setLogsPage(val)}
                                    color="primary"
                                    shape="rounded"
                                    showFirstButton
                                    showLastButton
                                />
                            </Box>
                        )}
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

            {/* MODAL XEM CHI TIẾT SỰ KIỆN CHO BAN TỔ CHỨC */}
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
                        position: 'relative',
                    },
                }}
            >
                {/* NÚT ĐÓNG DẤU X TỔNG QUÁT TRÊN CÙNG */}
                <IconButton
                    onClick={() => setOpenDetailModal(false)}
                    aria-label="Đóng popup chi tiết sự kiện"
                    sx={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        zIndex: 1400,
                        bgcolor: 'rgba(0, 0, 0, 0.65)',
                        color: '#ffffff',
                        backdropFilter: 'blur(6px)',
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.9)',
                            transform: 'scale(1.08)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    <Close fontSize="small" />
                </IconButton>

                {selectedEvent && (
                    <>
                        {/* BANNER / ẢNH SỰ KIỆN */}
                        {selectedEvent.bannerUrl ? (
                            <Box
                                component="img"
                                src={selectedEvent.bannerUrl}
                                alt={selectedEvent.title}
                                sx={{
                                    width: '100%',
                                    height: { xs: 180, sm: 220 },
                                    objectFit: 'cover',
                                    display: 'block',
                                    bgcolor: 'background.subtle',
                                }}
                            />
                        ) : null}

                        {/* TIÊU ĐỀ SỰ KIỆN & TRẠNG THÁI */}
                        <Box
                            sx={{
                                p: { xs: 2.5, sm: 3 },
                                pr: !selectedEvent.bannerUrl ? 7 : { xs: 2.5, sm: 3 },
                                pb: 1.5,
                                bgcolor: 'background.paper',
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                <Chip
                                    label={selectedEvent.statusText}
                                    size="small"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        bgcolor:
                                            selectedEvent.status === 'published'
                                                ? 'rgba(16, 185, 129, 0.15)'
                                                : selectedEvent.status === 'pending'
                                                ? 'rgba(245, 158, 11, 0.15)'
                                                : 'action.hover',
                                        color:
                                            selectedEvent.status === 'published'
                                                ? '#10B981'
                                                : selectedEvent.status === 'pending'
                                                ? '#F59E0B'
                                                : 'text.secondary',
                                        border: 1,
                                        borderColor:
                                            selectedEvent.status === 'published'
                                                ? 'rgba(16, 185, 129, 0.3)'
                                                : selectedEvent.status === 'pending'
                                                ? 'rgba(245, 158, 11, 0.3)'
                                                : 'divider',
                                    }}
                                />
                            </Stack>
                            <Typography
                                variant="h2"
                                fontWeight={800}
                                color="text.primary"
                                sx={{
                                    fontSize: { xs: '1.35rem', sm: '1.65rem' },
                                    lineHeight: 1.3,
                                }}
                            >
                                {selectedEvent.title}
                            </Typography>
                        </Box>

                        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Stack spacing={3}>
                                {/* BỘ CHỈ SỐ NHANH CỦA SỰ KIỆN (3 CARDS) */}
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Vé đã phát hành:
                                            </Typography>
                                            <Typography variant="h3" fontWeight={800} color="primary.main">
                                                {selectedEvent.ticketsSold} / {selectedEvent.maxSupply}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Tỷ lệ: {selectedEvent.maxSupply > 0 ? ((selectedEvent.ticketsSold / selectedEvent.maxSupply) * 100).toFixed(0) : 0}%
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Doanh thu bán vé:
                                            </Typography>
                                            <Typography variant="h3" fontWeight={800} color="primary.main">
                                                {Number(selectedEvent.totalRevenueEth || 0).toFixed(4).replace(/\.?0+$/, '')} ETH
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Soát vé tại cổng:
                                            </Typography>
                                            <Typography variant="h3" fontWeight={800} sx={{ color: '#8B5CF6' }}>
                                                {selectedEvent.checkedIn} khách
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Đã quét mã QR
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* THỜI GIAN & ĐỊA ĐIỂM TỔ CHỨC */}
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EventNote sx={{ fontSize: 18, color: 'primary.main' }} /> Thời Gian & Địa Điểm Tổ Chức
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                        <Grid item xs={12} sm={6}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Schedule sx={{ fontSize: 15 }} /> Thời gian bắt đầu:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedEvent.startTime || 'Chưa thiết lập'}
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Schedule sx={{ fontSize: 15 }} /> Thời gian kết thúc:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedEvent.endTime || 'Chưa thiết lập'}
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Divider sx={{ my: 0.5 }} />
                                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocationOn sx={{ fontSize: 15 }} /> Địa điểm tổ chức:
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {selectedEvent.venueName ? `${selectedEvent.venueName} - ` : ''}
                                                    {selectedEvent.venueAddress || selectedEvent.venue}
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Paper>

                                {/* MÔ TẢ NỘI DUNG SỰ KIỆN */}
                                {selectedEvent.description && (
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                            Mô Tả Chi Tiết Sự Kiện
                                        </Typography>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.subtle', border: 1, borderColor: 'divider' }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                                                {selectedEvent.description}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}

                                {/* DANH SÁCH CÁC HẠNG VÉ (TICKET TIERS) */}
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ConfirmationNumber sx={{ fontSize: 18, color: 'primary.main' }} /> Danh Sách Các Hạng Vé Đã Tạo ({selectedEvent.ticketTypes?.length || 0})
                                    </Typography>
                                    {(!selectedEvent.ticketTypes || selectedEvent.ticketTypes.length === 0) ? (
                                        <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.subtle', borderRadius: '10px' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Sự kiện chưa có hạng vé nào được tạo.
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {selectedEvent.ticketTypes.map((tt) => {
                                                const sold = Number(tt.currentSupply || tt.mintedAmount || 0);
                                                const max = Number(tt.maxSupply || 0);
                                                const percent = max > 0 ? ((sold / max) * 100).toFixed(0) : 0;
                                                const originalPrice = Number(tt.originalPrice || 0);
                                                const maxResale = +(originalPrice * 1.2).toFixed(4);

                                                return (
                                                    <Paper
                                                        key={tt.id}
                                                        elevation={0}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: '10px',
                                                            bgcolor: 'background.subtle',
                                                            border: 1,
                                                            borderColor: 'divider',
                                                        }}
                                                    >
                                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} mb={1}>
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                                                                    {tt.name}
                                                                </Typography>
                                                                {tt.description && (
                                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                                                        {tt.description}
                                                                    </Typography>
                                                                )}
                                                            </Box>

                                                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                                    {originalPrice} ETH
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary" display="block">
                                                                    Trần bán lại tối đa: {maxResale} ETH
                                                                </Typography>
                                                            </Box>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={Number(percent)}
                                                                sx={{ height: 6, borderRadius: 3, flexGrow: 1 }}
                                                            />
                                                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                                                                {sold} / {max} ({percent}%)
                                                            </Typography>
                                                        </Stack>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Box>

                                {/* THÔNG TIN HỢP ĐỒNG ON-CHAIN */}
                                <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.selected', border: 1, borderColor: 'divider' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Hợp đồng vé Smart Contract (Sepolia):
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                                {EVENT_TICKET_ADDRESS}
                                            </Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            component="a"
                                            href={`https://sepolia.etherscan.io/address/${EVENT_TICKET_ADDRESS}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            endIcon={<OpenInNew sx={{ fontSize: '0.85rem !important' }} />}
                                            sx={{ borderRadius: '6px', fontSize: '0.75rem', textTransform: 'none' }}
                                        >
                                            Xem Contract trên Etherscan
                                        </Button>
                                    </Stack>
                                </Paper>

                            </Stack>
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5, pt: 1.5, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                            {selectedEvent.status === 'approved' && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                        handlePublishEvent(selectedEvent.id);
                                        setOpenDetailModal(false);
                                    }}
                                    sx={{ borderRadius: '8px', fontWeight: 700, mr: 'auto' }}
                                >
                                    Mở Bán Sự Kiện Ngay
                                </Button>
                            )}

                            {selectedEvent.status === 'draft' && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        handleSubmitReview(selectedEvent.id);
                                        setOpenDetailModal(false);
                                    }}
                                    sx={{ borderRadius: '8px', fontWeight: 700, mr: 'auto' }}
                                >
                                    Gửi Duyệt Sự Kiện
                                </Button>
                            )}

                            <Button
                                variant="contained"
                                color="inherit"
                                onClick={() => setOpenDetailModal(false)}
                                sx={{ borderRadius: '8px', fontWeight: 600, px: 3, ml: 'auto' }}
                            >
                                Đóng
                            </Button>
                        </DialogActions>
                    </>
                )}
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

export default OrganizerDashboardPage;

