# BlockTickets

> **Hệ thống phân phối và chuyển nhượng vé sự kiện ứng dụng công nghệ Blockchain & NFT**

---

## 📌 Tổng quan dự án

**BlockTickets** giải quyết triệt để các vấn nạn nhức nhối trong ngành công nghiệp sự kiện truyền thống:
1. **Vé giả mạo:** Vé được đúc thành NFT (ERC-721) trên blockchain Ethereum Sepolia, đảm bảo tính duy nhất và minh bạch quyền sở hữu.
2. **Nạn đầu cơ / Phe vé chợ đen:** Smart Contract thiết lập quy tắc trần giá bất biến: **Vé bán lại trên thị trường thứ cấp không được vượt quá 120% giá gốc phát hành**.
3. **Gian lận khi soát vé:** Cơ chế mã QR động được ký số HMAC, chống tái sử dụng và đảm bảo chỉ check-in một lần duy nhất.

---

## 🛠 Công nghệ sử dụng

- **Frontend:** React (JavaScript / JSX), Vite, React Router DOM, ethers.js, Material UI / Lucide Icons.
- **Backend:** Node.js, Express.js, Mongoose ODM, JSON Web Token (JWT), Zod validator.
- **Cơ sở dữ liệu:** **MongoDB Atlas** (Cloud Database Cluster).
- **Blockchain:** Solidity (0.8.20+), Hardhat framework, OpenZeppelin Contracts, mạng Ethereum Sepolia Testnet.
- **Ví hỗ trợ:** MetaMask.

---

## 📂 Tài liệu dự án

Các tài liệu chi tiết được tổ chức trong thư mục `docs/` và file kế hoạch:
- [roadmap.md](file:///d:/MyFloder/Blockchain/BlockTickets/roadmap.md): Bản kế hoạch phát triển chi tiết từ khởi tạo đến nghiệm thu MVP.
- [docs/project_structure.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/project_structure.md): **Cấu trúc thư mục chi tiết kèm giải thích chức năng từng file** trong 4 phân hệ: `frontend/`, `backend/`, `blockchain/` và `docs/`.
- [docs/theme_specification.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/theme_specification.md): **Quy chuẩn thiết kế Theme UI/UX** (Modern SaaS, Material UI v5, màu chủ đạo #2563EB, Roboto, Light/Dark Mode).
- [docs/business_requirements.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/business_requirements.md): Yêu cầu nghiệp vụ chi tiết của 3 vai trò (Admin, Organizer, Customer).
- [docs/database_design.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/database_design.md): Thiết kế cơ sở dữ liệu MongoDB Atlas (Schemas, Indexes, Data mapping).
- [docs/api_specification.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/api_specification.md): Đặc tả đầy đủ các API RESTful.
- [docs/system_architecture.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/system_architecture.md): Sơ đồ kiến trúc hệ thống và cơ chế tương tác On-chain / Off-chain.

---

## 🏛 Cấu trúc 4 Module chính

- `frontend/`: Giao diện khách hàng (mua vé, ví vé), Organizer (tạo sự kiện, quét mã QR soát vé tại cổng bằng camera), Admin (duyệt sự kiện, quản lý người dùng) và sàn chuyển nhượng vé thứ cấp (Marketplace trần 120%).
- `backend/`: REST API điều hướng dữ liệu, xác thực JWT & chữ ký ví, kiểm tra giá bán lại, sinh mã QR bảo mật và worker lắng nghe sự kiện blockchain đồng bộ MongoDB Atlas.
- `blockchain/`: Smart Contract `EventTicket.sol` và `TicketMarketplace.sol`, script triển khai (deploy) và bộ test kiểm thử tự động với Hardhat.
- `docs/`: Toàn bộ tài liệu nghiệp vụ, kiến trúc, cơ sở dữ liệu và API của dự án.