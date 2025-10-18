import { type IUser, UserModel } from "../models/userSchema.ts";
import Referral from "../models/referral.ts";
import { generateReferralCode } from "../utils/generateReferralCode.ts";

/**
 * Sync or create user from Clerk authentication
 * This is called when a user signs up or signs in via Clerk
 * @param input - User data from Clerk
 * @returns User data
 */

interface SyncUserInput {
  clerkUserId: string;
  email: string;
  name: string;
  referralCode?: string;
}

interface UserResponse {
  id: string;
  clerkUserId: string;
  referralCode: string;
  credits: number;
  name: string;
}

export const syncUserService = async (
  input: SyncUserInput
): Promise<UserResponse> => {
  const { clerkUserId, referralCode } = input;

  let user = await UserModel.findOne<IUser>({ clerkUserId });

  if (user) {
    return {
      id: user._id,
      name: user.name,
      clerkUserId: user.clerkUserId,
      referralCode: user.referralCode,
      credits: user.credits,
    };
  }

  let isUnique = false;
  let newUser;
  const maxAttempts = 10;
  let referrer;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const attemptCode = generateReferralCode();
    try {
      if (referralCode) {
        referrer = await UserModel.findOne({
          referralCode: referralCode.toUpperCase(),
        });
      }
      newUser = await UserModel.create({
        clerkUserId,
        name: input.name,
        referralCode: attemptCode,
        credits: 0,
        totalCreditsEarned: 0,
        totalReferredUsers: 0,
        ...(referrer ? { referredBy: referrer._id } : {}),
      });

      isUnique = true;
      break;
    } catch (error: any) {
      if (error.code === 11000) {
        continue;
      }

      throw error;
    }
  }

  if (!isUnique) {
    throw new Error("Failed to generate unique referral code");
  }

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  if (referrer && referrer.clerkUserId !== newUser.clerkUserId) {
    await Referral.create({
      referrerId: referrer._id,
      referredUserId: newUser._id,
      status: "pending",
      creditsAwarded: false,
    });

    await UserModel.findByIdAndUpdate(referrer._id, {
      referredBy: newUser._id,
      $inc: { totalReferredUsers: 1 },
    });
  }

  return {
    id: newUser._id.toString(),
    name: newUser.name,
    clerkUserId: newUser.clerkUserId,
    referralCode: newUser.referralCode,
    credits: newUser.credits,
  };
};
