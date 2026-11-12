import { z } from "zod";
import { ethers } from "ethers";

const walletAddressField = z
  .string({ error: "Vui lòng cung cấp địa chỉ ví Ethereum" })
  .trim()
  .refine((val) => ethers.isAddress(val), "Địa chỉ ví Ethereum không hợp lệ");

const walletSignatureBody = z.object({
  walletAddress: walletAddressField,
  signature: z.string({ error: "Thiếu chữ ký ví" }).trim().min(1, "Thiếu chữ ký ví"),
  nonce: z.string({ error: "Thiếu chuỗi nonce" }).trim().min(1, "Thiếu chuỗi nonce"),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ error: "Vui lòng nhập email" }).trim().toLowerCase().email("Email không hợp lệ"),
    password: z
      .string({ error: "Vui lòng nhập mật khẩu" })
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .max(100, "Mật khẩu tối đa 100 ký tự"),
    fullName: z
      .string({ error: "Vui lòng nhập họ tên" })
      .trim()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(100, "Họ tên tối đa 100 ký tự"),
    role: z.enum(["customer", "organizer"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ error: "Vui lòng nhập email" }).trim().toLowerCase().email("Email không hợp lệ"),
    password: z.string({ error: "Vui lòng nhập mật khẩu" }).min(1, "Vui lòng nhập mật khẩu"),
  }),
});

export const nonceQuerySchema = z.object({
  query: z.object({
    wallet: walletAddressField,
  }),
});

export const verifyWalletSchema = z.object({
  body: walletSignatureBody,
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ error: "Vui lòng cung cấp Refresh Token" })
      .trim()
      .min(1, "Vui lòng cung cấp Refresh Token"),
  }),
});

export const logoutSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().trim().optional(),
    })
    .optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .max(100, "Họ tên tối đa 100 ký tự")
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .url("URL ảnh đại diện không hợp lệ")
      .or(z.literal(""))
      .optional(),
  }),
});

export const linkWalletSchema = z.object({
  body: walletSignatureBody,
});
