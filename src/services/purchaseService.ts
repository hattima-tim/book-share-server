import mongoose from "mongoose";
import { type IUser, UserModel } from "../models/userSchema.ts";
import PurchaseModel from "../models/purchaseSchema.ts";
import ReferralModel from "../models/referralSchema.ts";

const CREDIT_VALUE = 10; // $10 = 1 credit
const REFERRAL_CREDITS = 2; // Credits awarded for first purchase

interface CreatePurchaseParams {
  user: IUser;
  productId: string;
  productName: string;
  amount: number;
  creditsUsed: number;
  creditAmount: number;
  cashAmount: number;
}

const createPurchaseWithHybridPayment = async (
  params: CreatePurchaseParams
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user,
      productId,
      productName,
      amount,
      creditsUsed,
      creditAmount,
      cashAmount,
    } = params;

    const updatedUser = await UserModel.findOneAndUpdate({
      _id: user._id,
      credits: { $gte: creditsUsed }
    }, {
      $inc: { credits: -creditsUsed }
    }, {
      new: true,
      session
    })

    if (!updatedUser) {
      throw new Error("Insufficient credits");
    }

    const existingPurchases = await PurchaseModel.countDocuments({
      userId: user._id,
    }).session(session);
    const isFirstPurchase = existingPurchases === 0;


    const purchase = await PurchaseModel.create(
      [
        {
          userId: user._id,
          productId,
          productName,
          amount,
          creditsUsed,
          creditAmount,
          cashAmount,
          isFirstPurchase,
          referralCreditAwarded: false,
        },
      ],
      { session }
    );

    const creditsAwarded = {
      referrer: 0,
      user: 0,
    };

    if (isFirstPurchase && user.referredBy) {
      const referral = await ReferralModel.findOneAndUpdate({
        referredUserId: user._id,
        status: "pending",
        creditsAwarded: false
      },
        {
          $set: {
            status: 'converted',
            creditsAwarded: true,
            convertedAt: new Date()
          }
        }, {
        new: true,
        session
      });

      if (referral) {
        const referrer = await UserModel.findOneAndUpdate({ _id: referral.referrerId },
          {
            $inc: { credits: REFERRAL_CREDITS, totalCreditsEarned: REFERRAL_CREDITS }
          },
          {
            new: true,
            session
          }
        )

        if (referrer) {
          creditsAwarded.referrer = REFERRAL_CREDITS;
        }

        await UserModel.findOneAndUpdate({
          _id: user._id
        }, {
          $inc: {
            credits: REFERRAL_CREDITS,
            totalCreditsEarned: REFERRAL_CREDITS,
          }

        },
          {
            new: true,
            session
          })
        creditsAwarded.user = REFERRAL_CREDITS;

        purchase[0].referralCreditAwarded = true;
        await purchase[0].save({ session });
      }
    }

    await session.commitTransaction();

    return {
      purchase: purchase[0],
      creditsAwarded,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export { CREDIT_VALUE, createPurchaseWithHybridPayment };
