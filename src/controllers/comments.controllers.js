import mongoose, { isValidObjectId } from "mongoose";
import { Comments } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10, sortBy, sortType } = req.query;

  if (!videoId && isValidObjectId(videoId)) {
    throw new ApiError(407, "Error In Video Identification ");
  }

  const videoInstance = await Comments.find({ video: videoId });

  if (!videoInstance) {
    throw new ApiError(404, "Video Not Found");
  }

/*
TODO: get the comments of the video 
1. get the video id and match for the video collectios 
2. lookup users to via owner id  and project relevent fields
3. lookup for likes and calculate likesCount, isLiked, owner
4. project the relevent fields
*/
  const pipeline = [];

  pipeline.push(
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
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
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $arrayElemAt: ["$owner", 0],
        },
        likesCount: {
          $size: "$likes",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
        $project :{
            _id: 1,
            owner: 1,
            replies: 1,
            content: 1,
            createdAt: 1,
            likesCount: 1,
            isLiked: 1,
        }
    }
  );



  if (sortBy && sortType) {
    pipeline.push({ $sort: { [sortBy]: sortType  === "asc" ? 1 : -1} });
  }
  else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  const commentsAggregater = Comments.aggregate(pipeline);

  const Options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };


  const comments = await Comments.aggregatePaginate(commentsAggregater, Options);

  return res
    .status(200)
    .json(new ApiResponse(203, comments, "Comments Fetched Successfully"));

});

// adding comment to video
const addComment = asyncHandler(async (req, res) => {
  const {videoId} = req.params;
  const {content} = req.body;

  if (!videoId && !isValidObjectId(videoId)) {
    throw new ApiError(407, "Error In Video Identification ");
  }

  const videoInstance = await Video.findById(videoId);
  if(!videoInstance) {
    throw new ApiError(404, "Video Not Found");
  }

  if (!content) {
    throw new ApiError(407, "Error In Comment Content ");
  }

  const commentInstance = await Comments.create({
      content,
    owner: req.user._id,
    video: videoId,
  });

  if (!commentInstance) {
    throw new ApiError(404, "Comment Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentInstance, "Comment Added Successfully"));

});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const {content} = req.body.content;

    if (!commentId && !isValidObjectId(commentId)) {
        throw new ApiError(407, "Error In Comment Identification ");
    }

    const commentInstance = await Comments.findById(commentId);
    if(!commentInstance) {
        throw new ApiError(404, "Comment Not Found");
    }

    if (!content) {
        throw new ApiError(407, "Error In Comment Content ");
    }

    const updateCommentInstance = await Comments.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    );

    if (!updateCommentInstance) {
        throw new ApiError(404, "Comment Not Found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateCommentInstance, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId && !isValidObjectId(commentId)) {
    throw new ApiError(407, "Error In Comment Identification ");
  }

  const commentInstance = await Comments.findById(commentId);
  if(!commentInstance) {
    throw new ApiError(404, "Comment Not Found");
  }

  const deleteCommentInstance = await Comments.findByIdAndDelete(commentId);


  //  delete Likes on the comment
  await Likes.deleteMany({ comment: commentId }); 

  // delete replies on the comment
  await Comments.deleteMany({ replies: commentId });

  if (!deleteCommentInstance) {
    throw new ApiError(404, "Comment Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteCommentInstance, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
