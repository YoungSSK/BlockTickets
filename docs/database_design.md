# THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN - AIVEN CLOUD MYSQL)

> **Cơ sở dữ liệu:** Aiven Cloud MySQL (Managed MySQL 8.0+, SSL Required)  
> **Thư viện kết nối / ORM:** Sequelize v6+ & driver `mysql2` (Node.js ES Modules)  
> **Bảng mã & Đối chiếu (Charset & Collation):** `utf8mb4` / `utf8mb4_unicode_ci`  
> **Storage Engine:** InnoDB (hỗ trợ ACID Transactions, Row-level Locking, Foreign Key Constraints)  
> **Nguyên tắc cốt lõi:** MySQL lưu trữ dữ liệu nghiệp vụ ngoài chuỗi (off-chain), hỗ trợ truy vấn quan hệ nhanh, quản lý giao dịch an toàn và hiển thị giao diện. Quyền sở hữu vé NFT, trần giá 120% và tổng cung tối đa được bảo chứng bất biến trên Blockchain Ethereum Sepolia.

---

## 1. MỐI QUAN HỆ THỰC THỂ (ENTITY RELATIONSHIP DIAGRAM - ERD)

```text
+-------------------+            1:N           +---------------------+
|      users        | -----------------------> |       events        |
| (Admin/Org/Cust)  |                          | (Draft/Approved/...) |
+-------------------+                          +---------------------+
          |                                               | 1:N
          | 1:N                                           v
          |                                    +---------------------+
          |                                    |    ticket_types     |
          |                                    | (VIP, max_supply...) |
          |                                    +---------------------+
          v                                               | 1:N
+-------------------+                                     v
|      orders       | -----------------------> +---------------------+
| (buyer, tx_hash)  |            1:N           |       tickets       |
+-------------------+                          | (token_id, owner...) |
                                               +---------------------+
                                                 | 1:1          | 1:N
                                                 v              v
                                      +------------------+  +------------------+
                                      | resale_listings  |  |  check_in_logs   |
                                      | (price <= 120%)  |  |  (scanned_at...) |
                                      +------------------+  +------------------+
```

---

## 2. CHI TIẾT CÁC BẢNG (TABLES & SCHEMAS)

### 2.1. Bảng: `users`
Lưu trữ thông tin tài khoản người dùng, phân quyền vai trò và liên kết địa chỉ ví blockchain.

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`, `INDEX` | Email định danh |
| `password_hash` | `VARCHAR(255)` | `NULL` | Mật khẩu hash bằng bcrypt (null nếu chỉ đăng nhập ví) |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Họ tên hiển thị |
| `role` | `ENUM('admin', 'organizer', 'customer')` | `DEFAULT 'customer'`, `INDEX` | Phân quyền truy cập |
| `wallet_address` | `VARCHAR(42)` | `NULL`, `UNIQUE`, `INDEX` | Địa chỉ ví Ethereum (chữ thường, vd: `0x...`) |
| `nonce` | `VARCHAR(255)` | `NULL` | Chuỗi ngẫu nhiên phục vụ Sign-In with Ethereum (SIWE) |
| `status` | `ENUM('active', 'suspended')` | `DEFAULT 'active'` | Trạng thái tài khoản |
| `avatar_url` | `VARCHAR(500)` | `DEFAULT ''` | Đường dẫn ảnh đại diện |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### 2.2. Bảng: `events`
Lưu trữ thông tin chi tiết sự kiện do Organizer khởi tạo.

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `organizer_id` | `INT` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE CASCADE` | ID người tổ chức |
| `title` | `VARCHAR(255)` | `NOT NULL`, `FULLTEXT INDEX` | Tiêu đề sự kiện |
| `description` | `TEXT` | `NOT NULL` | Mô tả chi tiết nội dung sự kiện |
| `category` | `ENUM('music', 'technology', 'sports', 'workshop')` | `NOT NULL` | Phân loại sự kiện |
| `banner_url` | `VARCHAR(500)` | `NOT NULL` | Link ảnh poster/banner |
| `venue_name` | `VARCHAR(255)` | `NOT NULL` | Tên địa điểm tổ chức |
| `venue_address` | `VARCHAR(500)` | `NOT NULL` | Địa chỉ chi tiết |
| `venue_city` | `VARCHAR(100)` | `NOT NULL`, `INDEX` | Tỉnh / Thành phố |
| `start_time` | `DATETIME` | `NOT NULL`, `INDEX` | Thời gian bắt đầu sự kiện |
| `end_time` | `DATETIME` | `NOT NULL` | Thời gian kết thúc sự kiện |
| `status` | `ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'ended', 'cancelled')` | `DEFAULT 'draft'`, `INDEX` | Trạng thái phê duyệt & bán |
| `rejection_reason` | `TEXT` | `NULL` | Lý do Admin từ chối (nếu có) |
| `on_chain_event_id` | `BIGINT` | `NULL` | Mã ID sự kiện ghi nhận trên Smart Contract |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời gian tạo |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Thời gian cập nhật |

