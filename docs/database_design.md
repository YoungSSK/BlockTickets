# THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN - MONGODB ATLAS)

> **Cơ sở dữ liệu:** MongoDB Atlas (Cloud Cluster)  
> **Thư viện kết nối:** Mongoose ODM (Node.js)  
> **Nguyên tắc:** MongoDB Atlas lưu trữ dữ liệu nghiệp vụ, tìm kiếm nhanh và lịch sử hiển thị giao diện. Quyền sở hữu vé, giới hạn nguồn cung và trần giá 120% được bảo vệ bất biến trên Blockchain Ethereum Sepolia.

---

## 1. MỐI QUAN HỆ VÀ KIẾN TRÚC LƯU TRỮ

```text
+-------------------+            1:N           +---------------------+
|      User         | -----------------------> |       Event         |
| (Admin/Org/Cust)  |                          | (Draft/Approved/...) |
+-------------------+                          +---------------------+
          |                                               | 1:N
          | 1:N                                           v
          |                                    +---------------------+
          |                                    |     TicketType      |
          |                                    | (VIP, maxSupply...) |
          |                                    +---------------------+
          v                                               | 1:N
+-------------------+                                     v
|      Order        | -----------------------> +---------------------+
| (buyer, txHash)   |            1:N           |       Ticket        |
+-------------------+                          | (tokenId, owner...) |
                                               +---------------------+
                                                 | 1:1          | 1:N
                                                 v              v
                                      +------------------+  +------------------+
                                      |  ResaleListing   |  |   CheckInLog     |
                                      | (price <= 120%)  |  | (scannedAt...)   |
                                      +------------------+  +------------------+
```

---

## 2. CHI TIẾT CÁC COLLECTIONS & SCHEMAS

### 2.1. Collection: `users`
Lưu trữ thông tin người dùng và liên kết địa chỉ ví blockchain.

```javascript
{
  _id: ObjectId,
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: false }, // Cho đăng nhập truyền thống
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'organizer', 'customer'], default: 'customer', index: true },
  walletAddress: { type: String, lowercase: true, unique: true, sparse: true, index: true },
  nonce: { type: String, default: null }, // Chuỗi ngẫu nhiên phục vụ ký ví xác thực (Sign-In with Ethereum)
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  avatarUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 2.2. Collection: `events`
Lưu trữ thông tin sự kiện do Organizer khởi tạo.

```javascript
{
  _id: ObjectId,
  organizerId: { type: ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, index: 'text' },
  description: { type: String, required: true },
  category: { type: String, enum: ['music', 'technology', 'sports', 'workshop'], required: true },
  bannerUrl: { type: String, required: true },
  venue: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true }
  },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'approved', 'rejected', 'published', 'ended', 'cancelled'], 
    default: 'draft',
    index: true 
  },
  rejectionReason: { type: String, default: '' },
  onChainEventId: { type: Number, default: null }, // ID sự kiện trên Smart Contract nếu có
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 2.3. Collection: `ticket_types`
Lưu trữ các hạng vé thuộc về một sự kiện.

