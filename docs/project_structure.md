# CẤU TRÚC THƯ MỤC CHI TIẾT HỆ THỐNG BLOCKTICKETS

> **Dự án:** BlockTickets – Hệ thống phân phối & chuyển nhượng vé sự kiện ứng dụng Blockchain & NFT.  
> **Cơ sở dữ liệu:** MongoDB Atlas (Cloud Database).  
> **Frontend:** React + JavaScript (Vite, JSX/JS thuần, không sử dụng TypeScript).  
> **Backend:** Node.js + Express.js + Mongoose ODM.  
> **Blockchain:** Solidity + Hardhat (Chuẩn ERC-721, triển khai trên Ethereum Sepolia Testnet).  

---

## 1. TỔNG QUAN CÂY THƯ MỤC DỰ ÁN (PROJECT DIRECTORY TREE)

```text
BlockTickets/
│
├── frontend/                   # Ứng dụng Frontend (React + JavaScript / JSX + Vite)
│   ├── src/                    # Mã nguồn chính của giao diện
│   │   ├── assets/             # Hình ảnh, logo, banner
│   │   ├── components/         # Các component UI dùng chung (Navbar.jsx, Footer.jsx)
│   │   ├── context/            # Quản lý trạng thái toàn cục (AuthContext.jsx, ThemeContext.jsx)
│   │   ├── pages/              # Phân chia màn hình theo phân hệ chức năng
│   │   │   ├── customer/       # Khách hàng (HomePage, EventDetailPage, CheckoutPage, MyTicketsPage)
│   │   │   ├── marketplace/    # Chợ vé thứ cấp (MarketplacePage)
│   │   │   ├── organizer/      # Nhà tổ chức (OrganizerDashboardPage, CreateEventPage, CheckInScannerPage)
│   │   │   ├── admin/          # Quản trị viên (AdminDashboardPage, EventApprovalPage, UserManagementPage)
│   │   │   ├── auth/           # Xác thực (LoginPage, RegisterPage)
│   │   │   └── NotFoundPage.jsx # Trang thông báo lỗi 404
│   │   ├── services/           # Gọi REST API (api.js)
│   │   ├── theme/              # Cấu hình Theme MUI (theme.js)
│   │   ├── App.jsx             # Cấu hình định tuyến (React Router)
│   │   ├── index.css           # Cấu hình CSS toàn cục
│   │   └── main.jsx            # Entry point render React DOM
│   ├── index.html              # Trang HTML gốc cho Vite
│   ├── vite.config.js          # File cấu hình build & server của Vite
│   ├── package.json            # Khai báo thư viện phụ thuộc Frontend
│   └── .env.example            # Mẫu biến môi trường Frontend
│
├── backend/                    # Máy chủ API & Nghiệp vụ (Node.js + Express.js + MongoDB Atlas)
│   ├── src/                    # Mã nguồn server
│   │   ├── config/             # Cấu hình hệ thống (db.js kết nối MongoDB Atlas)
│   │   ├── controllers/        # Điều hướng request (authController.js, eventController.js)
│   │   ├── middleware/         # Xác thực & bắt lỗi (authMiddleware.js, errorMiddleware.js)
│   │   ├── models/             # Mongoose Schemas (User.js, Event.js, Ticket.js)
│   │   ├── routes/             # Định tuyến API (authRoutes.js, eventRoutes.js)
│   │   └── server.js           # Điểm khởi chạy server Express
│   ├── package.json            # Khai báo thư viện phụ thuộc Backend
│   └── .env.example            # Mẫu biến môi trường Backend
│
├── blockchain/                 # Hợp đồng thông minh Smart Contracts (Solidity + Hardhat)
│   ├── contracts/              # Mã nguồn hợp đồng Solidity (EventTicket.sol, TicketMarketplace.sol)
│   ├── scripts/                # Kịch bản triển khai (deploy.js)
│   ├── test/                   # Kiểm thử Smart Contract (EventTicket.test.js, TicketMarketplace.test.js)
│   ├── hardhat.config.js       # Cấu hình Hardhat compiler & mạng Sepolia
│   ├── package.json            # Khai báo thư viện phụ thuộc Hardhat & OpenZeppelin
│   └── .env.example            # Mẫu biến môi trường Blockchain
│
├── docs/                       # Tài liệu thiết kế hệ thống & đặc tả kỹ thuật
│   ├── project_structure.md    # [Tài liệu hiện tại] Cấu trúc chi tiết từng file trong hệ sinh thái
│   ├── theme_specification.md  # Quy chuẩn thiết kế Theme UI/UX (Modern SaaS, MUI v5, #2563EB, Light/Dark)
│   ├── business_requirements.md # Yêu cầu nghiệp vụ, vai trò người dùng, quy tắc trần giá 120%
│   ├── database_design.md      # Thiết kế cơ sở dữ liệu MongoDB Atlas (Schemas, Indexes, Relations)
│   ├── api_specification.md    # Đặc tả chi tiết toàn bộ RESTful API endpoints (Request/Response)
│   └── system_architecture.md  # Sơ đồ kiến trúc tổng thể, luồng giao dịch On-chain & Off-chain
│
├── .gitignore                  # Bỏ qua node_modules, .env, build artifacts, cache
├── README.md                   # Hướng dẫn tổng quan cài đặt, chạy hệ thống và demo dự án
└── roadmap.md                  # Bản kế hoạch phát triển chi tiết từng giai đoạn của dự án
```

