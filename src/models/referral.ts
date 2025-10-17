import mongoose, { Schema } from "mongoose";

const ReferralSchema: Schema = new Schema(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Referrer ID is required"],
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Referred user ID is required"],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "converted"],
      default: "pending",
      required: true,
      index: true,
    },
    creditsAwarded: {
      type: Boolean,
      default: false,
      required: true,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ReferralSchema.index({ referrerId: 1, referredUserId: 1 }, { unique: true });

export default mongoose.model("Referral", ReferralSchema);
