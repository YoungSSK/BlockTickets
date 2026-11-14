import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
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

/**
 * Tuyến đường phục vụ Khách vãng lai (Guest) và Khách hàng (Customer):
 * - Khách vãng lai và Customer được phép xem trang chủ
 * - Nếu là Admin hoặc Organizer đăng nhập, tự động chuyển về Dashboard quản trị tương ứng
 */
const CustomerOrGuestRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    if (isAuthenticated) {
        if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user?.role === 'organizer') return <Navigate to="/organizer/dashboard" replace />;
    }
    return children;
};

const App = () => {
    return (
        <Routes>
            {/* Tuyến đường trang chủ (Homepage) - Mở công khai cho khách vãng lai & khách hàng, chuyển hướng Admin/Organizer về Dashboard */}
            <Route path="/" element={<CustomerOrGuestRoute><HomePage /></CustomerOrGuestRoute>} />
            <Route path="/home" element={<CustomerOrGuestRoute><HomePage /></CustomerOrGuestRoute>} />
            <Route path="/homepage" element={<CustomerOrGuestRoute><HomePage /></CustomerOrGuestRoute>} />
            <Route path="/customer" element={<CustomerOrGuestRoute><HomePage /></CustomerOrGuestRoute>} />
            <Route path="/customer/home" element={<CustomerOrGuestRoute><HomePage /></CustomerOrGuestRoute>} />
            <Route path="/customer/homepage" element={<CustomerOrGuestRoute><HomePage /></CustomerOrGuestRoute>} />

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

            {/* Phân hệ Khách hàng (Customer): Khám phá sự kiện công khai cho cả khách vãng lai; Đặt vé & Kho vé yêu cầu đăng nhập */}
            <Route path="/events" element={<EventsPage />} />
            <Route path="/explore" element={<EventsPage />} />
            <Route path="/customer/events" element={<EventsPage />} />
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
