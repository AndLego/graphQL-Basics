import mongoose from "mongoose";
import password from "./password";

const MONGODB_URI = `mongodb+srv://admin-andres:${password}@cluster0.kcz9p.mongodb.net/?retryWrites=true&w=majority`;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.error("error connection to MongoDB", error.message);
  });
