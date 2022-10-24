import mongoose from "mongoose";

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minLenth: 3,
  },
  password: {
    type: String,
    required: true,
    unique: true,
    minLenth: 4,
  },
  friends: [
    {
      ref: "Person",
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
});

export default mongoose.model("User", schema);
