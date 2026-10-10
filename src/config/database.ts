import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  });

  console.log("MongoDB connected successfully");
}