import mongoose, { Document } from "mongoose";

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  productId: string;
  productName: string;
  amount: number;
  creditsUsed: number;
  creditAmount: number;
  cashAmount: number;
  paymentMethodId?: string;
  isFirstPurchase: boolean;
  referralCreditAwarded: boolean;
  createdAt: Date;
}

const PurchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    creditsUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    cashAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentMethodId: {
      type: String,
      default: null,
    },
    isFirstPurchase: {
      type: Boolean,
      default: false,
    },
    referralCreditAwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPurchase>("Purchase", PurchaseSchema);
