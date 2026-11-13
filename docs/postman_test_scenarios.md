# KỊCH BẢN KIỂM THỬ API BACKEND VỚI POSTMAN (API TEST SUITE)

> **Hệ thống:** BlockTickets Backend RESTful API  
> **Môi trường cục bộ:** `http://localhost:5000`  
> **Cơ sở dữ liệu:** Aiven Cloud MySQL (Sequelize ORM)  
> **Xác thực:** JWT Bearer Token & MetaMask Web3 Signature  
> **Tệp đính kèm sẵn sàng import:**
> - Postman Collection: [`docs/BlockTickets_API.postman_collection.json`](file:///d:/Code/BlockChain/BlockTickets/docs/BlockTickets_API.postman_collection.json)
> - Postman Environment: [`docs/BlockTickets_Local.postman_environment.json`](file:///d:/Code/BlockChain/BlockTickets/docs/BlockTickets_Local.postman_environment.json)

---

## 1. TỔNG QUAN KIẾN TRÚC & BIẾN MÔI TRƯỜNG (ENVIRONMENT VARIABLES)

Hệ thống biến môi trường tự động chuyển giao dữ liệu (`Dynamic Chaining`) giữa các request mà người kiểm thử **không cần sao chép thủ công**:

| Biến Postman | Ý nghĩa | Cách thức khởi tạo / Cập nhật tự động |
| :--- | :--- | :--- |
| `baseUrl` | URL gốc của máy chủ API | Mặc định: `http://localhost:5000` |
| `organizerToken` | JWT Token của tài khoản Ban tổ chức | Tự động lưu sau request *Register/Login Organizer* |
| `organizerRefreshToken` | Refresh Token của Ban tổ chức | Dùng để kiểm thử cấp mới token (`/refresh-token`) |
| `customerToken` | JWT Token của tài khoản Khách hàng | Tự động lưu sau request *Register/Login Customer* |
| `adminToken` | JWT Token tài khoản Quản trị viên | Đăng nhập bằng tài khoản Admin trong hệ thống |
| `eventId` | ID số nguyên của sự kiện vừa tạo | Tự động trích xuất từ phản hồi của *Create Event Draft* |
| `ticketTypeId` | ID của hạng vé NFT vừa cấu hình | Tự động trích xuất từ phản hồi của *Add Ticket Type* |
| `testWallet` | Địa chỉ ví MetaMask mẫu | `0x789b9102934812301928394819203849102334ef` |

---

## 2. MA TRẬN KỊCH BẢN KIỂM THỬ (TEST SCENARIOS MATRIX)

Bộ kiểm thử được tổ chức thành **7 thư mục chuyên biệt** với **29 API Requests** bao quát toàn bộ vòng đời ứng dụng:

```text
BlockTickets Backend API Test Suite
├── 01. Health Check (2 requests)
├── 02. Authentication & Authorization (8 requests)
├── 03. User Management (2 requests)
├── 04. Event Lifecycle (Organizer) (7 requests)
├── 05. Admin Approvals (4 requests)
├── 06. Public Event Discovery (2 requests)
└── 07. Negative & Security Tests (5 requests)
```

---

### Nhóm 1: Kiểm tra kết nối & Sức khỏe máy chủ (`01. Health Check`)
* **Mục tiêu:** Xác nhận máy chủ Express và kết nối cơ sở dữ liệu Aiven Cloud MySQL hoạt động thông suốt trước khi chạy các nghiệp vụ khác.

| STT | Tên Request | Method | Endpoint | Mã HTTP mong đợi | Script Assertions (`pm.test`) |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 1.1 | Check Server Health | `GET` | `/api/health` | `200 OK` | `success == true`, message chứa chuỗi xác nhận trạng thái |
| 1.2 | Check Root Welcome Endpoint | `GET` | `/` | `200 OK` | Xác nhận thông báo kết nối Aiven Cloud MySQL thành công |

---

### Nhóm 2: Xác thực & Phân quyền (`02. Authentication & Authorization`)
* **Mục tiêu:** Đăng ký, đăng nhập tài khoản theo đúng vai trò (`customer`, `organizer`), sinh chuỗi `nonce` cho MetaMask, làm mới Token và Đăng xuất.

| STT | Tên Request | Method | Endpoint | Payload chính | Script Assertions & Tự động hóa |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 2.1 | Register Organizer Account | `POST` | `/api/auth/register` | `email`, `password`, `fullName`, `role: "organizer"` | HTTP 201; Lưu `organizerToken` & `organizerRefreshToken` |
| 2.2 | Register Customer Account | `POST` | `/api/auth/register` | `email`, `password`, `fullName`, `role: "customer"` | HTTP 201; Lưu `customerToken` |
| 2.3 | Login Organizer | `POST` | `/api/auth/login` | `email`, `password` | HTTP 200; Cập nhật `organizerToken` mới |
| 2.4 | Login Customer | `POST` | `/api/auth/login` | `email`, `password` | HTTP 200; Cập nhật `customerToken` mới |
| 2.5 | Get MetaMask Wallet Nonce | `GET` | `/api/auth/nonce?wallet={{testWallet}}` | Query `wallet` | HTTP 200; Lưu chuỗi `nonce` trả về |
| 2.6 | Get Auth Profile (Logged In) | `GET` | `/api/auth/profile` | Header `Bearer {{organizerToken}}` | HTTP 200; Kiểm tra email trùng khớp |
| 2.7 | Refresh Access Token | `POST` | `/api/auth/refresh-token` | `refreshToken` | HTTP 200; Kiểm tra `accessToken` mới |

---

### Nhóm 3: Quản lý thông tin người dùng (`03. User Management`)
* **Mục tiêu:** Đọc và cập nhật hồ sơ cá nhân qua Header `Authorization`.

| STT | Tên Request | Method | Endpoint | Payload chính | Assertions |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 3.1 | Get My Profile | `GET` | `/api/users/profile` | Header `Bearer {{customerToken}}` | HTTP 200; Trả về đối tượng `user` |
| 3.2 | Update User Profile | `PUT` | `/api/users/profile` | `{ "fullName": "Nguyen Tuan An (VIP)" }` | HTTP 200; Tên mới được cập nhật trong DB |

---

### Nhóm 4: Vòng đời Sự kiện của Ban Tổ Chức (`04. Event Lifecycle`)
* **Mục tiêu:** Kiểm thử toàn bộ quy trình: Tạo nháp -> Cấu hình hạng vé (BR-01, BR-02) -> Cập nhật thông tin -> Xem danh sách -> Gửi duyệt -> Công khai bán vé.

| STT | Tên Request | Method | Endpoint | Vai trò | Mô tả & Assertions |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 4.1 | 1. Create Event Draft | `POST` | `/api/events` | `organizer` | Tạo sự kiện `draft`. **Tự động lưu `eventId` vào Environment**. |
| 4.2 | 2. Add Standard Ticket Type | `POST` | `/api/events/{{eventId}}/ticket-types` | `organizer` | Tạo vé Standard: `0.08 ETH`, `maxSupply: 300` (BR-01). |
| 4.3 | 3. Add VIP Ticket Type | `POST` | `/api/events/{{eventId}}/ticket-types` | `organizer` | Tạo vé VIP: `0.25 ETH`, `maxSupply: 50`. **Lưu `ticketTypeId`**. |
| 4.4 | 4. Update Event Draft Info | `PUT` | `/api/events/{{eventId}}` | `organizer` | Sửa tiêu đề sự kiện sang bản chính thức. |
| 4.5 | 5. List My Events | `GET` | `/api/events/organizer/my-events` | `organizer` | Kiểm tra sự kiện vừa tạo có trong danh sách. |
| 4.6 | 6. Submit Event for Review | `POST` | `/api/events/{{eventId}}/submit-review` | `organizer` | Chuyển trạng thái từ `draft` -> `pending`. |
| 4.7 | 7. Publish Approved Event | `POST` | `/api/events/{{eventId}}/publish` | `organizer` | Mở bán sự kiện khi đã được Admin phê duyệt (`published`). |

---

### Nhóm 5: Thẩm định & Phê duyệt của Quản trị viên (`05. Admin Approvals`)
* **Mục tiêu:** Quản trị viên kiểm tra hàng đợi sự kiện `pending` và thực hiện các quyết định duyệt / từ chối / hủy sự kiện.

| STT | Tên Request | Method | Endpoint | Vai trò | Assertions |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 5.1 | 1. List Pending Events Queue | `GET` | `/api/admin/pending-events` | `admin` | HTTP 200; Danh sách sự kiện chờ thẩm định |
| 5.2 | 2. Admin Approve Event | `PATCH` | `/api/admin/events/{{eventId}}/approve` | `admin` | HTTP 200; Trạng thái sự kiện chuyển thành `approved` |
| 5.3 | 3. Admin Reject Event with Reason | `PATCH` | `/api/admin/events/{{eventId}}/reject` | `admin` | HTTP 200; Lưu lý do từ chối `rejection_reason` |
| 5.4 | 4. Admin Cancel or Hide Event | `PATCH` | `/api/admin/events/{{eventId}}/cancel` | `admin` | HTTP 200; Hủy/Ẩn sự kiện vi phạm |

---

### Nhóm 6: Khám phá sự kiện công khai (`06. Public Event Discovery`)
* **Mục tiêu:** Kiểm tra các API công khai cho khách hàng duyệt xem sự kiện, tìm kiếm và xem chi tiết các hạng vé.

| STT | Tên Request | Method | Endpoint | Quyền hạn | Assertions |
| :---: | :--- | :---: | :--- | :---: | :--- |
| 6.1 | Get Public Events (List & Filter) | `GET` | `/api/events?page=1&limit=10&category=technology` | Public | HTTP 200; Trả về mảng `events` và đối tượng `pagination` |
| 6.2 | Get Event Details by ID | `GET` | `/api/events/{{eventId}}` | Public | HTTP 200; Trả về chi tiết sự kiện kèm mảng `ticketTypes` |

---

### Nhóm 7: Kiểm thử Ngoại lệ & Bảo mật (`07. Negative & Security Tests`)
* **Mục tiêu:** Đảm bảo hệ thống bắt lỗi chuẩn xác (Validation, Phân quyền, 404, Giá vé không hợp lệ).

| STT | Kịch bản kiểm thử | Request | Kích hoạt lỗi | Mã HTTP mong đợi |
| :---: | :--- | :---: | :--- | :---: |
| 7.1 | **Validation Error** | `POST /api/auth/register` | Gửi email sai định dạng (`"not-an-email"`) | `400 Bad Request` |
| 7.2 | **Missing Authorization** | `GET /api/users/profile` | Không gửi Header `Authorization` | `401 Unauthorized` |
| 7.3 | **Role Violation (Bảo mật)** | `POST /api/events` | Dùng `customerToken` gọi API tạo sự kiện của Organizer | `403 Forbidden` |
| 7.4 | **Quy tắc giá vé (BR-02)** | `POST /api/events/{{eventId}}/ticket-types` | Đặt giá vé phát hành ban đầu $\le 0$ ETH | `400 Bad Request` |
| 7.5 | **Not Found Handling** | `GET /api/events/999999` | Truy vấn ID sự kiện không tồn tại | `404 Not Found` |

---

## 3. HƯỚNG DẪN IMPORT VÀ CHẠY KIỂM THỬ TRÊN POSTMAN

### Bước 1: Khởi động Backend
Đảm bảo máy chủ Backend đang chạy:
```powershell
cd backend
npm run dev
# Server đang chạy tại: http://localhost:5000
```

### Bước 2: Import vào Postman
1. Mở ứng dụng **Postman**.
2. Bấm nút **Import** (góc trên bên trái).
3. Kéo thả 2 tệp sau vào cửa sổ Import:
   - [`docs/BlockTickets_API.postman_collection.json`](file:///d:/Code/BlockChain/BlockTickets/docs/BlockTickets_API.postman_collection.json)
   - [`docs/BlockTickets_Local.postman_environment.json`](file:///d:/Code/BlockChain/BlockTickets/docs/BlockTickets_Local.postman_environment.json)
4. Tại góc trên bên phải của Postman, chuyển môi trường hoạt động sang: **`BlockTickets Local Environment`**.

### Bước 3: Chạy Kiểm thử Tự động (Postman Collection Runner)
1. Nhấp chuột phải vào Collection **BlockTickets Backend API Test Suite**.
2. Chọn **Run collection**.
3. Giữ nguyên thứ tự các thư mục từ `01` đến `07`.
4. Bấm **Run BlockTickets Backend API Test Suite**.
5. Toàn bộ các Assertions xanh lá (`PASS`) sẽ được hiển thị với báo cáo chi tiết.

### Bước 4: (Tùy chọn) Chạy tự động qua Command Line với Newman
Nếu muốn tích hợp CI/CD hoặc kiểm tra nhanh qua terminal:
```powershell
npm install -g newman
newman run docs/BlockTickets_API.postman_collection.json -e docs/BlockTickets_Local.postman_environment.json
```

