import { UserModel } from "../models/userSchema";
import ReferralModel from "../models/referralSchema";
import PurchaseModel from "../models/purchaseSchema";
import ProductModel from "../models/productSchema";

/**
 * Clean all test data from database
 */
export const cleanDatabase = async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    ReferralModel.deleteMany({}),
    PurchaseModel.deleteMany({}),
    ProductModel.deleteMany({}),
  ]);
};

/**
 * Create test data for integration tests
 */
export const createTestData = async () => {
  const products = await ProductModel.insertMany([
    {
      title: "Test eBook",
      description: "A test ebook for testing purposes",
      author: "Test Author",
      price: 29.99,
      category: "ebook",
      imageUrl: "https://example.com/test-ebook.jpg",
    },
    {
      title: "Test Course",
      description: "A test course for testing purposes",
      author: "Test Instructor",
      price: 99.99,
      category: "course",
      imageUrl: "https://example.com/test-course.jpg",
    },
  ]);

  const referrer = await UserModel.create({
    clerkUserId: "test_referrer_123",
    name: "Test Referrer",
    referralCode: "TESTREF1",
    credits: 10,
    totalCreditsEarned: 10,
    totalReferredUsers: 0,
  });

  const referred = await UserModel.create({
    clerkUserId: "test_referred_456",
    name: "Test Referred",
    referralCode: "TESTREF2",
    credits: 0,
    totalCreditsEarned: 0,
    totalReferredUsers: 0,
    referredBy: referrer._id,
  });

  await ReferralModel.create({
    referrerId: referrer._id,
    referredUserId: referred._id,
    status: "pending",
    creditsAwarded: false,
  });

  return {
    products,
    users: { referrer, referred },
  };
};
