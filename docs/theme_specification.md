# QUY CHUẨN THIẾT KẾ THEME UI/UX (MODERN SAAS DESIGN SYSTEM)

> **Dự án:** BlockTickets – Hệ thống phân phối & chuyển nhượng vé sự kiện Blockchain  
> **Phong cách:** Modern SaaS (Hiện đại, Tối giản, Chuyên nghiệp, Dễ sử dụng)  
> **Công nghệ giao diện:** React (JavaScript / JSX) + Material UI (MUI v5)  
> **Font chữ chủ đạo:** Roboto  
> **Màu sắc thương hiệu chính:** Xanh dương `#2563EB` (Primary Blue)  
> **Chế độ hỗ trợ:** Light Mode (Mặc định) & Dark Mode (Chuyển đổi thủ công)  

---

## 1. TỔNG QUAN TRIẾT LÝ THIẾT KẾ (DESIGN PHILOSOPHY)

Hệ thống giao diện BlockTickets được thiết kế theo phong cách **Modern SaaS**, phục vụ ba nhóm đối tượng người dùng chính: **Khách hàng (Customer)**, **Nhà tổ chức (Organizer)** và **Quản trị viên (Admin)**.

### Các nguyên tắc cốt lõi:
1. **Rõ ràng & Phân cấp (Clarity & Hierarchy):** Bố cục thông tin mạch lạc, khoảng trắng (whitespace) cân đối, phân cấp thị giác rõ ràng giữa tiêu đề, nội dung và các hành động chính.
2. **Thân thiện với người dùng phổ thông (Web3 Simplicity):** Giảm thiểu tối đa rào cản thuật ngữ Blockchain phức tạp. Địa chỉ ví được rút gọn tinh tế (ví dụ: `0x12..78`), có nút sao chép nhanh và liên kết mở Etherscan. Các thông số quan trọng (giá vé, thời gian, số lượng còn lại, kết quả check-in) phải được hiển thị trực quan và dễ hiểu nhất.
3. **Tính nhất quán tuyệt đối (Consistency):** Toàn bộ giao diện được điều phối từ một cấu hình Theme tập trung. **Không hard-code mã màu HEX, kích thước font hoặc bo góc rải rác trong từng component**.
4. **Trung thực về trạng thái Blockchain:** Phân biệt rõ giữa *đang xử lý*, *chờ xác nhận on-chain* và *thành công*. Tuyệt đối không thông báo "Mua vé thành công" chỉ vì ví MetaMask vừa mở popup yêu cầu ký.

---

## 2. BẢNG MÀU THƯƠNG HIỆU & DESIGN TOKENS (COLOR PALETTE)

```text
+-----------------------------------------------------------------------------------+
|                                  PRIMARY BLUE                                     |
|           #2563EB (Main)    |    #1D4ED8 (Hover)    |    #1E40AF (Active)         |
+-----------------------------------------------------------------------------------+
```

### 2.1. Màu thương hiệu chủ đạo (Brand Primary)
* **Primary Main:** `#2563EB` (Blue 600) – Sử dụng cho các hành động cốt lõi: Nút Mua vé, Tạo sự kiện, Kết nối ví, Xác nhận thanh toán, Tab/Menu đang kích hoạt.
* **Primary Hover:** `#1D4ED8` (Blue 700) – Trạng thái di chuột vào nút chính.
* **Primary Dark / Active:** `#1E40AF` (Blue 800) – Trạng thái bấm giữ hoặc viền khi focus.
* **Primary Light (Dark Mode):** `#3B82F6` (Blue 500) – Điều chỉnh sắc độ sáng hơn khi chuyển sang nền tối để tăng độ tương phản đạt chuẩn WCAG.
* **Primary Background Tint:** `#EFF6FF` (Blue 50 ở Light Mode) hoặc `rgba(37, 99, 235, 0.12)` – Dùng cho viền active, nền avatar, badge nổi bật.

---

### 2.2. Màu sắc theo Chế độ Giao diện (Light Mode vs. Dark Mode)

