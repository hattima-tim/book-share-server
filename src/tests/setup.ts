import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { before, after, beforeEach } from "node:test";

let mongoServer: MongoMemoryReplSet;

before(async () => {
  mongoServer = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  await mongoServer.waitUntilRunning();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);

  await new Promise((resolve) => setTimeout(resolve, 1000));
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

export const mockClerkAuth = (userId: string) => {
  return {
    userId,
    sessionId: "test-session",
    orgId: null,
    orgRole: null,
    orgSlug: null,
  };
};

export const testUsers = {
  referrer: {
    clerkUserId: "user_referrer_123",
    name: "John Referrer",
    referralCode: "REF123XY",
    credits: 10,
    totalCreditsEarned: 10,
    totalReferredUsers: 1,
  },
  referred: {
    clerkUserId: "user_referred_456",
    name: "Jane Referred",
    referralCode: "REF456ZW",
    credits: 0,
    totalCreditsEarned: 0,
    totalReferredUsers: 0,
  },
  regular: {
    clerkUserId: "user_regular_789",
    name: "Bob Regular",
    referralCode: "REG789AB",
    credits: 5,
    totalCreditsEarned: 5,
    totalReferredUsers: 0,
  },
};

export const testProducts = {
  ebook: {
    title: "Clean Code",
    description: "A handbook of agile software craftsmanship",
    author: "Robert C. Martin",
    price: 32.99,
    category: "ebook" as const,
    imageUrl: "https://example.com/clean-code.jpg",
  },
  course: {
    title: "JavaScript Mastery",
    description: "Complete JavaScript course",
    author: "Tech Instructor",
    price: 99.99,
    category: "course" as const,
    imageUrl: "https://example.com/js-course.jpg",
  },
};
