# 🎟️ BlockTickets

> **Hệ thống phân phối và chuyển nhượng vé sự kiện Web3 ứng dụng công nghệ Smart Contract (NFT ERC-721), Aiven Cloud MySQL và mã QR động bảo mật.**

---

## 📌 1. Tổng quan & Vấn đề giải quyết

Ngành công nghiệp bán vé sự kiện truyền thống đang đối mặt với 3 vấn nạn nghiêm trọng:
1. **Vé giả mạo & Lừa đảo:** Khách hàng mua vé từ bên thứ ba không có cách nào xác thực vé thật/giả trước giờ diễn ra sự kiện.
2. **Nạn đầu cơ / Phe vé chợ đen (Scalping):** Phe vé dùng bot ôm sạch vé giá gốc rồi bán lại với giá cắt cổ gấp 3–5 lần, trong khi nghệ sĩ và ban tổ chức không nhận được thêm bất kỳ lợi ích nào.
3. **Gian lận soát vé tại cổng:** Vé chụp màn hình, mã QR tĩnh bị chia sẻ cho nhiều người cùng quét một lúc.

**BlockTickets giải quyết triệt để các vấn đề trên bằng công nghệ:**
- 🛡️ **Vé là NFT độc bản (ERC-721):** Mỗi vé là một Token ID duy nhất trên mạng Ethereum, minh bạch lịch sử và quyền sở hữu ví.
- ⚖️ **Trần giá bán lại 120% bất biến (Anti-Scalping):** Smart Contract thiết lập quy tắc trần giá tối đa `resalePrice <= originalPrice * 1.2`. Mọi giao dịch vượt trần đều bị Smart Contract hủy bỏ (Revert) lập tức.
- 🎨 **Phí bản quyền 5% (Royalty Fee):** Tự động trích 5% giá trị mỗi giao dịch bán lại chuyển thẳng về ví của Ban tổ chức sự kiện.
- 📲 **Mã QR động xoay vòng 60s (HMAC-SHA256):** Mã QR tự tạo mới mỗi phút kèm chữ ký mật mã, chống chụp màn hình và chống quét trùng lặp (`CheckInLog`).

---

## 🛠️ 2. Công nghệ sử dụng

| Phân hệ | Công nghệ & Thư viện | Vai trò |
| :--- | :--- | :--- |
| **Blockchain** | Solidity `^0.8.28` (EVM Cancun)<br>OpenZeppelin Contracts `5.6.1`<br>Hardhat `2.22.5` / `2.29.2` (ESM)<br>Ethers.js `v6`<br>Ethereum Sepolia Testnet | Hợp đồng thông minh NFT vé sự kiện, chợ thứ cấp non-custodial, chia phí bản quyền và ép trần giá 120%. |
| **Backend** | Node.js (v22+), Express.js (ESM)<br>Sequelize ORM & `mysql2`<br>JSON Web Token (JWT), bcryptjs<br>Zod validator, Helmet, Rate Limiter | RESTful API 3 lớp (Route-Controller-Service), xác thực chữ ký ví MetaMask (`nonce`), dịch vụ đọc blockchain on-chain, soát vé check-in. |
| **Database** | **Aiven Cloud MySQL 8.0+** (Managed SSL) | Lưu trữ hồ sơ người dùng, thông tin sự kiện, đơn hàng, nhật ký kiểm toán (`AuditLog`) và lịch sử soát vé (`CheckInLog`). |
| **Frontend** | React 18, Vite 5, JavaScript (JSX)<br>Material UI (MUI v5), Emotion<br>Ethers.js `v6`, html5-qrcode | Giao diện Modern SaaS (Light/Dark mode, màu chủ đạo `#2563EB`), kết nối ví Web3 MetaMask, quét camera soát vé, quản lý vé và chợ thứ cấp. |
| **Kiểm thử** | Hardhat Mocha/Chai (7/7 tests pass)<br>Postman Collection (66 test requests) | Kiểm thử đơn vị Smart Contract và kịch bản API tự động (positive & negative). |

---

## 🏛️ 3. Cấu trúc thư mục dự án

