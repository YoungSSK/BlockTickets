import React, { useState, useMemo } from 'react';
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
    Stack,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Avatar,
    TablePagination,
    Divider,
    RadioGroup,
    Radio,
    FormControlLabel,
} from '@mui/material';
import {
    ArrowBack,
    CheckCircle,
    Cancel,
    Refresh,
    ContentCopy,
    OpenInNew,
    Search,
    Visibility,
    Edit,
    Block,
    LockOpen,
    PeopleAlt,
    Person,
    EventNote,
    Security,
    AdminPanelSettings,
    DarkMode,
    LightMode,
    Add,
    AccountBalanceWallet,
    ConfirmationNumber,
    WarningAmber,
    Email as EmailIcon,
    Badge as BadgeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../context/ThemeContext';

// Helper rút gọn địa chỉ ví
const truncateHash = (hash, start = 6, end = 4) => {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
};

// Dữ liệu mẫu danh sách người dùng hệ thống BlockTickets
const INITIAL_USERS = [
    {
        id: 'USR-001',
        fullName: 'Nguyễn Văn Quản Trị (Admin)',
        email: 'admin@blocktickets.io',
        role: 'admin',
        walletAddress: '0x1234567890123456789012345678901234567890',
        status: 'active',
        createdAt: '10/01/2026',
        lastLogin: '10 phút trước',
        avatarText: 'AD',
        nftCount: 0,
        eventsCreated: 0,
        suspendReason: '',
        notes: 'Tài khoản Quản trị viên cấp cao toàn quyền hệ thống.',
    },
    {
        id: 'USR-002',
        fullName: 'Hanoi Symphony Orchestra',
        email: 'contact@hanoisymphony.vn',
        role: 'organizer',
        walletAddress: '0x3A2198Ccfa31E4082218901Dfb8293aa7e9B1102',
        status: 'active',
        createdAt: '15/02/2026',
        lastLogin: '25 phút trước',
        avatarText: 'HS',
        nftCount: 0,
        eventsCreated: 8,
        suspendReason: '',
        notes: 'Nhà tổ chức hòa nhạc cổ điển uy tín 98%.',
    },
    {
        id: 'USR-003',
        fullName: 'TechChain Foundation',
        email: 'events@techchain.io',
        role: 'organizer',
        walletAddress: '0x8F4211A990812Da7201bF241cba0982E12Da9911',
        status: 'active',
        createdAt: '01/03/2026',
        lastLogin: '2 giờ trước',
        avatarText: 'TC',
        nftCount: 0,
        eventsCreated: 12,
        suspendReason: '',
        notes: 'Tổ chức hội nghị thượng đỉnh Blockchain thường niên.',
    },
    {
        id: 'USR-004',
        fullName: 'Halong Running Club',
        email: 'marathon@halongrunning.org',
        role: 'organizer',
        walletAddress: '0x11B988Cc009941aB28394Fa019283738C0882190',
        status: 'active',
        createdAt: '20/03/2026',
        lastLogin: '5 giờ trước',
        avatarText: 'HR',
        nftCount: 0,
        eventsCreated: 5,
        suspendReason: '',
        notes: 'Ban tổ chức giải chạy marathon di sản.',
    },
    {
        id: 'USR-005',
        fullName: 'Nguyễn Tuấn An',
        email: 'nguyen.an.dev@gmail.com',
        role: 'customer',
        walletAddress: '0x789b9102934812301928394819203849102334ef',
        status: 'active',
        createdAt: '05/04/2026',
        lastLogin: '1 phút trước',
        avatarText: 'TA',
        nftCount: 4,
        eventsCreated: 0,
        suspendReason: '',
        notes: 'Khách hàng thân thiết, sở hữu vé VIP Vietnam Blockchain Summit 2026.',
    },
    {
        id: 'USR-006',
        fullName: 'Trần Minh Trí',
        email: 'tran.minh.tri@outlook.com',
        role: 'customer',
        walletAddress: '0x619a82739182390192839481920384910293bb41',
        status: 'active',
        createdAt: '18/04/2026',
        lastLogin: '4 phút trước',
        avatarText: 'MT',
        nftCount: 2,
        eventsCreated: 0,
        suspendReason: '',
        notes: 'Đã mua lại vé thứ cấp tuân thủ trần giá 120% hợp lệ.',
    },
    {
        id: 'USR-007',
        fullName: 'Lê Hoàng Yến',
        email: 'le.hoang.yen@gmail.com',
        role: 'customer',
        walletAddress: null, // Chưa liên kết ví MetaMask
        status: 'active',
        createdAt: '22/04/2026',
        lastLogin: 'Hôm qua',
        avatarText: 'HY',
        nftCount: 0,
        eventsCreated: 0,
        suspendReason: '',
        notes: 'Đăng nhập bằng Email/Password truyền thống, chưa kết nối ví Web3.',
    },
    {
        id: 'USR-008',
        fullName: 'Phạm Quốc Huy',
        email: 'pham.quoc.huy@yahoo.com',
        role: 'customer',
        walletAddress: '0x10ae9102938491029384910293849102938449bc',
        status: 'active',
        createdAt: '25/04/2026',
        lastLogin: '1 ngày trước',
        avatarText: 'QH',
        nftCount: 1,
        eventsCreated: 0,
        suspendReason: '',
        notes: 'Đang nắm giữ vé GA Pass EDM Sonic Wave.',
    },
    {
        id: 'USR-009',
        fullName: 'Tài khoản Đầu cơ Bot',
        email: 'bot.scalper.99@tempmail.com',
        role: 'customer',
        walletAddress: '0x99af110293841029384910293849102938491102',
        status: 'suspended',
        createdAt: '28/04/2026',
        lastLogin: '2 ngày trước',
        avatarText: 'BT',
        nftCount: 0,
        eventsCreated: 0,
        suspendReason: 'Hành vi sử dụng script bot tự động tạo đơn lặp liên tục và cố tình niêm yết bán lại vé vượt trần 120% trên chợ thứ cấp.',
        notes: 'Đã bị khóa toàn bộ quyền giao dịch trên hệ thống.',
    },
    {
        id: 'USR-010',
        fullName: 'Ẩn danh Crypto Group',
        email: 'contact@unknown-crypto.xyz',
        role: 'organizer',
        walletAddress: '0x0000000000000000000000000000000000009999',
        status: 'suspended',
        createdAt: '29/04/2026',
        lastLogin: '4 ngày trước',
        avatarText: 'AC',
        nftCount: 0,
        eventsCreated: 1,
        suspendReason: 'Tổ chức sự kiện kêu gọi đầu tư trái phép không có giấy phép kinh doanh và địa điểm không có thật.',
        notes: 'Tài khoản Organizer vi phạm nghiêm trọng chính sách nội dung.',
    },
];

const UserManagementPage = () => {
    const { mode, toggleTheme } = useAppTheme();
    const navigate = useNavigate();

    // Data states
    const [users, setUsers] = useState(INITIAL_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'organizer' | 'customer' | 'suspended'
    const [walletFilter, setWalletFilter] = useState('all'); // 'all' | 'connected' | 'not_connected'
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Modal states
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('customer');
    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendError, setSuspendError] = useState('');
    const [createUserModalOpen, setCreateUserModalOpen] = useState(false);

    // Create User Form
    const [newUserData, setNewUserData] = useState({
        fullName: '',
        email: '',
        role: 'customer',
        walletAddress: '',
        password: '',
    });
    const [createUserError, setCreateUserError] = useState('');

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

    // Làm mới dữ liệu
    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            showSnackbar('Đã đồng bộ danh sách tài khoản từ MongoDB Atlas!', 'success');
        }, 700);
    };

    // Mở modal đổi vai trò
    const handleOpenRoleModal = (user) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setRoleModalOpen(true);
    };

    // Xác nhận đổi vai trò
    const handleConfirmRoleChange = () => {
        if (!selectedUser) return;
        setUsers((prev) =>
            prev.map((u) => (u.id === selectedUser.id ? { ...u, role: selectedRole } : u))
        );
        showSnackbar(`Đã cập nhật vai trò của "${selectedUser.fullName}" thành ${selectedRole.toUpperCase()} thành công!`, 'success');
        setRoleModalOpen(false);
        if (detailModalOpen) {
            setSelectedUser((prev) => ({ ...prev, role: selectedRole }));
        }
    };

    // Mở modal Khóa / Mở khóa
    const handleOpenSuspendModal = (user) => {
        setSelectedUser(user);
        setSuspendReason(user.suspendReason || '');
        setSuspendError('');
        setSuspendModalOpen(true);
    };

    // Xác nhận Khóa / Mở khóa tài khoản
    const handleToggleSuspend = () => {
        if (!selectedUser) return;
        const isCurrentlySuspended = selectedUser.status === 'suspended';

        if (!isCurrentlySuspended && !suspendReason.trim()) {
            setSuspendError('Vui lòng nhập lý do khóa tài khoản vi phạm.');
            return;
        }

        const nextStatus = isCurrentlySuspended ? 'active' : 'suspended';
        const nextReason = isCurrentlySuspended ? '' : suspendReason.trim();

        setUsers((prev) =>
            prev.map((u) =>
                u.id === selectedUser.id
                    ? { ...u, status: nextStatus, suspendReason: nextReason }
                    : u
            )
        );

        showSnackbar(
            isCurrentlySuspended
                ? `Đã mở khóa tài khoản "${selectedUser.fullName}" thành công!`
                : `Đã khóa tài khoản "${selectedUser.fullName}". Lý do đã được lưu vết kiểm toán.`,
            isCurrentlySuspended ? 'success' : 'info'
        );

        setSuspendModalOpen(false);
        if (detailModalOpen) {
            setSelectedUser((prev) => ({ ...prev, status: nextStatus, suspendReason: nextReason }));
        }
    };

    // Xử lý tạo người dùng mới
    const handleCreateUser = (e) => {
        e.preventDefault();
        setCreateUserError('');

        if (!newUserData.fullName.trim() || !newUserData.email.trim()) {
            setCreateUserError('Vui lòng nhập đầy đủ Họ tên và Địa chỉ Email.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email)) {
            setCreateUserError('Địa chỉ email không hợp lệ.');
            return;
        }

        const newUser = {
            id: `USR-${String(users.length + 1).padStart(3, '0')}`,
            fullName: newUserData.fullName.trim(),
            email: newUserData.email.trim(),
            role: newUserData.role,
            walletAddress: newUserData.walletAddress.trim() || null,
            status: 'active',
            createdAt: 'Hôm nay',
            lastLogin: 'Chưa đăng nhập',
            avatarText: newUserData.fullName.trim().slice(0, 2).toUpperCase(),
            nftCount: 0,
            eventsCreated: 0,
            suspendReason: '',
            notes: 'Tài khoản được khởi tạo thủ công bởi Quản trị viên.',
        };

        setUsers((prev) => [newUser, ...prev]);
        showSnackbar(`Đã tạo tài khoản "${newUser.fullName}" thành công!`, 'success');
        setCreateUserModalOpen(false);
        setNewUserData({
            fullName: '',
            email: '',
            role: 'customer',
            walletAddress: '',
            password: '',
        });
    };

    // Thống kê nhanh
    const stats = useMemo(() => {
        const totalUsers = users.length;
        const totalWallets = users.filter((u) => u.walletAddress).length;
        const totalOrganizers = users.filter((u) => u.role === 'organizer').length;
        const totalSuspended = users.filter((u) => u.status === 'suspended').length;
        return { totalUsers, totalWallets, totalOrganizers, totalSuspended };
    }, [users]);

    // Lọc danh sách người dùng
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            // Lọc theo Role hoặc Trạng thái bị khóa
            if (roleFilter === 'suspended') {
                if (u.status !== 'suspended') return false;
            } else if (roleFilter !== 'all') {
                if (u.role !== roleFilter) return false;
            }

            // Lọc theo ví
            if (walletFilter === 'connected' && !u.walletAddress) return false;
            if (walletFilter === 'not_connected' && u.walletAddress) return false;

            // Tìm kiếm
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = u.fullName.toLowerCase().includes(q);
                const matchEmail = u.email.toLowerCase().includes(q);
                const matchId = u.id.toLowerCase().includes(q);
                const matchWallet = u.walletAddress && u.walletAddress.toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchId && !matchWallet) return false;
            }

            return true;
        });
    }, [users, roleFilter, walletFilter, searchQuery]);

    // Helper render Role Chip theo chuẩn
    const renderRoleChip = (role) => {
        switch (role) {
            case 'admin':
                return (
                    <Chip
                        icon={<AdminPanelSettings sx={{ fontSize: '14px !important', color: 'status.onchain' }} />}
                        label="Quản trị viên"
                        size="small"
                        sx={{
                            bgcolor: 'status.onchainBg',
                            color: 'status.onchain',
                            fontWeight: 700,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'organizer':
                return (
                    <Chip
                        icon={<EventNote sx={{ fontSize: '14px !important', color: 'primary.main' }} />}
                        label="Nhà tổ chức"
                        size="small"
                        sx={{
                            bgcolor: 'action.selected',
                            color: 'primary.main',
                            fontWeight: 600,
                            borderRadius: '6px',
                        }}
                    />
                );
            case 'customer':
            default:
                return (
                    <Chip
                        icon={<Person sx={{ fontSize: '14px !important', color: 'text.secondary' }} />}
                        label="Khách hàng"
                        size="small"
                        sx={{
                            bgcolor: 'background.subtle',
                            color: 'text.primary',
                            fontWeight: 500,
                            borderRadius: '6px',
                        }}
                    />
                );
        }
    };

    // Helper render Status Chip theo Section 2.3
    const renderStatusChip = (status) => {
        if (status === 'suspended') {
            return (
                <Chip
                    icon={<Block sx={{ fontSize: '14px !important', color: 'status.error' }} />}
                    label="Bị khóa"
                    size="small"
                    sx={{
                        bgcolor: 'status.errorBg',
                        color: 'status.error',
                        fontWeight: 600,
                        borderRadius: '6px',
                    }}
                />
            );
        }
        return (
            <Chip
                icon={<CheckCircle sx={{ fontSize: '14px !important', color: 'status.success' }} />}
                label="Hoạt động"
                size="small"
                sx={{
                    bgcolor: 'status.successBg',
                    color: 'status.success',
                    fontWeight: 600,
                    borderRadius: '6px',
                }}
            />
        );
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
            {/* ═══════════════════════════════════════════════════════════════════
                1. TOP HEADER / APP BAR
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
                <Container maxWidth="xl">
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        justifyContent="space-between"
                        spacing={2}
                    >
                        {/* Title & Back button */}
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                <Button
                                    size="small"
                                    onClick={() => navigate('/')}
                                    sx={{ color: 'text.secondary', px: 0, minWidth: 'auto', '&:hover': { bgcolor: 'transparent', color: 'primary.main' } }}
                                >
                                    Trang chủ
                                </Button>
                                <Typography variant="caption" color="text.disabled">/</Typography>
                                <Button
                                    size="small"
                                    startIcon={<ArrowBack />}
                                    onClick={() => navigate('/admin/dashboard')}
                                    sx={{ color: 'text.secondary', px: 0, '&:hover': { bgcolor: 'transparent', color: 'primary.main' } }}
                                >
                                    Bảng điều khiển Quản trị
                                </Button>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Typography variant="h2" color="text.primary">
                                    Quản Lý Người Dùng & Tài Khoản Web3
                                </Typography>
                                <Chip
                                    label={`${stats.totalUsers} tài khoản`}
                                    size="small"
                                    color="primary"
                                    sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Tra cứu hồ sơ người dùng, giám sát ví MetaMask, phân quyền vai trò và khóa các tài khoản có hành vi gian lận
                            </Typography>
                        </Box>

                        {/* Top Actions: Create User, Refresh, Theme Toggle */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Add />}
                                onClick={() => setCreateUserModalOpen(true)}
                                sx={{ height: 40 }}
                            >
                                Thêm tài khoản
                            </Button>

                            <Tooltip title="Làm mới danh sách từ MongoDB Atlas">
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        startIcon={
                                            <Refresh
                                                sx={{
                                                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                                    '@keyframes spin': {
                                                        '0%': { transform: 'rotate(0deg)' },
                                                        '100%': { transform: 'rotate(360deg)' },
                                                    },
                                                }}
                                            />
                                        }
                                        sx={{ height: 40 }}
                                    >
                                        Đồng bộ
                                    </Button>
                                </span>
                            </Tooltip>

                            <Tooltip title={mode === 'light' ? 'Chuyển Dark Mode' : 'Chuyển Light Mode'}>
                                <IconButton
                                    aria-label="Chuyển đổi giao diện sáng tối"
                                    onClick={toggleTheme}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: '8px',
                                        width: 40,
                                        height: 40,
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

            <Container maxWidth="xl" sx={{ mt: 4 }}>
                {/* ═══════════════════════════════════════════════════════════════════
                    2. THỐNG KÊ NHANH NGƯỜI DÙNG (USER METRICS CARDS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            TỔNG NGƯỜI DÙNG
                                        </Typography>
                                        <Typography variant="h2" color="text.primary" fontWeight={700} mt={0.5}>
                                            {stats.totalUsers.toLocaleString('vi-VN')}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'action.selected',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                        }}
                                    >
                                        <PeopleAlt />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="status.success" mt={1} display="block" fontWeight={600}>
                                    +124 tài khoản mới trong tuần này
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            VÍ METAMASK LIÊN KẾT
                                        </Typography>
                                        <Typography variant="h2" color="status.onchain" fontWeight={700} mt={0.5}>
                                            {stats.totalWallets.toLocaleString('vi-VN')}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'status.onchainBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.onchain',
                                        }}
                                    >
                                        <AccountBalanceWallet />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Tỷ lệ kết nối Web3: <strong>{((stats.totalWallets / stats.totalUsers) * 100).toFixed(1)}%</strong>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            NHÀ TỔ CHỨC (ORGANIZER)
                                        </Typography>
                                        <Typography variant="h2" color="primary.main" fontWeight={700} mt={0.5}>
                                            {stats.totalOrganizers}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'action.selected',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'primary.main',
                                        }}
                                    >
                                        <EventNote />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Đang vận hành 42 sự kiện hệ thống
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            TÀI KHOẢN BỊ KHÓA
                                        </Typography>
                                        <Typography variant="h2" color="status.error" fontWeight={700} mt={0.5}>
                                            {stats.totalSuspended}
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '8px',
                                            bgcolor: 'status.errorBg',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'status.error',
                                        }}
                                    >
                                        <Block />
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                                    Vi phạm quy tắc trần giá hoặc bot spam
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* ═══════════════════════════════════════════════════════════════════
                    3. BỘ LỌC & THANH TÌM KIẾM (TOOLBAR & FILTERS)
                ═══════════════════════════════════════════════════════════════════ */}
                <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            alignItems={{ xs: 'stretch', md: 'center' }}
                            justifyContent="space-between"
                            spacing={2}
                        >
                            {/* Tabs vai trò */}
                            <Tabs
                                value={roleFilter}
                                onChange={(e, val) => {
                                    setRoleFilter(val);
                                    setPage(0);
                                }}
                                textColor="primary"
                                indicatorColor="primary"
                                sx={{ minHeight: 40 }}
                            >
                                <Tab value="all" label={`Tất cả (${users.length})`} sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="customer" label="Khách hàng" sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="organizer" label="Nhà tổ chức" sx={{ minHeight: 40, py: 1 }} />
                                <Tab value="admin" label="Quản trị viên" sx={{ minHeight: 40, py: 1 }} />
                                <Tab
                                    value="suspended"
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <span>Bị khóa</span>
                                            {stats.totalSuspended > 0 && (
                                                <Chip
                                                    label={stats.totalSuspended}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        bgcolor: 'status.errorBg',
                                                        color: 'status.error',
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                    }
                                    sx={{ minHeight: 40, py: 1 }}
                                />
                            </Tabs>

                            {/* Bộ lọc ví Web3 & Ô tìm kiếm */}
                            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel id="wallet-filter-label">Ví Web3</InputLabel>
                                    <Select
                                        labelId="wallet-filter-label"
                                        label="Ví Web3"
                                        value={walletFilter}
                                        onChange={(e) => {
                                            setWalletFilter(e.target.value);
                                            setPage(0);
                                        }}
                                        sx={{ height: 40 }}
                                    >
                                        <MenuItem value="all">Tất cả trạng thái ví</MenuItem>
                                        <MenuItem value="connected">Đã kết nối MetaMask</MenuItem>
                                        <MenuItem value="not_connected">Chưa kết nối ví</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    placeholder="Tìm tên, email, ví 0x..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(0);
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ minWidth: 260, height: 40 }}
                                />
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════════
                    4. BẢNG DỮ LIỆU NGƯỜI DÙNG (USERS TABLE - SECTION 6.5)
                ═══════════════════════════════════════════════════════════════════ */}
                <Card sx={{ bgcolor: 'background.paper' }}>
                    <TableContainer>
                        <Table size="medium">
                            <TableHead sx={{ bgcolor: 'background.subtle' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Người Dùng & Email</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Vai Trò</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Địa Chỉ Ví Web3</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Tài Sản & Sự Kiện</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Trạng Thái</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Ngày Tạo / Đăng Nhập</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Hành Động</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                Không tìm thấy người dùng nào phù hợp với bộ lọc tìm kiếm.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((user) => (
                                            <TableRow key={user.id} hover>
                                                {/* Cột 1: Thông tin người dùng */}
                                                <TableCell>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Avatar
                                                            sx={{
                                                                width: 38,
                                                                height: 38,
                                                                bgcolor: user.role === 'admin' ? 'status.onchainBg' : user.role === 'organizer' ? 'action.selected' : 'background.subtle',
                                                                color: user.role === 'admin' ? 'status.onchain' : user.role === 'organizer' ? 'primary.main' : 'text.primary',
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                border: 1,
                                                                borderColor: 'divider',
                                                            }}
                                                        >
                                                            {user.avatarText}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                                                {user.fullName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {user.email} • ID: {user.id}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>

                                                {/* Cột 2: Vai trò */}
                                                <TableCell>
                                                    {renderRoleChip(user.role)}
                                                </TableCell>

                                                {/* Cột 3: Ví MetaMask */}
                                                <TableCell>
                                                    {user.walletAddress ? (
                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px' }}
                                                            >
                                                                {truncateHash(user.walletAddress, 6, 4)}
                                                            </Typography>
                                                            <Tooltip title="Sao chép địa chỉ ví">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Sao chép ví"
                                                                    onClick={() => handleCopy(user.walletAddress, 'địa chỉ ví')}
                                                                    sx={{ p: 0.2 }}
                                                                >
                                                                    <ContentCopy sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Xem trên Etherscan Sepolia">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Mở Etherscan"
                                                                    component="a"
                                                                    href={`https://sepolia.etherscan.io/address/${user.walletAddress}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    sx={{ p: 0.2, color: 'primary.main' }}
                                                                >
                                                                    <OpenInNew sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Stack>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">
                                                            Chưa liên kết
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Cột 4: Tài sản hoặc Sự kiện */}
                                                <TableCell>
                                                    {user.role === 'organizer' ? (
                                                        <Typography variant="body2" color="text.primary" fontWeight={600}>
                                                            {user.eventsCreated} sự kiện
                                                        </Typography>
                                                    ) : user.role === 'customer' ? (
                                                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                                                            {user.nftCount} vé NFT
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Toàn quyền Admin
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Cột 5: Trạng thái */}
                                                <TableCell>
                                                    {renderStatusChip(user.status)}
                                                </TableCell>

                                                {/* Cột 6: Ngày tạo */}
                                                <TableCell>
                                                    <Typography variant="body2" color="text.primary">
                                                        {user.createdAt}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {user.lastLogin}
                                                    </Typography>
                                                </TableCell>

                                                {/* Cột 7: Thao tác */}
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Tooltip title="Xem chi tiết hồ sơ">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Xem chi tiết"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setDetailModalOpen(true);
                                                                }}
                                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px' }}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Phân quyền vai trò">
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Phân quyền vai trò"
                                                                onClick={() => handleOpenRoleModal(user)}
                                                                sx={{ border: 1, borderColor: 'divider', borderRadius: '6px', color: 'primary.main' }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {user.status === 'suspended' ? (
                                                            <Tooltip title="Mở khóa tài khoản">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Mở khóa tài khoản"
                                                                    onClick={() => handleOpenSuspendModal(user)}
                                                                    sx={{
                                                                        bgcolor: 'status.successBg',
                                                                        color: 'status.success',
                                                                        borderRadius: '6px',
                                                                        '&:hover': { bgcolor: 'status.success', color: '#fff' },
                                                                    }}
                                                                >
                                                                    <LockOpen fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="Khóa tài khoản vi phạm">
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Khóa tài khoản"
                                                                    onClick={() => handleOpenSuspendModal(user)}
                                                                    disabled={user.role === 'admin'} // Không thể khóa Admin
                                                                    sx={{
                                                                        bgcolor: 'status.errorBg',
                                                                        color: 'status.error',
                                                                        borderRadius: '6px',
                                                                        '&:hover': { bgcolor: 'status.error', color: '#fff' },
                                                                        '&.Mui-disabled': { opacity: 0.4 },
                                                                    }}
                                                                >
                                                                    <Block fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Phân trang */}
                    <TablePagination
                        component="div"
                        count={filteredUsers.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage="Số dòng mỗi trang:"
                    />
                </Card>
            </Container>

            {/* ═══════════════════════════════════════════════════════════════════
                5. MODAL CHI TIẾT HỒ SƠ NGƯỜI DÙNG (PROFILE DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                {selectedUser && (
                    <>
                        <DialogTitle sx={{ pb: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h3" color="text.primary">
                                    Chi Tiết Tài Khoản Người Dùng
                                </Typography>
                                {renderStatusChip(selectedUser.status)}
                            </Stack>
                        </DialogTitle>

                        <DialogContent dividers>
                            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                                <Avatar
                                    sx={{
                                        width: 54,
                                        height: 54,
                                        bgcolor: 'primary.main',
                                        color: '#fff',
                                        fontSize: '1.25rem',
                                        fontWeight: 700,
                                    }}
                                >
                                    {selectedUser.avatarText}
                                </Avatar>
                                <Box>
                                    <Typography variant="h3" color="text.primary">
                                        {selectedUser.fullName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedUser.email}
                                    </Typography>
                                    <Box mt={0.5}>
                                        {renderRoleChip(selectedUser.role)}
                                    </Box>
                                </Box>
                            </Stack>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            ĐỊA CHỈ VÍ BLOCKCHAIN (ETHEREUM SEPOLIA)
                                        </Typography>
                                        {selectedUser.walletAddress ? (
                                            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {selectedUser.walletAddress}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    aria-label="Sao chép ví"
                                                    onClick={() => handleCopy(selectedUser.walletAddress, 'địa chỉ ví')}
                                                >
                                                    <ContentCopy sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>
                                        ) : (
                                            <Typography variant="body2" color="text.disabled" mt={0.5}>
                                                Người dùng chưa liên kết ví MetaMask. Chỉ có thể duyệt sự kiện, cần liên kết ví để mint vé NFT.
                                            </Typography>
                                        )}
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary">NGÀY THAM GIA</Typography>
                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600} mt={0.5}>
                                            {selectedUser.createdAt}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary">ĐĂNG NHẬP GẦN NHẤT</Typography>
                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600} mt={0.5}>
                                            {selectedUser.lastLogin}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: '8px' }}>
                                        <Typography variant="caption" color="text.secondary">GHI CHÚ HỆ THỐNG</Typography>
                                        <Typography variant="body2" color="text.primary" mt={0.5}>
                                            {selectedUser.notes}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {selectedUser.status === 'suspended' && (
                                    <Grid item xs={12}>
                                        <Alert severity="error">
                                            <strong>Lý do khóa tài khoản:</strong> {selectedUser.suspendReason}
                                        </Alert>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>

                        <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                color={selectedUser.status === 'suspended' ? 'success' : 'error'}
                                startIcon={selectedUser.status === 'suspended' ? <LockOpen /> : <Block />}
                                onClick={() => handleOpenSuspendModal(selectedUser)}
                                disabled={selectedUser.role === 'admin'}
                            >
                                {selectedUser.status === 'suspended' ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản'}
                            </Button>

                            <Stack direction="row" spacing={1.5}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setDetailModalOpen(false)}
                                >
                                    Đóng
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Edit />}
                                    onClick={() => handleOpenRoleModal(selectedUser)}
                                >
                                    Đổi Vai Trò
                                </Button>
                            </Stack>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                6. MODAL PHÂN QUYỀN VAI TRÒ (CHANGE ROLE DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={roleModalOpen}
                onClose={() => setRoleModalOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                <DialogTitle>
                    <Typography variant="h3" color="text.primary">
                        Phân Quyền Vai Trò
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Áp dụng cho tài khoản: <strong>{selectedUser?.fullName}</strong>
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText color="text.secondary" sx={{ mb: 2 }}>
                        Chọn quyền hạn phù hợp trong hệ thống BlockTickets:
                    </DialogContentText>

                    <RadioGroup
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: '8px', mb: 1.5 }}>
                            <FormControlLabel
                                value="customer"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
                                            Khách hàng (Customer)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Tìm kiếm sự kiện, kết nối ví MetaMask mua vé NFT, bán lại trên chợ thứ cấp.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>

                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: '8px', mb: 1.5 }}>
                            <FormControlLabel
                                value="organizer"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                                            Nhà tổ chức (Organizer)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Khởi tạo sự kiện, thiết lập hạng vé maxSupply, quét QR check-in tại cổng.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>

                        <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: '8px' }}>
                            <FormControlLabel
                                value="admin"
                                control={<Radio />}
                                label={
                                    <Box>
                                        <Typography variant="subtitle2" color="status.onchain" fontWeight={700}>
                                            Quản trị viên (Admin)
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Toàn quyền duyệt sự kiện, quản lý người dùng, giám sát Smart Contract.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    </RadioGroup>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button variant="outlined" onClick={() => setRoleModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleConfirmRoleChange}>
                        Cập Nhật Vai Trò
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                7. MODAL KHÓA / MỞ KHÓA TÀI KHOẢN (SUSPEND/UNSUSPEND DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={suspendModalOpen}
                onClose={() => setSuspendModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        {selectedUser?.status === 'suspended' ? (
                            <>
                                <LockOpen sx={{ color: 'status.success', fontSize: 26 }} />
                                <Typography variant="h3" color="text.primary">
                                    Xác Nhận Mở Khóa Tài Khoản
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Block sx={{ color: 'status.error', fontSize: 26 }} />
                                <Typography variant="h3" color="status.error">
                                    Khóa Tài Khoản Vi Phạm
                                </Typography>
                            </>
                        )}
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {selectedUser?.status === 'suspended' ? (
                        <DialogContentText color="text.secondary">
                            Bạn có chắc chắn muốn mở khóa tài khoản cho người dùng{' '}
                            <strong>{selectedUser?.fullName}</strong> ({selectedUser?.email})? Tài khoản sẽ được khôi phục quyền truy cập và giao dịch vé bình thường.
                        </DialogContentText>
                    ) : (
                        <>
                            <DialogContentText color="text.secondary" sx={{ mb: 2 }}>
                                Vui lòng ghi rõ lý do khóa tài khoản đối với{' '}
                                <strong>{selectedUser?.fullName}</strong>. Tài khoản bị khóa sẽ bị chặn kết nối ví MetaMask và không thể tạo đơn mua vé hay niêm yết trên chợ.
                            </DialogContentText>

                            {suspendError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {suspendError}
                                </Alert>
                            )}

                            <TextField
                                autoFocus
                                fullWidth
                                multiline
                                rows={3}
                                label="Lý do khóa tài khoản"
                                placeholder="Ví dụ: Cố ý sử dụng bot tự động gửi đơn hàng liên tục, bán vé vượt trần 120%..."
                                value={suspendReason}
                                onChange={(e) => {
                                    setSuspendReason(e.target.value);
                                    if (suspendError) setSuspendError('');
                                }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button variant="outlined" onClick={() => setSuspendModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        color={selectedUser?.status === 'suspended' ? 'success' : 'error'}
                        onClick={handleToggleSuspend}
                    >
                        {selectedUser?.status === 'suspended' ? 'Xác Nhận Mở Khóa' : 'Xác Nhận Khóa Tài Khoản'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                8. MODAL TẠO TÀI KHOẢN MỚI (CREATE USER DIALOG)
            ═══════════════════════════════════════════════════════════════════ */}
            <Dialog
                open={createUserModalOpen}
                onClose={() => setCreateUserModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '12px', bgcolor: 'background.paper' } }}
            >
                <DialogTitle>
                    <Typography variant="h3" color="text.primary">
                        Thêm Tài Khoản Mới
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Khởi tạo tài khoản người dùng hoặc nhà tổ chức sự kiện
                    </Typography>
                </DialogTitle>
                <Box component="form" onSubmit={handleCreateUser}>
                    <DialogContent dividers>
                        {createUserError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {createUserError}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Họ và tên"
                                    fullWidth
                                    required
                                    value={newUserData.fullName}
                                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Địa chỉ Email"
                                    type="email"
                                    fullWidth
                                    required
                                    value={newUserData.email}
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="new-user-role-label">Vai trò</InputLabel>
                                    <Select
                                        labelId="new-user-role-label"
                                        label="Vai trò"
                                        value={newUserData.role}
                                        onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                    >
                                        <MenuItem value="customer">Khách hàng (Customer)</MenuItem>
                                        <MenuItem value="organizer">Nhà tổ chức (Organizer)</MenuItem>
                                        <MenuItem value="admin">Quản trị viên (Admin)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Mật khẩu ban đầu"
                                    type="password"
                                    fullWidth
                                    placeholder="Tối thiểu 6 ký tự"
                                    value={newUserData.password}
                                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Địa chỉ ví MetaMask Sepolia (Tùy chọn)"
                                    placeholder="0x..."
                                    fullWidth
                                    value={newUserData.walletAddress}
                                    onChange={(e) => setNewUserData({ ...newUserData, walletAddress: e.target.value })}
                                    helperText="Có thể để trống để người dùng tự liên kết ví sau khi đăng nhập."
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2.5 }}>
                        <Button variant="outlined" onClick={() => setCreateUserModalOpen(false)}>
                            Hủy Bỏ
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            Tạo Tài Khoản
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════════════
                9. TOAST SNACKBAR THÔNG BÁO
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

export default UserManagementPage;

