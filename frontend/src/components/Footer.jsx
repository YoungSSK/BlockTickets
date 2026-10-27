import React from 'react';
import { Box, Container, Typography, Grid, Link, Stack, Chip } from '@mui/material';
import { Ticket, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        pt: { xs: 6, md: 8 },
        pb: { xs: 4, md: 6 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Cột 1: Thông tin thương hiệu */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Ticket size={18} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Block<Box component="span" sx={{ color: 'primary.main' }}>Tickets</Box>
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.6, maxWidth: 380 }}>
              Nền tảng phân phối và chuyển nhượng vé sự kiện trực tuyến an toàn, minh bạch. Cam kết 100% vé chính hãng, bảo vệ tối đa quyền lợi người hâm mộ với công nghệ vé số thế hệ mới.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Chip
                label="Vé số định danh"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider' }}
              />
              <Chip
                label="Bảo mật Blockchain"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.72rem', fontWeight: 600, borderColor: 'divider' }}
              />
              <Chip
                label="Vé chính hãng 100%"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.72rem', fontWeight: 600 }}
              />
            </Stack>
          </Grid>

          {/* Cột 2: Khám phá & Dịch vụ */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Khám phá
            </Typography>
            <Stack spacing={1.2}>
              <Link href="/" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Sự kiện âm nhạc
              </Link>
              <Link href="/" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Hội thảo công nghệ
              </Link>
              <Link href="/" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Giải đấu thể thao
              </Link>
              <Link href="/marketplace" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Chợ vé chuyển nhượng
              </Link>
            </Stack>
          </Grid>

          {/* Cột 3: Dành cho Ban tổ chức */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Dành cho Organizer
            </Typography>
            <Stack spacing={1.2}>
              <Link href="/organizer" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Tạo sự kiện mới
              </Link>
              <Link href="/organizer" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Quản lý hạng vé
              </Link>
              <Link href="/organizer" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Ứng dụng quét mã QR
              </Link>
              <Link href="/organizer" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                Báo cáo doanh thu
              </Link>
            </Stack>
          </Grid>

          {/* Cột 4: Kỹ thuật & Blockchain */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Hợp đồng thông minh
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontSize: '0.8rem' }}>
              Mạng thử nghiệm: Ethereum Sepolia
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'monospace',
                bgcolor: 'background.default',
                p: 1,
                borderRadius: 1.5,
                border: 1,
                borderColor: 'divider',
                display: 'block',
                mb: 1.5,
                wordBreak: 'break-all',
              }}
            >
              0x5FbDB2315678afecb367f032d93F642f64180aa3
            </Typography>
            <Link
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener"
              color="primary.main"
              underline="hover"
              sx={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              Xem trên Etherscan
              <ExternalLink size={12} />
            </Link>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            © {new Date().getFullYear()} BlockTickets Inc. Nền tảng bán vé sự kiện ứng dụng Blockchain & NFT.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Thiết kế theo chuẩn Modern SaaS • Light & Dark Mode
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