```text
BlockTickets/
├── blockchain/                      # PHÂN HỆ SMART CONTRACT
│   ├── contracts/
│   │   ├── interfaces/
│   │   │   └── IEventTicket.sol     # Interface giao tiếp giữa Ticket và Marketplace
│   │   ├── EventTicket.sol          # Contract vé NFT ERC-721, quản lý phát hành, check-in
│   │   └── TicketMarketplace.sol    # Contract chợ bán lại vé, trần 120%, chia 5% royalty
│   ├── scripts/
│   │   └── deploy.js                # Script deploy và tự động xuất ABI sang backend & frontend
│   ├── test/
│   │   ├── EventTicket.test.js      # Unit test phát hành vé, nguồn cung, check-in
│   │   └── TicketMarketplace.test.js# Unit test trần 120%, phí 5%, atomic swap
│   ├── hardhat.config.cjs           # Cấu hình compiler 0.8.28 Cancun & mạng Sepolia
│   └── package.json                 # Cấu hình ES Modules ("type": "module")
│
├── backend/                         # PHÂN HỆ BACKEND REST API
│   ├── src/
│   │   ├── config/                  # Kết nối Aiven Cloud MySQL qua Sequelize
│   │   ├── controllers/             # Tiếp nhận request & điều hướng response
│   │   ├── middleware/              # Auth JWT, RBAC 3 role, Rate Limit, Error Handler
│   │   ├── models/                  # 8 Model Sequelize: User, Event, TicketType, Ticket,
│   │   │                            # Order, ResaleListing, CheckInLog, AuditLog
│   │   ├── routes/                  # Định tuyến API: auth, user, event, admin, order, ticket
│   │   ├── services/                # Nghiệp vụ: auth, event, customer, admin, blockchainService
│   │   ├── validators/              # Xác thực dữ liệu đầu vào bằng Zod
│   │   ├── utils/                   # AppError chuẩn hóa mã lỗi HTTP
│   │   └── server.js                # Entry point khởi chạy Express server (Port 5000)
│   └── package.json
│
├── frontend/                        # PHÂN HỆ GIAO DIỆN REACT + VITE
│   ├── src/
│   │   ├── components/              # Các UI Component tái sử dụng (Navbar, Footer...)
│   │   ├── context/                 # AuthContext quản lý đăng nhập & kết nối ví MetaMask
│   │   ├── pages/
│   │   │   ├── admin/               # Trang Admin: Thống kê, duyệt sự kiện, quản lý User
│   │   │   ├── customer/            # Trang Khách: Trang chủ, chi tiết sự kiện, thanh toán, ví vé
│   │   │   ├── marketplace/         # Trang Sàn giao dịch vé thứ cấp (Marketplace 120%)
│   │   │   └── organizer/           # Trang Organizer: Tạo sự kiện, quét camera soát vé
│   │   ├── services/                # api.js tập trung gọi Axios API
│   │   ├── theme/                   # Cấu hình MUI Theme (Light/Dark mode, Roboto, #2563EB)
│   │   └── main.jsx
│   └── package.json
│
├── docs/                            # TÀI LIỆU DỰ ÁN & KIỂM THỬ API
│   ├── BlockTickets_API.postman_collection.json     # Bộ 66 kịch bản kiểm thử API
│   ├── BlockTickets_Local.postman_environment.json  # Biến môi trường Postman
│   ├── postman_test_scenarios.md                    # Hướng dẫn chi tiết chạy test Postman
│   ├── business_requirements.md                     # Đặc tả yêu cầu nghiệp vụ
│   ├── database_design.md                           # Thiết kế cơ sở dữ liệu MySQL
│   └── system_architecture.md                       # Sơ đồ kiến trúc On-chain / Off-chain
└── roadmap.md                       # Lộ trình triển khai chi tiết các mốc BE, FE, SC
```

---

## 📋 4. Quy tắc nghiệp vụ cốt lõi (Business Rules)

- **BR-01 (Giới hạn nguồn cung):** Không một ai có thể mint vượt quá số lượng vé tối đa (`maxSupply`) của từng hạng vé.
- **BR-02 (Giá gốc bất biến):** Giá phát hành ban đầu (`originalPrice`) được ghi vĩnh viễn vào ô nhớ Storage của Smart Contract tại thời điểm tạo vé, không thể can thiệp sửa đổi.
- **BR-03 (Trần giá bán lại 120%):** Mọi giao dịch niêm yết bán lại trên sàn thứ cấp bắt buộc thỏa mãn:  
  $$\text{resalePrice} \le \text{originalPrice} \times 1.2$$
- **BR-04 (Phí bản quyền 5%):** Mỗi khi vé được chuyển nhượng thành công, Smart Contract tự động trích 5% giá trị giao dịch gửi về ví của Ban tổ chức sự kiện, người bán nhận 95%.
- **BR-05 (Khóa vé sau khi sử dụng):** Vé đã check-in qua cổng (`isUsed = true`) hoặc sự kiện đã kết thúc/hủy sẽ bị Smart Contract và Backend khóa vĩnh viễn, không cho chuyển nhượng hay bán lại.
- **BR-06 (Mã QR động chống chụp màn hình):** Mã QR được mã hóa bằng HMAC SHA-256 xoay vòng 60 giây. Quét lần thứ 2 sẽ bị từ chối với lỗi `already_used` (409 Conflict).