```javascript
{
  _id: ObjectId,
  eventId: { type: ObjectId, ref: 'Event', required: true, index: true },
  name: { type: String, required: true }, // Ví dụ: "Standard", "VIP", "Early Bird"
  description: { type: String, default: '' },
  originalPrice: { type: Number, required: true }, // Giá gốc phát hành (đơn vị: ETH hoặc WEI)
  currency: { type: String, default: 'ETH' },
  maxSupply: { type: Number, required: true }, // Giới hạn số lượng vé phát hành tối đa
  currentSupply: { type: Number, default: 0 }, // Số lượng vé đã được mint
  saleStartTime: { type: Date, required: true },
  saleEndTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### 2.4. Collection: `tickets`
Bản ghi vé NFT sau khi giao dịch mua trên blockchain được xác thực thành công.

```javascript
{
  _id: ObjectId,
  tokenId: { type: Number, required: true, unique: true, index: true }, // Token ID ERC-721 on-chain
  eventId: { type: ObjectId, ref: 'Event', required: true, index: true },
  ticketTypeId: { type: ObjectId, ref: 'TicketType', required: true },
  ownerWallet: { type: String, lowercase: true, required: true, index: true }, // Ví hiện đang sở hữu vé
  originalBuyerWallet: { type: String, lowercase: true, required: true },
  originalPrice: { type: Number, required: true }, // Giá ban đầu để đối soát trần giá 120%
  txHash: { type: String, required: true, unique: true }, // Transaction Hash mint vé trên Sepolia
  isUsed: { type: Boolean, default: false, index: true }, // Trạng thái đã check-in hay chưa
  usedAt: { type: Date, default: null },
  isListedForResale: { type: Boolean, default: false, index: true }, // Có đang được rao bán trên chợ không
  createdAt: { type: Date, default: Date.now }
}
```

### 2.5. Collection: `orders`
Quản lý lịch sử đặt mua vé và trạng thái xác minh giao dịch với blockchain.

```javascript
{
  _id: ObjectId,
  buyerWallet: { type: String, lowercase: true, required: true, index: true },
  eventId: { type: ObjectId, ref: 'Event', required: true },
  ticketTypeId: { type: ObjectId, ref: 'TicketType', required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'ETH' },
  txHash: { type: String, sparse: true, index: true }, // Hash giao dịch do MetaMask gửi
  status: { 
    type: String, 
    enum: ['pending_payment', 'verifying', 'confirmed', 'failed', 'cancelled'], 
    default: 'pending_payment',
    index: true 
  },
  idempotencyKey: { type: String, unique: true, required: true }, // Chống tạo đơn trùng khi gửi request lặp
  createdAt: { type: Date, default: Date.now }
}
```

### 2.6. Collection: `resale_listings`
Thông tin vé đang được niêm yết bán lại trên thị trường thứ cấp.

```javascript
{
  _id: ObjectId,
  tokenId: { type: Number, required: true, index: true },
  ticketId: { type: ObjectId, ref: 'Ticket', required: true },
  eventId: { type: ObjectId, ref: 'Event', required: true },
  sellerWallet: { type: String, lowercase: true, required: true, index: true },
  originalPrice: { type: Number, required: true },
  resalePrice: { type: Number, required: true }, // BẮT BUỘC <= originalPrice * 1.2
  maxAllowedPrice: { type: Number, required: true }, // originalPrice * 1.2
  listingTxHash: { type: String, default: '' },
  buyerWallet: { type: String, lowercase: true, default: null },
  soldTxHash: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['active', 'sold', 'cancelled'], 
    default: 'active',
    index: true 
  },
  createdAt: { type: Date, default: Date.now },
  soldAt: { type: Date, default: null }
}
```

### 2.7. Collection: `check_in_logs`
Nhật ký quét mã QR soát vé tại cửa sự kiện.

```javascript
{
  _id: ObjectId,
  tokenId: { type: Number, required: true, index: true },
  eventId: { type: ObjectId, ref: 'Event', required: true, index: true },
  scannedBy: { type: ObjectId, ref: 'User', required: true }, // Nhân viên soát vé
  status: { 
    type: String, 
    enum: ['success', 'already_used', 'invalid_ticket', 'wrong_event', 'invalid_signature'], 
    required: true 
  },
  qrNonce: { type: String, required: true },
  scannedAt: { type: Date, default: Date.now, index: true }
}
```

### 2.8. Collection: `audit_logs`
Lưu vết các hành động quản trị nhạy cảm.

```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true }, // Vd: "APPROVE_EVENT", "REJECT_EVENT", "SUSPEND_USER"
  targetId: { type: String, required: true },
  ipAddress: { type: String, default: '' },
  details: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 3. CHIẾN LƯỢC TỐI ƯU HÓA TRÊN MONGODB ATLAS

1. **Compound Indexes (Chỉ mục kết hợp):**
   - `tickets`: `{ eventId: 1, ownerWallet: 1 }` -> Tối ưu tốc độ lấy vé của user trong sự kiện.
   - `events`: `{ status: 1, startTime: 1 }` -> Tối ưu hiển thị sự kiện công khai trên trang chủ.
   - `resale_listings`: `{ status: 1, eventId: 1 }` -> Tối ưu tìm kiếm vé đang rao bán.
2. **Atomic Updates (Cập nhật nguyên tử):**
   - Sử dụng `findOneAndUpdate` với điều kiện `{ tokenId: id, isUsed: false }` khi check-in để đảm bảo không thể xảy ra race-condition khi 2 máy quét mã cùng lúc.
3. **Atlas Security & Whitelisting:**
   - Cấu hình Network Access trên MongoDB Atlas chỉ cho phép IP của máy chủ backend truy cập (hoặc `0.0.0.0/0` kèm username/password phức tạp trong giai đoạn demo/test).