---

## 2. CHI TIẾT MODULE `frontend/` (React + JavaScript)

> Phân hệ giao diện người dùng xây dựng bằng **React (JSX) + Vite**, tuyệt đối **không dùng TypeScript** nhằm giúp code gọn nhẹ, linh hoạt và đẩy nhanh tiến độ hoàn thiện giao diện cho 3 nhóm đối tượng: Khách hàng, Organizer và Admin.

```text
frontend/
├── public/
│   ├── favicon.ico                         # Icon hiển thị trên tab trình duyệt
│   ├── logo.svg                            # Logo chính thức của BlockTickets
│   └── manifest.json                       # Cấu hình PWA (hỗ trợ hiển thị trên điện thoại khi check-in)
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── hero-banner.jpg             # Banner quảng bá tại trang chủ
│   │   │   ├── default-event-poster.png    # Ảnh poster mặc định khi Organizer chưa tải ảnh
│   │   │   └── placeholder-ticket.png      # Ảnh minh họa thẻ vé NFT
│   │   └── icons/                          # Các icon tùy biến giao diện
│   │
│   ├── components/                         # Các khối giao diện dùng chung
│   │   ├── common/
│   │   │   ├── Navbar.jsx                  # Thanh điều hướng trên cùng (logo, tìm kiếm, kết nối ví, menu user)
│   │   │   ├── Footer.jsx                  # Chân trang (thông tin dự án, mạng xã hội, tài liệu smart contract)
│   │   │   ├── Button.jsx                  # Nút bấm tùy biến giao diện (chứa trạng thái loading, disabled, hover)
│   │   │   ├── Modal.jsx                   # Khung popup tái sử dụng cho thông báo hoặc xác nhận thao tác
│   │   │   ├── LoadingSpinner.jsx          # Vòng xoay biểu thị đang tải dữ liệu hoặc đang chờ giao dịch on-chain
│   │   │   ├── EmptyState.jsx              # Hiển thị khi không có sự kiện, không có vé hoặc danh sách rỗng
│   │   │   └── ToastNotification.jsx       # Hộp thông báo nhanh nổi lên góc màn hình (thành công, cảnh báo, lỗi)
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletConnectButton.jsx     # Nút kết nối MetaMask, hiển thị địa chỉ ví rút gọn (ví dụ: 0x12..78)
│   │   │   ├── NetworkBadge.jsx            # Nhãn hiển thị mạng hiện tại (Sepolia Testnet), cảnh báo nếu sai mạng
│   │   │   └── SwitchNetworkModal.jsx      # Popup yêu cầu và hướng dẫn người dùng chuyển ví về mạng Sepolia
│   │   │
│   │   ├── qr/
│   │   │   ├── QRCodeDisplay.jsx           # Component render mã QR động cho vé (chứa payload đã ký từ backend)
│   │   │   └── QRCodeCameraScanner.jsx     # Component tích hợp camera thiết bị để quét mã QR tại cổng soát vé
│   │   │
│   │   └── guards/
│   │       ├── ProtectedRoute.jsx          # Chặn truy cập nếu chưa đăng nhập hệ thống
│   │       └── RoleBasedRoute.jsx          # Phân quyền truy cập theo vai trò: Admin, Organizer, Customer
│   │
│   ├── layouts/
│   │   ├── MainLayout.jsx                  # Layout cho khách hàng (Navbar công khai + Nội dung + Footer)
│   │   ├── DashboardLayout.jsx             # Layout bảng điều khiển có Sidebar cho Organizer & Admin
│   │   └── AuthLayout.jsx                  # Layout tối giản cho các màn hình Đăng nhập / Đăng ký
│   │
│   ├── pages/                              # Các trang chức năng chính
│   │   ├── customer/                       # --- PHÂN HỆ KHÁCH HÀNG (CUSTOMER) ---
│   │   │   ├── HomePage.jsx                # Trang chủ: Sự kiện nổi bật, danh mục, thanh tìm kiếm nhanh
│   │   │   ├── EventListingPage.jsx        # Trang danh sách tất cả sự kiện có bộ lọc (địa điểm, giá, ngày tổ chức)
│   │   │   ├── EventDetailPage.jsx         # Chi tiết sự kiện: Thông tin, nghệ sĩ, chính sách, danh sách hạng vé
│   │   │   ├── CheckoutPage.jsx            # Màn hình mua vé: Chọn số lượng vé, tính tổng ETH, ký ví MetaMask
│   │   │   ├── OrderSuccessPage.jsx        # Màn hình chúc mừng mua vé thành công, kèm link Etherscan xem giao dịch
│   │   │   ├── MyTicketsPage.jsx           # Kho vé NFT của tôi: Vé còn hạn, vé đã dùng, vé đang rao bán
│   │   │   └── TicketDetailPage.jsx        # Chi tiết một vé NFT: Xem TokenID, mã QR check-in, nút chuyển nhượng
│   │   │
│   │   ├── marketplace/                    # --- PHÂN HỆ CHỢ VÉ THỨ CẤP (MARKETPLACE) ---
│   │   │   ├── MarketplacePage.jsx         # Chợ vé: Danh sách vé người khác đang bán lại kèm giá niêm yết
│   │   │   ├── ResaleListingModal.jsx      # Form niêm yết bán vé: Tự động tính trần giá tối đa 120% giá gốc
│   │   │   └── BuyResaleTicketModal.jsx    # Popup xác nhận mua lại vé từ chợ: Approve & chuyển ETH thanh toán
│   │   │
│   │   ├── organizer/                      # --- PHÂN HỆ NHÀ TỔ CHỨC (ORGANIZER) ---
│   │   │   ├── OrganizerDashboardPage.jsx  # Tổng quan: Doanh thu bán vé, số lượng vé đã phát hành, tỷ lệ check-in
│   │   │   ├── CreateEventPage.jsx         # Form tạo sự kiện mới: Tên sự kiện, địa điểm, thời gian, tải ảnh poster
│   │   │   ├── EditEventPage.jsx           # Cập nhật thông tin sự kiện (chỉ khi sự kiện chưa mở bán vé)
│   │   │   ├── ManageTicketTypesPage.jsx   # Cấu hình các loại vé (VIP, Standard), giá ban đầu, giới hạn maxSupply
│   │   │   ├── EventAttendeesPage.jsx      # Danh sách khách tham dự sự kiện, tra cứu theo ví hoặc mã vé
│   │   │   └── CheckInScannerPage.jsx      # Màn hình quét QR trực tiếp bằng camera: Hiển thị trạng thái HỢP LỆ/ĐÃ DÙNG
│   │   │
│   │   ├── admin/                          # --- PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN) ---
│   │   │   ├── AdminDashboardPage.jsx      # Bảng số liệu toàn hệ thống: Tổng người dùng, tổng sự kiện, tổng doanh thu
│   │   │   ├── EventApprovalPage.jsx       # Hàng đợi duyệt sự kiện: Xem chi tiết và chọn DUYỆT hoặc TỪ CHỐI kèm lý do
│   │   │   ├── UserManagementPage.jsx      # Quản lý tài khoản: Xem danh sách, gán vai trò, khóa tài khoản vi phạm
│   │   │   ├── TransactionMonitorPage.jsx  # Giám sát giao dịch on-chain & off-chain, phát hiện giao dịch bất thường
│   │   │   └── AuditLogsPage.jsx           # Xem lịch sử thao tác của các quản trị viên và nhà tổ chức
│   │   │
│   │   ├── auth/                           # --- XÁC THỰC & TÀI KHOẢN ---
│   │   │   ├── LoginPage.jsx               # Đăng nhập bằng Email/Mật khẩu hoặc Đăng nhập trực tiếp bằng ví MetaMask
│   │   │   ├── RegisterPage.jsx            # Đăng ký tài khoản mới (lựa chọn vai trò Customer hoặc Organizer)
│   │   │   └── ProfilePage.jsx             # Cập nhật thông tin cá nhân và liên kết ví blockchain
│   │   │
│   │   └── NotFoundPage.jsx                # Giao diện thông báo lỗi 404 khi truy cập sai đường dẫn
│   │
│   ├── context/                            # Quản lý State toàn cục bằng React Context
│   │   ├── AuthContext.jsx                 # Lưu thông tin tài khoản đang đăng nhập, JWT token, vai trò hiện tại
│   │   ├── WalletContext.jsx               # Lưu trạng thái kết nối MetaMask: Địa chỉ ví, chainId Sepolia, số dư ETH
│   │   ├── NotificationContext.jsx         # Cung cấp hàm hiển thị Toast thông báo ở mọi nơi trong ứng dụng
│   │   └── ThemeContext.jsx                # Quản lý trạng thái Light/Dark Mode, lưu localStorage, bọc ThemeProvider
│   │
│   ├── theme/                              # Cấu hình Design System & Material UI (MUI) tập trung
│   │   ├── index.js                        # Hàm createAppTheme(mode): Lắp ráp palette, typography, components overrides
│   │   ├── palette.js                      # Bảng màu thương hiệu (#2563EB), màu nền, màu chữ cho Light Mode & Dark Mode
│   │   ├── typography.js                   # Cấu hình font Roboto, phân cấp h1-h6, body1-2, button, font ví monospace
│   │   └── components.js                   # Tùy biến mặc định các component MUI: MuiButton, MuiCard, MuiDialog, MuiChip
│   │
│   ├── hooks/                              # Custom React Hooks
│   │   ├── useAuth.js                      # Hook gọi nhanh context Auth (kiểm tra isLoggedIn, role, user info)
│   │   ├── useWallet.js                    # Hook gọi nhanh context Wallet (connect, disconnect, switchNetwork)
│   │   ├── useContract.js                  # Hook khởi tạo instance Smart Contract với ethers.js (Signer/Provider)
│   │   └── useQRScanner.js                 # Hook điều khiển luồng camera, dừng/bật quét và giải mã barcode QR
│   │
│   ├── services/                           # Tầng giao tiếp mạng (Network Layer)
│   │   ├── api.js                          # Cấu hình Axios Base Instance: Gắn JWT token vào header, xử lý lỗi 401
│   │   ├── authService.js                  # Gọi API đăng nhập, đăng ký, lấy chuỗi nonce xác thực ví
│   │   ├── eventService.js                 # Gọi API lấy danh sách sự kiện, tạo sự kiện, gửi yêu cầu phê duyệt
│   │   ├── ticketService.js                # Gọi API lấy danh sách vé sở hữu, chi tiết vé, lấy payload mã QR
│   │   ├── marketplaceService.js           # Gọi API lấy vé đang bán trên chợ, gửi yêu cầu niêm yết/hủy niêm yết
│   │   ├── checkInService.js               # Gửi dữ liệu mã QR từ camera lên server để kiểm tra tính hợp lệ
│   │   └── blockchainService.js            # Tương tác trực tiếp phía client với Smart Contract (mua vé, list vé)
│   │
│   ├── constants/                          # Hằng số cấu hình hệ thống
│   │   ├── contracts.js                    # Địa chỉ Smart Contract EventTicket và Marketplace trên Sepolia
│   │   ├── roles.js                        # Định nghĩa chuỗi vai trò: ADMIN: 'admin', ORGANIZER: 'organizer', CUSTOMER: 'customer'
│   │   ├── ticketStatus.js                 # Định nghĩa trạng thái vé: VALID, USED, RESALE, CANCELLED
│   │   └── abi/                            # Chứa file ABI xuất ra từ quá trình biên dịch Smart Contract
│   │       ├── EventTicketABI.json         # ABI tương tác với hợp đồng phát hành vé NFT
│   │       └── TicketMarketplaceABI.json   # ABI tương tác với hợp đồng chợ chuyển nhượng vé
│   │
│   ├── utils/                              # Các hàm tiện ích dùng chung
│   │   ├── formatters.js                   # Rút gọn địa chỉ ví (0x12..89), định dạng ngày giờ, định dạng số ETH
│   │   ├── validators.js                   # Kiểm tra tính hợp lệ của form nhập liệu (email, số lượng vé, giá bán lại <= 120%)
│   │   └── storage.js                      # Đọc/ghi an toàn dữ liệu vào LocalStorage (lưu token, cấu hình giao diện)
│   │
│   ├── App.jsx                             # Định nghĩa các Route URL và bọc AuthProvider, WalletProvider
│   ├── main.jsx                            # Gắn ứng dụng React vào thẻ div #root trong index.html
│   └── index.css                           # Toàn bộ CSS phong cách thiết kế hiện đại, dark/light theme, animation
│
├── index.html                              # Trang HTML gốc
├── vite.config.js                          # File cấu hình của Vite bundler
├── package.json                            # Danh sách các thư viện: react, react-dom, react-router-dom, ethers, axios, html5-qrcode
└── .env.example                            # Biến môi trường: VITE_API_URL, VITE_CONTRACT_ADDRESS, VITE_CHAIN_ID
```