---

## 🚀 5. Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- [Node.js](https://nodejs.org/) phiên bản **v20.x trở lên** (khuyên dùng Node v22).
- Extension ví [MetaMask](https://metamask.io/) cài đặt trên trình duyệt.
- Cơ sở dữ liệu MySQL (khuyên dùng [Aiven Cloud MySQL](https://aiven.io/)).

---

### Bước 1: Cài đặt Dependencies cho cả 3 phân hệ

Mở terminal tại thư mục gốc `BlockTickets/`:

```powershell
# 1. Cài đặt Blockchain module
cd blockchain
npm install

# 2. Cài đặt Backend module
cd ../backend
npm install

# 3. Cài đặt Frontend module
cd ../frontend
npm install
```

---

### Bước 2: Cấu hình biến môi trường (`.env`)

#### 1. Cấu hình `blockchain/.env`
Tạo file `blockchain/.env`:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### 2. Cấu hình `backend/.env`
Tạo file `backend/.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173

# Kết nối Aiven Cloud MySQL
DB_HOST=your-mysql-host.aivencloud.com
DB_PORT=20441
DB_NAME=blocktickets
DB_USER=avnadmin
DB_PASSWORD=your_mysql_password

# Bảo mật JWT
JWT_ACCESS_SECRET=your_jwt_access_secret_key_12345
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_12345

# Tích hợp Blockchain Sepolia
SEPOLIA_RPC_URL=https://rpc.sepolia.org
EVENT_TICKET_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
TICKET_MARKETPLACE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
MOCK_BLOCKCHAIN=true
```

#### 3. Cấu hình `frontend/.env`
Tạo file `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_BLOCK_EXPLORER_URL=https://sepolia.etherscan.io
```

---

### Bước 3: Biên dịch & Kiểm thử Smart Contract

Tại thư mục `blockchain/`:

```powershell
cd blockchain

# 1. Biên dịch Smart Contract (Solidity 0.8.28 Cancun)
npm run compile

# 2. Chạy toàn bộ 7 bài Unit Test tự động (Hardhat ESM)
npm test

# 3. Chạy thử script deploy xuất ABI sang backend và frontend
npx hardhat run scripts/deploy.js

# 4. (Tùy chọn) Deploy lên mạng Sepolia Testnet thật
npm run deploy:sepolia
```

---

### Bước 4: Khởi chạy Backend Server

Tại thư mục `backend/`:

```powershell
cd backend
npm run dev
```
> Server sẽ khởi động tại: `http://localhost:5000`. Khi kết nối thành công, terminal sẽ thông báo:  
> `✅ Toàn bộ bảng trên Aiven Cloud MySQL đã được đồng bộ!`

---

### Bước 5: Khởi chạy Giao diện Frontend

Tại thư mục `frontend/`:

```powershell
cd frontend
npm run dev
```
> Mở trình duyệt tại: `http://localhost:5173` để trải nghiệm ứng dụng.

---

## 🧪 6. Kiểm thử API bằng Postman

Dự án cung cấp sẵn bộ sưu tập kiểm thử API toàn diện tại thư mục `docs/`:
1. Mở Postman $\rightarrow$ Chọn **Import** $\rightarrow$ Chọn 2 file:
   - `docs/BlockTickets_API.postman_collection.json`
   - `docs/BlockTickets_Local.postman_environment.json`
2. Chọn môi trường **`BlockTickets Local Environment`**.
3. Xem kịch bản chi tiết 66 ca kiểm thử tại `docs/postman_test_scenarios.md`.

---

## 👥 7. Phân quyền người dùng (RBAC)

- **Admin:** Quản trị viên hệ thống có quyền duyệt/từ chối sự kiện, ẩn sự kiện vi phạm, quản lý trạng thái tài khoản và xem nhật ký kiểm toán.
- **Organizer:** Nhà tổ chức sự kiện có quyền tạo sự kiện nháp, cấu hình hạng vé, gửi duyệt, công khai sự kiện lên blockchain và sử dụng camera quét QR check-in tại cổng.
- **Customer:** Khách hàng có thể đăng nhập bằng ví MetaMask, mua vé sơ cấp, quản lý vé NFT trong ví cá nhân, xem mã QR động và niêm yết bán lại trên sàn thứ cấp (với mức giá $\le 120\%$).

---

## 📄 8. Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**.
