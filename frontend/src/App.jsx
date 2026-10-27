import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeContextProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/customer/HomePage';
import EventDetailPage from './pages/customer/EventDetailPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeContextProvider>
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              {/* Trang chủ */}
              <Route path="/" element={<HomePage />} />

              {/* Chi tiết sự kiện */}
              <Route path="/event/:id" element={<EventDetailPage />} />

              {/* Mọi route không tồn tại điều hướng về 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}
