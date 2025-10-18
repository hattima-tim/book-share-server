import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ["ebook", "course", "template", "software", "other"],
      required: true,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", ProductSchema);
