import crypto from "crypto";
import { Op } from "sequelize";
import {
  sequelize,
  ResaleListing,
  Ticket,
  TicketType,
  Event,
  User,
} from "../models/index.js";
import { AppError } from "../utils/AppError.js";

// 1. Danh sách vé đang rao bán trên Marketplace
export const listResaleTickets = async ({
  page = 1,
  limit = 20,
  category,
  search,
  minPrice,
  maxPrice,
  sort = "newest",
}) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const where = { status: "active" };

  if (minPrice || maxPrice) {
    where.resalePrice = {};
    if (minPrice) where.resalePrice[Op.gte] = Number(minPrice);
    if (maxPrice) where.resalePrice[Op.lte] = Number(maxPrice);
  }

  const eventWhere = {};
  if (category && category !== "all") {
    eventWhere.category = category;
  }
  if (search) {
    eventWhere[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { venueName: { [Op.like]: `%${search}%` } },
      { venueCity: { [Op.like]: `%${search}%` } },
    ];
  }

  let order = [["createdAt", "DESC"]];
  if (sort === "price_asc") order = [["resalePrice", "ASC"]];
  if (sort === "price_desc") order = [["resalePrice", "DESC"]];

  const { rows, count } = await ResaleListing.findAndCountAll({
    where,
    include: [
      {
        model: Event,
        as: "event",
        where: Object.keys(eventWhere).length > 0 ? eventWhere : undefined,
        attributes: [
          "id",
          "title",
          "category",
          "bannerUrl",
          "venueName",
          "venueAddress",
          "venueCity",
          "startTime",
          "endTime",
          "status",
        ],
        include: [
          {
            model: User,
            as: "organizer",
            attributes: ["id", "fullName", "email", "walletAddress"],
          },
        ],
      },
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: TicketType,
            as: "ticketType",
            attributes: ["id", "name", "originalPrice", "currency"],
          },
        ],
      },
    ],
    order,
    limit: parsedLimit,
    offset,
    distinct: true,
  });

  return {
    listings: rows,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      totalItems: count,
      totalPages: Math.ceil(count / parsedLimit),
    },
  };
};

// 2. Kiểm tra trước giá bán lại trần 120% (Anti-Scalping Rule BR-03)
export const validateResalePrice = ({ originalPrice, resalePrice }) => {
  const orig = Number(originalPrice);
  const resale = Number(resalePrice);

  if (isNaN(orig) || orig <= 0) {
    throw new AppError("Giá gốc ban đầu không hợp lệ.", 400);
  }
  if (isNaN(resale) || resale <= 0) {
    throw new AppError("Giá bán lại phải lớn hơn 0 ETH.", 400);
  }

  const maxAllowedPrice = +(orig * 1.2).toFixed(6);
  const isValid = resale <= maxAllowedPrice;
  const percentDiff = +(((resale - orig) / orig) * 100).toFixed(2);

  return {
    isValid,
    originalPrice: orig,
    resalePrice: resale,
    maxAllowedPrice,
    percentDifference: percentDiff,
    message: isValid
      ? `Giá bán lại hợp lệ (${percentDiff > 0 ? `+${percentDiff}%` : `${percentDiff}%`} so với giá gốc).`
      : `Giá bán lại (${resale} ETH) vượt quá trần 120% giá gốc (${maxAllowedPrice} ETH).`,
  };
};

// 3. Đồng bộ sau khi niêm yết vé on-chain thành công
export const syncListing = async (
  { ticketId, resalePrice, txHash },
  user,
) => {
  return sequelize.transaction(async (t) => {
    const ticket = await Ticket.findByPk(ticketId, {
      include: [{ model: Event, as: "event" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ticket) throw new AppError("Không tìm thấy vé NFT.", 404);

    if (ticket.isUsed) {
      throw new AppError("Vé đã qua sử dụng, không thể bán lại.", 400);
    }

    const origPrice = Number(ticket.originalPrice);
    const maxAllowedPrice = +(origPrice * 1.2).toFixed(6);
    const requestedPrice = Number(resalePrice);

    if (requestedPrice <= 0) {
      throw new AppError("Giá bán lại phải lớn hơn 0 ETH.", 400);
    }

    if (requestedPrice > maxAllowedPrice) {
      throw new AppError(
        `Quy tắc BR-03: Giá bán lại (${requestedPrice} ETH) vượt quá trần 120% giá gốc (${maxAllowedPrice} ETH).`,
        400,
      );
    }

    ticket.isListedForResale = true;
    await ticket.save({ transaction: t });

    let listing = await ResaleListing.findOne({
      where: { ticketId: ticket.id },
      transaction: t,
    });

    if (listing) {
      listing.resalePrice = requestedPrice;
      listing.status = "active";
      listing.listingTxHash = txHash || listing.listingTxHash;
      await listing.save({ transaction: t });
    } else {
      listing = await ResaleListing.create(
        {
          ticketId: ticket.id,
          tokenId: ticket.tokenId,
          eventId: ticket.eventId,
          sellerWallet: ticket.ownerWallet,
          originalPrice: origPrice,
          resalePrice: requestedPrice,
          maxAllowedPrice,
          listingTxHash: txHash || `0x${crypto.randomBytes(32).toString("hex")}`,
          status: "active",
        },
        { transaction: t },
      );
    }

    return { listing, ticket };
  });
};

// 4. Đồng bộ sau khi người mua thực hiện mua vé trên Marketplace
export const syncPurchase = async (
  { listingId, buyerWallet, txHash },
  user,
) => {
  return sequelize.transaction(async (t) => {
    const listing = await ResaleListing.findByPk(listingId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!listing) throw new AppError("Không tìm thấy tin rao bán vé.", 404);

    if (listing.status !== "active") {
      throw new AppError("Vé này đã được mua hoặc đã bị hủy niêm yết.", 409);
    }

    const ticket = await Ticket.findByPk(listing.ticketId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ticket) throw new AppError("Không tìm thấy vé NFT tương ứng.", 404);

    const resolvedBuyer = (
      buyerWallet ||
      user?.walletAddress ||
      "0x0000000000000000000000000000000000000000"
    ).toLowerCase();

    // Cập nhật trạng thái listing sang sold
    listing.status = "sold";
    listing.buyerWallet = resolvedBuyer;
    listing.soldTxHash = txHash || `0x${crypto.randomBytes(32).toString("hex")}`;
    listing.soldAt = new Date();
    await listing.save({ transaction: t });

    // Đổi quyền sở hữu vé NFT cho người mua mới
    ticket.ownerWallet = resolvedBuyer;
    ticket.isListedForResale = false;
    ticket.txHash = listing.soldTxHash;
    await ticket.save({ transaction: t });

    return { listing, ticket };
  });
};

// 5. Hủy niêm yết khỏi chợ thứ cấp
export const cancelListing = async (listingId, user) => {
  return sequelize.transaction(async (t) => {
    const listing = await ResaleListing.findByPk(listingId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!listing) throw new AppError("Không tìm thấy tin rao bán vé.", 404);

    const ticket = await Ticket.findByPk(listing.ticketId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    listing.status = "cancelled";
    await listing.save({ transaction: t });

    if (ticket) {
      ticket.isListedForResale = false;
      await ticket.save({ transaction: t });
    }

    return { listing, ticket };
  });
};

