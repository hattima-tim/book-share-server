import { type IUser } from "../models/user.ts";

export interface DashboardResponse {
  convertedUsers: number;
  totalCreditsEarned: number;
  currentBalance: number;
  referralLink: string;
  referralCode: string;
  name: string;
  referredUsers: IUser[] | null;
}
