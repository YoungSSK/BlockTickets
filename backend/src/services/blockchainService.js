import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import { AppError } from "../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. ABI rút gọn cần thiết cho Backend giao tiếp với EventTicket & TicketMarketplace
const EVENT_TICKET_MINIMAL_ABI = [
  "function getEventInfo(uint256 eventId) external view returns (tuple(uint256 eventId, address organizer, uint256 startTime, uint256 endTime, bool isActive, bool isCancelled, uint256 totalMinted))",
  "function getTicketTier(uint256 tierId) external view returns (tuple(uint256 tierId, uint256 eventId, uint256 originalPrice, uint256 maxSupply, uint256 currentSupply, uint256 saleStartTime, uint256 saleEndTime, bool exists))",
  "function getTicketInfo(uint256 tokenId) external view returns (tuple(uint256 tokenId, uint256 eventId, uint256 tierId, uint256 originalPrice, address originalBuyer, bool isUsed))",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function isResaleAllowed(uint256 tokenId) external view returns (bool)",
  "event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, uint256 indexed tierId, address buyer, uint256 originalPrice)",
  "event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId, address indexed checkedInBy)",
  "event EventCancelled(uint256 indexed eventId)",
];

const MARKETPLACE_MINIMAL_ABI = [
  "function getMaxAllowedPrice(uint256 originalPrice) external pure returns (uint256)",
  "function getListing(uint256 tokenId) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool active))",
  "event TicketListed(uint256 indexed tokenId, uint256 indexed eventId, address indexed seller, uint256 price, uint256 maxAllowedPrice)",
  "event TicketResold(uint256 indexed tokenId, uint256 indexed eventId, address indexed seller, address buyer, uint256 price, uint256 royaltyFee)",
];

// Hàm nạp ABI đầy đủ nếu đã chạy deploy script xuất ra thư mục backend
function loadArtifactAbi(contractName, fallbackAbi) {
  try {
    const artifactPath = path.resolve(
      __dirname,
      `../blockchain/contracts/${contractName}.json`,
    );
    if (fs.existsSync(artifactPath)) {
      const data = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      return data.abi || fallbackAbi;
    }
  } catch {
    // Không tìm thấy file JSON thì fallback về minimal ABI
  }
  return fallbackAbi;
}

// 2. Khởi tạo Provider kết nối Blockchain
export const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  return new ethers.JsonRpcProvider(rpcUrl);
};

// 3. Khởi tạo Contract Instances
export const getEventTicketContract = (customProvider) => {
  const address = process.env.EVENT_TICKET_ADDRESS;
  if (!address || !ethers.isAddress(address)) {
    throw new AppError(
      "Địa chỉ EVENT_TICKET_ADDRESS chưa được cấu hình hoặc không hợp lệ.",
      500,
    );
  }
  const provider = customProvider || getProvider();
  const abi = loadArtifactAbi("EventTicket", EVENT_TICKET_MINIMAL_ABI);
  return new ethers.Contract(address, abi, provider);
};

export const getMarketplaceContract = (customProvider) => {
  const address = process.env.TICKET_MARKETPLACE_ADDRESS;
  if (!address || !ethers.isAddress(address)) {
    throw new AppError(
      "Địa chỉ TICKET_MARKETPLACE_ADDRESS chưa được cấu hình hoặc không hợp lệ.",
      500,
    );
  }
  const provider = customProvider || getProvider();
  const abi = loadArtifactAbi("TicketMarketplace", MARKETPLACE_MINIMAL_ABI);
  return new ethers.Contract(address, abi, provider);
};

// 4. Xác minh sự kiện tồn tại thật trên Smart Contract (Dùng cho BE-04, BE-06)
export const verifyOnChainEvent = async (onChainEventId, expectedOrganizer) => {
  if (process.env.MOCK_BLOCKCHAIN === "true") {
    return { eventId: onChainEventId, isActive: true, isCancelled: false };
  }

  const contract = getEventTicketContract();
  try {
    const eventInfo = await contract.getEventInfo(BigInt(onChainEventId));

    if (eventInfo.isCancelled) {
      throw new AppError("Sự kiện trên Smart Contract đã bị hủy bỏ.", 400);
    }

    if (!eventInfo.isActive) {
      throw new AppError("Sự kiện trên Smart Contract đang không kích hoạt.", 400);
    }

    if (
      expectedOrganizer &&
      eventInfo.organizer.toLowerCase() !== expectedOrganizer.toLowerCase()
    ) {
      throw new AppError(
        `Ví tạo sự kiện on-chain (${eventInfo.organizer}) không khớp với ví Organizer của bạn (${expectedOrganizer}).`,
        403,
      );
    }

    return {
      eventId: Number(eventInfo.eventId),
      organizer: eventInfo.organizer,
      startTime: Number(eventInfo.startTime),
      endTime: Number(eventInfo.endTime),
      isActive: eventInfo.isActive,
      isCancelled: eventInfo.isCancelled,
      totalMinted: Number(eventInfo.totalMinted),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      `Không tìm thấy sự kiện on-chain ID ${onChainEventId} trên Smart Contract: ${error.message}`,
      400,
    );
  }
};

// 5. Xác minh Transaction mua vé và bóc tách danh sách tokenId thật (Dùng cho BE-07)
export const verifyTicketPurchaseTx = async (
  txHash,
  { expectedBuyer, expectedEventId, expectedQuantity },
) => {
  // Nếu ở chế độ mock thì trả về token ID giả lập
  if (process.env.MOCK_BLOCKCHAIN === "true" || !txHash) {
    const fallbackIds = Array.from(
      { length: expectedQuantity || 1 },
      (_, i) => Math.floor(Date.now() / 1000) + i,
    );
    return { success: true, tokenIds: fallbackIds };
  }

  const provider = getProvider();
  const contract = getEventTicketContract(provider);
  const contractAddress = (await contract.getAddress()).toLowerCase();

  // Đọc biên lai giao dịch trên Blockchain
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw new AppError(
      "Giao dịch đang chờ xác nhận (Pending) hoặc không tồn tại trên mạng Sepolia. Vui lòng thử lại sau vài giây.",
      400,
    );
  }

  if (receipt.status !== 1) {
    throw new AppError(
      "Giao dịch trên Smart Contract đã bị hủy bỏ hoặc Revert (status: 0).",
      400,
    );
  }

  // Phân tích Logs để tìm các event TicketMinted
  const mintedTokenIds = [];
  const eventInterface = contract.interface;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === contractAddress) {
      try {
        const parsedLog = eventInterface.parseLog(log);
        if (parsedLog && parsedLog.name === "TicketMinted") {
          const tokenId = Number(parsedLog.args.tokenId);
          const eventId = Number(parsedLog.args.eventId);
          const buyer = parsedLog.args.buyer.toLowerCase();

          if (expectedEventId && eventId !== Number(expectedEventId)) {
            continue;
          }

          if (expectedBuyer && buyer !== expectedBuyer.toLowerCase()) {
            continue;
          }

          mintedTokenIds.push(tokenId);
        }
      } catch {
        // Log không thuộc format của TicketMinted thì bỏ qua
      }
    }
  }

  if (mintedTokenIds.length === 0) {
    throw new AppError(
      "Giao dịch hợp lệ nhưng không tìm thấy sự kiện phát hành vé (TicketMinted) khớp với đơn hàng của bạn.",
      400,
    );
  }

  return {
    success: true,
    tokenIds: mintedTokenIds,
    blockNumber: receipt.blockNumber,
    txHash: receipt.hash,
  };
};