# Roadmap: Hệ thống bán vé sự kiện ứng dụng Blockchain

## 1. Mục tiêu dự án

Xây dựng hệ thống tạo, quản lý, mua bán và xác minh vé sự kiện. Vé được
biểu diễn bằng NFT trên blockchain; Smart Contract thực thi các quy tắc
phát hành, thanh toán và chuyển nhượng. Backend Node.js/Express quản lý
nghiệp vụ ngoài chuỗi và tích hợp blockchain; MongoDB lưu dữ liệu phục
vụ truy vấn; frontend React + MUI cung cấp giao diện cho ba vai trò.

### Công nghệ dự kiến

-   **Frontend:** React (JavaScript / JSX), Vite, Material UI (MUI), React
    Router, TanStack Query hoặc Axios. *(Sử dụng JavaScript thuần, không dùng TypeScript ở frontend để tăng tính linh hoạt và tối ưu tốc độ phát triển).*
-   **Backend:** Node.js, Express.js, REST API, Zod/Joi để kiểm tra dữ liệu.
-   **Database:** MongoDB Atlas (Cloud Database), Mongoose ODM.
-   **Blockchain:** Solidity, Hardhat, OpenZeppelin, Ethereum Sepolia
    cho môi trường thử nghiệm.
-   **Wallet và blockchain client:** MetaMask, ethers.js.
-   **Vé NFT:** ERC-721; cân nhắc ERC-1155 nếu sau này cần phát hành
    nhiều vé cùng loại theo mô hình fungible-like.
-   **QR check-in:** thư viện tạo QR ở backend hoặc frontend; QR chứa
    mã/token ngẫu nhiên có chữ ký hoặc token dùng một lần, không chứa
    thông tin cá nhân nhạy cảm.
-   **Kiểm thử:** Vitest/React Testing Library cho frontend; Jest hoặc
    Vitest + Supertest cho backend; Hardhat tests cho Smart Contract.

