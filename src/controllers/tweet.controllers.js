import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  if (!owner) {
    res.json(new ApiError(407, "User is Not Found "));
  }

  const { content } = req.body;

  if (!content) {
    res.send(new ApiResponse(406, {}, "Add some Content to Tweet"));
  }

  const tweetInstance = await Tweet.create({
    owner,
    content,
  });

  if (!tweetInstance) {
    res.json(new ApiError(409, "Error while creating tweet"));
  }

  res.status(200).json(new ApiResponse(200, tweetInstance, "User is Created "));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !isValidObjectId(userId)) {
    res.json(new ApiError(408, "Object Id is Invalid "));
  }

  /*
    const tweets = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets",
            }
            
        },
        {
            $project: {
                username : 1,
                fullname : 1 ,
                email : 1 ,
                tweets : 1,
                avatar : 1
            }
        },
        {
            $unwind: {
                path: '$tweets',
            }
        },
        {
            $lookup: {
                from:  "likes",
                localField: "tweets._id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likes : {
                    $size : { $ifNull : ['$likes' , []]}
                }
            }
        }
    ])
        */

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        likecount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req?.user?._id, "$likes.likedBy"],
            },
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
        likecount: 1,
        owner: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!tweets) {
    res.json(new ApiError(410, "Error in Populating Database Call"));
  }

  return res.json(new ApiResponse(200, tweets, "Tweets and Their Likes"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params?.tweetId;

  if (!tweetId || !isValidObjectId(tweetId)) {
    {
      res.json(new ApiError(409, "Invalid Tweet Signature"));
    }

    const tweentInstance = await Tweet.findById(tweetId);

    if (!tweentInstance) {
      res.json(new ApiError(409, "Invalid Tweet Signature"));
    }

    if (!tweentInstance?.owner.equals(req.user?._id)) {
      throw new ApiResponse(409, "User is not authorized to update this tweet");
    }

    const { content } = req.body;

    if (!content) {
      res.json(new ApiError(407, "Add Some Content to tweet"));
    }

    const updatedtweetInstance = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedtweetInstance) {
      res.json(new ApiError(407, "Error in the Updatation of Tweet"));
    }

    res.json(
      new ApiResponse(
        200,
        updatedtweetInstance,
        "Updation is Done Successfully !! "
      )
    );
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params?.tweetId;

  if (!tweetId) {
    res.json(new ApiError(409, "Invalid Tweet Signature"));
  }

  const tweetInstance = await Tweet.findById(tweetId);

  if (!tweetInstance) {
    throw new ApiError(409, "Invalid Tweet Signature");
  }

  if (tweetInstance.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Only tweet owner can delete this tweet");
  }

  const deleteTweetInstance = await Tweet.deleteOne({
    _id: new mongoose.Types.ObjectId(tweetId),
  });

  if (!deleteTweetInstance) {
    res.json(new ApiError(408, "Error While Deletion of the Tweet"));
  }
  // Likes and Comments deletion
  await Like.deleteMany({ tweets: tweetId });
  await Comment.deleteMany({ tweet: tweetId });

  res.json(
    new ApiResponse(200, deleteTweetInstance, "Deletion Process is Done")
  );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
