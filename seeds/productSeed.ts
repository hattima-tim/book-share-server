import connectDatabase from "../src/config/database.ts";
import mongoose from "mongoose";
import Product from "../src/models/productSchema.ts";

const seedProducts = [
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    description:
      "A handbook of agile software craftsmanship. Learn to write clean, maintainable code that stands the test of time.",
    price: 32.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760790454/book-share%20project/clean_code_we4vsl.jpg",
    category: "ebook",
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt & David Thomas",
    description:
      "Timeless lessons for becoming a better developer and crafting pragmatic solutions.",
    price: 36.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760790454/book-share%20project/pragmatic_programmer_qd846q.jpg",
    category: "ebook",
  },
  {
    title: "Introduction to Algorithms",
    author:
      "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    description:
      "The definitive textbook on algorithms — rigorous yet accessible to students and professionals.",
    price: 59.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760790454/book-share%20project/intro_to_algo_cskmt9.jpg",
    category: "ebook",
  },
  {
    title: "Design Patterns: Elements of Reusable Object-Oriented Software",
    author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    description:
      "The classic reference for software design patterns that revolutionized modern programming.",
    price: 38.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760790455/book-share%20project/designPatternsCover_yz9dnf.jpg",
    category: "ebook",
  },
  {
    title: "You Don’t Know JS Yet",
    author: "Kyle Simpson",
    description:
      "An in-depth exploration of JavaScript that goes beyond the basics to master the language.",
    price: 27.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760790454/book-share%20project/you_don_t_know_ilxgld.jpg",
    category: "ebook",
  },
  {
    title: "Refactoring: Improving the Design of Existing Code",
    author: "Martin Fowler",
    description:
      "Learn how to make your existing code simpler and more efficient without changing its behavior.",
    price: 41.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760790453/book-share%20project/refact2_lpyfo0.jpg",
    category: "ebook",
  },
  {
    title: "Think Like A Programmer",
    author: "V. Anton Spraul",
    description:
      "Master the fundamentals of clean code and software craftsmanship.",
    price: 29.99,
    imageUrl:
      "https://res.cloudinary.com/du3oueesv/image/upload/v1760789765/book-share%20project/Think-Like-a-Programmer-Spraul-V-Anton-9781593274245_oprdut.jpg",
    category: "ebook",
  },
];

const seedDatabase = async () => {
  try {
    await connectDatabase();

    await Product.deleteMany({});
    console.log("Existing products deleted");

    await Product.insertMany(seedProducts);
    console.log("Products seeded successfully");

    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
