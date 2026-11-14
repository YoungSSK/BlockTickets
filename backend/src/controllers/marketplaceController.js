import * as marketplaceService from "../services/marketplaceService.js";

// GET /api/marketplace/listings
export const getListings = async (req, res, next) => {
  try {
    const data = await marketplaceService.listResaleTickets(req.query);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách vé bán lại thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/marketplace/validate-price
export const validatePrice = async (req, res, next) => {
  try {
    const data = marketplaceService.validateResalePrice(req.body);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/marketplace/sync-listing
export const syncListing = async (req, res, next) => {
  try {
    const data = await marketplaceService.syncListing(req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Đồng bộ niêm yết vé lên sàn thứ cấp thành công!",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/marketplace/sync-purchase
export const syncPurchase = async (req, res, next) => {
  try {
    const data = await marketplaceService.syncPurchase(req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Mua lại vé thành công! Vé NFT đã được chuyển quyền sở hữu vào ví của bạn.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/marketplace/cancel-listing/:id
export const cancelListing = async (req, res, next) => {
  try {
    const data = await marketplaceService.cancelListing(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Hủy niêm yết vé khỏi chợ thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

