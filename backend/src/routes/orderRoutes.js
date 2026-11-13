import express from "express";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import {
  createOrder,
  verifyOrder,
  getOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", optionalProtect, createOrder);
router.post("/verify-tx", optionalProtect, verifyOrder);
router.post("/:id/verify-tx", optionalProtect, verifyOrder);
router.get("/:id", optionalProtect, getOrder);

export default router;

