import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { UserModel } from "../../models/userSchema.ts";
import PurchaseModel from "../../models/purchaseSchema.ts";
import ReferralModel from "../../models/referralSchema.ts";
import ProductModel from "../../models/productSchema.ts";
import {
  createPurchaseWithHybridPayment,
  CREDIT_VALUE,
} from "../../services/purchaseService.ts";
import "../setup.ts";

describe("Purchase Service - Payment Tests", () => {
  let referrerUser: any;
  let referredUser: any;
  let regularUser: any;
  let testProduct: any;

  beforeEach(async () => {
    referrerUser = await UserModel.create({
      clerkUserId: "user_referrer_123",
      name: "John Referrer",
      referralCode: "REF123XY",
      credits: 10,
      totalCreditsEarned: 10,
      totalReferredUsers: 1,
    });

    const referredUserData = {
      clerkUserId: "user_referred_456",
      name: "Jane Referred",
      referralCode: "REF456ZW",
      credits: 0,
      totalCreditsEarned: 0,
      totalReferredUsers: 0,
      referredBy: referrerUser._id,
    };
    referredUser = await UserModel.create(referredUserData);

    regularUser = await UserModel.create({
      clerkUserId: "user_regular_789",
      name: "Bob Regular",
      referralCode: "REG789AB",
      credits: 5,
      totalCreditsEarned: 5,
      totalReferredUsers: 0,
    });

    await ReferralModel.create({
      referrerId: referrerUser._id,
      referredUserId: referredUser._id,
      status: "pending",
      creditsAwarded: false,
    });

    testProduct = await ProductModel.create({
      title: "Clean Code",
      description: "A handbook of agile software craftsmanship",
      author: "Robert C. Martin",
      price: 32.99,
      category: "ebook",
      imageUrl: "https://example.com/clean-code.jpg",
    });
  });

  describe("Hybrid Payment System", () => {
    it("should process payment with credits only when user has sufficient credits", async () => {
      const purchaseAmount = 20;
      const creditsNeeded = Math.ceil(purchaseAmount / CREDIT_VALUE);

      await UserModel.findByIdAndUpdate(regularUser._id, { credits: 5 });
      const updatedUser = await UserModel.findById(regularUser._id);

      const result = await createPurchaseWithHybridPayment({
        user: updatedUser!,
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: purchaseAmount,
        creditsUsed: creditsNeeded,
        creditAmount: creditsNeeded * CREDIT_VALUE,
        cashAmount: 0,
      });

      assert.ok(result.purchase);
      assert.strictEqual(result.purchase.amount, purchaseAmount);
      assert.strictEqual(result.purchase.creditsUsed, creditsNeeded);
      assert.strictEqual(result.purchase.creditAmount, 20);
      assert.strictEqual(result.purchase.cashAmount, 0);

      const userAfterPurchase = await UserModel.findById(regularUser._id);
      assert.strictEqual(userAfterPurchase!.credits, 5 - creditsNeeded);
    });

    it("should process hybrid payment (credits + cash) when credits are insufficient", async () => {
      const purchaseAmount = 50;
      const userCredits = 3;
      const creditAmount = userCredits * CREDIT_VALUE;
      const cashAmount = purchaseAmount - creditAmount;

      await UserModel.findByIdAndUpdate(regularUser._id, {
        credits: userCredits,
      });
      const updatedUser = await UserModel.findById(regularUser._id);

      const result = await createPurchaseWithHybridPayment({
        user: updatedUser!,
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: purchaseAmount,
        creditsUsed: userCredits,
        creditAmount: creditAmount,
        cashAmount: cashAmount,
      });

      assert.strictEqual(result.purchase.amount, purchaseAmount);
      assert.strictEqual(result.purchase.creditsUsed, userCredits);
      assert.strictEqual(result.purchase.creditAmount, creditAmount);
      assert.strictEqual(result.purchase.cashAmount, cashAmount);

      const userAfterPurchase = await UserModel.findById(regularUser._id);
      assert.strictEqual(userAfterPurchase!.credits, 0);
    });

    it("should fail when user has insufficient credits for attempted credit usage", async () => {
      const purchaseAmount = 50;
      const attemptedCredits = 10;

      await UserModel.findByIdAndUpdate(regularUser._id, { credits: 2 });
      const updatedUser = await UserModel.findById(regularUser._id);

      await assert.rejects(
        createPurchaseWithHybridPayment({
          user: updatedUser!,
          productId: testProduct._id.toString(),
          productName: testProduct.title,
          amount: purchaseAmount,
          creditsUsed: attemptedCredits,
          creditAmount: attemptedCredits * CREDIT_VALUE,
          cashAmount: 0,
        }),
        /Insufficient credits/
      );
    });
  });

  describe("Referral Credit System", () => {
    it("should award referral credits on first purchase by referred user", async () => {
      const purchaseAmount = 32.99;

      const result = await createPurchaseWithHybridPayment({
        user: referredUser,
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: purchaseAmount,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: purchaseAmount,
      });

      assert.strictEqual(result.creditsAwarded.referrer, 2);
      assert.strictEqual(result.creditsAwarded.user, 2);

      const updatedReferrer = await UserModel.findById(referrerUser._id);
      assert.strictEqual(updatedReferrer!.credits, 12); // 10 + 2
      assert.strictEqual(updatedReferrer!.totalCreditsEarned, 12); // 10 + 2

      const updatedReferred = await UserModel.findById(referredUser._id);
      assert.strictEqual(updatedReferred!.credits, 2);
      assert.strictEqual(updatedReferred!.totalCreditsEarned, 2);

      const referral = await ReferralModel.findOne({
        referredUserId: referredUser._id,
      });
      assert.strictEqual(referral!.status, "converted");
      assert.strictEqual(referral!.creditsAwarded, true);
      assert.ok(referral!.convertedAt);

      assert.strictEqual(result.purchase.isFirstPurchase, true);
      assert.strictEqual(result.purchase.referralCreditAwarded, true);
    });

    it("should NOT award referral credits on second purchase by referred user", async () => {
      await createPurchaseWithHybridPayment({
        user: referredUser,
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: 25.0,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: 25.0,
      });

      const result = await createPurchaseWithHybridPayment({
        user: referredUser,
        productId: testProduct._id.toString(),
        productName: "Another Product",
        amount: 30.0,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: 30.0,
      });

      assert.strictEqual(result.creditsAwarded.referrer, 0);
      assert.strictEqual(result.creditsAwarded.user, 0);

      assert.strictEqual(result.purchase.isFirstPurchase, false);
      assert.strictEqual(result.purchase.referralCreditAwarded, false);
    });

    it("should NOT award referral credits for non-referred user first purchase", async () => {
      const result = await createPurchaseWithHybridPayment({
        user: regularUser,
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: 32.99,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: 32.99,
      });

      assert.strictEqual(result.creditsAwarded.referrer, 0);
      assert.strictEqual(result.creditsAwarded.user, 0);

      assert.strictEqual(result.purchase.isFirstPurchase, true);
      assert.strictEqual(result.purchase.referralCreditAwarded, false);
    });
  });

  describe("Transaction Integrity", () => {
    it("should maintain data consistency during successful purchase", async () => {
      const initialReferrerCredits = referrerUser.credits;
      const initialReferredCredits = referredUser.credits;

      await createPurchaseWithHybridPayment({
        user: referredUser,
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: 32.99,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: 32.99,
      });

      const [updatedReferrer, updatedReferred, referral, purchase] =
        await Promise.all([
          UserModel.findById(referrerUser._id),
          UserModel.findById(referredUser._id),
          ReferralModel.findOne({ referredUserId: referredUser._id }),
          PurchaseModel.findOne({ userId: referredUser._id }),
        ]);

      assert.strictEqual(updatedReferrer!.credits, initialReferrerCredits + 2);
      assert.strictEqual(updatedReferred!.credits, initialReferredCredits + 2);
      assert.strictEqual(referral!.status, "converted");
      assert.strictEqual(referral!.creditsAwarded, true);
      assert.strictEqual(purchase!.referralCreditAwarded, true);
    });

    it("should rollback transaction on database error", async () => {
      const invalidProductId = "invalid_product_id";

      await assert.rejects(
        createPurchaseWithHybridPayment({
          user: referredUser,
          productId: invalidProductId,
          productName: testProduct.title,
          amount: 32.99,
          creditsUsed: 0,
          creditAmount: 0,
          cashAmount: 32.99,
        })
      );

      const [unchangedReferrer, unchangedReferred, unchangedReferral] =
        await Promise.all([
          UserModel.findById(referrerUser._id),
          UserModel.findById(referredUser._id),
          ReferralModel.findOne({ referredUserId: referredUser._id }),
        ]);

      assert.strictEqual(unchangedReferrer!.credits, 10);
      assert.strictEqual(unchangedReferred!.credits, 0);
      assert.strictEqual(unchangedReferral!.status, "pending");
      assert.strictEqual(unchangedReferral!.creditsAwarded, false);

      const purchase = await PurchaseModel.findOne({
        userId: referredUser._id,
      });
      assert.strictEqual(purchase, null);
    });
  });
});