| Thành phần giao diện | Light Mode (Mặc định) | Dark Mode | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Nền trang (Page Background)** | `#F8FAFC` (Slate 50) | `#0B0F19` (Deep Slate) | Nền tổng thể, giảm chói mắt ở Light, tạo chiều sâu ở Dark |
| **Bề mặt (Paper / Card / Dialog)** | `#FFFFFF` (Pure White) | `#1E293B` (Slate 800) | Thẻ sự kiện, khung bảng biểu, popup hộp thoại |
| **Bề mặt phụ (Elevated / Hover)** | `#F1F5F9` (Slate 100) | `#334155` (Slate 700) | Nền dòng bảng khi hover, thanh tìm kiếm, input |
| **Chữ chính (Text Primary)** | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Tiêu đề trang, tên sự kiện, giá tiền, nội dung quan trọng |
| **Chữ phụ (Text Secondary)** | `#64748B` (Slate 500) | `#94A3B8` (Slate 400) | Mô tả chi tiết, ngày giờ, nhãn phụ, thông tin bản quyền |
| **Chữ vô hiệu (Text Disabled)** | `#94A3B8` (Slate 400) | `#64748B` (Slate 500) | Nút bấm bị khóa, placeholder |
| **Đường viền (Border / Divider)** | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) | Đường ngăn cách menu, viền Card, đường chia bảng |

---

### 2.3. Màu sắc trạng thái nghiệp vụ (Business Status Tokens)

Mỗi trạng thái nghiệp vụ trong hệ thống được gắn liền với một bảng màu tiêu chuẩn. **Quy tắc bắt buộc:** Luôn hiển thị kèm **Biểu tượng (Icon)** hoặc **Nhãn chữ (Label)** rõ ràng, không chỉ dùng màu sắc đơn thuần để truyền đạt thông tin (đạt chuẩn trợ năng cho người khiếm thị màu).

```text
[✓ Thành công]     [⏳ Chờ xử lý]     [⚡ Chờ Blockchain]     [⚠ Cảnh báo]     [✕ Thất bại]     [🎟 Đã Check-in]     [⊘ Đã Hủy]
```

| Trạng thái | Màu đại diện | Mã HEX (Light / Dark) | Nền Badge (Chip Background) | Ý nghĩa nghiệp vụ trong hệ thống |
| :--- | :--- | :--- | :--- | :--- |
| **Thành công (Success)** | Xanh lục | `#10B981` / `#34D399` | `#ECFDF5` / `rgba(16, 185, 129, 0.15)` | Vé hợp lệ, thanh toán thành công, sự kiện được duyệt |
| **Chờ xử lý (Pending)** | Vàng cam | `#F59E0B` / `#FBBF24` | `#FFFBEB` / `rgba(245, 158, 11, 0.15)` | Sự kiện chờ Admin duyệt, đơn hàng đang chờ tạo |
| **Chờ Blockchain (On-chain Pending)** | Chàm / Tím | `#6366F1` / `#818CF8` | `#EEF2FF` / `rgba(99, 102, 241, 0.15)` | Giao dịch MetaMask đã gửi lên Sepolia, đang chờ thợ đào đóng block |
| **Cảnh báo (Warning)** | Cam tươi | `#F97316` / `#FB923C` | `#FFF7ED` / `rgba(249, 115, 22, 0.15)` | Vé sắp hết hạn mở bán, cảnh báo trần giá 120%, sắp hết vé |
| **Thất bại / Lỗi (Error / Failed)** | Đỏ tươi | `#EF4444` / `#F87171` | `#FEF2F2` / `rgba(239, 68, 68, 0.15)` | Giao dịch reverted, vé không hợp lệ, sự kiện bị từ chối |
| **Đã check-in (Checked-in / Used)** | Tím thẫm | `#8B5CF6` / `#A78BFA` | `#F5F3FF` / `rgba(139, 92, 246, 0.15)` | Vé đã quét thành công tại cổng, không thể sử dụng lần 2 |
| **Đã hủy / Vô hiệu (Cancelled / Inactive)** | Xám trung tính | `#64748B` / `#94A3B8` | `#F1F5F9` / `rgba(100, 116, 139, 0.15)` | Vé hết hạn, sự kiện bị ban tổ chức hủy, vé bị thu hồi |

---

## 3. CƠ CHẾ CHUYỂN ĐỔI CHẾ ĐỘ SÁNG / TỐI (LIGHT & DARK MODE)

