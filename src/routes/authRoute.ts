import { requireAuth } from "@clerk/express";
import { Router } from "express";
import { syncUserController } from "../controller/authController/authController.ts";

const router = Router();

router.post("/sync", requireAuth(), syncUserController);

export default router;