---

## 3. CHI TIẾT MODULE `backend/` (Node.js + Express.js + MongoDB Atlas)

> Máy chủ backend xử lý các logic nghiệp vụ ngoài chuỗi (off-chain), xác thực người dùng, bảo mật API, tạo mã QR mã hóa và đồng bộ dữ liệu giao dịch từ blockchain vào cơ sở dữ liệu đám mây **MongoDB Atlas**.

```text
backend/
├── src/
│   ├── config/                             # Cấu hình hệ thống & kết nối bên ngoài
│   │   ├── database.js                     # Kết nối cơ sở dữ liệu MongoDB Atlas qua Mongoose (kèm retry logic & pool)
│   │   ├── blockchain.js                   # Khởi tạo ethers.js JsonRpcProvider (Sepolia), nạp contract ABI & địa chỉ
│   │   ├── env.js                          # Kiểm tra và nạp các biến môi trường từ .env, cảnh báo nếu thiếu biến
│   │   └── constants.js                    # Định nghĩa các mã lỗi hệ thống, mã HTTP status, trạng thái đơn hàng
│   │
│   ├── models/                             # Mongoose Schemas (Lưu trữ trên MongoDB Atlas)
│   │   ├── User.js                         # Tài khoản người dùng (email, hash mật khẩu, vai trò, địa chỉ ví, nonce)
│   │   ├── Event.js                        # Thông tin sự kiện (tên, mô tả, organizerId, posterUrl, địa điểm, thời gian, trạng thái duyệt)
│   │   ├── TicketType.js                   # Loại vé (eventId, tên hạng vé, originalPrice, maxSupply, currentSupply, thời gian mở bán)
│   │   ├── Ticket.js                       # Bản ghi vé NFT (tokenId on-chain, ticketTypeId, eventId, ownerWallet, txHash, isUsed)
│   │   ├── Order.js                        # Đơn hàng mua vé (buyerWallet, ticketTypeId, số lượng vé, tổng tiền, txHash, trạng thái)
│   │   ├── ResaleListing.js                # Tin bán lại trên chợ (tokenId, sellerWallet, resalePrice <= 120%, isActive, txHash)
│   │   ├── CheckInLog.js                   # Nhật ký soát vé (tokenId, eventId, scannedByStaffId, scannedAt, kết quả thành công/thất bại)
│   │   └── AuditLog.js                     # Ghi nhật ký thao tác nhạy cảm của Admin/Organizer (duyệt sự kiện, khóa user)
│   │
│   ├── routes/                             # Khai báo các đường dẫn RESTful API
│   │   ├── authRoutes.js                   # /api/auth (Đăng ký, đăng nhập, lấy nonce, xác thực chữ ký ví, refresh token)
│   │   ├── userRoutes.js                   # /api/users (Xem hồ sơ cá nhân, liên kết ví MetaMask, cập nhật tài khoản)
│   │   ├── eventRoutes.js                  # /api/events (Lấy danh sách sự kiện, tạo sự kiện, cập nhật, gửi duyệt sự kiện)
│   │   ├── ticketTypeRoutes.js             # /api/ticket-types (Cấu hình hạng vé, thiết lập số lượng tối đa và giá bán gốc)
│   │   ├── ticketRoutes.js                 # /api/tickets (Tra cứu vé theo người dùng, chi tiết vé, lấy token mã QR)
│   │   ├── orderRoutes.js                  # /api/orders (Tạo intent mua vé, xác nhận transaction hash từ Sepolia)
│   │   ├── marketplaceRoutes.js            # /api/marketplace (Lấy danh sách vé bán lại, đồng bộ giao dịch chuyển nhượng)
│   │   ├── checkInRoutes.js                # /api/check-in (Endpoint nhận mã QR từ nhân viên soát vé và xác thực quyền vào cổng)
│   │   └── adminRoutes.js                  # /api/admin (Phê duyệt/từ chối sự kiện, quản lý người dùng, xem báo cáo tổng hợp)
│   │
│   ├── controllers/                        # Tiếp nhận Request, gọi Service và trả về Response
│   │   ├── authController.js               # Điều hướng luồng đăng nhập, xử lý chữ ký mật mã của ví MetaMask
│   │   ├── userController.js               # Xử lý cập nhật thông tin người dùng và phân quyền
│   │   ├── eventController.js              # Xử lý danh sách sự kiện công khai, sự kiện theo nhà tổ chức
│   │   ├── ticketTypeController.js         # Xử lý tạo hạng vé và kiểm tra tính hợp lệ nguồn cung
│   │   ├── ticketController.js             # Xử lý truy vấn thông tin vé và cấp mã QR an toàn
│   │   ├── orderController.js              # Tiếp nhận đơn hàng, đối chiếu giao dịch on-chain với blockchain
│   │   ├── marketplaceController.js        # Tiếp nhận yêu cầu niêm yết bán lại và mua lại vé
│   │   ├── checkInController.js            # Tiếp nhận quét mã QR tại cổng và phản hồi kết quả tức thì
│   │   └── adminController.js              # Xử lý duyệt sự kiện, khóa tài khoản và trích xuất báo cáo quản trị
│   │
│   ├── services/                           # Tầng nghiệp vụ cốt lõi (Business Logic Layer)
│   │   ├── authService.js                  # Logic tạo chuỗi ngẫu nhiên nonce, xác minh chữ ký eth_sign, ký JWT
│   │   ├── eventService.js                 # Logic chuyển đổi trạng thái sự kiện: DRAFT -> PENDING -> APPROVED -> PUBLISHED
│   │   ├── orderService.js                 # Xử lý tạo đơn hàng, chống tạo đơn trùng bằng idempotency key
│   │   ├── marketplaceService.js           # Kiểm tra điều kiện bán lại (vé chưa dùng, giá bán lại <= 120% originalPrice)
│   │   ├── checkInService.js               # Xác minh mã QR (giải mã token, kiểm tra HMAC, cập nhật trạng thái isUsed một lần duy nhất)
│   │   ├── qrService.js                    # Sinh payload mã QR: Chứa tokenId + chuỗi nonce ngẫu nhiên + chữ ký HMAC bí mật
│   │   └── blockchainService.js            # Kết nối RPC Sepolia: Kiểm tra trạng thái giao dịch (Receipt), đọc hàm ownerOf
│   │
│   ├── middleware/                         # Tầng trung gian kiểm soát truy cập & xử lý lỗi
│   │   ├── authMiddleware.js               # Kiểm tra Header Authorization (Bearer JWT), gắn user vào req.user
│   │   ├── roleMiddleware.js               # Kiểm tra quyền truy cập (chỉ cho phép ADMIN, ORGANIZER hoặc CUSTOMER)
│   │   ├── validateMiddleware.js           # Kiểm tra định dạng dữ liệu đầu vào (Request Body/Params/Query) bằng Zod hoặc Joi
│   │   ├── rateLimiter.js                  # Giới hạn tần suất gửi request (chống spam / DDoS vào API mua vé & quét QR)
│   │   └── errorMiddleware.js              # Bắt lỗi toàn cục, định dạng phản hồi JSON lỗi chuẩn và ẩn chi tiết nhạy cảm
│   │
│   ├── blockchain/                         # Tương tác chuyên sâu với mạng Blockchain
│   │   ├── contracts/                      # Nơi lưu ABI JSON của Smart Contract để backend gọi hàm on-chain
│   │   ├── verifier.js                     # Hàm xác thực Transaction Hash: Chờ đủ số block confirmations, check status = 1
│   │   └── listeners.js                    # Worker chạy ngầm lắng nghe Smart Contract Events (TicketMinted, TicketSold) để đồng bộ MongoDB Atlas
│   │
│   ├── utils/                              # Các hàm tiện ích dùng chung
│   │   ├── logger.js                       # Cấu hình Winston logger (ghi log thông tin hoạt động và log lỗi ra console/file)
│   │   ├── crypto.js                       # Hash mật khẩu bằng bcrypt, tạo chữ ký số HMAC-SHA256 cho mã QR
│   │   └── apiResponse.js                  # Chuẩn hóa định dạng JSON phản hồi: { success: true, data: ..., message: ... }
│   │
│   ├── app.js                              # Khởi tạo Express, cài đặt bảo mật (Helmet, CORS), parser JSON và gắn router
│   └── server.js                           # Kết nối MongoDB Atlas, lắng nghe cổng HTTP (Port 5000), khởi động blockchain listener
│
├── package.json                            # Danh sách phụ thuộc: express, mongoose, ethers, jsonwebtoken, bcryptjs, cors, helmet, dotenv
└── .env.example                            # Biến môi trường: PORT, MONGODB_ATLAS_URI, JWT_SECRET, SEPOLIA_RPC_URL, CONTRACT_ADDRESS, QR_SECRET_KEY
```

