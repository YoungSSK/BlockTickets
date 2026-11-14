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

// Response interceptor: xử lý bắt lỗi tập trung & tự động gia hạn token nếu hết hạn
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu mã lỗi là 401 do token hết hạn và chưa từng retry
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/refresh-token')
        ) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('blocktickets_refresh_token');

            if (refreshToken) {
                try {
                    const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                        refreshToken,
                    });

                    const newAccessToken = refreshRes.data?.data?.accessToken;
                    if (newAccessToken) {
                        localStorage.setItem('blocktickets_token', newAccessToken);
                        if (refreshRes.data?.data?.refreshToken) {
                            localStorage.setItem('blocktickets_refresh_token', refreshRes.data.data.refreshToken);
                        }
                        // Gắn token mới và thực hiện lại request ban đầu
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return api(originalRequest);
                    }
                } catch (refreshErr) {
                    console.warn('Phiên đăng nhập đã hết hạn hoàn toàn, cần đăng nhập lại:', refreshErr);
                    localStorage.removeItem('blocktickets_token');
                    localStorage.removeItem('blocktickets_user');
                    localStorage.removeItem('blocktickets_refresh_token');
                }
            } else {
                localStorage.removeItem('blocktickets_token');
                localStorage.removeItem('blocktickets_user');
            }
        }

        // Trả về error object có sẵn message tiếng Việt từ backend
        const validationErrors = error.response?.data?.errors;
        let message = error.response?.data?.message || error.response?.data?.error;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            message = validationErrors.map((e) => e.message).join('; ');
        }
        if (!message) {
            message = 'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.';
        }
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

export const marketplaceAPI = {
    // Lấy danh sách vé đang rao bán trên Marketplace
    getListings: (params) => api.get('/marketplace/listings', { params }),

    // Kiểm tra tính hợp lệ của giá bán lại theo quy tắc trần 120%
    validatePrice: (priceData) => api.post('/marketplace/validate-price', priceData),

    // Đồng bộ trạng thái niêm yết vé sau khi gọi Smart Contract
    syncListing: (listingData) => api.post('/marketplace/sync-listing', listingData),

    // Đồng bộ mua vé sau khi gọi hàm buyTicket trên Smart Contract
    syncPurchase: (purchaseData) => api.post('/marketplace/sync-purchase', purchaseData),

    // Hủy niêm yết vé khỏi Marketplace
    cancelListing: (listingId) => api.post(`/marketplace/cancel-listing/${listingId}`),
};

export const organizerAPI = {
    // Thống kê tổng quan của ban tổ chức (BTC)
    getStats: () => api.get('/events/organizer/stats'),

    // Danh sách sự kiện do BTC hiện tại quản lý
    getMyEvents: (params) => api.get('/events/organizer/my-events', { params }),

    // Tạo sự kiện mới (trạng thái draft)
    createEvent: (data) => api.post('/events', data),

    // Cập nhật sự kiện
    updateEvent: (id, data) => api.put(`/events/${id}`, data),

    // Thêm hạng vé cho sự kiện
    addTicketType: (eventId, data) => api.post(`/events/${eventId}/ticket-types`, data),

    // Gửi sự kiện cho Admin xét duyệt (draft -> pending)
    submitReview: (eventId) => api.post(`/events/${eventId}/submit-review`),

    // Công bố bán vé sau khi Admin duyệt (approved -> published)
    publishEvent: (eventId, data = {}) => api.post(`/events/${eventId}/publish`, data),
};

export const checkInAPI = {
    // Soát vé: quét mã QR và kiểm tra tính hợp lệ
    verifyTicket: (data) => api.post('/check-in/verify', data),

    // Xác nhận check-in (đóng dấu vé đã dùng)
    confirmCheckIn: (data) => api.post('/check-in/confirm', data),

    // Lấy thống kê check-in thời gian thực theo sự kiện
    getStats: (eventId) => api.get(`/check-in/stats/${eventId}`),
};

export default api;