### 3.1. Nguyên tắc hoạt động
* **Mặc định ban đầu:** Hệ thống luôn khởi động ở **Light Mode** đối với người dùng mới.
* **Chuyển đổi thủ công (Manual Toggle):** Nút chuyển đổi Light/Dark Mode được đặt tại vị trí cố định, dễ thấy trên thanh điều hướng (`Navbar`) hoặc góc trên menu tài khoản.
* **Lưu trữ phiên (Persistence):** Khi người dùng chuyển đổi, lựa chọn được ghi nhận vào `localStorage` (khóa `blocktickets_theme_mode: 'light' | 'dark'`). Khi F5 tải lại trang, trạng thái này được nạp tự động.
* **Không phụ thuộc OS:** Hệ thống không tự động thay đổi theo `prefers-color-scheme` của hệ điều hành, nhằm giữ tính ổn định và tôn trọng lựa chọn chủ động của người dùng.
* **Đồng bộ toàn cục:** Sử dụng MUI `ThemeProvider` kết hợp `ThemeContext` của React. Mọi Component từ Customer, Organizer đến Admin đều tự động cập nhật ngay lập tức mà không cần reload trang.

---

## 4. QUY CHUẨN KIỂU CHỮ (TYPOGRAPHY SPECIFICATION)

Toàn bộ hệ thống sử dụng font chữ **Roboto** làm font mặc định để tương thích hoàn hảo với hệ sinh thái Material UI, bổ sung font Monospace cho địa chỉ ví và mã giao dịch Blockchain.

```text
Font Family Chính:   'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Font Monospace (Ví): 'Roboto Mono', 'SFMono-Regular', Consolas, monospace
```

### 4.1. Bảng phân cấp kiểu chữ (Type Scale)

| Biến thể (Variant) | Kích thước | Độ đậm (Weight) | Chiều cao dòng (Line Height) | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- | :--- |
| `h1` | 32px (2.0rem) | Bold (700) | 1.25 | Tiêu đề lớn trang chủ, Hero banner sự kiện |
| `h2` | 24px (1.5rem) | SemiBold (600) | 1.30 | Tiêu đề trang chi tiết sự kiện, Dashboard chính |
| `h3` | 20px (1.25rem) | SemiBold (600) | 1.35 | Tiêu đề thẻ Card sự kiện, tiêu đề modal Dialog |
| `h4` | 18px (1.125rem) | Medium (500) | 1.40 | Tiêu đề bảng biểu, tiêu đề nhóm chức năng |
| `body1` | 16px (1.0rem) | Regular (400) | 1.50 | Nội dung văn bản chính, mô tả sự kiện, chính sách |
| `body2` | 14px (0.875rem) | Regular (400) | 1.50 | Dữ liệu bảng biểu, nhãn phụ, thông tin chi tiết hạng vé |
| `subtitle1` | 16px (1.0rem) | Medium (500) | 1.40 | Tiêu đề phụ, nhãn nổi bật |
| `subtitle2` | 14px (0.875rem) | Medium (500) | 1.40 | Tên người dùng, tên Organizer trong thẻ |
| `caption` | 12px (0.75rem) | Regular (400) | 1.40 | Ngày giờ tạo, thời gian check-in, số block xác nhận |
| `button` | 14px (0.875rem) | SemiBold (600) | 1.25 | Chữ trong nút bấm (`textTransform: 'none'`, không viết hoa toàn bộ) |

### 4.2. Quy cách hiển thị địa chỉ Ví & Mã băm Blockchain (Hashes)
* **Chuỗi dài:** Sử dụng kiểu chữ `fontFamily: 'monospace'`, cỡ chữ `13px`.
* **Hiển thị rút gọn (Truncation):** Rút gọn theo định dạng `0x1234...5678` (4 ký tự đầu và 4 ký tự cuối).
* **Tiện ích đi kèm:** Luôn bố trí nút bấm biểu tượng sao chép (Copy Icon) nhanh kèm thông báo "Đã sao chép vào bộ nhớ tạm" và liên kết icon trỏ sang Etherscan Sepolia Explorer.

---

## 5. BỐ CỤC, KHOẢNG CÁCH & BO GÓC (SPACING, RADIUS & SHADOWS)

### 5.1. Hệ thống lưới Spacing cơ sở 8px
Mọi khoảng cách (padding, margin, gap) đều tuân theo bội số của **8px**:
* **`8px` (spacing: 1):** Khoảng cách nhỏ giữa icon và chữ, giữa các chip trạng thái.
* **`16px` (spacing: 2):** Khoảng cách nội dung bên trong form, padding của Card nhỏ, khoảng cách giữa các trường nhập liệu.
* **`24px` (spacing: 3):** Padding tiêu chuẩn của Card sự kiện, Dialog, khoảng cách giữa các phần trong form.
* **`32px` (spacing: 4):** Khoảng cách giữa các khối nội dung lớn trên trang, padding của Dashboard view.
* **`48px` (spacing: 6):** Khoảng cách phân tách các Section chính trên trang chủ.

