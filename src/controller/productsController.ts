import type { Request, Response } from "express";
import Product from "../models/productSchema.ts";

const getAllProductsController = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export { getAllProductsController };