---

## 4. CHI TIẾT MODULE `blockchain/` (Solidity + Hardhat + Sepolia)

> Phân hệ hợp đồng thông minh chịu trách nhiệm đảm bảo **tính toàn vẹn bất biến**: quyền sở hữu NFT, số lượng vé tối đa không thể gian lận, và đặc biệt là **quy tắc bắt buộc giá bán lại trên chợ không vượt quá 120% giá gốc**.

```text
blockchain/
├── contracts/                              # Mã nguồn Smart Contracts viết bằng Solidity (0.8.20+)
│   ├── EventTicket.sol                     # Hợp đồng vé NFT kế thừa OpenZeppelin ERC721URIStorage:
│   │                                       # - Quản lý việc tạo sự kiện on-chain
│   │                                       # - Lưu trữ bất biến giá gốc phát hành (originalPrice) của từng loại vé
│   │                                       # - Giới hạn số lượng vé tối đa (maxSupply), không cho phép mint vượt quá
│   │                                       # - Cấp quyền mint vé cho người mua sau khi nhận thanh toán hợp lệ
│   │
│   ├── TicketMarketplace.sol               # Hợp đồng chợ mua bán vé thứ cấp:
│   │                                       # - Cho phép chủ sở hữu niêm yết bán lại vé NFT
│   │                                       # - THỰC THI QUY TẮC BẤT BIẾN: require(resalePrice <= originalPrice * 120 / 100)
│   │                                       # - Chặn tuyệt đối việc bán vé đã qua check-in hoặc sự kiện đã kết thúc
│   │                                       # - Tự động chuyển ETH cho người bán và chuyển quyền sở hữu NFT cho người mua
│   │
│   └── interfaces/                         # Các Interface tiêu chuẩn
│       ├── IEventTicket.sol                # Khai báo các hàm giao tiếp của hợp đồng EventTicket (getTicketInfo, isTicketUsed)
│       └── ITicketMarketplace.sol          # Khai báo các hàm giao tiếp của hợp đồng TicketMarketplace (listTicket, buyTicket)
│
├── scripts/                                # Kịch bản chạy tự động bằng Hardhat CLI
│   ├── deploy.js                           # Script biên dịch và triển khai các contract lên mạng Ethereum Sepolia Testnet,
│   │                                       # tự động lưu lại địa chỉ contract vào file cấu hình của frontend và backend
│   ├── verify.js                           # Script gửi mã nguồn lên Etherscan API để xác minh công khai hợp đồng
│   └── seed.js                             # Kịch bản nạp dữ liệu mẫu: Tạo sẵn 1 sự kiện và mint 5 vé mẫu để thử nghiệm
│
├── test/                                   # Kiểm thử tự động Smart Contract toàn diện
│   ├── EventTicket.test.js                 # Unit test kiểm tra:
│   │                                       # - Mint vé thành công khi thanh toán đủ tiền
│   │                                       # - Từ chối giao dịch khi mint vượt quá giới hạn maxSupply
│   │                                       # - Ghi nhận chính xác originalPrice của vé
│   │
│   ├── TicketMarketplace.test.js           # Unit test kiểm tra các quy tắc chợ thứ cấp:
│   │                                       # - Niêm yết thành công khi giá <= 120% giá gốc
│   │                                       # - BỊ TỪ CHỐI (REVERT) ngay lập tức khi giá bán lại > 120% giá gốc
│   │                                       # - Hủy niêm yết vé trả lại NFT cho chủ sở hữu
│   │                                       # - Mua vé thành công: Tiền về ví người bán, NFT sang ví người mua
│   │
│   └── Integration.test.js                 # Kiểm thử luồng tích hợp hoàn chỉnh từ đầu đến cuối:
│                                           # Tạo sự kiện -> Khách hàng mua vé -> Niêm yết bán lại -> Khách khác mua vé
│
├── hardhat.config.js                       # Cấu hình Hardhat: Phiên bản Solidity, mạng Sepolia RPC (Infura/Alchemy), Etherscan API key
├── package.json                            # Khai báo thư viện: hardhat, @openzeppelin/contracts, @nomicfoundation/hardhat-toolbox, ethers
└── .env.example                            # Biến môi trường: SEPOLIA_RPC_URL, PRIVATE_KEY_DEPLOYER, ETHERSCAN_API_KEY
```

