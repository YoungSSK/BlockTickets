import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EventApprovalPage from './pages/admin/EventApprovalPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/events" element={<EventApprovalPage />} />
      <Route path="/admin/events/pending" element={<EventApprovalPage />} />
      <Route path="/admin/approvals" element={<EventApprovalPage />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/user-management" element={<UserManagementPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/customer/checkout" element={<CheckoutPage />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
