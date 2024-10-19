import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscriptions.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req?.user?._id;
  if (!userId && !isValidObjectId(userId)) {
    throw ApiError(407, "User Not Found");
  }

  const userInstance = await findById(userId);
  if (!userInstance) {
    throw ApiError(404, "User Not Matched");
  }

/*
todo: getChannelstats:- total video views, total subscribers, total videos, total likes etc
- subscription data and video data
1. match the channle with the user
   1.1 group the all and sum them
2. match the channel with the video with owner feild
   2.1 lookup with likes and exclude the comments and replies
   2.2 add the likesCount and TotalViews
   2.3 group them all and sum them
3. combine the relevent feild and return

*/


  // getting Subcribers data
  const subscribersAggregation = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        subscriptionCount: {
          $sum: 1,
        },
      },
    },
  ]);

  // getting Videos data
  const videosAggregation = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
        pipeline: [
          {
            $match: {
              comment: {$exists: false},
              reply: {$exists : false},
            },
          },
        ],
      },
    },
    {
        $addFields: {
            likesCount: {$size: "$likes"},
            TotalViews: {$size: "$views"},
        },
    },
    {
        $group: {
            _id: null,
            totalLikes: {$sum: "$likesCount"},
            totalVideos: {$sum: 1},
            totalViews: {$sum: "$TotalViews"},
        },
    }
  ]);

  // combining channel stats
  const channelStats = {
    subscribers: subscribersAggregation[0]?.subscriptionCount || 0,
    videos: videosAggregation[0]?.totalVideos || 0,
    likes: videosAggregation[0]?.totalLikes || 0,
    views: videosAggregation[0]?.totalViews || 0,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel Stats"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req?.user?._id);
    if (!userId && !isValidObjectId(userId)) {
        throw ApiError(407, "User Not Found");
    }

    const VideosDetails = await Video.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $addFields: {
                createdAt: {
                    $dateToParts : {
                        date : "$createdAt",
                    }
                }
            }
        },
        {
            $sort :{
                createdAt : -1
            }
        },
        {
            $project :{ 
                _id: 1,
                title: 1,
                videoFile: 1,
                thumbnail: 1,
                description: 1,
                isPublished: 1,
                createdAt: 1,
                commentSection: 1,
            }
        }
    ]);


    return res
        .status(200)
        .json(new ApiResponse(200, VideosDetails, "Channel Videos"));

});

export { getChannelStats, getChannelVideos };
