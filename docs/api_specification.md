# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API SPECIFICATION)

> **Giao thức:** RESTful HTTP / JSON  
> **Cơ sở dữ liệu:** MongoDB Atlas  
> **Mã hóa & Xác thực:** JWT Bearer Token trong Header `Authorization: Bearer <token>`  
> **Định dạng chuẩn phản hồi:**
> ```json
> {
>   "success": true,
>   "message": "Mô tả kết quả thao tác",
>   "data": { ... }
> }
> ```

---

## 1. NHÓM API XÁC THỰC & NGƯỜI DÙNG (`/api/auth`, `/api/users`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản bằng email & mật khẩu |
| `POST` | `/api/auth/login` | Public | Đăng nhập bằng email/mật khẩu, trả về JWT access token |
| `GET` | `/api/auth/nonce?wallet=0x...` | Public | Lấy chuỗi ngẫu nhiên (nonce) để người dùng ký qua ví MetaMask |
| `POST` | `/api/auth/verify-wallet` | Public | Xác minh chữ ký `eth_sign`, tạo phiên đăng nhập bằng ví |
| `GET` | `/api/users/profile` | Logged In | Lấy thông tin tài khoản hiện tại |
| `PUT` | `/api/users/profile` | Logged In | Cập nhật thông tin cá nhân, liên kết địa chỉ ví |

---

## 2. NHÓM API SỰ KIỆN (`/api/events`, `/api/ticket-types`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Public | Danh sách sự kiện đã duyệt (`published`), có phân trang, lọc theo danh mục, tìm kiếm tên |
| `GET` | `/api/events/:id` | Public | Xem chi tiết sự kiện kèm danh sách các hạng vé |
| `POST` | `/api/events` | Organizer | Tạo mới sự kiện (trạng thái ban đầu: `draft`) |
| `PUT` | `/api/events/:id` | Organizer | Chỉnh sửa thông tin sự kiện (chỉ áp dụng khi chưa mở bán) |
| `POST` | `/api/events/:id/submit-review` | Organizer | Gửi sự kiện lên hàng đợi để Admin phê duyệt |
| `POST` | `/api/events/:id/ticket-types` | Organizer | Tạo các hạng vé (Standard, VIP, giá ban đầu, maxSupply) |

---

## 3. NHÓM API ĐƠN HÀNG & MUA VÉ (`/api/orders`, `/api/tickets`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Customer | Tạo intent mua vé, kiểm tra số lượng vé còn lại, sinh `idempotencyKey` |
| `POST` | `/api/orders/verify-tx` | Customer | Gửi `txHash` sau khi khách hàng đã thanh toán qua MetaMask; Backend xác minh receipt từ Sepolia |
| `GET` | `/api/orders/:id` | Customer | Kiểm tra trạng thái đơn hàng: `pending`, `confirmed`, `failed` |
| `GET` | `/api/tickets/my-tickets` | Customer | Lấy danh sách toàn bộ vé NFT thuộc quyền sở hữu của ví người dùng |
| `GET` | `/api/tickets/:id` | Customer | Chi tiết vé, lịch sử chuyển nhượng và hash giao dịch |
| `GET` | `/api/tickets/:id/qr-code` | Customer | Sinh mã QR động (chứa token HMAC) để trình diện tại cổng soát vé |

---

## 4. NHÓM API CHỢ VÉ THỨ CẤP (`/api/marketplace`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/marketplace/listings` | Public | Danh sách vé đang được niêm yết bán lại (giá, loại vé, sự kiện) |
| `POST` | `/api/marketplace/validate-price` | Customer | Kiểm tra trước giá bán lại có vượt quá trần **120% giá gốc** hay không |
| `POST` | `/api/marketplace/sync-listing` | Customer | Đồng bộ trạng thái sau khi đã gọi hàm `listTicket` thành công trên Smart Contract |
| `POST` | `/api/marketplace/sync-purchase` | Customer | Đồng bộ đổi chủ sở hữu vé sau khi người mua thực hiện `buyTicket` on-chain |

---

## 5. NHÓM API QUÉT MÃ QR & CHECK-IN (`/api/check-in`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/check-in/verify` | Organizer / Staff | Nhân viên gửi payload từ camera lên server để kiểm tra vé hợp lệ |
| `POST` | `/api/check-in/confirm` | Organizer / Staff | Đánh dấu vé đã check-in thành công một lần (`isUsed: true`), ghi log `CheckInLog` |
| `GET` | `/api/check-in/stats/:eventId` | Organizer | Thống kê số lượng khách đã check-in / tổng số vé đã phát hành |

---

## 6. NHÓM API QUẢN TRỊ VIÊN (`/api/admin`)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/pending-events` | Admin | Lấy danh sách các sự kiện đang chờ phê duyệt |
| `PATCH` | `/api/admin/events/:id/approve` | Admin | Phê duyệt sự kiện cho phép mở bán vé công khai |
| `PATCH` | `/api/admin/events/:id/reject` | Admin | Từ chối sự kiện kèm lý do giải thích |
| `GET` | `/api/admin/users` | Admin | Tra cứu toàn bộ người dùng, trạng thái và lịch sử ví |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Khóa hoặc mở khóa tài khoản người dùng vi phạm |
| `GET` | `/api/admin/audit-logs` | Admin | Xem toàn bộ nhật ký kiểm toán hệ thống |
