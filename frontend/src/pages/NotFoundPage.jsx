import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Chip,
  useTheme,
} from '@mui/material';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        color: 'text.primary',
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={theme.palette.mode === 'light' ? 1 : 0}
          sx={{
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderRadius: 3, // 12px
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
          }}
        >
          {/* Badge Trạng thái Theme UI/UX */}
          <Chip
            label="LỖI 404 • KHỐI KHÔNG TỒN TẠI"
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              mb: 3,
              bgcolor:
                theme.palette.mode === 'light'
                  ? 'rgba(37, 99, 235, 0.08)'
                  : 'rgba(59, 130, 246, 0.15)',
              color: 'primary.main',
              border: 1,
              borderColor:
                theme.palette.mode === 'light'
                  ? 'rgba(37, 99, 235, 0.2)'
                  : 'rgba(59, 130, 246, 0.3)',
            }}
          />

          {/* Minh họa Vé & Khối Blockchain 404 (SVG Tinh gọn) */}
          <Box
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor:
                theme.palette.mode === 'light'
                  ? 'rgba(37, 99, 235, 0.06)'
                  : 'rgba(59, 130, 246, 0.1)',
              color: 'primary.main',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Biểu tượng Thẻ Vé NFT với chuỗi khối */}
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="m9.5 10 5 4" />
              <path d="m14.5 10-5 4" />
            </svg>
          </Box>

          {/* Tiêu đề & Nội dung chuẩn phân cấp Roboto */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem' },
              fontWeight: 800,
              color: 'primary.main',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              mb: 1.5,
            }}
          >
            404
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              fontWeight: 600,
              color: 'text.primary',
              mb: 1.5,
            }}
          >
            Không tìm thấy trang hoặc vé sự kiện
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              mb: 4,
              maxWidth: 440,
              mx: 'auto',
            }}
          >
            Đường dẫn bạn đang tìm kiếm có thể đã bị thay đổi, sự kiện đã kết thúc hoặc
            mã vé không tồn tại trên mạng blockchain BlockTickets.
          </Typography>

          {/* Các nút hành động chính (Tuân theo quy chuẩn Component Button) */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/')}
              sx={{
                px: 3,
                py: 1.25,
                fontWeight: 600,
              }}
            >
              Về trang chủ
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
              sx={{
                px: 3,
                py: 1.25,
                fontWeight: 600,
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor:
                    theme.palette.mode === 'light'
                      ? 'rgba(37, 99, 235, 0.04)'
                      : 'rgba(59, 130, 246, 0.08)',
                },
              }}
            >
              Quay lại trang trước
            </Button>
          </Stack>

          {/* Thông tin hỗ trợ phụ */}
          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Cần tra cứu giao dịch hoặc vé sự kiện?{' '}
              <Box
                component="span"
                onClick={() => navigate('/')}
                sx={{
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Khám phá sự kiện ngay
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
