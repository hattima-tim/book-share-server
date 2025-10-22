import { describe, it } from "node:test";
import assert from "node:assert";
import { UserModel } from "../../models/userSchema.ts";
import ReferralModel from "../../models/referralSchema.ts";
import PurchaseModel from "../../models/purchaseSchema.ts";
import ProductModel from "../../models/productSchema.ts";
import { createPurchaseWithHybridPayment } from "../../services/purchaseService.ts";
import { syncUserService } from "../../services/auth.ts";
import "../setup.ts";

describe("Purchase Flow Integration Tests", () => {
  describe("Complete Referral Purchase Flow", () => {
    it("should handle complete referral flow from signup to first purchase", async () => {
      const referrerData = await syncUserService({
        clerkUserId: "referrer_integration_test",
        email: "referrer@test.com",
        name: "Integration Referrer",
      });

      const referredData = await syncUserService({
        clerkUserId: "referred_integration_test",
        email: "referred@test.com",
        name: "Integration Referred",
        referralCode: referrerData.referralCode,
      });

      const referral = await ReferralModel.findOne({
        referredUserId: referredData.id,
      });
      assert.ok(referral);
      assert.strictEqual(referral!.status, "pending");
      assert.strictEqual(referral!.creditsAwarded, false);

      const product = await ProductModel.create({
        title: "Integration Test Product",
        description: "Product for integration testing",
        author: "Test Author",
        price: 49.99,
        category: "ebook",
      });

      const referredUser = await UserModel.findById(referredData.id);
      const purchaseResult = await createPurchaseWithHybridPayment({
        user: referredUser!,
        productId: product._id.toString(),
        productName: product.title,
        amount: product.price,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: product.price,
      });

      assert.ok(purchaseResult.purchase);
      assert.strictEqual(purchaseResult.purchase.isFirstPurchase, true);
      assert.strictEqual(purchaseResult.purchase.referralCreditAwarded, true);
      assert.strictEqual(purchaseResult.purchase.amount, product.price);

      assert.strictEqual(purchaseResult.creditsAwarded.referrer, 2);
      assert.strictEqual(purchaseResult.creditsAwarded.user, 2);

      const updatedReferrer = await UserModel.findById(referrerData.id);
      assert.strictEqual(updatedReferrer!.credits, 2);
      assert.strictEqual(updatedReferrer!.totalCreditsEarned, 2);

      const updatedReferred = await UserModel.findById(referredData.id);
      assert.strictEqual(updatedReferred!.credits, 2);
      assert.strictEqual(updatedReferred!.totalCreditsEarned, 2);

      const updatedReferral = await ReferralModel.findOne({
        referredUserId: referredData.id,
      });
      assert.strictEqual(updatedReferral!.status, "converted");
      assert.strictEqual(updatedReferral!.creditsAwarded, true);
      assert.ok(updatedReferral!.convertedAt);

      const secondPurchaseResult = await createPurchaseWithHybridPayment({
        user: updatedReferred!,
        productId: product._id.toString(),
        productName: product.title,
        amount: 25.0,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: 25.0,
      });

      assert.strictEqual(secondPurchaseResult.creditsAwarded.referrer, 0);
      assert.strictEqual(secondPurchaseResult.creditsAwarded.user, 0);
      assert.strictEqual(secondPurchaseResult.purchase.isFirstPurchase, false);
      assert.strictEqual(
        secondPurchaseResult.purchase.referralCreditAwarded,
        false
      );
    });

    it("should handle hybrid payment flow with credits from referral", async () => {
      const referrerData = await syncUserService({
        clerkUserId: "hybrid_referrer_test",
        email: "hybridreferrer@test.com",
        name: "Hybrid Referrer",
      });

      const referredData = await syncUserService({
        clerkUserId: "hybrid_referred_test",
        email: "hybridreferred@test.com",
        name: "Hybrid Referred",
        referralCode: referrerData.referralCode,
      });

      await UserModel.findByIdAndUpdate(referredData.id, {
        credits: 5, // $50 worth of credits
        totalCreditsEarned: 5,
      });

      const product = await ProductModel.create({
        title: "Expensive Course",
        description: "High-value course",
        author: "Expert Instructor",
        price: 75.0, // More than user's credits
        category: "course",
      });

      const updatedReferred = await UserModel.findById(referredData.id);
      const purchaseResult = await createPurchaseWithHybridPayment({
        user: updatedReferred!,
        productId: product._id.toString(),
        productName: product.title,
        amount: product.price,
        creditsUsed: 5,
        creditAmount: 50.0,
        cashAmount: 25.0,
      });

      assert.strictEqual(purchaseResult.purchase.creditsUsed, 5);
      assert.strictEqual(purchaseResult.purchase.creditAmount, 50.0);
      assert.strictEqual(purchaseResult.purchase.cashAmount, 25.0);
      assert.strictEqual(purchaseResult.purchase.amount, 75.0);

      const finalReferred = await UserModel.findById(referredData.id);
      assert.strictEqual(finalReferred!.credits, 2); // 0 (used all) + 2 (referral bonus)

      assert.strictEqual(purchaseResult.creditsAwarded.referrer, 2);
      assert.strictEqual(purchaseResult.creditsAwarded.user, 2);

      const finalReferrer = await UserModel.findById(referrerData.id);
      assert.strictEqual(finalReferrer!.credits, 2); // 0 (initial) + 2 (referral bonus)
    });
  });

  describe("Data Consistency Verification", () => {
    it("should maintain referral statistics consistency", async () => {
      const referrerData = await syncUserService({
        clerkUserId: "consistency_referrer_test",
        email: "consistencyreferrer@test.com",
        name: "Consistency Referrer",
      });

      const referredData = await syncUserService({
        clerkUserId: "consistency_referred_test",
        email: "consistencyreferred@test.com",
        name: "Consistency Referred",
        referralCode: referrerData.referralCode,
      });

      const product = await ProductModel.create({
        title: "Consistency Test Product",
        description: "Product for consistency testing",
        author: "Consistency Author",
        price: 40.0,
        category: "course",
      });

      const referrer = await UserModel.findById(referrerData.id);
      const referred = await UserModel.findById(referredData.id);

      await createPurchaseWithHybridPayment({
        user: referred!,
        productId: product._id.toString(),
        productName: product.title,
        amount: product.price,
        creditsUsed: 0,
        creditAmount: 0,
        cashAmount: product.price,
      });

      const [
        finalReferrer,
        finalReferred,
        referral,
        purchase,
        referralCount,
        purchaseCount,
      ] = await Promise.all([
        UserModel.findById(referrer!._id),
        UserModel.findById(referred!._id),
        ReferralModel.findOne({ referredUserId: referred!._id }),
        PurchaseModel.findOne({ userId: referred!._id }),
        ReferralModel.countDocuments({ referrerId: referrer!._id }),
        PurchaseModel.countDocuments({ userId: referred!._id }),
      ]);

      assert.strictEqual(finalReferrer!.credits, 2); // 0 + 2
      assert.strictEqual(finalReferrer!.totalCreditsEarned, 2); // 0 + 2
      assert.strictEqual(finalReferred!.credits, 2);
      assert.strictEqual(finalReferred!.totalCreditsEarned, 2);

      assert.strictEqual(referral!.status, "converted");
      assert.strictEqual(referral!.creditsAwarded, true);
      assert.ok(referral!.convertedAt);

      assert.strictEqual(purchase!.isFirstPurchase, true);
      assert.strictEqual(purchase!.referralCreditAwarded, true);
      assert.strictEqual(purchase!.amount, product.price);

      assert.strictEqual(referralCount, 1);
      assert.strictEqual(purchaseCount, 1);
    });
  });
});