---

## 5. CHI TIẾT MODULE `docs/` (Tài liệu nghiệp vụ & Kiến trúc)

> Thư mục tài liệu kỹ thuật hoàn chỉnh phục vụ nghiên cứu, phát triển, kiểm thử và bàn giao hệ thống.

```text
docs/
├── project_structure.md                    # [Tài liệu hiện tại] Bản đồ giải thích chi tiết cấu trúc thư mục & chức năng từng file
│
├── theme_specification.md                  # Quy chuẩn Thiết kế Theme UI/UX (Modern SaaS Design System):
│                                           # - Định hướng phong cách Modern SaaS cho 3 vai trò Customer, Organizer, Admin
│                                           # - Màu xanh thương hiệu #2563EB, tokens màu nền/chữ cho Light Mode & Dark Mode
│                                           # - Quy tắc chuyển đổi chế độ thủ công, lưu trữ localStorage, không auto OS
│                                           # - Font Roboto, base grid 8px, bo góc 8-12px, shadow tinh tế
│                                           # - Quy chuẩn component: Button, TextField, Card, Dialog, Table, Chip
│                                           # - Mã hóa trạng thái nghiệp vụ & phân biệt giao dịch Blockchain pending
│                                           # - Đáp ứng Responsive (MUI breakpoints) & Trợ năng (WCAG 2.1 AA)
│                                           # - Cấu hình tập trung tại frontend/src/theme/, cấm hard-code mã HEX rải rác
│
├── business_requirements.md                # Tài liệu Đặc tả Yêu cầu Nghiệp vụ (BRD):
│                                           # - Phân tích chi tiết 3 vai trò: Admin, Nhà tổ chức sự kiện (Organizer), Khách hàng (Customer)
│                                           # - Quy tắc kiểm soát nguồn cung vé (maxSupply)
│                                           # - Quy tắc bắt buộc trần giá bán lại 120% (Chống hiện tượng phe vé / đầu cơ vé chợ đen)
│                                           # - Cơ chế check-in vé bằng mã QR mã hóa dùng một lần
│
├── database_design.md                      # Tài liệu Thiết kế Cơ sở Dữ liệu MongoDB Atlas:
│                                           # - Chi tiết tất cả Collections: users, events, ticket_types, tickets, orders, resale_listings, checkin_logs, audit_logs
│                                           # - Định nghĩa kiểu dữ liệu từng trường, khóa ngoại tham chiếu, ràng buộc duy nhất (Unique)
│                                           # - Chiến lược tạo Indexes để tối ưu hiệu năng tìm kiếm và truy vấn
│                                           # - Cơ chế phân định dữ liệu On-chain (Blockchain) và Off-chain (MongoDB Atlas)
│
├── api_specification.md                    # Tài liệu Đặc tả Giao diện Lập trình Ứng dụng (REST API):
│                                           # - Danh sách toàn bộ Endpoints theo chuẩn RESTful
│                                           # - Chi tiết HTTP Method (GET, POST, PUT, DELETE), Headers (Bearer Token)
│                                           # - Mẫu dữ liệu Request Body, Params và phản hồi JSON thành công/thất bại
│                                           # - Quy chuẩn mã lỗi HTTP (400, 401, 403, 404, 409, 500)
│
└── system_architecture.md                  # Tài liệu Thiết kế Kiến trúc Hệ thống Tổng thể:
│                                           # - Sơ đồ luồng dữ liệu tương tác giữa Frontend (React JS), Backend (Node.js), MongoDB Atlas & Sepolia Blockchain
│                                           # - Cơ chế đồng bộ dữ liệu giao dịch On-chain vào Database thông qua Event Listeners
│                                           # - Cơ chế bảo mật: Xác thực ví MetaMask qua Nonce & HMAC Signature cho QR Code
│                                           # - Thiết kế chịu tải, xử lý tranh chấp vé khi mở bán đồng thời
```

