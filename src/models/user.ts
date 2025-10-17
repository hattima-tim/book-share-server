import mongoose, { Schema } from "mongoose";

export interface IUser extends mongoose.Document {
  _id: string;
  clerkUserId: string;
  referralCode: string;
  credits: number;
  totalCreditsEarned: number;
  totalReferredUsers: number;
  name: string;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    clerkUserId: {
      type: String,
      required: [true, "Clerk user ID is required"],
      unique: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: [true, "Referral code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCreditsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReferredUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
