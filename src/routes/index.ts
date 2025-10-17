import { Router } from "express";
import userRouter from "./userRoutes.ts";
import authRouter from "./authRoute.ts";

const router = Router();

router.use("/", userRouter);
router.use("/auth", authRouter);

export default router;
