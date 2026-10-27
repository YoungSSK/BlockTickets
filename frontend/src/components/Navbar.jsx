import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  useTheme,
} from '@mui/material';
import { useAppTheme } from '../context/ThemeContext';
import {
  Ticket,
  Sun,
  Moon,
  Wallet,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();

  // Trạng thái xác thực (placeholder độc lập - sẵn sàng kết nối khi bạn cùng nhóm hoàn thiện module Auth)
  const user = null;
  const isLoggedIn = Boolean(user);
  const logout = () => {};

  // Trạng thái kết nối ví demo
  const [walletAddress, setWalletAddress] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Menu dropdown cho Avatar khi đã đăng nhập
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleAvatarClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleConnectWallet = () => {
    if (walletAddress) {
      setWalletAddress(null);
    } else {
      setWalletAddress('0x71C...492E');
    }
  };

  const navLinks = [
    { label: 'Khám phá sự kiện', path: '/' },
    { label: 'Chợ vé chuyển nhượng', path: '/marketplace' },
    { label: 'Dành cho Organizer', path: '/organizer' },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 70, justifyContent: 'space-between' }}>
          {/* Logo & Tên thương hiệu */}
          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Ticket size={22} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  color: 'text.primary',
                }}
              >
                Block<Box component="span" sx={{ color: 'primary.main' }}>Tickets</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem', display: 'block' }}>
                NFT TICKETING PLATFORM
              </Typography>
            </Box>
          </Box>

          {/* Links điều hướng Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: isActive
                      ? theme.palette.mode === 'light'
                        ? 'rgba(37, 99, 235, 0.08)'
                        : 'rgba(59, 130, 246, 0.15)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor:
                        theme.palette.mode === 'light'
                          ? 'rgba(37, 99, 235, 0.05)'
                          : 'rgba(59, 130, 246, 0.1)',
                      color: 'primary.main',
                    },
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>

          {/* Nhóm Actions: Theme Toggle + Kết nối ví + Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Nút chuyển Light/Dark Mode */}
            <Tooltip title={mode === 'light' ? 'Chuyển sang Chế độ Tối' : 'Chuyển sang Chế độ Sáng'}>
              <IconButton
                onClick={toggleTheme}
                aria-label="Toggle theme mode"
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }}
              >
                {mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </IconButton>
            </Tooltip>

            {/* Nút Kết nối Ví MetaMask */}
            {walletAddress ? (
              <Chip
                label={walletAddress}
                onDelete={handleConnectWallet}
                color="primary"
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  borderRadius: 2,
                  px: 1,
                  height: 38,
                  borderColor: 'primary.main',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            ) : (
              <Button
                variant="contained"
                onClick={handleConnectWallet}
                startIcon={<Wallet size={18} />}
                sx={{
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              >
                Kết nối ví
              </Button>
            )}

            {/* =========================================================================
                Ô AVATAR: CHƯA ĐĂNG NHẬP -> /login | ĐÃ ĐĂNG NHẬP -> /profile
            ========================================================================= */}
            {isLoggedIn && user ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={`Tài khoản: ${user.fullName} • Bấm để vào Trang cá nhân`}>
                  <IconButton
                    onClick={handleAvatarClick}
                    aria-label="Trang cá nhân profile"
                    id="navbar-profile-avatar-btn"
                    sx={{
                      p: 0.25,
                      border: 2,
                      borderColor: 'primary.main',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.08)',
                        boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
                      },
                    }}
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.fullName}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                      }}
                    >
                      {user.fullName ? user.fullName.charAt(0) : 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                {/* Mũi tên mở dropdown menu nhanh cho các thao tác phụ (Kho vé, Đăng xuất) */}
                <IconButton
                  size="small"
                  onClick={handleOpenUserMenu}
                  aria-label="Mở menu người dùng"
                  id="navbar-user-dropdown-arrow"
                  sx={{
                    ml: 0.5,
                    p: 0.5,
                    color: 'text.secondary',
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  <ChevronDown size={16} />
                </IconButton>
              </Box>
            ) : (
              <Tooltip title="Tài khoản • Bấm để đăng nhập">
                <IconButton
                  onClick={handleAvatarClick}
                  aria-label="Tài khoản đăng nhập"
                  id="navbar-guest-avatar-btn"
                  sx={{
                    p: 0.25,
                    border: 1.5,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      transform: 'scale(1.08)',
                      boxShadow: '0 0 10px rgba(37, 99, 235, 0.25)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                    }}
                  >
                    <UserIcon size={20} />
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}

            {/* Menu Popover khi click Avatar đã đăng nhập */}
            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleCloseUserMenu}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  borderRadius: 2.5,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  p: 1,
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* Header người dùng */}
              {user && (
                <Box
                  onClick={() => {
                    navigate('/profile');
                    handleCloseUserMenu();
                  }}
                  sx={{
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {user.fullName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap display="block">
                    {user.email}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />

              <MenuItem
                onClick={() => {
                  navigate('/profile');
                  handleCloseUserMenu();
                }}
                sx={{ borderRadius: 1.5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <UserIcon size={18} />
                </ListItemIcon>
                <ListItemText primary="Trang cá nhân (Profile)" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
              </MenuItem>

              <MenuItem
                onClick={() => {
                  navigate('/profile');
                  handleCloseUserMenu();
                }}
                sx={{ borderRadius: 1.5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Ticket size={18} />
                </ListItemIcon>
                <ListItemText primary="Kho vé NFT của tôi" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
              </MenuItem>

              <Divider sx={{ my: 1 }} />

              <MenuItem
                onClick={() => {
                  logout();
                  handleCloseUserMenu();
                }}
                sx={{ borderRadius: 1.5, py: 1, color: 'status.error' }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                  <LogOut size={18} />
                </ListItemIcon>
                <ListItemText primary="Đăng xuất" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }} />
              </MenuItem>
            </Menu>

            {/* Nút mở Menu Mobile */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              sx={{ display: { xs: 'flex', md: 'none' }, border: 1, borderColor: 'divider', borderRadius: 2 }}
            >
              <MenuIcon size={22} />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      {/* Drawer menu cho Mobile */}
      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Menu điều hướng
          </Typography>
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.path} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(link.path);
                    setMobileOpen(false);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* Phần tài khoản trong Drawer */}
          <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {isLoggedIn && user && (
              <Box
                onClick={() => {
                  navigate('/profile');
                  setMobileOpen(false);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  cursor: 'pointer',
                  mb: 2,
                }}
              >
                <Avatar src={user.avatarUrl} sx={{ width: 40, height: 40, border: 2, borderColor: 'primary.main' }} />
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {user.fullName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                    Trang cá nhân →
                  </Typography>
                </Box>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                handleConnectWallet();
                setMobileOpen(false);
              }}
              sx={{ py: 1.25 }}
            >
              {walletAddress ? `Đã nối ví: ${walletAddress}` : 'Kết nối ví MetaMask'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
