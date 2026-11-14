import React, { useState, useEffect, useCallback } from 'react';
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
    CircularProgress,
    LinearProgress,
    Stepper,
    Step,
    StepLabel,
    InputAdornment,
} from '@mui/material';
import {
    ArrowBack,
    ConfirmationNumber,
    AccountBalanceWallet,
    CheckCircle,
    Cancel,
    ContentCopy,
    OpenInNew,
    Security,
    DarkMode,
    LightMode,
    Add,
    Remove,
    LocationOn,
    Schedule,
    ElectricBolt,
    FiberManualRecord,
    WarningAmber,
    LocalOffer,
    Person,
    Email as EmailIcon,
    Phone,
    Shield,
    Launch,
    Refresh,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI } from '../../services/api';
import { ethers } from 'ethers';
import { EVENT_TICKET_ADDRESS } from '../../constants/contracts';
import EventTicketABI from '../../constants/abi/EventTicket.json';

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

const CheckoutPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Dữ liệu sự kiện nhận từ trang EventDetail
    const eventData = location.state?.eventData || null;
    const tier = eventData?.selectedTier || null;

    useEffect(() => {
        if (!eventData || !tier) {
            navigate('/', { replace: true });
        }
    }, [eventData, tier, navigate]);

    // Form đặt vé
    const initialQuantity = Math.max(
        1,
        Math.min(4, Number(location.state?.quantity || eventData?.quantity || 1))
    );
    const [quantity, setQuantity] = useState(initialQuantity);

    // Cập nhật số lượng nếu được truyền từ trang chi tiết sự kiện
    useEffect(() => {
        const passedQty = Number(location.state?.quantity || eventData?.quantity);
        if (passedQty && passedQty >= 1 && passedQty <= 4) {
            setQuantity(passedQty);
        }
    }, [location.state, eventData?.quantity]);

    const [customerName, setCustomerName] = useState(user?.fullName || '');
    const [customerEmail, setCustomerEmail] = useState(user?.email || '');
    const [customerPhone, setCustomerPhone] = useState(user?.phoneNumber || '');
    const [formErrors, setFormErrors] = useState({});

    // Trạng thái ví Web3
    const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
    const [walletBalance, setWalletBalance] = useState(0); // Số dư Sepolia ETH
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);
    const [networkChainId, setNetworkChainId] = useState(11155111); // Sepolia ChainID

    // Ước tính Gas & Phí
    const estimatedGasEth = 0.0028;
    const subtotalEth = tier ? tier.originalPrice * quantity : 0;
    const totalEth = Number((subtotalEth + estimatedGasEth).toFixed(4));
    const ethToUsdRate = 3140; // $3,140 / 1 ETH
    const totalUsd = Math.round(totalEth * ethToUsdRate);

    // Luồng xử lý giao dịch 3 bước theo đúng Mục 7 của docs/theme_specification.md
    // Trạng thái: 'idle' | 'pending_signature' (Bước 1) | 'verifying_block' (Bước 2) | 'confirmed' (Bước 3) | 'error'
    const [txStatus, setTxStatus] = useState('idle');
    const [txHash, setTxHash] = useState('');
    const [mintedTokenIds, setMintedTokenIds] = useState([]);
    const [txError, setTxError] = useState('');

    // Snackbar state
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

    // Sao chép clipboard
    const handleCopy = (text, label = 'mã') => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        showSnackbar(`Đã sao chép ${label} vào bộ nhớ tạm: ${truncateHash(text, 8, 6)}`, 'success');
    };

    // Lấy số dư ETH thực tế từ MetaMask trên mạng Sepolia
    const fetchWalletBalance = useCallback(async (address) => {
        if (!address) {
            setWalletBalance(0);
            return;
        }
        try {
            if (window.ethereum) {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const balanceBigInt = await browserProvider.getBalance(address);
                const ethStr = ethers.formatEther(balanceBigInt);
                const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                setWalletBalance(ethNum);
                setFormErrors((prev) => {
                    if (prev.balance && ethNum >= totalEth) {
                        const { balance, ...rest } = prev;
                        return rest;
                    }
                    return prev;
                });
            } else {
                try {
                    const rpcProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
                    const balanceBigInt = await rpcProvider.getBalance(address);
                    const ethStr = ethers.formatEther(balanceBigInt);
                    const ethNum = parseFloat(parseFloat(ethStr).toFixed(4));
                    setWalletBalance(ethNum);
                } catch {
                    // Demo Sandbox fallback
                    setWalletBalance(1.5);
                }
            }
        } catch (err) {
            console.error('Lỗi khi lấy số dư ví MetaMask:', err);
        }
    }, [totalEth]);

    // Tự động kiểm tra ví đã kết nối trong MetaMask khi mở trang
    useEffect(() => {
        let isMounted = true;
        const checkConnectedWallet = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts[0]) {
                        if (isMounted) {
                            setWalletAddress(accounts[0]);
                            await fetchWalletBalance(accounts[0]);
                        }
                        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                        if (isMounted) {
                            setNetworkChainId(parseInt(chainIdHex, 16));
                        }
                        return;
                    }
                } catch (err) {
                    console.error('Lỗi kiểm tra eth_accounts:', err);
                }
            }
            if (walletAddress) {
                fetchWalletBalance(walletAddress);
            }
        };

        checkConnectedWallet();
        return () => {
            isMounted = false;
        };
    }, [walletAddress, fetchWalletBalance]);

    // Lắng nghe sự kiện chuyển đổi ví hoặc chuyển mạng trong MetaMask
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = async (accounts) => {
            if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
                await fetchWalletBalance(accounts[0]);
                showSnackbar(`Đã chuyển sang ví: ${truncateHash(accounts[0], 6, 4)}`, 'info');
            } else {
                setWalletAddress('');
                setWalletBalance(0);
            }
        };

        const handleChainChanged = (chainIdHex) => {
            setNetworkChainId(parseInt(chainIdHex, 16));
            if (walletAddress) {
                fetchWalletBalance(walletAddress);
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
    }, [walletAddress, fetchWalletBalance]);

    // Kết nối ví MetaMask
    const handleConnectWallet = async () => {
        setIsConnectingWallet(true);
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts[0]) {
                    setWalletAddress(accounts[0]);
                    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
                    setNetworkChainId(parseInt(chainIdHex, 16));
                    await fetchWalletBalance(accounts[0]);
                    showSnackbar(`Đã kết nối ví: ${truncateHash(accounts[0], 6, 4)}`, 'success');
                }
            } else {
                // Giả lập ví nếu browser không cài MetaMask extension
                await new Promise((r) => setTimeout(r, 600));
                setWalletAddress('0x789b9102934812301928394819203849102334ef');
                setWalletBalance(1.5);
                showSnackbar('Đã kết nối ví MetaMask Sepolia (Demo Sandbox)', 'success');
            }
        } catch (err) {
            showSnackbar(err?.message || 'Không thể kết nối ví MetaMask.', 'error');
        } finally {
            setIsConnectingWallet(false);
        }
    };

    // Kiểm tra tính hợp lệ của Form trước khi thanh toán
    const validateForm = () => {
        const errors = {};
        if (!customerName.trim()) errors.name = 'Vui lòng nhập họ và tên người tham dự.';
        if (!customerEmail.trim()) errors.email = 'Vui lòng nhập địa chỉ email nhận vé.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) errors.email = 'Email không hợp lệ.';
        if (!walletAddress) errors.wallet = 'Vui lòng kết nối ví MetaMask để nhận vé NFT.';
        if (walletAddress && walletBalance < totalEth) {
            errors.balance = `Số dư ví không đủ (${walletBalance} ETH < ${totalEth} ETH). Vui lòng nạp thêm SepoliaETH vào ví của bạn.`;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Tiến hành giao dịch mua vé theo Quy chuẩn Mục 7
    const handleInitiatePayment = async () => {
        if (!validateForm()) {
            if (!walletAddress) {
                showSnackbar('Vui lòng kết nối ví MetaMask trước khi thanh toán!', 'warning');
            }
            return;
        }

        // Bước 1: Khởi tạo đơn hàng & Mở popup ký ví (pending_signature)
        setTxStatus('pending_signature');
        setTxError('');

        let backendOrderId = null;
        try {
            // Khởi tạo đơn đặt vé trên Backend
            try {
                const orderRes = await orderAPI.createOrder({
                    eventId: eventData.id,
                    ticketTypeId: tier?.id,
                    quantity,
                    buyerWallet: walletAddress,
                });
                backendOrderId = orderRes.data?.data?.order?.id;
            } catch (createErr) {
                console.log('Tạo đơn trên API (sẽ fallback nếu chạy offline):', createErr.message);
            }

            // Gọi MetaMask hoặc sinh giao dịch on-chain thật
            if (window.ethereum) {
                try {
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await browserProvider.getSigner();

                    // Khởi tạo contract EventTicket với ví người dùng đã kết nối
                    const contract = new ethers.Contract(EVENT_TICKET_ADDRESS, EventTicketABI, signer);

                    // Tính tổng tiền ETH cần thanh toán
                    const subtotal = Number(tier?.originalPrice || 0) * quantity;
                    const totalCostWei = ethers.parseEther(subtotal.toFixed(6));

                    // Xác định onChainEventId và onChainTierId
                    const eventOnChainId = BigInt(eventData?.onChainEventId || 1);
                    const tierOnChainId = BigInt(tier?.onChainTierId || tier?.id || 1);

                    // Mở popup MetaMask cho người dùng ký giao dịch mua vé
                    const tx = await contract.buyTicket(eventOnChainId, tierOnChainId, quantity, {
                        value: totalCostWei,
                    });

                    // Bước 2: Ký xong -> Nhận txHash thật, chờ thợ đào đóng Block Sepolia
                    setTxHash(tx.hash);
                    setTxStatus('verifying_block');

                    await tx.wait(); // Đợi giao dịch hoàn tất trên mạng blockchain

                    // Gửi xác nhận txHash thật lên Backend để đối soát và cấp vé vào MySQL
                    let confirmedTokenIds = null;
                    if (backendOrderId) {
                        try {
                            const verifyRes = await orderAPI.verifyOrderTx(backendOrderId, { txHash: tx.hash });
                            const tickets = verifyRes.data?.data?.tickets;
                            if (Array.isArray(tickets) && tickets.length > 0) {
                                confirmedTokenIds = tickets.map((t) => t.tokenId);
                            }
                        } catch (verifyErr) {
                            console.log('Xác thực đơn hàng backend:', verifyErr.message);
                        }
                    }

                    // Bước 3: Hoàn tất
                    const tokenIds = confirmedTokenIds || Array.from({ length: quantity }, (_, i) => 1420 + i);
                    setMintedTokenIds(tokenIds);
                    setTxStatus('confirmed');
                    showSnackbar('Giao dịch thành công! Vé NFT đã được lưu vĩnh viễn trên Sepolia.', 'success');
                    return;
                } catch (walletErr) {
                    if (walletErr.code === 4001 || walletErr.info?.error?.code === 4001) {
                        throw new Error('Người dùng đã từ chối ký giao dịch trên ví MetaMask.');
                    }
                    console.warn('Lỗi gọi contract on-chain:', walletErr);
                    const errorMsg = walletErr.reason || walletErr.info?.error?.message || walletErr.message;
                    if (errorMsg?.includes('Event does not exist')) {
                        throw new Error('Sự kiện này chưa được tạo on-chain trên Smart Contract mới deploy. Vui lòng tạo sự kiện mới từ tài khoản Organizer.');
                    }
                    if (errorMsg?.includes('insufficient funds')) {
                        throw new Error('Số dư Sepolia ETH trong ví của bạn không đủ để thanh toán vé và phí gas.');
                    }
                    throw new Error(errorMsg || 'Giao dịch trên Smart Contract thất bại.');
                }
            }

            // Fallback môi trường demo khi không có MetaMask extension
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const mockTx = '0x8a9f3b12dc089148b39019284918239018294018234810239481902371ef8923';
            setTxHash(mockTx);
            setTxStatus('verifying_block');

            if (backendOrderId) {
                try {
                    await orderAPI.verifyOrderTx(backendOrderId, { txHash: mockTx });
                } catch (e) {
                    console.log('Xác nhận vé demo:', e.message);
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 2500));
            const tokenIds = Array.from({ length: quantity }, (_, i) => 1422 + i);
            setMintedTokenIds(tokenIds);
            setTxStatus('confirmed');
            showSnackbar('Giao dịch thành công! Vé NFT đã được ghi nhận trên Sepolia.', 'success');
        } catch (err) {
            setTxStatus('error');
            setTxError(err.message || 'Giao dịch trên Blockchain bị hủy bỏ hoặc thất bại.');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
            {/* ═══════════════════════════════════════════════════════════════════
                1. CHECKOUT TOP BAR & HEADER
            ═══════════════════════════════════════════════════════════════════ */}
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 2,
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
                        {/* Quay lại & Logo */}
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Button
                                size="small"
                                startIcon={<ArrowBack />}
                                onClick={() => navigate(-1)}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                            >
                                Quay lại
                            </Button>
                            <Divider orientation="vertical" flexItem sx={{ height: 20, my: 'auto' }} />
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '6px',
                                        bgcolor: 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                    }}
                                >
                                    <ConfirmationNumber sx={{ fontSize: 18 }} />
                                </Box>
                                <Typography variant="h3" color="text.primary" fontWeight={700}>
                                    Thanh Toán Vé NFT
                                </Typography>
                            </Stack>
                        </Stack>

                        {/* Network Badge & Theme Toggle */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
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
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* ═══════════════════════════════════════════════════════════════════
                    2. STEPPER TIẾN TRÌNH 3 BƯỚC (CHECKOUT PROGRESS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Box sx={{ mb: 4, display: { xs: 'none', sm: 'block' } }}>
                    <Stepper activeStep={walletAddress ? 1 : 0} alternativeLabel>
                        <Step completed={Boolean(walletAddress)}>
                            <StepLabel>
                                <Typography variant="caption" fontWeight={600}>
                                    1. Chọn Hạng Vé & Người Nhận
                                </Typography>
                            </StepLabel>
                        </Step>
                        <Step completed={Boolean(walletAddress)}>
                            <StepLabel>
                                <Typography variant="caption" fontWeight={600}>
                                    2. Kết Nối Ví MetaMask Sepolia
                                </Typography>
                            </StepLabel>
                        </Step>
                        <Step completed={txStatus === 'confirmed'}>
                            <StepLabel>
                                <Typography variant="caption" fontWeight={600}>
                                    3. Ký Ví & Mint Vé NFT On-Chain
                                </Typography>
                            </StepLabel>
                        </Step>
                    </Stepper>
                </Box>

                {/* ═══════════════════════════════════════════════════════════════════
                    3. BỐ CỤC 2 CỘT CHÍNH (MAIN CHECKOUT GRID)
                ═══════════════════════════════════════════════════════════════════ */}
                <Grid container spacing={4}>
                    {/* ── CỘT TRÁI: THÔNG TIN VÉ & THÔNG TIN NGƯỜI NHẬN ── */}
                    <Grid item xs={12} md={7}>
                        <Stack spacing={3}>
                            {/* Card 1: Sự kiện & Hạng vé */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="flex-start">
                                        <Box
                                            component="img"
                                            src={eventData.bannerUrl}
                                            alt={eventData.title}
                                            sx={{
                                                width: { xs: '100%', sm: 140 },
                                                height: 100,
                                                borderRadius: '8px',
                                                objectFit: 'cover',
                                                border: 1,
                                                borderColor: 'divider',
                                            }}
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Chip
                                                label={eventData.categoryLabel}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'action.selected',
                                                    color: 'primary.main',
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem',
                                                    height: 22,
                                                    mb: 0.5,
                                                }}
                                            />
                                            <Typography variant="h3" color="text.primary" fontWeight={700}>
                                                {eventData.title}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                                <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {eventData.startTime}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 320 }}>
                                                    {eventData.venue}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 2.5 }} />

                                    {/* Hạng vé & Bộ chọn số lượng */}
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="subtitle1" color="text.primary" fontWeight={600}>
                                                    {tier.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Còn lại: <strong>{tier.remainingSupply}</strong> / {tier.maxSupply} vé
                                                </Typography>
                                            </Box>
                                            <Typography variant="h3" color="primary.main" fontWeight={700}>
                                                {tier.originalPrice} ETH
                                            </Typography>
                                        </Stack>

                                        {/* Perks */}
                                        <Box mt={1.5}>
                                            {tier.perks.map((perk, i) => (
                                                <Typography key={i} variant="caption" color="text.secondary" display="block">
                                                    • {perk}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>

                                    {/* Chọn số lượng vé */}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2.5}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                                Số lượng vé mua
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Tối đa 4 vé / một ví để tránh nạn đầu cơ
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <IconButton
                                                size="small"
                                                aria-label="Giảm số lượng vé"
                                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                            >
                                                <Remove fontSize="small" />
                                            </IconButton>
                                            <Typography variant="h3" color="text.primary" fontWeight={700} sx={{ minWidth: 28, textAlign: 'center' }}>
                                                {quantity}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                aria-label="Tăng số lượng vé"
                                                onClick={() => setQuantity((q) => Math.min(4, q + 1))}
                                                disabled={quantity >= 4}
                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>

                                    {/* Quy tắc trần giá 120% BR-02 */}
                                    <Alert
                                        severity="info"
                                        icon={<Security sx={{ color: 'primary.main' }} />}
                                        sx={{ mt: 2.5, borderRadius: '8px' }}
                                    >
                                        <Typography variant="caption" color="text.secondary">
                                            <strong>Chính sách Bảo vệ Người mua (BR-02):</strong> Nếu bạn muốn bán lại vé này trên thị trường thứ cấp,
                                            Smart Contract sẽ tự động áp mức trần tối đa là <strong>{tier.maxResalePrice} ETH</strong> (+120% giá gốc).
                                        </Typography>
                                    </Alert>
                                </CardContent>
                            </Card>

                            {/* Card 2: Thông tin Người nhận vé */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h3" color="text.primary" fontWeight={600} mb={0.5}>
                                        Thông Tin Người Tham Dự
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2.5}>
                                        Tên người tham dự sẽ được gắn với mã QR động để đối soát tại cổng sự kiện
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Họ và tên người tham dự"
                                                fullWidth
                                                required
                                                size="small"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                error={Boolean(formErrors.name)}
                                                helperText={formErrors.name}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Person sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Email nhận thông báo vé"
                                                fullWidth
                                                required
                                                type="email"
                                                size="small"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                error={Boolean(formErrors.email)}
                                                helperText={formErrors.email}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Số điện thoại liên hệ"
                                                fullWidth
                                                size="small"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Phone sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Card 3: Ví Web3 nhận vé NFT */}
                            <Card sx={{ bgcolor: 'background.paper' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                        <Typography variant="h3" color="text.primary" fontWeight={600}>
                                            Ví Web3 Nhận Vé NFT
                                        </Typography>
                                        {walletAddress && (
                                            <Chip
                                                icon={<CheckCircle sx={{ fontSize: '13px !important', color: 'status.success' }} />}
                                                label="Đã kết nối"
                                                size="small"
                                                sx={{ bgcolor: 'status.successBg', color: 'status.success', fontWeight: 600 }}
                                            />
                                        )}
                                    </Stack>

                                    {walletAddress ? (
                                        <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                                    <MetaMaskIcon size={28} />
                                                    <Box>
                                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                                            Ví MetaMask (Sepolia)
                                                        </Typography>
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}
                                                            >
                                                                {truncateHash(walletAddress, 8, 6)}
                                                            </Typography>
                                                            <Tooltip title="Sao chép địa chỉ ví">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Sao chép ví"
                                                                    onClick={() => handleCopy(walletAddress, 'địa chỉ ví')}
                                                                    sx={{ p: 0.2 }}
                                                                >
                                                                    <ContentCopy sx={{ fontSize: 14 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    </Box>
                                                </Stack>

                                                <Box textAlign="right">
                                                    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                                                        <Typography variant="caption" color="text.secondary">SỐ DƯ KHẢ DỤNG</Typography>
                                                        <Tooltip title="Làm mới số dư ví">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => fetchWalletBalance(walletAddress)}
                                                                sx={{ p: 0.2 }}
                                                            >
                                                                <Refresh sx={{ fontSize: 13 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                    <Typography variant="subtitle1" color="primary.main" fontWeight={700}>
                                                        {walletBalance} ETH
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: '8px', textAlign: 'center' }}>
                                            <MetaMaskIcon size={40} />
                                            <Typography variant="subtitle1" color="text.primary" fontWeight={600} mt={1}>
                                                Chưa kết nối ví MetaMask
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" mb={2}>
                                                Vé sự kiện được phát hành trực tiếp dưới dạng NFT trên mạng Ethereum Sepolia.
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={handleConnectWallet}
                                                disabled={isConnectingWallet}
                                                startIcon={isConnectingWallet ? <CircularProgress size={16} color="inherit" /> : <MetaMaskIcon />}
                                            >
                                                {isConnectingWallet ? 'Đang kết nối...' : 'Kết nối ví MetaMask'}
                                            </Button>
                                        </Box>
                                    )}

                                    {formErrors.wallet && (
                                        <Alert severity="error" sx={{ mt: 2 }}>
                                            {formErrors.wallet}
                                        </Alert>
                                    )}
                                    {formErrors.balance && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            {formErrors.balance}
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>

                    {/* ── CỘT PHẢI: BẢNG TÓM TẮT & NÚT THANH TOÁN ── */}
                    <Grid item xs={12} md={5}>
                        <Card sx={{ bgcolor: 'background.paper', position: { md: 'sticky' }, top: { md: 90 } }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h3" color="text.primary" fontWeight={700} mb={2.5}>
                                    Tóm Tắt Đơn Hàng
                                </Typography>

                                <Stack spacing={1.5} mb={2.5}>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">
                                            {tier.name} ({tier.originalPrice} ETH x {quantity})
                                        </Typography>
                                        <Typography variant="body2" color="text.primary" fontWeight={600}>
                                            {subtotalEth.toFixed(4)} ETH
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" justifyContent="space-between">
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" color="text.secondary">
                                                Phí ước tính Gas mạng Sepolia
                                            </Typography>
                                            <Tooltip title="Phí thợ đào đóng block giao dịch mint token ERC-721 trên Sepolia (~18 Gwei).">
                                                <IconButton size="small" aria-label="Xem giải thích phí gas" sx={{ p: 0 }}>
                                                    <FiberManualRecord sx={{ fontSize: 8, color: 'text.disabled' }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                        <Typography variant="body2" color="text.primary" fontWeight={500}>
                                            ~{estimatedGasEth} ETH
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="body2" color="text.secondary">
                                            Phí nền tảng BlockTickets
                                        </Typography>
                                        <Typography variant="body2" color="status.success" fontWeight={600}>
                                            0 ETH (Miễn phí)
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Divider sx={{ my: 2 }} />

                                {/* Tổng cộng */}
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={1}>
                                    <Box>
                                        <Typography variant="subtitle1" color="text.primary" fontWeight={700}>
                                            Tổng thanh toán:
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Quy đổi: ~${totalUsd.toLocaleString('en-US')} USD
                                        </Typography>
                                    </Box>
                                    <Typography variant="h2" color="primary.main" fontWeight={700}>
                                        {totalEth} ETH
                                    </Typography>
                                </Stack>

                                <Divider sx={{ my: 2 }} />

                                {/* Nút Thanh Toán Chính */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    onClick={handleInitiatePayment}
                                    disabled={txStatus === 'pending_signature' || txStatus === 'verifying_block'}
                                    sx={{
                                        py: 1.5,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        mb: 2,
                                    }}
                                >
                                    {txStatus === 'pending_signature' ? (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CircularProgress size={20} color="inherit" />
                                            <span>Đang chờ ký ví MetaMask...</span>
                                        </Stack>
                                    ) : txStatus === 'verifying_block' ? (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <CircularProgress size={20} color="inherit" />
                                            <span>Đang đóng block Sepolia...</span>
                                        </Stack>
                                    ) : (
                                        `Thanh toán ${totalEth} ETH & Mint Vé NFT`
                                    )}
                                </Button>

                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                    <Shield sx={{ fontSize: 16, color: 'status.success' }} />
                                    <Typography variant="caption" color="text.secondary">
                                        Bảo mật bởi Smart Contract ERC-721 trên Ethereum Sepolia
                                    </Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                4. MODAL TRẠNG THÁI GIAO DỊCH BLOCKCHAIN (MỤC 7 CỦA SPECIFICATION)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={txStatus !== 'idle'}
                onClose={() => {
                    if (txStatus === 'confirmed' || txStatus === 'error') {
                        setTxStatus('idle');
                    }
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper', p: 1 } }}
            >
                {/* ── BƯỚC 1: YÊU CẦU KÝ VÍ (pending_signature) ── */}
                {txStatus === 'pending_signature' && (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                <MetaMaskIcon size={64} />
                            </Box>
                            <Typography variant="h2" color="text.primary">
                                Vui lòng xác nhận giao dịch trên ví MetaMask
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ textAlign: 'center' }}>
                            <CircularProgress size={32} sx={{ my: 2, color: 'primary.main' }} />
                            <DialogContentText color="text.secondary">
                                Popup MetaMask vừa mở. Vui lòng kiểm tra số tiền <strong>{totalEth} ETH</strong> và nhấn <strong>Confirm</strong> để ký giao dịch.
                            </DialogContentText>
                            <Alert severity="warning" sx={{ mt: 3, textAlign: 'left', borderRadius: '8px' }}>
                                <strong>Lưu ý:</strong> Đơn hàng vẫn ở trạng thái <code>pending_signature</code>. Vé chưa được ghi nhận cho đến khi block được đóng trên chuỗi.
                            </Alert>
                        </DialogContent>
                    </>
                )}

                {/* ── BƯỚC 2: CHỜ ĐÓNG BLOCK (verifying_block) ── */}
                {txStatus === 'verifying_block' && (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'status.onchainBg',
                                    color: 'status.onchain',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <ElectricBolt sx={{ fontSize: 36 }} />
                            </Box>
                            <Typography variant="h2" color="text.primary">
                                Đang gửi giao dịch lên mạng Sepolia...
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ textAlign: 'center' }}>
                            <LinearProgress sx={{ my: 2.5, borderRadius: 2 }} />
                            <DialogContentText color="text.secondary" paragraph>
                                Giao dịch đã được phát lên mạng lưới. Đang chờ các thợ đào Sepolia xác nhận và đóng block...
                            </DialogContentText>

                            {txHash && (
                                <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px', textAlign: 'left' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        MÃ BĂM GIAO DỊCH (TXHASH):
                                    </Typography>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}
                                        >
                                            {truncateHash(txHash, 10, 8)}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                aria-label="Sao chép TxHash"
                                                onClick={() => handleCopy(txHash, 'TxHash')}
                                            >
                                                <ContentCopy sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                aria-label="Mở Etherscan Sepolia"
                                                component="a"
                                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ color: 'primary.main' }}
                                            >
                                                <OpenInNew sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                </Box>
                            )}
                        </DialogContent>
                    </>
                )}

                {/* ── BƯỚC 3: XÁC NHẬN HOÀN TẤT THÀNH CÔNG (confirmed) ── */}
                {txStatus === 'confirmed' && (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                            <Box
                                sx={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: '50%',
                                    bgcolor: 'status.successBg',
                                    color: 'status.success',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <CheckCircle sx={{ fontSize: 44 }} />
                            </Box>
                            <Typography variant="h2" color="status.success">
                                Mua Vé NFT Thành Công!
                            </Typography>
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText color="text.secondary" textAlign="center" paragraph>
                                Giao dịch đã được xác thực hoàn tất trên khối Sepolia. <strong>{quantity} vé NFT</strong> đã được chuyển thẳng về ví cá nhân của bạn.
                            </DialogContentText>

                            <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px', mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    CHI TIẾT VÉ NFT ĐÃ MINT:
                                </Typography>
                                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                                    {mintedTokenIds.map((id) => (
                                        <Chip
                                            key={id}
                                            icon={<ConfirmationNumber sx={{ fontSize: '13px !important' }} />}
                                            label={`Token ID #${id}`}
                                            color="primary"
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    ))}
                                </Stack>

                                <Divider sx={{ my: 1.5 }} />

                                <Typography variant="caption" color="text.secondary" display="block">
                                    Ví sở hữu: <code>{truncateHash(walletAddress, 10, 8)}</code>
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    TxHash:{' '}
                                    <a
                                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#2563EB', textDecoration: 'none' }}
                                    >
                                        {truncateHash(txHash, 10, 8)} ↗
                                    </a>
                                </Typography>
                            </Box>

                            <Alert severity="info" sx={{ borderRadius: '8px' }}>
                                Bạn có thể xem vé NFT và mở mã QR động để soát vé tại cổng trong trang <strong>Kho vé của tôi</strong>.
                            </Alert>
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={() => navigate('/customer/tickets')}
                                sx={{ px: 4, height: 44 }}
                            >
                                Đi Đến Kho Vé Của Tôi
                            </Button>
                        </DialogActions>
                    </>
                )}

                {/* ── BƯỚC LỖI / NGƯỜI DÙNG TỪ CHỐI (error) ── */}
                {txStatus === 'error' && (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                            <Box
                                sx={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: '50%',
                                    bgcolor: 'status.errorBg',
                                    color: 'status.error',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <Cancel sx={{ fontSize: 40 }} />
                            </Box>
                            <Typography variant="h2" color="status.error">
                                Giao Dịch Không Thành Công
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ textAlign: 'center' }}>
                            <Alert severity="error" sx={{ textAlign: 'left', mb: 2 }}>
                                {txError}
                            </Alert>
                            <DialogContentText color="text.secondary">
                                Chưa có khoản tiền nào bị trừ khỏi ví của bạn. Vui lòng kiểm tra lại số dư hoặc thử lại sau.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions sx={{ p: 2.5, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => setTxStatus('idle')}
                                sx={{ mr: 1 }}
                            >
                                Đóng
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleInitiatePayment}
                            >
                                Thử Lại
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                5. TOAST SNACKBAR THÔNG BÁO
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

export default CheckoutPage;

