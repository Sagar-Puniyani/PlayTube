import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comments } from "../models/comment.models.js";
import { Reply } from "../models/reply.models.js";
import mongoose, { mongo } from "mongoose";

const createReply = asyncHandler(async (req, res) => {
  const { commentId, videoId } = req.params;
  const { content } = req.body;

  if ([commentId, videoId].some((feild) => feild.trim() === "")) {
    throw new ApiError(407, "Error In Comment Identification ");
  }

  const commentInstance = await Comments.findById(commentId);
  if (!commentInstance) {
    throw new ApiError(404, "Comment Not Found");
  }

  const replyInstance = await Reply.create({
    content,
    comment: commentId,
    replyedBy: req.user._id,
    video: videoId,
  });

  if (!replyInstance) {
    throw new ApiError(404, "Reply Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, replyInstance, "Reply Created Successfully"));
});

// update the reply
const updateReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const { content } = req.body;

  if (!replyId || !isValidObjectId(replyId)) {
    throw new ApiError(407, "Error In Reply Identification ");
  }

  const replyInstance = await Reply.findById(replyId);
  if (!replyInstance) {
    throw new ApiError(404, "Reply Not Found");
  }

  // only owner can update the reply
  if (req.user?._id.toString() !== replyInstance.replyedBy.toString()) {
    throw new ApiError(403, "You are not allowed to update this reply");
  }

  const updatedReplyInstance = await Reply.findByIdAndUpdate(
    replyId,
    { content },
    { new: true }
  );

  if (!updatedReplyInstance) {
    throw new ApiError(404, "Updatation Failed");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedReplyInstance, "Reply Updated Successfully")
    );
});

const deleteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  if (!replyId || !isValidObjectId(replyId)) {
    throw new ApiError(407, "Error In Reply Identification ");
  }

  const replyInstance = await Reply.findById(replyId);
  if (!replyInstance) {
    throw new ApiError(404, "Reply Not Found");
  }

  // only owner can delete the reply
  if (req.user?._id.toString() !== replyInstance.replyedBy.toString()) {
    throw new ApiError(403, "You are not allowed to delete this reply");
  }

  const deletedReplyInstance = await Reply.findByIdAndDelete(replyId);

  if (!deletedReplyInstance) {
    throw new ApiError(404, "Deletion Failed");
  }

  // Delete the Likes on the reply
  await Likes.deleteMany({ reply: replyId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Reply Deleted Successfully"));
});

const getAllCommentsReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(407, "Error In Comment Identification ");
  }

  const coommentInstance = await Comments.findById(commentId);
  if (!coommentInstance) {
    throw new ApiError(404, "Comment Not Found");
  }

  /*
getting all replies of comment 
1. match with comment id in reply collection
2. lookup user collection who replied to comment
    2.2 project only username and avatar
3. lookup to the likes via id to reply 
4. calculate the feilds likeCount, isLiked, owner
5. sort and project the relevent information

*/

  const ReplyAggregate = await Reply.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(commentId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "replyedBy",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "reply",
        as: "likes",
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        likeCount: 1,
        isLiked: 1,
        owner: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, ReplyAggregate, "Replies Fetched Successfully"));
});

export { createReply, updateReply, deleteReply, getAllCommentsReplies };
