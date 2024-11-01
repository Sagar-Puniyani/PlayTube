import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  {
    timestamps: true,
  }
);

export const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);
