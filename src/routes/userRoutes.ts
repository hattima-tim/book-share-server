import { requireAuth } from "@clerk/express";
import { Router } from "express";
import { getDashboard } from "../controller/userController.ts";

const router = Router();

router.get("/dashboard", requireAuth(), getDashboard);

export default router;
