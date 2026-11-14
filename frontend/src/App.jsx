import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventApprovalPage from './pages/admin/EventApprovalPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import EventDetailPage from './pages/customer/EventDetailPage';
import EventsPage from './pages/customer/EventsPage';
import HomePage from './pages/customer/HomePage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import CheckInScannerPage from './pages/organizer/CheckInScannerPage';
import CreateEventPage from './pages/organizer/CreateEventPage';
import OrganizerDashboardPage from './pages/organizer/OrganizerDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
    return (
        <Routes>
            {/* Tuyến đường trang chủ (Customer Homepage) - YÊU CẦU ĐĂNG NHẬP */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/homepage" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/customer" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/customer/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/customer/homepage" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

            {/* Phân hệ xác thực */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Phân hệ Quản trị viên (Admin) - Yêu cầu role admin */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['admin']}><EventApprovalPage /></ProtectedRoute>} />
            <Route path="/admin/events/pending" element={<ProtectedRoute allowedRoles={['admin']}><EventApprovalPage /></ProtectedRoute>} />
            <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin']}><EventApprovalPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/user-management" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />

            {/* Phân hệ Khách hàng (Customer): Khám phá sự kiện, Xem chi tiết, Đặt vé & Kho vé NFT */}
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/customer/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/event/:id" element={<EventDetailPage />} />
            <Route path="/customer/events/:id" element={<EventDetailPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/customer/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/customer/tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
            <Route path="/customer/my-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />

            {/* Phân hệ Chợ vé thứ cấp (Marketplace - BR-02 Trần giá 120%) */}
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/resale" element={<MarketplacePage />} />
            <Route path="/customer/marketplace" element={<MarketplacePage />} />
            <Route path="/customer/resale" element={<MarketplacePage />} />

            {/* Phân hệ Ban tổ chức (Organizer) - Yêu cầu role organizer hoặc admin */}
            <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
            <Route path="/organizer/dashboard" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><OrganizerDashboardPage /></ProtectedRoute>} />
            <Route path="/organizer-dashboard" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><OrganizerDashboardPage /></ProtectedRoute>} />
            <Route path="/organizer/check-in" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CheckInScannerPage /></ProtectedRoute>} />
            <Route path="/check-in" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CheckInScannerPage /></ProtectedRoute>} />
            <Route path="/scanner" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CheckInScannerPage /></ProtectedRoute>} />
            <Route path="/organizer/scanner" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CheckInScannerPage /></ProtectedRoute>} />
            <Route path="/organizer/create-event" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CreateEventPage /></ProtectedRoute>} />
            <Route path="/create-event" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CreateEventPage /></ProtectedRoute>} />
            <Route path="/events/create" element={<ProtectedRoute allowedRoles={['organizer', 'admin']}><CreateEventPage /></ProtectedRoute>} />

            {/* Tuyến đường bắt lỗi 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default App;
