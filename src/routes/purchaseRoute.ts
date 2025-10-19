import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { createPurchase } from "../controller/purchaseController.ts";
import purchaseValidation from "../validation/purchaseValidation.ts";

const router = Router();

/**
 * @route   POST /api/purchases
 * @desc    Create a new purchase with hybrid payment (credits + cash)
 * @access  Private
 */
router.post("/", requireAuth(), purchaseValidation, createPurchase);

export default router;
