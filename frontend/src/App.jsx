import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventApprovalPage from './pages/admin/EventApprovalPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import EventDetailPage from './pages/customer/EventDetailPage';
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
            {/* Tuyến đường trang chủ (Customer Homepage) với đầy đủ alias */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/customer" element={<HomePage />} />
            <Route path="/customer/home" element={<HomePage />} />
            <Route path="/customer/homepage" element={<HomePage />} />

            {/* Phân hệ xác thực */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Phân hệ Quản trị viên (Admin) */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/events" element={<EventApprovalPage />} />
            <Route path="/admin/events/pending" element={<EventApprovalPage />} />
            <Route path="/admin/approvals" element={<EventApprovalPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/user-management" element={<UserManagementPage />} />

            {/* Phân hệ Khách hàng (Customer): Xem chi tiết, Đặt vé & Kho vé NFT */}
            <Route path="/events" element={<EventDetailPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/event/:id" element={<EventDetailPage />} />
            <Route path="/customer/events/:id" element={<EventDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/customer/checkout" element={<CheckoutPage />} />
            <Route path="/my-tickets" element={<MyTicketsPage />} />
            <Route path="/tickets" element={<MyTicketsPage />} />
            <Route path="/customer/tickets" element={<MyTicketsPage />} />
            <Route path="/customer/my-tickets" element={<MyTicketsPage />} />

            {/* Phân hệ Chợ vé thứ cấp (Marketplace - BR-02 Trần giá 120%) */}
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/resale" element={<MarketplacePage />} />
            <Route path="/customer/marketplace" element={<MarketplacePage />} />
            <Route path="/customer/resale" element={<MarketplacePage />} />

            {/* Phân hệ Ban tổ chức (Organizer): Dashboard, Soát vé Check-in & Tạo sự kiện */}
            <Route path="/organizer" element={<Navigate to="/organizer/dashboard" replace />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
            <Route path="/organizer-dashboard" element={<OrganizerDashboardPage />} />
            <Route path="/organizer/check-in" element={<CheckInScannerPage />} />
            <Route path="/check-in" element={<CheckInScannerPage />} />
            <Route path="/scanner" element={<CheckInScannerPage />} />
            <Route path="/organizer/scanner" element={<CheckInScannerPage />} />
            <Route path="/organizer/create-event" element={<CreateEventPage />} />
            <Route path="/create-event" element={<CreateEventPage />} />
            <Route path="/events/create" element={<CreateEventPage />} />

            {/* Tuyến đường bắt lỗi 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default App;
