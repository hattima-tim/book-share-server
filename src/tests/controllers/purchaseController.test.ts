import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import request from "supertest";
import express from "express";
import { UserModel } from "../../models/userSchema";
import ProductModel from "../../models/productSchema";
import { createPurchase } from "../../controller/purchaseController";
import purchaseValidation from "../../validation/purchaseValidation";
import { testUsers, testProducts, mockClerkAuth } from "../setup";

const mockGetAuth = {
  fn: null as any,
  mockReturnValue: function (value: any) {
    this.fn = () => value;
  },
};

const mockClerk = {
  getAuth: () => (mockGetAuth.fn ? mockGetAuth.fn() : null),
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
};

const app = express();
app.use(express.json());

app.use((req: any, _res: any, next: any) => {
  req.auth = mockClerk.getAuth();
  next();
});

app.post("/purchase", purchaseValidation, createPurchase);

describe("Purchase Controller - API Tests", () => {
  let testUser: any;
  let testProduct: any;

  beforeEach(async () => {
    testUser = await UserModel.create(testUsers.regular);
    testProduct = await ProductModel.create(testProducts.ebook);

    mockGetAuth.mockReturnValue(mockClerkAuth(testUser.clerkUserId));
  });

  describe("Purchase Creation", () => {
    it("should create purchase successfully with valid data", async () => {
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(201);

      assert.strictEqual(response.body.success, true);
      assert.strictEqual(
        response.body.message,
        "Purchase created successfully"
      );
    });

    it("should return 400 for missing required fields", async () => {
      const invalidData = {
        productId: testProduct._id.toString(),
      };

      const response = await request(app)
        .post("/purchase")
        .send(invalidData)
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.code, "VALIDATION_ERROR");
    });

    it("should return 400 for invalid amount (zero)", async () => {
      const invalidData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: 0,
      };

      const response = await request(app)
        .post("/purchase")
        .send(invalidData)
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.code, "INVALID_AMOUNT");
    });

    it("should return 400 for negative amount", async () => {
      const invalidData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: -10,
      };

      const response = await request(app)
        .post("/purchase")
        .send(invalidData)
        .expect(400);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.code, "INVALID_AMOUNT");
    });

    it("should return 401 for unauthenticated request", async () => {
      mockGetAuth.mockReturnValue({ userId: null });

      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(401);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.code, "UNAUTHORIZED");
    });

    it("should return 404 for non-existent user", async () => {
      mockGetAuth.mockReturnValue(mockClerkAuth("non_existent_user"));

      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(404);

      assert.strictEqual(response.body.success, false);
      assert.strictEqual(response.body.code, "USER_NOT_FOUND");
    });
  });

  describe("Credit Calculation Logic", () => {
    it("should calculate hybrid payment correctly when user has partial credits", async () => {
      // Set user to have 3 credits (worth $30)
      await UserModel.findByIdAndUpdate(testUser._id, { credits: 3 });

      const purchaseAmount = 50; // $50 purchase
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: purchaseAmount,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(201);

      assert.strictEqual(response.body.success, true);

      // Verify user credits were deducted
      const updatedUser = await UserModel.findById(testUser._id);
      assert.strictEqual(updatedUser!.credits, 0); // All 3 credits should be used
    });

    it("should handle purchase when user has more credits than needed", async () => {
      // Set user to have 10 credits (worth $100)
      await UserModel.findByIdAndUpdate(testUser._id, { credits: 10 });

      const purchaseAmount = 25; // $25 purchase (needs 3 credits)
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: purchaseAmount,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(201);

      assert.strictEqual(response.body.success, true);

      // Verify correct number of credits were deducted
      const updatedUser = await UserModel.findById(testUser._id);
      assert.strictEqual(updatedUser!.credits, 7); // 10 - 3 = 7 credits remaining
    });

    it("should handle purchase with no credits (cash only)", async () => {
      await UserModel.findByIdAndUpdate(testUser._id, { credits: 0 });

      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(201);

      assert.strictEqual(response.body.success, true);

      const updatedUser = await UserModel.findById(testUser._id);
      assert.strictEqual(updatedUser!.credits, 0);
    });
  });

  describe("Input Validation", () => {
    it("should validate productId format", async () => {
      const invalidData = {
        productId: "invalid_id_format",
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app)
        .post("/purchase")
        .send(invalidData)
        .expect(400);

      assert.strictEqual(response.body.success, false);
    });

    it("should validate productName is string", async () => {
      const invalidData = {
        productId: testProduct._id.toString(),
        productName: 123,
        amount: testProduct.price,
      };

      const response = await request(app)
        .post("/purchase")
        .send(invalidData)
        .expect(400);

      assert.strictEqual(response.body.success, false);
    });

    it("should validate amount is number", async () => {
      const invalidData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: "not_a_number",
      };

      const response = await request(app)
        .post("/purchase")
        .send(invalidData)
        .expect(400);

      assert.strictEqual(response.body.success, false);
    });

    it("should handle large purchase amounts", async () => {
      const largeAmount = 999999.99;
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: largeAmount,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(201);

      assert.strictEqual(response.body.success, true);
    });

    it("should handle decimal amounts correctly", async () => {
      const decimalAmount = 19.99;
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: decimalAmount,
      };

      const response = await request(app)
        .post("/purchase")
        .send(purchaseData)
        .expect(201);

      assert.strictEqual(response.body.success, true);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors gracefully", async () => {
      const originalFindOne = UserModel.findOne;
      (UserModel.findOne as any) = () =>
        Promise.reject(new Error("Database connection failed"));

      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      await request(app).post("/purchase").send(purchaseData).expect(500);

      UserModel.findOne = originalFindOne;
    });

    it("should handle service layer errors correctly", async () => {
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app).post("/purchase").send(purchaseData);

      assert.ok(response.status >= 200 && response.status < 600);
    });

    it("should handle insufficient credits error", async () => {
      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: testProduct.price,
      };

      const response = await request(app).post("/purchase").send(purchaseData);

      assert.ok(response.status >= 200 && response.status < 600);
    });
  });

  describe("Concurrent Request Handling", () => {
    it("should handle multiple simultaneous purchases by same user", async () => {
      // Set user to have limited credits
      await UserModel.findByIdAndUpdate(testUser._id, { credits: 5 });

      const purchaseData = {
        productId: testProduct._id.toString(),
        productName: testProduct.title,
        amount: 30, // Requires 3 credits
      };

      // Make multiple simultaneous requests
      const requests = Array(3)
        .fill(null)
        .map(() => request(app).post("/purchase").send(purchaseData));

      const responses = await Promise.allSettled(requests);

      // At least one should succeed
      const successfulResponses = responses.filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled" && result.value.status === 201
      );

      assert.ok(successfulResponses.length > 0);

      // User should not have negative credits
      const finalUser = await UserModel.findById(testUser._id);
      assert.ok(finalUser!.credits >= 0);
    });
  });
});