---

## 6. MA TRẬN PHÂN BỔ TÍNH NĂNG THEO TỪNG THƯ MỤC

| Nghiệp vụ / Tính năng | Frontend (`frontend/src/`) | Backend (`backend/src/`) | Blockchain (`blockchain/`) | Cơ sở dữ liệu (`MongoDB Atlas`) |
| :--- | :--- | :--- | :--- | :--- |
| **Đăng nhập & Liên kết Ví** | `pages/auth/LoginPage.jsx`, `hooks/useWallet.js` | `controllers/authController.js`, `services/authService.js` | Ký xác thực chữ ký `eth_sign` tại ví người dùng | `models/User.js` (Lưu ví, nonce) |
| **Quản lý & Duyệt Sự kiện** | `pages/organizer/CreateEventPage.jsx`, `pages/admin/EventApprovalPage.jsx` | `controllers/eventController.js`, `services/eventService.js` | Lưu tham chiếu `eventId` on-chain khi mở bán | `models/Event.js`, `models/TicketType.js` |
| **Mua vé ban đầu (Primary Sale)** | `pages/customer/CheckoutPage.jsx`, `services/blockchainService.js` | `controllers/orderController.js`, `blockchain/verifier.js` | `EventTicket.sol` (`mintTicket`, nhận ETH, giới hạn maxSupply) | `models/Order.js`, `models/Ticket.js` |
| **Chợ bán lại trần 120% (Marketplace)**| `pages/marketplace/ResaleListingModal.jsx`, `MarketplacePage.jsx` | `controllers/marketplaceController.js`, `marketplaceService.js` | `TicketMarketplace.sol` (`listTicket`, check `resalePrice <= 120%`) | `models/ResaleListing.js` |
| **Tạo & Hiển thị mã QR vé** | `pages/customer/TicketDetailPage.jsx`, `components/qr/QRCodeDisplay.jsx` | `controllers/ticketController.js`, `services/qrService.js` | Xác thực `ownerOf(tokenId)` trên smart contract | `models/Ticket.js` |
| **Quét QR & Soát vé tại cổng** | `pages/organizer/CheckInScannerPage.jsx`, `QRCodeCameraScanner.jsx` | `controllers/checkInController.js`, `services/checkInService.js` | Cập nhật hoặc kiểm tra trạng thái vé chưa sử dụng | `models/CheckInLog.js`, `models/Ticket.js` (`isUsed: true`) |
| **Thống kê & Giám sát** | `pages/organizer/OrganizerDashboardPage.jsx`, `pages/admin/AdminDashboardPage.jsx` | `controllers/adminController.js`, `services/eventService.js` | Đọc dữ liệu event logs & balances | Query tổng hợp từ MongoDB Atlas |