> **Chỉ mục kết hợp (Composite Index):** `INDEX idx_events_status_start_time (status, start_time)` giúp trang chủ load danh sách sự kiện đã duyệt cực nhanh.

---

### 2.3. Bảng: `ticket_types`
Lưu trữ các hạng vé (Standard, VIP, Early Bird...) thuộc về một sự kiện.

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `event_id` | `INT` | `NOT NULL`, `FOREIGN KEY (events.id) ON DELETE CASCADE` | Thuộc sự kiện nào |
| `name` | `VARCHAR(100)` | `NOT NULL` | Tên hạng vé (vd: "VIP Diamond", "Standard") |
| `description` | `TEXT` | `NULL` | Quyền lợi của hạng vé |
| `original_price` | `DECIMAL(18, 6)` | `NOT NULL` | Giá gốc phát hành ban đầu (đơn vị ETH) |
| `currency` | `VARCHAR(10)` | `DEFAULT 'ETH'` | Đơn vị tiền tệ |
| `max_supply` | `INT` | `NOT NULL` | Số lượng vé phát hành trần |
| `current_supply` | `INT` | `DEFAULT 0` | Số lượng vé đã được mint on-chain |
| `sale_start_time` | `DATETIME` | `NOT NULL` | Thời điểm bắt đầu mở bán |
| `sale_end_time` | `DATETIME` | `NOT NULL` | Thời điểm kết thúc đợt bán |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm tạo |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### 2.4. Bảng: `tickets`
Bản ghi vé NFT sau khi giao dịch mua trên Sepolia Testnet được xác thực thành công.

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính nội bộ |
| `token_id` | `BIGINT` | `NOT NULL`, `UNIQUE`, `INDEX` | Token ID ERC-721 đại diện trên Blockchain |
| `event_id` | `INT` | `NOT NULL`, `FOREIGN KEY (events.id) ON DELETE RESTRICT` | Liên kết sự kiện |
| `ticket_type_id` | `INT` | `NOT NULL`, `FOREIGN KEY (ticket_types.id) ON DELETE RESTRICT` | Liên kết hạng vé |
| `owner_wallet` | `VARCHAR(42)` | `NOT NULL`, `INDEX` | Ví hiện đang sở hữu vé (lowercase) |
| `original_buyer_wallet` | `VARCHAR(42)` | `NOT NULL` | Ví người mua ban đầu |
| `original_price` | `DECIMAL(18, 6)` | `NOT NULL` | Giá gốc (đối soát trần 120% khi bán lại) |
| `tx_hash` | `VARCHAR(66)` | `NOT NULL`, `UNIQUE` | Hash giao dịch mint vé on-chain |
| `is_used` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0`, `INDEX` | Trạng thái check-in (1 = đã dùng, 0 = chưa) |
| `used_at` | `DATETIME` | `NULL` | Thời điểm quét vé thành công |
| `is_listed_for_resale` | `TINYINT(1)` / `BOOLEAN` | `DEFAULT 0`, `INDEX` | Cờ đánh dấu đang niêm yết trên chợ |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Ngày tạo |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Ngày cập nhật |

> **Chỉ mục kết hợp:** `INDEX idx_tickets_event_owner (event_id, owner_wallet)` giúp lấy vé của người dùng trong sự kiện tức thì.

---

### 2.5. Bảng: `orders`
Lịch sử đặt mua vé và trạng thái xác minh giao dịch với blockchain.

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `buyer_wallet` | `VARCHAR(42)` | `NOT NULL`, `INDEX` | Địa chỉ ví người mua |
| `event_id` | `INT` | `NOT NULL`, `FOREIGN KEY (events.id) ON DELETE RESTRICT` | Sự kiện |
| `ticket_type_id` | `INT` | `NOT NULL`, `FOREIGN KEY (ticket_types.id) ON DELETE RESTRICT` | Hạng vé |
| `quantity` | `INT` | `NOT NULL DEFAULT 1` | Số lượng vé đặt mua |
| `total_price` | `DECIMAL(18, 6)` | `NOT NULL` | Tổng tiền thanh toán (ETH) |
| `currency` | `VARCHAR(10)` | `DEFAULT 'ETH'` | Loại tiền |
| `tx_hash` | `VARCHAR(66)` | `NULL`, `INDEX` | Transaction Hash người dùng gửi từ MetaMask |
| `status` | `ENUM('pending_payment', 'verifying', 'confirmed', 'failed', 'cancelled')` | `DEFAULT 'pending_payment'`, `INDEX` | Trạng thái đơn |
| `idempotency_key` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | Khóa chống tạo đơn trùng khi bấm nhiều lần |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm tạo đơn |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Thời điểm cập nhật |

---

### 2.6. Bảng: `resale_listings`
Thông tin vé đang được niêm yết bán lại trên Marketplace.

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `token_id` | `BIGINT` | `NOT NULL`, `INDEX` | Token ID trên blockchain |
| `ticket_id` | `INT` | `NOT NULL`, `FOREIGN KEY (tickets.id) ON DELETE RESTRICT` | Liên kết bản ghi vé |
| `event_id` | `INT` | `NOT NULL`, `FOREIGN KEY (events.id) ON DELETE RESTRICT` | Liên kết sự kiện |
| `seller_wallet` | `VARCHAR(42)` | `NOT NULL`, `INDEX` | Ví người bán |
| `original_price` | `DECIMAL(18, 6)` | `NOT NULL` | Giá gốc ban đầu |
| `resale_price` | `DECIMAL(18, 6)` | `NOT NULL` | Giá chào bán (**BẮT BUỘC <= max_allowed_price**) |
| `max_allowed_price` | `DECIMAL(18, 6)` | `NOT NULL` | Trần giá 120% (`original_price * 1.2`) |
| `listing_tx_hash` | `VARCHAR(66)` | `NULL` | Transaction hash gọi hàm `listTicket` on-chain |
| `buyer_wallet` | `VARCHAR(42)` | `NULL` | Ví người mua lại |
| `sold_tx_hash` | `VARCHAR(66)` | `NULL` | Transaction hash người mua lại gọi `buyTicket` |
| `status` | `ENUM('active', 'sold', 'cancelled')` | `DEFAULT 'active'`, `INDEX` | Trạng thái niêm yết |
| `sold_at` | `DATETIME` | `NULL` | Thời điểm hoàn tất giao dịch bán |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm đăng tin |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Thời điểm cập nhật |

> **Chỉ mục kết hợp:** `INDEX idx_resale_status_event (status, event_id)` tối ưu tìm kiếm vé đang rao bán trong từng sự kiện.

---

### 2.7. Bảng: `check_in_logs`
Nhật ký quét mã QR soát vé tại cửa sự kiện (truy vết kiểm soát vào cổng).

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `token_id` | `BIGINT` | `NOT NULL`, `INDEX` | Token ID của vé |
| `event_id` | `INT` | `NOT NULL`, `FOREIGN KEY (events.id) ON DELETE RESTRICT` | Sự kiện |
| `scanned_by` | `INT` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE RESTRICT` | Nhân viên thực hiện quét |
| `status` | `ENUM('success', 'already_used', 'invalid_ticket', 'wrong_event', 'invalid_signature')` | `NOT NULL` | Kết quả soát vé |
| `qr_nonce` | `VARCHAR(255)` | `NOT NULL` | Chuỗi nonce HMAC bảo mật |
| `scanned_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP`, `INDEX` | Thời điểm quét |