> Quy tắc quan trọng: MongoDB Atlas không phải nguồn xác thực cuối cùng cho
> quyền sở hữu NFT, thanh toán on-chain hoặc trạng thái vé đã được sử
> dụng. Những dữ liệu này phải được xác minh từ blockchain/Smart
> Contract hoặc từ quy trình check-in có kiểm soát. Không lưu private
> key của người dùng trong backend.
>
> 📁 **Tài liệu cấu trúc thư mục chi tiết:** Xem tại [docs/project_structure.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/project_structure.md).  
> 🎨 **Quy chuẩn Theme UI/UX chi tiết:** Xem tại [docs/theme_specification.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/theme_specification.md) (Modern SaaS, MUI v5, màu chủ đạo #2563EB, Roboto, Light/Dark Mode).

------------------------------------------------------------------------

## 2. Vai trò và quyền hạn

### Admin

-   Quản lý tài khoản và phân quyền.
-   Duyệt, từ chối hoặc tạm ẩn sự kiện theo quy định của hệ thống.
-   Khóa tài khoản có dấu hiệu lạm dụng; xem lịch sử hoạt động và báo
    cáo.
-   Theo dõi giao dịch, sự kiện, vé phát hành, vé đã bán và trạng thái
    check-in.
-   Xử lý khiếu nại theo quy trình; mọi thao tác quản trị cần ghi audit
    log.
-   Cấu hình các tham số hệ thống không được phép tùy tiện sửa quy tắc
    on-chain đã triển khai.

### Người tổ chức sự kiện (Organizer)

-   Tạo và cập nhật hồ sơ sự kiện: tên, mô tả, địa điểm, thời gian, ảnh,
    chính sách.
-   Thiết lập loại vé, giá phát hành, số lượng tối đa và thời điểm
    mở/đóng bán.
-   Gửi sự kiện để Admin duyệt nếu áp dụng quy trình kiểm duyệt.
-   Theo dõi số vé đã phát hành, đã bán, còn lại, chuyển nhượng và
    check-in.
-   Quản lý danh sách người tham dự và quét QR tại cổng.
-   Yêu cầu hủy sự kiện/hoàn tiền theo chính sách được công bố.
-   Xem báo cáo doanh thu và lịch sử giao dịch.

### Khách hàng (Customer)

-   Đăng ký/đăng nhập, cập nhật hồ sơ và kết nối MetaMask.
-   Tìm kiếm, lọc và xem chi tiết sự kiện.
-   Mua vé bằng quy trình thanh toán được hỗ trợ; xác nhận giao dịch và
    nhận NFT.
-   Xem vé đang sở hữu, lịch sử mua và lịch sử chuyển nhượng.
-   Chuyển nhượng/bán lại vé trong giới hạn giá quy định.
-   Hiển thị QR vé và xem trạng thái vé: hợp lệ, đã chuyển nhượng, đã
    check-in, đã hủy.
-   Gửi yêu cầu hỗ trợ hoặc khiếu nại.

------------------------------------------------------------------------

## 3. Quy tắc nghiệp vụ cốt lõi

1.  **Giới hạn phát hành:** mỗi sự kiện/loại vé có `maxSupply`; tổng số
    vé phát hành không được vượt giới hạn này. Smart Contract phải kiểm
    tra giới hạn, không chỉ dựa vào frontend/backend.
2.  **Giá bán ban đầu:** Organizer thiết lập giá và số lượng trước khi
    mở bán. Thay đổi giá sau khi bán cần tuân thủ chính sách công khai
    và không làm thay đổi giao dịch đã hoàn tất.
3.  **Giới hạn giá chuyển nhượng:** giá bán lại tối đa bằng **120% giá
    phát hành ban đầu của chính loại vé đó**. Ví dụ vé phát hành 100.000
    đồng thì giá bán lại tối đa 120.000 đồng, chưa tính phí nếu hệ thống
    có quy định phí riêng. Hãy thống nhất đơn vị tiền tệ và cách quy đổi
    nếu thanh toán bằng token.
4.  **Áp dụng giới hạn ở Smart Contract:** mọi lệnh list/bán/chuyển
    nhượng có thu tiền phải bị từ chối nếu giá vượt mức 120%. Không chỉ
    kiểm tra ở giao diện hoặc API.
5.  **Lưu giá gốc bất biến:** lưu `originalPrice` trong dữ liệu on-chain
    của loại vé hoặc cấu trúc tương đương để không thể sửa giá gốc nhằm
    lách giới hạn.
6.  **Chuyển nhượng:** vé chỉ được chuyển nhượng nếu sự kiện chưa kết
    thúc, vé chưa check-in/chưa bị hủy và chính sách cho phép. Có thể
    giới hạn số lần chuyển nhượng nếu cần.
7.  **Chống bán trùng:** Smart Contract phải kiểm soát trạng thái vé và
    giao dịch; backend cần xử lý idempotency và xác nhận giao dịch trước
    khi cập nhật trạng thái nghiệp vụ.
8.  **QR chống tái sử dụng:** QR không nên chỉ chứa `tokenId` hoặc địa
    chỉ ví. Khi check-in, backend/contract phải kiểm tra vé còn hợp lệ
    và đánh dấu đã sử dụng một cách nguyên tử; lần quét sau phải bị từ
    chối.
9.  **Hoàn tiền/hủy sự kiện:** xác định rõ ai có quyền kích hoạt, điều
    kiện, thời hạn, nguồn tiền hoàn và xử lý khi vé đã chuyển nhượng.
    Nên đưa vào MVP ở mức đơn giản hoặc để giai đoạn mở rộng.
10. **Phân định dữ liệu:** blockchain lưu quyền sở hữu, giới hạn phát
    hành, giá gốc, trạng thái giao dịch và check-in cần thiết; MongoDB
    lưu mô tả sự kiện, hồ sơ người dùng, ảnh, tìm kiếm, báo cáo và dữ
    liệu phục vụ giao diện.

### Lựa chọn thanh toán cần chốt sớm

Vì dự án dùng MetaMask và Sepolia, bản demo nên dùng **ETH testnet**
hoặc một token thử nghiệm được triển khai trên Sepolia. Nếu muốn hiển
thị giá bằng VND, phải quy định rõ tỷ giá/quy đổi; không nên giả định số
tiền VND có thể gửi trực tiếp vào Smart Contract. Không sử dụng tiền
thật trong môi trường testnet.

------------------------------------------------------------------------

# 4. Roadmap Backend

## BE-01. Khởi tạo dự án và cấu trúc mã nguồn

-   Tạo backend Node.js + Express + TypeScript.
-   Cấu hình scripts `dev`, `build`, `start`, `test`, lint và format.
-   Tổ chức thư mục theo lớp: `routes`, `controllers`, `services`,
    `models`, `middlewares`, `validators`, `config`, `utils`, `jobs`,
    `tests`.
-   Thiết lập biến môi trường bằng `.env`; cung cấp `.env.example` không
    chứa bí mật.
-   Hoàn thành khi server chạy được, có endpoint health-check và không
    commit secret lên Git.

## BE-02. Kết nối MongoDB Atlas và thiết kế dữ liệu

-   Thiết lập cụm MongoDB Atlas (Cluster M0/M10), cấu hình Network Access (IP Whitelist/0.0.0.0/0 cho test) và Database User.
-   Kết nối an toàn qua Mongoose bằng biến môi trường `MONGODB_URI` trong `.env`.
-   Tạo Mongoose models tối thiểu:
    -   `User`: tên hiển thị, email, mật khẩu đã hash nếu dùng đăng nhập mật khẩu, role (`admin`, `organizer`, `customer`), trạng thái tài khoản, wallet address đã liên kết, nonce dùng một lần.
    -   `Event`: organizerId, thông tin sự kiện, địa điểm, thời gian, ảnh banner, trạng thái duyệt (`draft`, `pending`, `approved`, `rejected`), trạng thái bán vé, địa chỉ contract/chain nếu có.
    -   `TicketType`: eventId, tên loại vé, originalPrice, maxSupply, currentSupply, saleStart, saleEnd và các trường đồng bộ từ blockchain.
    -   `Ticket`: tokenId, eventId, ticketTypeId, owner wallet, transaction hash, trạng thái đồng bộ, check-in status; dữ liệu quyền sở hữu phải được đối chiếu với chain.
    -   `Order` / `Transaction`: buyer, event, loại vé, số lượng, giá, trạng thái, chainId, transaction hash, idempotency key.
    -   `ResaleListing`: tokenId, seller, giá chào bán (giới hạn <= 120% originalPrice), trạng thái và transaction hash; trạng thái on-chain là nguồn xác thực cho listing.
    -   `CheckInLog`: tokenId, eventId, thời điểm, nhân viên/quầy check-in, kết quả và mã yêu cầu.
    -   `AuditLog` và `SupportTicket` nếu có.
-   Thiết lập index trên MongoDB Atlas cho email, wallet address, eventId, tokenId, thời gian và các trường tìm kiếm text. Không lưu dữ liệu nhạy cảm hoặc private key.

## BE-03. Xác thực, phân quyền và bảo mật API

-   Xây dựng đăng ký/đăng nhập và hash mật khẩu bằng thư viện phù hợp.
-   Dùng access token an toàn; xác định chính sách hết hạn, refresh và
    đăng xuất.
-   Middleware xác thực và RBAC cho `admin`, `organizer`, `customer`.
-   Liên kết ví bằng nonce dùng một lần và chữ ký ví; backend xác minh
    chữ ký để chứng minh quyền kiểm soát ví.
-   Kiểm tra quyền sở hữu tài nguyên: Organizer chỉ được sửa sự kiện của
    mình; Customer không được xem dữ liệu riêng của người khác.
-   Thêm rate limit, CORS, Helmet, kiểm tra input, giới hạn upload và xử
    lý lỗi thống nhất.
-   Hoàn thành khi các route nhạy cảm có test cho cả trường hợp được
    phép và bị từ chối.

## BE-04. API sự kiện và quy trình duyệt

-   Organizer tạo, cập nhật, gửi duyệt và xem sự kiện của mình.
-   Public API liệt kê sự kiện đã được công khai, hỗ trợ phân trang, tìm
    kiếm, lọc theo ngày/địa điểm/danh mục.
-   Admin duyệt, từ chối, ẩn hoặc khóa sự kiện; lưu lý do và audit log.
-   Xác thực thời gian, dữ liệu bắt buộc và quy tắc không sửa trường
    quan trọng sau khi mở bán nếu không có quy trình phù hợp.
-   Hoàn thành khi trạng thái sự kiện chuyển đúng luồng:
    `draft -> pending -> approved/rejected -> published -> ended/cancelled`.

## BE-05. API loại vé và quản lý nguồn cung

-   Organizer tạo loại vé, giá phát hành, số lượng và thời gian mở bán.
-   Kiểm tra dữ liệu ở backend, đồng thời gọi Smart Contract để thực thi
    giới hạn thực tế.
-   Đồng bộ số lượng đã mint/đã bán/còn lại từ chain hoặc sự kiện
    contract.
-   Ngăn tạo đơn vượt số vé còn lại; thiết kế xử lý tranh chấp khi nhiều
    khách mua cùng lúc.
-   Hoàn thành khi không thể vượt `maxSupply` kể cả khi gửi request trực
    tiếp ngoài giao diện.

## BE-06. Tích hợp Smart Contract và blockchain

-   Cấu hình ethers.js provider, chainId, contract address và ABI qua
    biến môi trường.
-   Tạo service đọc dữ liệu on-chain: thông tin sự kiện/vé,
    `ownerOf(tokenId)`, trạng thái check-in và giao dịch.
-   Tạo API hỗ trợ frontend chuẩn bị giao dịch, nhưng giao dịch cần
    người dùng ký bằng MetaMask khi phù hợp.
-   Xác minh receipt, trạng thái giao dịch, chainId, contract address,
    event logs và confirmations theo chính sách.
-   Xử lý pending, failed, replaced và dropped transactions; không đánh
    dấu thành công chỉ vì frontend gửi hash.
-   Có cơ chế đồng bộ lại khi webhook/job bị bỏ lỡ; không tin dữ liệu
    blockchain do client tự gửi mà chưa xác minh.
-   Hoàn thành khi backend có thể xác nhận một giao dịch mua vé hợp lệ
    từ Sepolia và đồng bộ vào MongoDB.

## BE-07. API đơn hàng và mua vé

-   Tạo đơn hoặc intent mua vé với số lượng, loại vé và giá được tính từ
    nguồn đáng tin cậy.
-   Frontend thực hiện giao dịch bằng MetaMask; backend nhận transaction
    hash và tự xác minh receipt.
-   Xác nhận sự kiện contract phù hợp, người mua, tokenId/số lượng, giá
    và trạng thái.
-   Dùng idempotency key và unique index để tránh tạo vé/đơn trùng khi
    client gửi lại request.
-   Cung cấp API truy vấn trạng thái đơn: `pending`, `confirmed`,
    `failed`, `cancelled`.
-   Hoàn thành khi giao dịch thành công tạo bản ghi vé đúng, giao dịch
    thất bại không cấp vé.

## BE-08. Marketplace chuyển nhượng vé

-   API lấy danh sách vé được phép bán lại và chi tiết listing.
-   Tạo listing, hủy listing và mua lại theo quy trình được Smart
    Contract hỗ trợ.
-   Kiểm tra vé chưa check-in, chưa hủy, chưa kết thúc sự kiện và người
    bán đang sở hữu vé.
-   Kiểm tra giá bán lại không vượt `originalPrice * 1.2` ở Smart
    Contract; backend chỉ là lớp kiểm tra bổ sung.
-   Cập nhật owner và lịch sử sau khi transaction được xác nhận; không
    dựa riêng vào MongoDB.
-   Hoàn thành khi thử nghiệm giá bằng 120% được chấp nhận và giá cao
    hơn 120% bị contract từ chối.

## BE-09. QR và check-in

-   Sinh mã QR chứa token ngẫu nhiên khó đoán hoặc token ký số, có thời
    hạn/nonce nếu phù hợp.
-   Endpoint xác minh QR kiểm tra sự kiện, quyền sở hữu hiện tại, trạng
    thái vé, thời gian và trạng thái đã dùng.
-   Chỉ cho phép một lần check-in thành công; xử lý hai yêu cầu quét
    đồng thời.
-   Ghi log kết quả thành công/thất bại và lý do; không đưa email, số
    điện thoại hoặc dữ liệu cá nhân vào QR.
-   Quyết định rõ việc đánh dấu check-in trên chain hay backend. Nếu cần
    chứng minh on-chain, triển khai hàm contract tương ứng và cân nhắc
    phí gas.
-   Hoàn thành khi QR giả, vé đã chuyển nhượng, vé đã dùng hoặc vé không
    hợp lệ đều bị từ chối.

## BE-10. Dashboard, báo cáo và nhật ký

-   Organizer: tổng vé phát hành, đã bán, còn lại, doanh thu, vé chuyển
    nhượng, check-in.
-   Admin: số người dùng, sự kiện theo trạng thái, giao dịch lỗi, hoạt
    động đáng ngờ.
-   Tổng hợp dữ liệu từ MongoDB và blockchain; ghi rõ dữ liệu nào là ước
    tính/chưa xác nhận.
-   Lưu audit log cho thao tác duyệt sự kiện, khóa tài khoản và xử lý
    khiếu nại.

## BE-11. Kiểm thử, tài liệu API và triển khai

-   Viết unit/integration tests cho auth, RBAC, sự kiện, đơn hàng,
    marketplace và check-in.
-   Viết test Smart Contract cho giới hạn cung, quyền organizer, thanh
    toán, chuyển nhượng 120%, check-in và hoàn tiền (nếu có).
-   Tạo tài liệu OpenAPI/Swagger cho REST API.
-   Cấu hình logging, health check, xử lý lỗi và kiểm tra cấu hình môi
    trường.
-   Triển khai backend và MongoDB; giữ private key triển khai contract
    trong ví/secret quản lý riêng, không đặt trong repo.
-   Hoàn thành khi có hướng dẫn chạy local, deploy testnet và bộ test có
    thể chạy lặp lại.

------------------------------------------------------------------------

# 5. Roadmap Frontend

## FE-01. Khởi tạo React (JavaScript) và Quy chuẩn Theme UI/UX

-   Tạo React + JavaScript + Vite (sử dụng `.jsx` và `.js`, **không** sử dụng TypeScript để giữ code đơn giản, linh hoạt và đẩy nhanh tiến độ hoàn thiện UI).
-   Cài đặt Material UI (MUI v5), Emotion, React Router DOM, Axios hoặc TanStack Query, html5-qrcode.
-   Tổ chức cấu trúc thư mục rõ ràng: `pages`, `components`, `layouts`, `context`, `theme`, `services`, `hooks`, `constants`, `utils`.
-   **Quy chuẩn Theme UI/UX hệ thống (Modern SaaS):**
    -   *Phong cách:* Hiện đại, tối giản, thân thiện với người dùng phổ thông (đơn giản hóa hiển thị ví blockchain, mã NFT).
    -   *Màu thương hiệu chính:* Xanh dương `#2563EB` (Blue 600) cho các hành động cốt lõi (mua vé, tạo sự kiện, kết nối ví, xác nhận).
    -   *Hỗ trợ 2 chế độ:* Light Mode (mặc định, nền `#F8FAFC`, bề mặt thẻ/modal `#FFFFFF`, chữ tối `#0F172A`) & Dark Mode (nền `#0B0F19`, bề mặt `#1E293B`, chữ sáng `#F8FAFC`, màu xanh điều chỉnh `#3B82F6`).
    -   *Cơ chế chuyển đổi:* Thủ công bằng nút toggle trên Navbar/Menu, lưu trạng thái vào `localStorage`, không tự chuyển theo OS.
    -   *Typography:* Toàn bộ hệ thống dùng font **Roboto**, phân cấp rõ ràng (`h1`-`h4`, `body1`-`2`, `button` không viết hoa toàn bộ). Địa chỉ ví và mã băm dùng font monospace rút gọn `0x12..78` kèm nút copy và link Etherscan.
    -   *Bố cục & Bo góc:* Lưới khoảng cách base grid 8px (8, 16, 24, 32px); bán kính bo góc 8–12px; shadow nhẹ nhàng (elevation 1–3).
    -   *Quy chuẩn Component:* Đồng bộ cấu hình MUI cho `Button` (Contained/Outlined), `TextField` (border focus #2563EB), `Card`, `Dialog`, `Table`, `Chip`.
    -   *Trạng thái nghiệp vụ:* Màu riêng biệt cho Thành công (`#10B981`), Chờ xử lý (`#F59E0B`), Chờ Blockchain on-chain (`#6366F1`), Thất bại (`#EF4444`), Cảnh báo (`#F97316`), Đã check-in (`#8B5CF6`), Đã hủy (`#64748B`), luôn đi kèm icon/nhãn chữ.
    -   *Nguyên tắc phát triển bắt buộc:* **Không hard-code mã HEX rải rác trong JSX/CSS**, toàn bộ thành viên kế thừa theme tập trung tại `frontend/src/theme/`.
    -   *Chi tiết đặc tả:* Xem tài liệu đầy đủ tại [docs/theme_specification.md](file:///d:/MyFloder/Blockchain/BlockTickets/docs/theme_specification.md).
-   Tạo route guard (`ProtectedRoute.jsx`) theo trạng thái đăng nhập và role (`admin`, `organizer`, `customer`); đây là trải nghiệm điều hướng giao diện, backend vẫn phải kiểm tra quyền.

## FE-02. Xác thực và kết nối ví

-   Giao diện đăng ký, đăng nhập, đăng xuất và khôi phục trạng thái
    phiên.
-   Giao diện kết nối MetaMask, hiển thị địa chỉ ví rút gọn và mạng đang
    kết nối.
-   Luồng ký nonce để liên kết ví với tài khoản, không yêu cầu người
    dùng nhập private key/seed phrase.
-   Hiển thị cảnh báo nếu đang ở sai network và hướng dẫn chuyển sang
    Sepolia.
-   Hoàn thành khi người dùng có thể đăng nhập, kết nối ví và thấy trạng
    thái ví/mạng chính xác.

## FE-03. Trang khám phá sự kiện

-   Trang chủ hiển thị sự kiện nổi bật và sắp diễn ra.
-   Danh sách sự kiện với tìm kiếm, lọc, phân trang và sắp xếp.
-   Trang chi tiết: nội dung, thời gian, địa điểm, Organizer, chính
    sách, loại vé, giá và số vé còn lại.
-   Hiển thị rõ trạng thái sự kiện và thời gian mở bán; không hiển thị
    nút mua khi sự kiện chưa được phép bán.

## FE-04. Khu vực Organizer

-   Dashboard tổng quan.
-   Form tạo/sửa sự kiện, tải ảnh và xem trước.
-   Màn hình quản lý loại vé: giá phát hành, số lượng tối đa, thời gian
    bán.
-   Màn hình gửi duyệt và theo dõi trạng thái duyệt.
-   Trang quản lý người tham dự, check-in và báo cáo.
-   Hiển thị lỗi từ API/Smart Contract theo cách dễ hiểu; yêu cầu xác
    nhận trước các thao tác quan trọng.

## FE-05. Khu vực Admin

-   Dashboard quản trị.
-   Bảng người dùng, tìm kiếm/lọc, xem trạng thái và khóa/mở khóa theo
    quyền.
-   Hàng đợi sự kiện chờ duyệt; màn hình xem chi tiết, duyệt/từ chối và
    nhập lý do.
-   Màn hình theo dõi đơn hàng/giao dịch, báo cáo lỗi và nhật ký hoạt
    động.
-   Chỉ hiển thị thao tác theo quyền; backend là nơi quyết định cuối
    cùng.

## FE-06. Quy trình mua vé

-   Chọn loại vé và số lượng; hiển thị giá, phí và tổng tiền minh bạch
    trước khi xác nhận.
-   Kiểm tra kết nối ví, đúng network và số dư testnet cần thiết.
-   Gọi API tạo intent/đơn mua; sử dụng MetaMask để người dùng ký và gửi
    giao dịch.
-   Hiển thị trạng thái chờ xác nhận, thành công hoặc thất bại; hỗ trợ
    thử kiểm tra lại trạng thái khi người dùng tải lại trang.
-   Sau khi backend xác nhận giao dịch, hiển thị vé NFT và liên kết tới
    transaction explorer.
-   Không thông báo "mua thành công" chỉ dựa trên transaction hash chưa
    được xác minh.

## FE-07. Ví vé của khách hàng

-   Danh sách vé đang sở hữu, vé đã dùng, vé đã hết hạn/hủy và lịch sử
    giao dịch.
-   Trang chi tiết vé: sự kiện, loại vé, tokenId, trạng thái, ví sở hữu
    và transaction hash.
-   Nút xem/hiển thị QR chỉ khi vé đủ điều kiện.
-   Cảnh báo nếu vé đã được chuyển nhượng hoặc trạng thái chưa đồng bộ.

## FE-08. Giao diện chuyển nhượng/bán lại

-   Hiển thị vé đủ điều kiện để bán lại.
-   Form nhập giá; giao diện tính và hiển thị mức giá tối đa bằng 120%
    giá phát hành.
-   Chặn giá vượt giới hạn ở frontend để hỗ trợ người dùng, nhưng vẫn xử
    lý lỗi từ Smart Contract vì contract mới là nơi thực thi quy tắc.
-   Hiển thị listing, hủy listing, mua vé thứ cấp và lịch sử chuyển
    nhượng.
-   Hiển thị phí giao dịch nếu có và số tiền người mua cần thanh toán
    trước khi ký.

## FE-09. Quét QR và check-in cho Organizer

-   Màn hình quét QR bằng camera thiết bị; có phương án nhập mã thủ công
    khi camera không khả dụng.
-   Hiển thị rõ kết quả: hợp lệ, đã check-in, không tồn tại, sai sự
    kiện, đã chuyển nhượng hoặc đã hủy.
-   Ghi nhận kết quả sau khi backend xác nhận; tránh chỉ dựa vào nội
    dung QR.
-   Hỗ trợ giao diện mobile/tablet tại cổng sự kiện và trạng thái mạng
    yếu.

## FE-10. Dashboard và trải nghiệm hoàn thiện

-   Biểu đồ doanh thu, vé bán theo thời gian, tỷ lệ check-in và số vé
    còn lại.
-   Lịch sử hoạt động, thông báo và trang hỗ trợ/khiếu nại.
-   Responsive cho desktop, tablet và mobile; kiểm tra accessibility cơ
    bản.
-   Bổ sung skeleton loading, error boundary, empty states và thông báo
    giao dịch pending.

## FE-11. Kiểm thử frontend và build

-   Unit tests cho component và logic giá/hiển thị trạng thái.
-   Integration tests cho luồng đăng nhập, tạo sự kiện, mua vé và bán
    lại.
-   Kiểm tra các trạng thái MetaMask: chưa cài, từ chối ký, sai mạng,
    hết gas, giao dịch pending/thất bại.
-   Kiểm tra phân quyền bằng cách thử điều hướng trực tiếp tới route
    không được phép.
-   Hoàn thành khi `npm run build` thành công và các luồng chính hoạt
    động trên trình duyệt mục tiêu.

------------------------------------------------------------------------

# 6. Roadmap Smart Contract và tích hợp (phần bắt buộc của dự án Blockchain)

Dù yêu cầu chia nhiệm vụ frontend/backend, cần có nhánh công việc Smart
Contract riêng vì các quy tắc quan trọng không thể bảo đảm chỉ bằng API.

## SC-01. Chốt thiết kế contract

-   Xác định dữ liệu nào lưu on-chain và dữ liệu nào lưu MongoDB.
-   Xác định ai được tạo sự kiện, mint vé, nhận tiền, hủy listing và
    check-in.
-   Xác định đồng tiền thanh toán, phí nền tảng, chính sách hoàn tiền và
    cách xử lý sự kiện bị hủy.
-   Viết đặc tả trạng thái vé và các event cần phát ra.

## SC-02. Phát triển contract

Có thể chia thành: - `EventTicket.sol`: tạo/cấu hình đợt phát hành, giới
hạn nguồn cung, mint NFT, lưu giá phát hành và trạng thái vé. -
`TicketMarketplace.sol`: listing, mua lại và giới hạn giá bán lại tối đa
120% giá gốc. - Có thể gộp hai contract cho MVP để giảm độ phức tạp,
miễn là phân quyền và kiểm thử rõ ràng. - Dùng OpenZeppelin cho ERC-721
và các tiện ích bảo mật phù hợp. - Kiểm tra quyền truy cập, reentrancy,
thanh toán, xử lý số nguyên và đường đi lỗi.

## SC-03. Kiểm thử và deploy testnet

-   Dùng Hardhat để viết unit tests cho các trường hợp hợp lệ và không
    hợp lệ.
-   Test giới hạn `maxSupply`, quyền Organizer, mua vé, chuyển nhượng,
    mức giá 120%, check-in và hoàn tiền nếu có.
-   Deploy lên Sepolia; lưu contract address, ABI và chainId trong cấu
    hình ứng dụng.
-   Ghi lại transaction hash và hướng dẫn xác minh trên block explorer.
-   Không dùng dữ liệu/khóa ví thật trong repo hoặc bản demo công khai.

------------------------------------------------------------------------

# 7. Gợi ý chức năng mở rộng

Ưu tiên sau khi MVP ổn định: 1. **Danh sách chờ (waitlist):** thông báo
khi có vé được mở bán hoặc listing mới. 2. **Mã giảm giá/vé mời:** mã
khuyến mãi có giới hạn số lượt và thời gian. 3. **Hoàn tiền có điều
kiện:** quy định hạn cuối yêu cầu hoàn tiền, phí và xử lý tiền khi sự
kiện bị hủy. 4. **Chuyển nhượng có kiểm soát:** giới hạn số lần bán lại,
khóa chuyển nhượng trước giờ diễn ra hoặc chỉ cho phép marketplace chính
thức. 5. **Chống bot và mua số lượng lớn:** rate limit, CAPTCHA ở điểm
phù hợp, giới hạn số vé mỗi tài khoản/ví. 6. **Thông báo:** email hoặc
thông báo trong ứng dụng khi mua thành công, sự kiện thay đổi, vé được
chuyển nhượng hoặc sắp diễn ra. 7. **Đánh giá Organizer/sự kiện:** chỉ
cho người tham dự hợp lệ đánh giá sau sự kiện. 8. **Báo cáo bất
thường:** nhiều giao dịch thất bại, hành vi mua hàng loạt, QR bị quét
lặp. 9. **Metadata NFT trên IPFS:** dùng nếu cần metadata phi tập trung;
tránh lưu thông tin cá nhân trên IPFS hoặc blockchain. 10. **Mã QR luân
phiên hoặc token ký số:** tăng khả năng chống chụp màn hình/chia sẻ QR;
cần thiết kế cân bằng với khả năng check-in offline.

------------------------------------------------------------------------

# 8. Thứ tự triển khai đề xuất

  -----------------------------------------------------------------------
  Giai đoạn               Công việc chính         Kết quả cần có
  ----------------------- ----------------------- -----------------------
  1\. Phân tích           Chốt use case, trạng    Tài liệu yêu cầu và sơ
                          thái, chính sách giá,   đồ luồng
                          thanh toán và hoàn tiền 

  2\. Nền tảng            Khởi tạo                Chạy được môi trường
                          frontend/backend,       local
                          MongoDB, cấu hình       
                          Sepolia/Hardhat         

  3\. Smart Contract      NFT, nguồn cung, giá    Contract test pass,
                          gốc, marketplace và     deploy Sepolia
                          test                    

  4\. Tài khoản và sự     Auth, RBAC, tạo sự      Organizer tạo và Admin
  kiện                    kiện, duyệt, loại vé    duyệt được sự kiện

  5\. Mua vé              MetaMask, thanh toán    Customer mua và nhận
                          testnet, xác minh giao  được vé
                          dịch, mint NFT          

  6\. Chuyển nhượng       Listing, mua lại, giới  Bán lại hợp lệ, vượt
                          hạn 120% trong contract mức bị từ chối

  7\. Check-in            QR, xác minh vé, chống  Vé hợp lệ check-in một
                          quét lặp                lần

  8\. Dashboard           Báo cáo, audit log,     Ba vai trò có giao diện
                          thông báo               phù hợp

  9\. Hoàn thiện          Kiểm thử bảo mật, tài   Bản demo có thể trình
                          liệu, deploy demo       bày và đánh giá
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 9. Tiêu chí nghiệm thu MVP

-   [ ] Có đủ ba vai trò Admin, Organizer và Customer; API kiểm tra
    quyền trên server.
-   [ ] Organizer tạo sự kiện và cấu hình số lượng vé tối đa.
-   [ ] Admin duyệt sự kiện trước khi mở bán nếu bật quy trình kiểm
    duyệt.
-   [ ] Customer kết nối MetaMask trên Sepolia và mua vé thử nghiệm.
-   [ ] Vé được mint thành NFT và quyền sở hữu có thể xác minh on-chain.
-   [ ] Không thể phát hành vượt số lượng tối đa.
-   [ ] Vé được phép chuyển nhượng; giá bán lại không vượt 120% giá phát
    hành ban đầu.
-   [ ] Vé đã check-in/hủy/hết hạn không thể bán lại hoặc sử dụng lần
    nữa.
-   [ ] QR được xác minh bởi backend và không thể check-in thành công
    hai lần.
-   [ ] Backend xử lý giao dịch pending/thất bại và tránh tạo đơn/vé
    trùng.
-   [ ] Có lịch sử giao dịch và dashboard cơ bản cho Organizer/Admin.
-   [ ] Có README hướng dẫn cài đặt, cấu hình `.env`, chạy test, deploy
    contract và khởi chạy frontend/backend.

## 10. Quyết định cần chốt trước khi code

1.  Thanh toán bằng ETH testnet hay ERC-20 test token?
2.  Giá hiển thị là ETH, token hay VND quy đổi?
3.  Ai nhận tiền vé ban đầu: Organizer trực tiếp hay contract giữ tiền
    rồi rút?
4.  Có yêu cầu hoàn tiền khi khách tự hủy hoặc khi sự kiện bị hủy không?
5.  Vé có được chuyển nhượng miễn phí ngoài marketplace không, hay mọi
    lần chuyển đều phải qua contract?
6.  Check-in được ghi nhận trên blockchain hay chỉ ở backend?
7.  Admin có bắt buộc duyệt tất cả sự kiện không?

Để hoàn thành MVP đúng trọng tâm, nên ưu tiên: **tạo sự kiện -\> phát
hành giới hạn vé -\> mua vé NFT -\> chuyển nhượng có trần 120% -\> quét
QR/check-in một lần**. Các tính năng như waitlist, đánh giá, mã giảm giá
và phân tích nâng cao nên làm sau.
