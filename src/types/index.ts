import { type IUser } from "../models/userSchema.ts";

export interface DashboardResponse {
  convertedUsers: number;
  totalCreditsEarned: number;
  currentBalance: number;
  referralLink: string;
  referralCode: string;
  name: string;
  referredBy: string | null;
  referredUsers: IUser[] | null;
}
