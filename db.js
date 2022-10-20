import mongoose from "mongoose";
import password from "./password.js";

const MONGODB_URI = `mongodb+srv://andlego:${password}@graphql.2c9mv0m.mongodb.net/?retryWrites=true&w=majority`;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.error("error connection to MongoDB", error.message);
  });
