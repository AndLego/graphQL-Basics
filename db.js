import mongoose from "mongoose";
import * as dotev from "dotenv"

dotev.config()

const MONGODB_URI = process.env.DATABASE_URL

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.error("error connection to MongoDB", error.message);
  });
