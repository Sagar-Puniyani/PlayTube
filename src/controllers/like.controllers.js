import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Comments } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// toggle video like
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId && !isValidObjectId(videoId)) {
    throw ApiError(407, "Error In Video Identification ");
  }

  const videoInstance = await Video.findById(videoId);
  if (!videoInstance) {
    throw new ApiError(404, "Video Not Found");
  }

  const AlreadyLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (AlreadyLiked) {
    await Like.findByIdAndDelete(AlreadyLiked._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Video Unliked Successfully")
      );
  }

  await Like.create({
    video: videoId,
    likedBy: req.user._id,
    likedType: "Video",
  });

  return res.status(200).json(new ApiResponse(200, { isLiked: true }));
});

// toggle comment like
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId, videoId } = req.params;

  if (!commentId && !isValidObjectId(commentId)) {
    throw ApiError(407, "Error In Comment Identification ");
  }

  if (!videoId && !isValidObjectId(videoId)) {
    throw ApiError(407, "Error In Video Identification ");
  }

  const commentInstance = await Comments.findById(commentId);
  if (!commentInstance) {
    throw new ApiError(404, "Comment Not Found");
  }

  const AlreadyLiked = await Like.findOne({
    video: videoId,
    comment: commentId,
    likedBy: req.user._id,
  });

  if (AlreadyLiked) {
    await Like.findByIdAndDelete(AlreadyLiked._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Comment Unliked Successfully")
      );
  }

  await Like.create({
    video: videoId,
    comment: commentId,
    likedBy: req.user._id,
    likedType: "Comment",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { isLiked: true }, "Comment Liked Successfully")
    );
});

// Toggle Tweet Like
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId && !isValidObjectId(tweetId)) {
    throw ApiError(407, "Error In Tweet Identification ");
  }

  const tweetInstance = await Tweet.findById(tweetId);
  if (!tweetInstance) {
    throw new ApiError(404, "Tweet Not Found");
  }

  const AlreadyLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (AlreadyLiked) {
    await Like.findByIdAndDelete(AlreadyLiked._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Tweet Unliked Successfully")
      );
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req?.user?._id,
    likedType: "Tweet",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Tweet Liked Successfully"));
});

// Toggle Reply Like
const toggleReplyLike = asyncHandler(async (req, res) => {
  const { replyId, videoId } = req.params;

  if (!replyId && !isValidObjectId(replyId)) {
    throw ApiError(407, "Error In Reply Identification ");
  }
  if (!videoId && !isValidObjectId(videoId)) {
    throw ApiError(407, "Error In Video Identification ");
  }

  const replyInstance = await Reply.findById(replyId);
  if (!replyInstance) {
    throw new ApiError(404, "Reply Not Found");
  }

  const AlreadyLiked = await Like.findOne({
    video: videoId,
    reply: replyId,
    likedBy: req.user?._id,
  });

  if (AlreadyLiked) {
    await Like.findByIdAndDelete(AlreadyLiked._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Reply Unliked Successfully")
      );
  }

  await Like.create({
    video: videoId,
    reply: replyId,
    likedBy: req?.user?._id,
    likedType: "Reply",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Reply Liked Successfully"));
});

// get All Likes on Videos
const getLikedVideos = asyncHandler(async (req, res) => {
  /*
getLikedVideos
1. match the current user and liked type videos
2. lookup to the video to get the details of the video( name as likedVideos)
    2.1 lookup user to get the details of the owner ( name as ownerDetails) 
    2.2 unwind the array of OwnerDetails to spread information
3. unwind the array of likedVideos to spread information
4. sort by createdAt and project the information
*/

  const LikedVideoAggregation = await Like.aggregate([
    {
      $match: {
        likedType: "Video",
        likedBy: mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    //  project all data without _id
    {
      $project: {
        _id: 0,
        likedVideo: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          owner: 1,
          titel: 1,
          description: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          isPublished: 1,
          ownerDetails: {
            username: 1,
            fullName: 1,
            avatar: 1,
            _id: 1,
          },
        },
      },
    },
  ]);
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  toggleReplyLike,
  getLikedVideos,
};
