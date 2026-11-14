import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component:
 * - Chặn người dùng chưa đăng nhập và chuyển hướng sang trang đăng nhập (/login)
 * - Lưu lại tuyến đường người dùng đang truy cập dở trong location.state để chuyển hướng lại sau khi đăng nhập
 * - Hỗ trợ lọc theo danh sách quyền hợp lệ (allowedRoles)
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user?.role === 'organizer') return <Navigate to="/organizer/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;

