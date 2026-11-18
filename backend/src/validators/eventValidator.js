import { z } from "zod";

const CATEGORIES = ["music", "technology", "sports", "workshop"];
const EVENT_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "published",
  "ended",
  "cancelled",
];

const eventIdParam = z.object({
  id: z.coerce.number().int().positive("ID sự kiện không hợp lệ"),
});

export const eventIdParamSchema = z.object({
  params: eventIdParam,
});

export const listEventsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().trim().optional(),
    category: z.enum(CATEGORIES).optional(),
    city: z.string().trim().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    sort: z.enum(["start_asc", "start_desc", "newest"]).default("start_asc"),
  }),
});

export const myEventsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    status: z.enum(EVENT_STATUSES).optional(),
  }),
});

export const createEventSchema = z.object({
  body: z
    .object({
      title: z.string({ error: "Thiếu tên sự kiện" }).trim().min(5).max(255),
      description: z.string({ error: "Thiếu mô tả sự kiện" }).trim().min(20),
      category: z.enum(CATEGORIES, { error: "Danh mục không hợp lệ" }),
      bannerUrl: z
        .string({ error: "Thiếu URL banner" })
        .trim()
        .url("URL banner không hợp lệ"),
      venueName: z
        .string({ error: "Thiếu tên địa điểm" })
        .trim()
        .min(2)
        .max(255),
      venueAddress: z.string({ error: "Thiếu địa chỉ" }).trim().min(5).max(500),
      venueCity: z.string({ error: "Thiếu thành phố" }).trim().min(2).max(100),
      startTime: z.coerce.date({ error: "Thời gian bắt đầu không hợp lệ" }),
      endTime: z.coerce.date({ error: "Thời gian kết thúc không hợp lệ" }),
      saleStartTime: z.coerce.date().optional(),
      saleEndTime: z.coerce.date().optional(),
      ticketTypes: z.array(z.any()).optional(),
      checkInGates: z.array(z.string()).optional(),
      seatingMap: z.any().optional(),
    })
    .refine((data) => data.endTime > data.startTime, {
      message: "Thời gian kết thúc sự kiện phải sau thời gian bắt đầu",
      path: ["endTime"],
    })
    .refine((data) => {
      if (data.saleStartTime && data.saleEndTime) {
        return data.saleEndTime > data.saleStartTime;
      }
      return true;
    }, {
      message: "Thời gian kết thúc bán vé phải sau thời gian bắt đầu mở bán",
      path: ["saleEndTime"],
    })
    .refine((data) => {
      if (data.saleEndTime && data.startTime) {
        return data.saleEndTime <= data.startTime;
      }
      return true;
    }, {
      message: "Thời gian kết thúc bán vé phải trước hoặc bằng thời gian sự kiện bắt đầu",
      path: ["saleEndTime"],
    }),
});

export const updateEventSchema = z.object({
  params: eventIdParam,
  body: z
    .object({
      title: z.string().trim().min(5).max(255).optional(),
      description: z.string().trim().min(20).optional(),
      category: z.enum(CATEGORIES).optional(),
      bannerUrl: z.string().trim().url("URL banner không hợp lệ").optional(),
      venueName: z.string().trim().min(2).max(255).optional(),
      venueAddress: z.string().trim().min(5).max(500).optional(),
      venueCity: z.string().trim().min(2).max(100).optional(),
      startTime: z.coerce.date().optional(),
      endTime: z.coerce.date().optional(),
      saleStartTime: z.coerce.date().optional(),
      saleEndTime: z.coerce.date().optional(),
      checkInGates: z.array(z.string()).optional(),
      seatingMap: z.any().optional(),
      ticketTypes: z.array(z.any()).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Cần ít nhất một trường để cập nhật",
    }),
});

export const updateTicketTypeSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Mã sự kiện không hợp lệ"),
    ticketTypeId: z.coerce.number().int().positive("Mã hạng vé không hợp lệ"),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().optional(),
      originalPrice: z.coerce
        .number()
        .positive("Giá vé phải lớn hơn 0 ETH")
        .optional(),
      currency: z.string().trim().max(10).optional(),
      maxSupply: z.coerce.number().int().min(1).optional(),
      entryGate: z.string().trim().max(100).optional(),
      tierType: z.enum(["vip", "standard"]).optional(),
      seatZone: z.string().trim().max(100).optional(),
      seatRow: z.string().trim().max(100).optional(),
      seatStart: z.coerce.number().int().min(1).optional(),
      seatEnd: z.coerce.number().int().min(1).optional(),
      seatConfig: z.any().optional(),
      saleStartTime: z.coerce.date().optional(),
      saleEndTime: z.coerce.date().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "Cần ít nhất một trường để cập nhật hạng vé",
    }),
});

export const createTicketTypeSchema = z.object({
  params: eventIdParam,
  body: z
    .object({
      name: z.string({ error: "Thiếu tên hạng vé" }).trim().min(2).max(100),
      description: z.string().trim().optional(),
      originalPrice: z.coerce
        .number({ error: "Giá gốc không hợp lệ" })
        .positive("Giá vé phải lớn hơn 0 ETH"),
      currency: z.string().trim().max(10).default("ETH"),
      maxSupply: z.coerce
        .number({ error: "Số lượng tối đa không hợp lệ" })
        .int("maxSupply phải là số nguyên")
        .min(1, "Số lượng vé tối thiểu là 1"),
      entryGate: z.string().trim().max(100).optional().default("Cổng A - Khán Đài Phổ Thông Tầng 1"),
      tierType: z.enum(["vip", "standard"]).optional().default("standard"),
      seatZone: z.string().trim().max(100).optional(),
      seatRow: z.string().trim().max(100).optional(),
      seatStart: z.coerce.number().int().min(1).optional().default(1),
      seatEnd: z.coerce.number().int().min(1).optional(),
      seatConfig: z.any().optional(),
      saleStartTime: z.coerce.date({ error: "Thời điểm mở bán không hợp lệ" }).optional(),
      saleEndTime: z.coerce.date({ error: "Thời điểm đóng bán không hợp lệ" }).optional(),
    })
    .refine((data) => {
      if (data.saleStartTime && data.saleEndTime) {
        return data.saleEndTime > data.saleStartTime;
      }
      return true;
    }, {
      message: "Thời điểm đóng bán phải sau thời điểm mở bán",
      path: ["saleEndTime"],
    }),
});

export const publishEventSchema = z.object({
  params: eventIdParam,
  body: z
    .object({
      onChainEventId: z.coerce.number().int().positive().optional(),
      tierMappings: z
        .array(
          z.object({
            ticketTypeId: z.coerce.number().int().positive(),
            onChainTierId: z.coerce.number().int().positive(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export const rejectEventSchema = z.object({
  params: eventIdParam,
  body: z.object({
    reason: z
      .string({ error: "Vui lòng nhập lý do từ chối" })
      .trim()
      .min(5, "Lý do từ chối tối thiểu 5 ký tự"),
  }),
});

export const adminHideEventSchema = z.object({
  params: eventIdParam,
  body: z.object({
    reason: z
      .string({ error: "Vui lòng nhập lý do tạm ẩn/hủy sự kiện" })
      .trim()
      .min(5, "Lý do tối thiểu 5 ký tự"),
  }),
});
