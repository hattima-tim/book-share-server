import type { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { syncUserService } from "../../services/auth.ts";

/**
 * @route   POST /api/auth/sync
 * @desc    Sync user data from Clerk
 * @access  Private (requires Clerk authentication)
 */
export const syncUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      res.sendStatus(401);
      return;
    }

    let referralCode = "";
    let email = "";
    let name = "";

    if (clerkUserId) {
      const user = await clerkClient.users.getUser(clerkUserId);
      referralCode = user.unsafeMetadata.referralCode as string;
      email = user.emailAddresses[0].emailAddress;
      name = user.firstName + " " + user.lastName;
    }

    const result = await syncUserService({
      clerkUserId,
      email,
      name,
      referralCode,
    });

    res.send(result);
  } catch (error: any) {
    console.log(error.message);

    if (error.message === "Failed to generate unique referral code") {
      res.sendStatus(500);
      return;
    }

    next(error);
  }
};
