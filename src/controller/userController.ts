import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { getDashboardData } from "../services/userService.ts";

/**
 * Get dashboard data for authenticated user
 * @route GET /api/user/dashboard
 */
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = getAuth(req);
    const dashboardData = await getDashboardData(userId!);

    res.send(dashboardData);
  } catch (error: any) {
    if (error.message === "User not found") {
      res.sendStatus(404);
      return;
    }

    if (error.message === "Invalid user ID format") {
      res.sendStatus(400).json({ error: "Invalid user ID format" });

      return;
    }

    next(error);
  }
};
