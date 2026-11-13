import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor: tự động đính kèm JWT Bearer Token nếu đã đăng nhập
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('blocktickets_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: xử lý bắt lỗi tập trung
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Trả về error object có sẵn message tiếng Việt từ backend
        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.';
        return Promise.reject({ ...error, message });
    }
);

export const authAPI = {
    // Đăng ký tài khoản (Customer hoặc Organizer)
    register: (userData) => api.post('/auth/register', userData),

    // Đăng nhập bằng Email & Mật khẩu
    login: (credentials) => api.post('/auth/login', credentials),

    // Lấy nonce ngẫu nhiên để ký trên ví MetaMask
    getNonce: (wallet) => api.get('/auth/nonce', { params: { wallet } }),

    // Xác thực chữ ký ví MetaMask
    verifyWallet: (walletData) => api.post('/auth/verify-wallet', walletData),

    // Làm mới Access Token khi hết hạn
    refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),

    // Đăng xuất thu hồi session
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),

    // Lấy thông tin cá nhân hiện tại
    getProfile: () => api.get('/auth/profile'),
};

export const adminAPI = {
    // Thống kê số liệu hệ thống
    getMetrics: () => api.get('/admin/metrics'),

    // Quản lý sự kiện & phê duyệt
    getPendingEvents: (params) => api.get('/admin/pending-events', { params }),
    getAllEvents: (params) => api.get('/admin/events', { params }),
    approveEvent: (id) => api.patch(`/admin/events/${id}/approve`),
    rejectEvent: (id, reason) => api.patch(`/admin/events/${id}/reject`, { reason }),
    cancelEvent: (id, reason) => api.patch(`/admin/events/${id}/cancel`, { reason }),

    // Quản lý người dùng
    getUsers: (params) => api.get('/admin/users', { params }),
    updateUserStatus: (id, status, reason) => api.patch(`/admin/users/${id}/status`, { status, reason }),
    updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),

    // Nhật ký kiểm toán
    getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
};

export const eventAPI = {
    // Lấy danh sách sự kiện công khai
    getEvents: (params) => api.get('/events', { params }),

    // Chi tiết sự kiện kèm các hạng vé
    getEventDetail: (id) => api.get(`/events/${id}`),
};

export const orderAPI = {
    // Tạo đơn mua vé
    createOrder: (orderData) => api.post('/orders', orderData),

    // Xác nhận giao dịch thanh toán on-chain và mint vé
    verifyTx: (txData) => api.post('/orders/verify-tx', txData),
    verifyOrderTx: (orderId, txData) => api.post(`/orders/${orderId}/verify-tx`, txData),

    // Lấy thông tin đơn hàng
    getOrder: (id) => api.get(`/orders/${id}`),
};

export const ticketAPI = {
    // Lấy danh sách vé NFT của người dùng / ví
    getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),

    // Chi tiết 1 vé
    getTicketDetail: (id) => api.get(`/tickets/${id}`),

    // Lấy chuỗi mã QR HMAC động
    getQRCode: (id) => api.get(`/tickets/${id}/qr-code`),

    // Chuyển nhượng vé cho ví khác
    transferTicket: (id, transferData) => api.post(`/tickets/${id}/transfer`, transferData),

    // Niêm yết vé bán lại trên sàn thứ cấp (trần giá 120%)
    listForResale: (id, resaleData) => api.post(`/tickets/${id}/resale`, resaleData),
};

export default api;

