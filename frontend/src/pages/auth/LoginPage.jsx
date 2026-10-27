import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Divider,
    IconButton,
    InputAdornment,
    Alert,
    Link,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    LightMode,
    DarkMode,
    ConfirmationNumber,
    Email as EmailIcon,
    Lock as LockIcon,
    Verified,
    Security,
    SwapHoriz,
    QrCode2,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

// MetaMask fox inline SVG
const MetaMaskIcon = () => (
    <svg width="20" height="20" viewBox="0 0 318 318" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const FEATURES = [
    { Icon: Verified, text: 'Vé NFT duy nhất, xác thực trên Blockchain' },
    { Icon: Security, text: 'Chống giả mạo với mã QR HMAC động' },
    { Icon: SwapHoriz, text: 'Chuyển nhượng an toàn, trần giá 120%' },
    { Icon: QrCode2, text: 'Soát vé tức thì tại cổng sự kiện' },
];

const LoginPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loginLoading, setLoginLoading] = useState(false);
    const [walletLoading, setWalletLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Vui lòng nhập địa chỉ email.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            newErrors.email = 'Địa chỉ email không hợp lệ.';
        if (!password) newErrors.password = 'Vui lòng nhập mật khẩu.';
        else if (password.length < 6)
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;
        setLoginLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 1000));
            setServerError('Backend chưa kết nối. Chức năng đang phát triển.');
        } catch (err) {
            setServerError(err?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleWalletLogin = async () => {
        setServerError('');
        if (!window.ethereum) {
            setServerError('Trình duyệt chưa cài MetaMask. Vui lòng cài đặt tiện ích MetaMask và thử lại.');
            return;
        }
        setWalletLoading(true);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const wallet = accounts[0];
            setServerError(`Đã kết nối ví: ${wallet.slice(0, 6)}...${wallet.slice(-4)}. Backend/SIWE chưa tích hợp.`);
        } catch (err) {
            if (err.code === 4001) {
                setServerError('Người dùng đã từ chối kết nối ví.');
            } else {
                setServerError('Không thể kết nối ví. Vui lòng thử lại.');
            }
        } finally {
            setWalletLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>

            {/* ─── LEFT: Hero Panel ─── */}
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flex: '0 0 430px',
                    flexDirection: 'column',
                    bgcolor: '#2563EB',
                    position: 'relative',
                    overflow: 'hidden',
                    p: '40px 36px',
                }}
            >
                {/* Decorative circles */}
                <Box sx={{
                    position: 'absolute', width: 320, height: 320, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.07)', top: -80, right: -80,
                }} />
                <Box sx={{
                    position: 'absolute', width: 220, height: 220, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', top: 60, right: 30,
                }} />
                <Box sx={{
                    position: 'absolute', width: 260, height: 260, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)', bottom: 60, left: -60,
                }} />

                {/* Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 'auto', position: 'relative', zIndex: 1 }}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: '8px',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ConfirmationNumber sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        BlockTickets
                    </Typography>
                </Box>

                {/* Headline */}
                <Box sx={{ position: 'relative', zIndex: 1, mt: 6, mb: 3 }}>
                    <Typography
                        sx={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: { md: '1.9rem', lg: '2.2rem' },
                            lineHeight: 1.2,
                            mb: 1.5,
                        }}
                    >
                        Vé sự kiện<br />
                        <span style={{ color: '#93C5FD' }}>không thể giả mạo</span>
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                        Nền tảng phân phối & chuyển nhượng vé sự kiện ứng dụng công nghệ Blockchain & NFT trên Ethereum Sepolia.
                    </Typography>
                </Box>

                {/* Feature list */}
                <Box sx={{ position: 'relative', zIndex: 1, mb: 'auto' }}>
                    {FEATURES.map(({ Icon, text }) => (
                        <Box
                            key={text}
                            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}
                        >
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '8px',
                                bgcolor: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Icon sx={{ color: '#fff', fontSize: 16 }} />
                            </Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.8rem' }}>
                                {text}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Sepolia badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ADE80' }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                        Sepolia Testnet
                    </Typography>
                </Box>
            </Box>

            {/* ─── RIGHT: Form Panel ─── */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: { xs: 3, sm: 5, md: 6 },
                    position: 'relative',
                    bgcolor: mode === 'dark' ? 'background.paper' : '#fff',
                }}
            >
                {/* Theme toggle */}
                <Tooltip title={mode === 'light' ? 'Chuyển Dark Mode' : 'Chuyển Light Mode'}>
                    <IconButton
                        onClick={toggleTheme}
                        sx={{
                            position: 'absolute', top: 24, right: 24,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                    </IconButton>
                </Tooltip>

                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    {/* Mobile logo */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <ConfirmationNumber sx={{ color: 'primary.main', fontSize: 28 }} />
                        <Typography variant="h3" color="primary.main" fontWeight={700}>BlockTickets</Typography>
                    </Box>

                    {/* Heading */}
                    <Typography
                        sx={{ fontWeight: 700, fontSize: '1.75rem', color: 'text.primary', mb: 0.5 }}
                    >
                        Chào mừng trở lại
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3.5}>
                        Đăng nhập để quản lý vé sự kiện của bạn
                    </Typography>

                    {/* Server error */}
                    {serverError && (
                        <Alert
                            severity={serverError.startsWith('Đã kết nối') ? 'info' : 'error'}
                            sx={{ mb: 3, borderRadius: '8px' }}
                            onClose={() => setServerError('')}
                        >
                            {serverError}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box component="form" onSubmit={handleEmailLogin} noValidate>
                        {/* Email */}
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>
                            Email
                        </Typography>
                        <TextField
                            id="login-email"
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                            autoComplete="email"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2.5 }}
                        />

                        {/* Password */}
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>
                            Mật khẩu
                        </Typography>
                        <TextField
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={Boolean(errors.password)}
                            helperText={errors.password}
                            autoComplete="current-password"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword((p) => !p)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3 }}
                        />

                        {/* Submit */}
                        <Button
                            id="login-submit-btn"
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loginLoading}
                            sx={{ height: 44, mb: 2.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                        >
                            {loginLoading ? <CircularProgress size={20} sx={{ color: 'primary.contrastText' }} /> : 'Đăng nhập'}
                        </Button>
                    </Box>

                    {/* Divider */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Divider sx={{ flex: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            hoặc đăng nhập bằng
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                    </Box>

                    {/* MetaMask */}
                    <Button
                        id="login-wallet-btn"
                        variant="outlined"
                        fullWidth
                        onClick={handleWalletLogin}
                        disabled={walletLoading}
                        startIcon={walletLoading ? <CircularProgress size={16} color="inherit" /> : <MetaMaskIcon />}
                        sx={{
                            height: 44, borderRadius: '8px', textTransform: 'none',
                            fontWeight: 600, borderWidth: '1.5px', mb: 1,
                        }}
                    >
                        {walletLoading ? 'Đang kết nối ví...' : 'Kết nối ví MetaMask'}
                    </Button>

                    <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mb={3}>
                        🔗 Yêu cầu mạng Ethereum Sepolia Testnet
                    </Typography>

                    {/* Register link */}
                    <Typography variant="body2" align="center" color="text.secondary">
                        Chưa có tài khoản?{' '}
                        <Link
                            component={RouterLink}
                            to="/register"
                            color="primary"
                            fontWeight={600}
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Đăng ký ngay
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default LoginPage;