### 5.2. Bán kính bo góc (Border Radius / Shape)
Toàn bộ hệ thống áp dụng bo góc mềm mại, hiện đại trong khoảng **8px – 12px**:
* **`8px`:** Áp dụng cho `Button`, `TextField`, `Select`, `Chip`.
* **`10px`:** Áp dụng cho thẻ sự kiện (`Card`), khung bảng dữ liệu (`TableContainer`).
* **`12px`:** Áp dụng cho hộp thoại xác nhận (`Dialog`), menu xổ xuống (`Menu`), thông báo Toast.

### 5.3. Hiệu ứng đổ bóng (Elevation & Shadows)
Sử dụng bóng mờ tinh tế (soft shadow), không lạm dụng shadow đậm gây rối mắt:
* **`elevation: 0`:** Nền phẳng kèm viền `1px solid divider` (phù hợp với bảng biểu và input).
* **`elevation: 1`:** `0 1px 3px 0 rgba(0, 0, 0, 0.08)` – Card sự kiện ở trạng thái tĩnh.
* **`elevation: 3` (Hover):** `0 10px 15px -3px rgba(0, 0, 0, 0.1)` – Card sự kiện khi người dùng rê chuột vào.
* **`elevation: 5`:** `0 20px 25px -5px rgba(0, 0, 0, 0.15)` – Hộp thoại Dialog và Modal thanh toán.

---

## 6. QUY CHUẨN CÁC THÀNH PHẦN GIAO DIỆN CHÍNH (COMPONENTS)

### 6.1. Nút bấm (Button)
* **Contained Button (Nút nổi bật chính):** Nền `#2563EB`, chữ trắng, bo góc 8px. Dành riêng cho hành động then chốt: **Mua vé**, **Tạo sự kiện**, **Kết nối ví MetaMask**, **Xác nhận giao dịch**. Khi đang gọi Smart Contract, nút tự động hiển thị `CircularProgress` màu trắng và chuyển sang trạng thái `disabled`.
* **Outlined Button (Nút viền phụ):** Nền trong suốt, viền `1px solid #2563EB`, chữ `#2563EB`. Dành cho hành động: **Xem chi tiết**, **Lịch sử giao dịch**, **Chỉnh sửa**.
* **Text Button (Nút dạng chữ):** Dành cho thao tác hủy: **Đóng**, **Quay lại**, **Bỏ qua**.
* **Nguyên tắc chữ:** `textTransform: 'none'` (giữ nguyên kiểu chữ viết hoa/thường bình thường của tiếng Việt, tuyệt đối không viết hoa toàn bộ `ALL CAPS`).

### 6.2. Ô nhập liệu (TextField & Select)
* **Chiều cao tiêu chuẩn:** 44px – 48px, dễ thao tác trên cả chuột máy tính lẫn màn hình cảm ứng điện thoại.
* **Trạng thái bình thường:** Viền trung tính `#E2E8F0` (Light) / `#334155` (Dark).
* **Trạng thái Focus:** Viền chuyển sang màu xanh thương hiệu `#2563EB` với hiệu ứng viền phát sáng nhẹ.
* **Trạng thái Lỗi (Error):** Viền chuyển sang đỏ `#EF4444`, đi kèm câu thông báo giải thích lỗi cụ thể ngay dưới ô nhập liệu (ví dụ: *"Giá bán lại không được vượt quá 120% giá phát hành ban đầu"*).

### 6.3. Thẻ thông tin (Card)
* Nền: `#FFFFFF` (Light) / `#1E293B` (Dark).
* Viền: `1px solid #E2E8F0` (Light) / `1px solid #334155` (Dark).
* Padding: `20px` hoặc `24px`.
* Hình ảnh poster sự kiện trong Card có tỷ lệ chuẩn `16:9` hoặc `4:3`, bo góc phía trên `10px 10px 0 0`.

### 6.4. Hộp thoại xác nhận (Dialog / Modal)
* Thiết kế tối giản, tập trung vào hành động cốt lõi.
* Tiêu đề toát lên mục đích (ví dụ: *"Xác nhận mua vé sự kiện"*).
* Bảng tóm tắt thông tin: Tên vé, số lượng, đơn giá, phí ước tính gas, tổng tiền ETH.
* Hai nút dứt khoát dưới chân: Nút Hủy (Text/Outlined) bên trái và Nút Xác nhận (Contained) bên phải.

