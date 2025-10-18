import { Router } from "express";
import userRouter from "./userRoutes.ts";
import authRouter from "./authRoute.ts";
import productRouter from "./productRoute.ts";

const router = Router();

router.use("/", userRouter);
router.use("/auth", authRouter);
router.use("/products", productRouter);

export default router;
