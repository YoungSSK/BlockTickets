# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS)

> **Hệ thống:** BlockTickets – Nền tảng bán vé và chuyển nhượng vé sự kiện ứng dụng Blockchain & NFT  
> **Cơ sở dữ liệu:** MongoDB Atlas  
> **Frontend:** React + JavaScript (Vite)  
> **Mạng Blockchain:** Ethereum Sepolia Testnet  

---

## 1. MỤC TIÊU NGHIỆP VỤ

1. **Giải quyết vấn nạn vé giả:** Sử dụng Smart Contract (chuẩn ERC-721) để phát hành vé dưới dạng NFT. Mỗi vé là duy nhất, có thể xác thực công khai quyền sở hữu trên blockchain.
2. **Kiểm soát nạn phe vé / đầu cơ vé chợ đen:** Thiết lập quy tắc bất biến trong Smart Contract: Giá bán lại trên thị trường thứ cấp (Marketplace) **không được vượt quá 120% giá gốc phát hành**.
3. **Quy trình soát vé một lần (Check-in an toàn):** Áp dụng mã QR động có chữ ký số HMAC, ngăn chặn hoàn toàn việc chụp màn hình vé gửi cho nhiều người hoặc sử dụng vé lặp lại.
4. **Minh bạch tài chính:** Báo cáo doanh thu thời gian thực, đối soát dễ dàng giữa dữ liệu ngoài chuỗi (MongoDB Atlas) và dữ liệu trên chuỗi (Sepolia Testnet).

---

## 2. CÁC VAI TRÒ VÀ MA TRẬN QUYỀN HẠN

### 2.1. Quản trị viên hệ thống (Admin)
- **Quản lý & Duyệt sự kiện:** Tiếp nhận các sự kiện do Organizer tạo, kiểm tra thông tin hợp lệ và chọn **Phê duyệt (Approve)** hoặc **Từ chối (Reject)** kèm lý do.
- **Quản lý người dùng:** Tra cứu danh sách tài khoản, phân quyền vai trò (Admin/Organizer/Customer), khóa các tài khoản có hành vi gian lận.
- **Giám sát giao dịch:** Theo dõi các giao dịch on-chain (thành công, thất bại, pending), phát hiện bất thường về khối lượng mua vé.
- **Nhật ký hệ thống (Audit Log):** Xem lại toàn bộ các thao tác quản trị nhằm phục vụ truy vết và kiểm toán.

### 2.2. Nhà tổ chức sự kiện (Organizer)
- **Tạo & Quản lý sự kiện:** Nhập tên sự kiện, nội dung mô tả, địa điểm, thời gian bắt đầu/kết thúc, tải poster sự kiện.
- **Cấu hình hạng vé:** Thiết lập các loại vé (ví dụ: Early Bird, Standard, VIP), định giá phát hành ban đầu (`originalPrice`), giới hạn số lượng phát hành tối đa (`maxSupply`), thời gian mở/đóng bán.
- **Soát vé tại cổng (Check-in Scanner):** Sử dụng camera điện thoại hoặc máy tính bảng để quét mã QR vé của người tham dự; nhận phản hồi tức thì: **HỢP LỆ**, **VÉ ĐÃ SỬ DỤNG**, **SAI SỰ KIỆN**, hoặc **VÉ ĐÃ BỊ CHUYỂN NHƯỢNG**.
- **Báo cáo & Thống kê:** Theo dõi số lượng vé đã bán, doanh thu thu về, số người đã check-in thực tế tại sự kiện.

### 2.3. Khách hàng (Customer)
- **Khám phá sự kiện:** Tìm kiếm, lọc sự kiện theo địa điểm, danh mục, thời gian.
- **Kết nối ví & Mua vé:** Kết nối ví MetaMask trên mạng Sepolia, thanh toán ETH để mint vé NFT trực tiếp về ví cá nhân.
- **Kho vé cá nhân (My Tickets):** Quản lý toàn bộ vé đang sở hữu, xem thông tin chi tiết từng vé NFT.
- **Sử dụng vé (Check-in):** Mở mã QR vé an toàn khi đến cổng sự kiện để nhân viên soát vé quét.
- **Chuyển nhượng vé (Marketplace):** Niêm yết bán lại vé cho người khác với giá tối đa bằng 120% giá gốc; hoặc mua lại vé từ người bán khác trên chợ.

---

## 3. CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

### BR-01: Giới hạn nguồn cung vé tối đa (`maxSupply`)
- Mỗi hạng vé của một sự kiện có một số lượng phát hành trần không đổi.
- Quy tắc này được Smart Contract kiểm tra trực tiếp (`require(currentSupply + quantity <= maxSupply)`). Không một ai (kể cả Admin hay Organizer) có thể phát hành vượt quá con số này.

### BR-02: Quy tắc giá gốc bất biến (`originalPrice`)
- Giá phát hành ban đầu của vé được ghi nhận bất biến trên Smart Contract tại thời điểm tạo hạng vé.
- Giá này là căn cứ duy nhất để tính toán trần giá cho mọi lần giao dịch chuyển nhượng sau này.

### BR-03: Giới hạn trần giá bán lại 120% (Anti-Scalping Rule)
- Mọi giao dịch niêm yết vé trên Marketplace đều phải thỏa mãn điều kiện:
  $$\text{resalePrice} \le \text{originalPrice} \times 1.2$$
- Nếu người bán đặt giá vượt quá 120%, Smart Contract sẽ **từ chối giao dịch (Revert)** ngay lập tức. Frontend cũng sẽ hiển thị gợi ý và chặn người dùng nhập số tiền vượt mức tối đa này.

### BR-04: Điều kiện chuyển nhượng vé
- Vé chỉ được phép niêm yết bán lại nếu:
  1. Vé thuộc quyền sở hữu của người bán (`msg.sender == ownerOf(tokenId)`).
  2. Vé **chưa từng được check-in** (`isUsed == false`).
  3. Sự kiện **chưa kết thúc**.
  4. Vé không nằm trong trạng thái bị khóa hoặc sự kiện bị hủy.

### BR-05: Chống quét vé lặp lại (Atomic One-Time Check-In)
- Mã QR check-in được tạo động từ backend với thời hạn nhất định và chứa chuỗi chữ ký bảo mật HMAC.
- Khi nhân viên soát vé quét mã QR, backend sẽ kiểm tra trạng thái vé và cập nhật cờ `isUsed = true` dưới dạng thao tác nguyên tử (atomic operation) trên MongoDB Atlas / Smart Contract. Lần quét thứ hai trở đi sẽ bị hệ thống từ chối ngay lập tức kèm thời gian đã check-in trước đó.