### 6.5. Bảng dữ liệu (Table)
* **Header (Tiêu đề cột):** Nền xám nhạt `#F1F5F9` (Light) / `#0F172A` (Dark), chữ bán đậm `600`, chiều cao tối thiểu 44px.
* **Hàng dữ liệu (Row):** Viền dưới mảnh `1px solid divider`, hiệu ứng đổi màu nền nhẹ nhàng khi hover.
* **Empty State:** Khi không có dữ liệu, hiển thị hình minh họa trống + tiêu đề ngắn gọn + nút kêu gọi hành động (ví dụ: *"Bạn chưa sở hữu vé nào. Hãy khám phá sự kiện ngay!"*).

### 6.6. Huy hiệu trạng thái (Chip / Badge)
* Kích thước nhỏ gọn, bo góc `6px` hoặc bo tròn `16px`.
* Sử dụng nền nhạt (opacity 10-15%) kết hợp màu chữ đậm cùng tone:
  * Vé Hợp lệ: Nền xanh lá nhạt + Chữ xanh lá đậm + Icon check.
  * Vé Đã Check-in: Nền tím nhạt + Chữ tím đậm + Icon QR đã quét.
  * Giao dịch Chờ: Nền chàm nhạt + Chữ chàm đậm + Icon đồng hồ xoay.

---

## 7. QUY CHUẨN HIỂN THỊ TRẠNG THÁI GIAO DỊCH BLOCKCHAIN

Hệ thống yêu cầu quy trình phản hồi giao dịch 3 bước minh bạch:

```text
[ Bước 1: Yêu cầu ký ví ]  --->  [ Bước 2: Chờ đóng Block ]  --->  [ Bước 3: Xác nhận hoàn tất ]
  Mở popup MetaMask               Hiển thị Spinner + TxHash           Thông báo Thành công + Link Etherscan
  (Chưa ghi nhận vé)              (Trạng thái Pending)                (Vé NFT xuất hiện trong ví)
```

