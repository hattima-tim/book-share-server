import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { UserModel } from "../models/userSchema.ts";
import {
  createPurchaseWithHybridPayment,
  CREDIT_VALUE,
} from "../services/purchaseService.ts";

/**
 * Create a new purchase
 * @route POST /api/purchases
 */
export const createPurchase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const { productId, productName, amount } = req.body;

    if (!productId || !productName || amount === undefined) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
        code: "INVALID_AMOUNT",
      });
      return;
    }

    const user = await UserModel.findOne({ clerkUserId });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    const maxCreditsNeeded = Math.ceil(amount / CREDIT_VALUE);
    const creditsToUse = Math.min(user.credits, maxCreditsNeeded);
    const creditCoverage = creditsToUse * CREDIT_VALUE;
    const moneyRequired = Math.max(0, amount - creditCoverage);

    await createPurchaseWithHybridPayment({
      user,
      productId,
      productName,
      amount,
      creditsUsed: creditsToUse,
      creditAmount: creditCoverage,
      cashAmount: moneyRequired,
    });

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({
        success: false,
        message: error.message,
        code: "USER_NOT_FOUND",
      });
      return;
    }

    if (error.message === "Insufficient credits") {
      res.status(400).json({
        success: false,
        message: error.message,
        code: "INSUFFICIENT_CREDITS",
      });
      return;
    }

    if (error.message.startsWith("Payment failed")) {
      res.status(402).json({
        success: false,
        message: error.message,
        code: "PAYMENT_FAILED",
      });
      return;
    }

    if (error.message === "Payment method required") {
      res.status(400).json({
        success: false,
        message: error.message,
        code: "INVALID_PAYMENT_METHOD",
      });
      return;
    }

    next(error);
  }
};
