# THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

> **Hệ thống:** BlockTickets  
> **Kiến trúc:** Hybrid On-chain & Off-chain Architecture  

---

## 1. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ

```text
[ Người Dùng: Khách Hàng / Organizer / Admin ]
                     |
                     |  Trình duyệt web + MetaMask
                     v
+-----------------------------------------------------------+
|               FRONTEND (React + JavaScript)               |
|  - Giao diện người dùng: Customer, Organizer, Admin       |
|  - Mua vé, Chợ Marketplace, Soát vé QR qua Camera         |
|  - Thư viện: React Router, Axios, ethers.js, Html5-QRCode |
+-----------------------------------------------------------+
        |                                           |
        | (1) REST API (JSON / JWT)                 | (2) Web3 Transaction
        v                                           v
+------------------------------------+  +-------------------------------------+
|        BACKEND (Node.js/Express)   |  |     ETHEREUM SEPOLIA BLOCKCHAIN     |
|  - Routes & Controllers            |  |                                     |
|  - Services (Auth, Order, CheckIn) |  |  +-------------------------------+  |
|  - Bảo mật (JWT, HMAC QR, Zod)     |  |  | EventTicket.sol (ERC-721)     |  |
|  - Blockchain Verifier & Listener  |  |  | - Quản lý maxSupply & mint vé |  |
+------------------------------------+  |  | - Lưu originalPrice bất biến  |  |
        |                     ^         |  +-------------------------------+  |
        | Mongoose            | RPC     |  +-------------------------------+  |
        v                     | Event   |  | TicketMarketplace.sol         |  |
+-----------------------+     | Sync    |  | - Ràng buộc trần giá 120%     |  |
|     MONGODB ATLAS     |     +-------- |  | - Chuyển giao tiền & vé NFT   |  |
|  - Cloud DB Cluster   |               |  +-------------------------------+  |
|  - Lưu dữ liệu cache, |               +-------------------------------------+
|    sự kiện, tài khoản,|
|    lịch sử check-in   |
+-----------------------+
```

---

## 2. PHÂN ĐỊNH TRÁCH NHIỆM ON-CHAIN VÀ OFF-CHAIN

| Dữ liệu / Trách nhiệm | Xử lý On-chain (Blockchain) | Xử lý Off-chain (MongoDB Atlas / Backend) |
| :--- | :--- | :--- |
| **Quyền sở hữu vé (Ownership)** | Bất biến, chuẩn ERC-721 qua hàm `ownerOf(tokenId)` | Lưu bản ghi cache để hỗ trợ tìm kiếm và hiển thị nhanh trên giao diện |
| **Nguồn cung vé (`maxSupply`)** | Ràng buộc cứng trong Smart Contract, không thể mint vượt | Hiển thị số vé còn lại trên UI để người dùng theo dõi |
| **Giá phát hành ban đầu** | Lưu trong biến `originalPrice` on-chain của hạng vé | Hiển thị giá vé theo đơn vị ETH và VND quy đổi |
| **Trần giá bán lại 120%** | **Smart Contract từ chối giao dịch** nếu `price > originalPrice * 1.2` | Frontend kiểm tra trước và cảnh báo người dùng khi nhập giá |
| **Thông tin sự kiện phong phú** | Chỉ lưu `eventId` và token URI tối giản (tiết kiệm phí gas) | Lưu tiêu đề, mô tả chi tiết, ảnh banner, địa chỉ bản đồ, lịch trình |
| **Xác thực danh tính & Check-in** | Trạng thái vé hợp lệ on-chain | Sinh mã QR động HMAC, lưu lịch sử quét tại cổng, thời gian và nhân viên soát vé |

---

## 3. CƠ CHẾ BẢO MẬT VÀ XÁC THỰC

### 3.1. Xác thực ví MetaMask (Sign-In with Ethereum - SIWE)
1. Người dùng bấm "Đăng nhập bằng Ví".
2. Frontend gọi `GET /api/auth/nonce?wallet=0x...` để nhận chuỗi ngẫu nhiên từ backend.
3. Frontend yêu cầu MetaMask ký chuỗi thông điệp này (`personal_sign`).
4. Backend nhận chữ ký qua `POST /api/auth/verify-wallet`, dùng `ethers.verifyMessage` để chứng minh quyền kiểm soát private key mà không cần người dùng nhập mật khẩu.
5. Backend cấp JWT token cho người dùng tiếp tục thao tác.

### 3.2. Cơ chế QR Code chống gian lận & chống chụp màn hình
1. Khách hàng mở trang chi tiết vé.
2. Backend sinh mã QR chứa token bao gồm: `tokenId`, thời điểm tạo `timestamp`, chuỗi ngẫu nhiên `nonce`, và chữ ký `HMAC-SHA256` được tạo bằng khóa bí mật riêng của server.
3. Khi nhân viên soát vé quét mã QR:
   - Backend giải mã và kiểm tra chữ ký HMAC (đảm bảo mã không bị giả mạo).
   - Kiểm tra xem vé đã được check-in trong database chưa (`isUsed === false`).
   - Cập nhật tức thì `isUsed = true` dưới dạng **Atomic Update**.
   - Nếu bất kỳ ai cố tình quét lại mã lần thứ hai, hệ thống sẽ cảnh báo đỏ ngay lập tức.
