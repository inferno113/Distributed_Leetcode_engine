import "dotenv/config";
import mongoose from "mongoose";

import app from "./app.js";

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI;

const startServer = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  await mongoose.connect(MONGODB_URI);

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