---

### 2.8. Bảng: `audit_logs`
Lưu vết các thao tác nhạy cảm của Admin và Organizer (phục vụ kiểm toán).

| Cột (Column) | Kiểu dữ liệu | Thuộc tính | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT`, `PRIMARY KEY` | Khóa chính |
| `user_id` | `INT` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE RESTRICT` | Người thực hiện |
| `user_role` | `VARCHAR(50)` | `NOT NULL` | Vai trò khi thực hiện thao tác |
| `action` | `VARCHAR(100)` | `NOT NULL` | Hành động (vd: `APPROVE_EVENT`, `REJECT_EVENT`, `SUSPEND_USER`) |
| `target_id` | `VARCHAR(100)` | `NOT NULL` | ID đối tượng bị tác động |
| `ip_address` | `VARCHAR(45)` | `NULL` | Địa chỉ IP (IPv4 hoặc IPv6) |
| `details` | `JSON` | `NULL` | Chi tiết thao tác dạng JSON |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm ghi log |

---

## 3. CHIẾN LƯỢC TỐI ƯU HÓA TRÊN AIVEN CLOUD MYSQL

1. **Khóa dòng & Giao dịch an toàn (Row-level Locking & Transactions):**
   - Khi check-in vé hoặc cập nhật số lượng vé mở bán, hệ thống sử dụng cú pháp:
     ```sql
     START TRANSACTION;
     SELECT * FROM tickets WHERE token_id = ? AND is_used = 0 FOR UPDATE;
     UPDATE tickets SET is_used = 1, used_at = NOW() WHERE id = ?;
     COMMIT;
     ```
   - Cơ chế này chặn đứng tình trạng race-condition (2 máy quét QR cùng một lúc hoặc 2 người cùng mua chiếc vé cuối cùng).
2. **Bảo mật kết nối SSL/TLS:**
   - Aiven Cloud MySQL bắt buộc kết nối có mã hóa (`ssl: { require: true, rejectUnauthorized: false }`), đảm bảo không thể bị nghe lén (Man-In-The-Middle) khi dữ liệu truyền qua Internet.
3. **Foreign Keys Toàn vẹn:**
   - Các khóa ngoại đảm bảo dữ liệu quan hệ luôn nhất quán. Ví dụ: Sự kiện bị xóa sẽ tự động dọn dẹp các hạng vé tương ứng (`ON DELETE CASCADE`), nhưng vé đã phát hành on-chain sẽ được bảo vệ không thể xóa bừa bãi (`ON DELETE RESTRICT`).
