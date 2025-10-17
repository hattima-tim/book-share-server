import { UserModel } from "../models/user.ts";
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

  const referralStats = await Referral.aggregate([
    {
      $match: { referrerId: user._id },
    },
    {
      $group: {
        _id: null,
        totalReferred: { $sum: 1 },
        convertedUsers: {
          $sum: {
            $cond: [{ $eq: ["$status", "converted"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const stats =
    referralStats.length > 0
      ? referralStats[0]
      : { totalReferred: 0, convertedUsers: 0 };

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const referralLink = `${frontendUrl}/register?r=${user.referralCode}`;

  return {
    name: user.name,
    totalReferredUsers: stats.totalReferred,
    convertedUsers: stats.convertedUsers,
    totalCreditsEarned: user.totalCreditsEarned,
    currentBalance: user.credits,
    referralLink,
    referralCode: user.referralCode,
  };
};
