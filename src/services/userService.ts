import { type IUser, UserModel } from "../models/user.ts";
import Referral from "../models/referral.ts";
import { type DashboardResponse } from "../types/index.ts";

/**
 * Get comprehensive dashboard data for a user by Clerk user ID
 * Includes referral statistics, credit information, and referral link
 *
 * @param clerkUserId - The Clerk user ID
 * @returns Dashboard data with all metrics
 */
export const getDashboardData = async (
  clerkUserId: string
): Promise<DashboardResponse> => {
  const user = await UserModel.findOne({ clerkUserId }).select(
    "_id credits totalCreditsEarned referralCode name"
  );

  if (!user) {
    throw new Error("User not found");
  }

  const referrals = await Referral.find({ referrerId: user._id })
    .populate("referredUserId")
    .lean();

  const referredUsers = referrals.map((r) => {
    const userObj = r.referredUserId;

    return { ...userObj, status: (r as any).status } as unknown as IUser;
  });

  const stats = {
    totalReferred: referrals.length,
    convertedUsers: referrals.filter((r) => r.status === "converted").length,
    referredUsers,
  };

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const referralLink = `${frontendUrl}/register?r=${user.referralCode}`;

  return {
    name: user.name,
    convertedUsers: stats.convertedUsers,
    totalCreditsEarned: user.totalCreditsEarned,
    currentBalance: user.credits,
    referralLink,
    referralCode: user.referralCode,
    referredUsers: stats.referredUsers,
  };
};
