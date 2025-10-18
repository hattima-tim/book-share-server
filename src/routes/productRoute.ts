import { requireAuth } from "@clerk/express";
import { Router } from "express";
import { getAllProductsController } from "../controller/productsController.ts";

const router = Router();

router.get("/", requireAuth(), getAllProductsController);

export default router;
