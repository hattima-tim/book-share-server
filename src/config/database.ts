import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL!);

    console.log(`Mongodb connected: ${conn.connection.host}`);

    process.on("SIGINT", async () => {
      await mongoose.connection.close();

      console.log("Mongodb connection closed for app termination");
      process.exit(0);
    });
  } catch (e) {
    console.log(`Database connection error:`, e);
    process.exit(1);
  }
};

export default connectDatabase;