1. **Khi ví MetaMask mở popup ký giao dịch:** Giao diện hiển thị modal: *"Vui lòng xác nhận giao dịch trên ví MetaMask của bạn..."*. Lúc này trạng thái đơn hàng vẫn là `pending_signature`, tuyệt đối không ghi nhận mua vé thành công.
2. **Khi người dùng bấm Ký xong trên ví:** Frontend nhận về `txHash`. Giao diện hiển thị: *"Đang gửi giao dịch lên mạng Sepolia..."* kèm mã băm giao dịch và biểu tượng xoay (Pulse/Spinner). Người dùng có thể bấm vào link xem giao dịch trực tiếp trên Etherscan.
3. **Khi backend xác minh Transaction Receipt đã thành công (status = 1):** Giao diện mới kích hoạt Toast thông báo xanh *"Giao dịch thành công!"* và điều hướng người dùng tới trang [Kho vé của tôi](file:///d:/MyFloder/Blockchain/BlockTickets/docs/project_structure.md#2-chi-tiết-module-frontend-react--javascript).

---

## 8. ĐÁP ỨNG THIẾT BỊ (RESPONSIVE) & KHẢ NĂNG TIẾP CẬN (A11Y)

### 8.1. Các điểm ngắt Responsive (Breakpoints theo chuẩn MUI)
* **`xs` (0px – 599px) - Điện thoại:**
  * Bố cục 1 cột duy nhất.
  * Chiều rộng nút bấm full-width (`100%`) ở màn hình thanh toán để ngón tay dễ chạm.
  * Màn hình [CheckInScannerPage.jsx](file:///d:/MyFloder/Blockchain/BlockTickets/docs/project_structure.md#2-chi-tiết-module-frontend-react--javascript) tối ưu toàn màn hình cho camera.
* **`sm` (600px – 899px) - Máy tính bảng (Tablet):**
  * Lưới sự kiện 2 cột. Thanh tìm kiếm và bộ lọc xếp ngang.
* **`md` (900px – 1199px) - Laptop:**
  * Lưới sự kiện 3 cột. Dashboard hiển thị Sidebar bên trái thu gọn hoặc đầy đủ.
* **`lg` (1200px trở lên) - Màn hình Desktop lớn:**
  * Lưới sự kiện 3-4 cột. Giới hạn chiều rộng nội dung tối đa `maxWidth: 'lg'` (1200px) hoặc `'xl'` (1440px) để không bị kéo giãn quá mức.

### 8.2. Tiêu chuẩn Trợ năng (Accessibility - WCAG 2.1 AA)
* **Độ tương phản màu:** Mọi văn bản hiển thị trên cả Light Mode và Dark Mode đều phải đạt tỷ lệ tương phản tối thiểu **4.5:1** đối với văn bản thông thường và **3.0:1** đối với tiêu đề lớn.
* **Điều hướng bàn phím:** Duy trì trạng thái `focus-visible` với viền xanh `#2563EB` rõ ràng khi người dùng nhấn phím `Tab`.
* **Nhãn trợ năng (Accessible Labels):** Mọi nút bấm chỉ chứa biểu tượng (IconButton ví dụ như nút đóng, nút copy ví, nút chuyển theme) đều bắt buộc phải có thuộc tính `aria-label="..."`.

---

## 9. KIẾN TRÚC MÃ NGUỒN CẤU HÌNH THEME (CODE STRUCTURE)

Theme được tổ chức tập trung trong thư mục `frontend/src/theme/` và được quản lý trạng thái qua `ThemeContext.jsx`:

```text
frontend/src/
├── theme/
│   ├── index.js            # Hàm createAppTheme(mode): Lắp ráp palette, typography, components
│   ├── palette.js          # Định nghĩa tokens màu sắc Light Mode và Dark Mode
│   ├── typography.js       # Cấu hình font Roboto, kích cỡ h1-h6, body1-2, button
│   └── components.js       # Tùy biến mặc định các component MUI (MuiButton, MuiCard, MuiChip...)
└── context/
    └── ThemeContext.jsx    # Quản lý mode ('light'|'dark'), hàm toggleTheme, lưu localStorage
```

### 9.1. Mẫu cài đặt Palette (`frontend/src/theme/palette.js`)
```javascript
export const getPalette = (mode) => ({
  mode,
  primary: {
    main: mode === 'light' ? '#2563EB' : '#3B82F6',
    hover: '#1D4ED8',
    dark: '#1E40AF',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#64748B',
  },
  background: {
    default: mode === 'light' ? '#F8FAFC' : '#0B0F19',
    paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
    subtle: mode === 'light' ? '#F1F5F9' : '#334155',
  },
  text: {
    primary: mode === 'light' ? '#0F172A' : '#F8FAFC',
    secondary: mode === 'light' ? '#64748B' : '#94A3B8',
    disabled: mode === 'light' ? '#94A3B8' : '#64748B',
  },
  divider: mode === 'light' ? '#E2E8F0' : '#334155',
  status: {
    success: mode === 'light' ? '#10B981' : '#34D399',
    warning: mode === 'light' ? '#F97316' : '#FB923C',
    error: mode === 'light' ? '#EF4444' : '#F87171',
    pending: mode === 'light' ? '#F59E0B' : '#FBBF24',
    onchain: mode === 'light' ? '#6366F1' : '#818CF8',
    checkedIn: mode === 'light' ? '#8B5CF6' : '#A78BFA',
  },
});
```

### 9.2. Mẫu cài đặt Component Overrides (`frontend/src/theme/components.js`)
```javascript
export const getComponentOverrides = (mode) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 'none',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: '10px',
        border: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: '12px',
      },
    },
  },
});
```

### 9.3. Mẫu quản lý ThemeContext (`frontend/src/context/ThemeContext.jsx`)
```javascript
import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme';

const ThemeContext = createContext();

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('blocktickets_theme_mode') || 'light';
  });

  const toggleTheme = () => {
    setMode((prevMode) => {
      const nextMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('blocktickets_theme_mode', nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
```

---

## 10. QUY TẮC BẮT BUỘC DÀNH CHO CÁC THÀNH VIÊN FRONTEND

1. **Tuyệt đối không hard-code mã HEX trong JSX/CSS:**
   * ❌ *Sai:* `<Box sx={{ backgroundColor: '#FFFFFF', color: '#000000' }}>`
   * ✅ *Đúng:* `<Box sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>`
2. **Không cố định màu viền hoặc shadow tùy tiện:** Sử dụng `border: 1, borderColor: 'divider'` để màu sắc tự động thích ứng hoàn hảo khi chuyển giữa Light Mode và Dark Mode.
3. **Sử dụng typography theo đúng biến thể quy định:** Sử dụng `<Typography variant="h2">` hoặc `<Typography variant="body2" color="text.secondary">`, không tự định nghĩa `fontSize: '23px'` hoặc `fontWeight: 550`.
4. **Kiểm tra giao diện ở cả hai chế độ trước khi commit code:** Đảm bảo khi bấm nút chuyển chế độ, toàn bộ trang không xuất hiện vùng bị "cháy màu" (nền trắng chữ trắng hoặc nền đen chữ đen).
