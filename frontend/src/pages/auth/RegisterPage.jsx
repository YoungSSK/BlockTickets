import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
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
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    CheckCircle,
    Event as EventIcon,
    Verified,
    Security,
    SwapHoriz,
    QrCode2,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const FEATURES = [
    { Icon: Verified, text: 'Vé NFT duy nhất, xác thực trên Blockchain' },
    { Icon: Security, text: 'Chống giả mạo với mã QR HMAC động' },
    { Icon: SwapHoriz, text: 'Chuyển nhượng an toàn, trần giá 120%' },
    { Icon: QrCode2, text: 'Soát vé tức thì tại cổng sự kiện' },
];

const RegisterPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState('customer'); // 'customer' | 'organizer'
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const handleChange = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';
        else if (form.fullName.trim().length < 2) newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
        if (!form.email.trim()) newErrors.email = 'Vui lòng nhập địa chỉ email.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            newErrors.email = 'Địa chỉ email không hợp lệ.';
        if (!form.password) newErrors.password = 'Vui lòng nhập mật khẩu.';
        else if (form.password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
        if (!form.confirmPassword) newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
        else if (form.password !== form.confirmPassword)
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        if (!validate()) return;
        setLoading(true);
        try {
            await new Promise((r) => setTimeout(r, 1200));
            setServerError('Backend chưa kết nối. Chức năng đang phát triển.');
        } catch (err) {
            setServerError(err?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const roleButtonSx = (active) => ({
        flex: 1,
        py: 1.5,
        px: 2,
        borderRadius: '8px',
        border: active ? '2px solid #2563EB' : '1.5px solid',
        borderColor: active ? '#2563EB' : 'divider',
        bgcolor: active ? 'rgba(37,99,235,0.06)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s',
        '&:hover': { borderColor: '#2563EB', bgcolor: 'rgba(37,99,235,0.04)' },
    });

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
                    overflowY: 'auto',
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
                    <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', color: 'text.primary', mb: 0.5 }}>
                        Tạo tài khoản
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Bắt đầu trải nghiệm vé sự kiện Blockchain ngay hôm nay
                    </Typography>

                    {/* Role selection */}
                    <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={1}>
                        Tôi muốn đăng ký với vai trò:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                        {/* Khách hàng */}
                        <Box sx={roleButtonSx(role === 'customer')} onClick={() => setRole('customer')}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                                {role === 'customer' && (
                                    <CheckCircle sx={{ fontSize: 16, color: '#2563EB' }} />
                                )}
                                <PersonIcon sx={{ fontSize: 16, color: role === 'customer' ? '#2563EB' : 'text.secondary' }} />
                            </Box>
                            <Typography
                                variant="caption"
                                fontWeight={600}
                                sx={{ color: role === 'customer' ? '#2563EB' : 'text.primary', display: 'block' }}
                            >
                                Khách hàng
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                Mua vé & tham dự sự kiện
                            </Typography>
                        </Box>

                        {/* Nhà tổ chức */}
                        <Box sx={roleButtonSx(role === 'organizer')} onClick={() => setRole('organizer')}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.25 }}>
                                {role === 'organizer' && (
                                    <CheckCircle sx={{ fontSize: 16, color: '#2563EB' }} />
                                )}
                                <EventIcon sx={{ fontSize: 16, color: role === 'organizer' ? '#2563EB' : 'text.secondary' }} />
                            </Box>
                            <Typography
                                variant="caption"
                                fontWeight={600}
                                sx={{ color: role === 'organizer' ? '#2563EB' : 'text.primary', display: 'block' }}
                            >
                                Nhà tổ chức
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                Tạo & quản lý sự kiện
                            </Typography>
                        </Box>
                    </Box>

                    {/* Server error */}
                    {serverError && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }} onClose={() => setServerError('')}>
                            {serverError}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {/* Full Name */}
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>
                            Họ và tên
                        </Typography>
                        <TextField
                            id="register-fullname"
                            type="text"
                            fullWidth
                            value={form.fullName}
                            onChange={handleChange('fullName')}
                            error={Boolean(errors.fullName)}
                            helperText={errors.fullName}
                            autoComplete="name"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2.5 }}
                        />

                        {/* Email */}
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>
                            Email
                        </Typography>
                        <TextField
                            id="register-email"
                            type="email"
                            fullWidth
                            value={form.email}
                            onChange={handleChange('email')}
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
                            id="register-password"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            value={form.password}
                            onChange={handleChange('password')}
                            error={Boolean(errors.password)}
                            autoComplete="new-password"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 0.5 }}
                        />
                        {errors.password ? (
                            <Typography variant="caption" color="error" display="block" mb={1.5}>
                                {errors.password}
                            </Typography>
                        ) : (
                            <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
                                Ít nhất 8 ký tự, gồm chữ hoa và số
                            </Typography>
                        )}

                        {/* Confirm Password */}
                        <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>
                            Xác nhận mật khẩu
                        </Typography>
                        <TextField
                            id="register-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            fullWidth
                            value={form.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            error={Boolean(errors.confirmPassword)}
                            helperText={errors.confirmPassword}
                            autoComplete="new-password"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowConfirmPassword((p) => !p)} edge="end" size="small">
                                            {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3 }}
                        />

                        {/* Submit */}
                        <Button
                            id="register-submit-btn"
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            sx={{ height: 44, mb: 2.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                        >
                            {loading ? <CircularProgress size={20} sx={{ color: 'primary.contrastText' }} /> : 'Tạo tài khoản'}
                        </Button>
                    </Box>

                    {/* Login link */}
                    <Typography variant="body2" align="center" color="text.secondary">
                        Đã có tài khoản?{' '}
                        <Link
                            component={RouterLink}
                            to="/login"
                            color="primary"
                            fontWeight={600}
                            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Đăng nhập ngay
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default RegisterPage;
