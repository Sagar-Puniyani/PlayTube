import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId && !isValidObjectId(channelId)) {
    res.json(new ApiError(407, "Error In Channel Identification "));
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel Not Found");
  }

  const isSubscribed = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subscription.deleteOne({
      subscriber: req.user._id,
      channel: channelId,
    });

    return res.json(
      new ApiResponse(200, { subscribed: false }, "Unsubscribed Successfully")
    );
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res.json(
    new ApiResponse(200, { subscribed: true }, "Subscribed Successfully")
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId && !isValidObjectId(channelId)) {
    res.json(new ApiError(407, "Error In Channel Identification "));
  }

  // This query retrieves the subscribers of a specific channel.
  // For each subscriber, it fetches user details (username, full name, avatar).
  // It also checks if the current user is subscribed to the same channel as each subscriber.
  // The total number of subscribers for each user is calculated and returned.

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(req?.user?._id),
                      "$subscribedToSubscriber.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
              subscriptionCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribedToSubscriber: 1,
              subscriptionCount: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribers: {
          $first: "$subscribers",
        },
      },
    },
    {
      $project: {
        _id: 1,
        subscribers: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers List"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId && !isValidObjectId(subscriberId)) { {
    res.json(new ApiError(407, "Error In Subscription Identification "));
  }
}

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToChannel",
            },
          },
          {
            $addFields: {
              subscritionsCount: {
                $size: "$subscribedToChannel",
              },
            },
          },
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
              pipeline: [
                {
                  $match: {
                    ispublished: true,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    isPublished: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
                Lastvideo: {
                    $cond:{
                        if: { $gt: [{$size: "$videos"}, 0]},
                        then:{$last: "$videos"},
                        else: null
                }
            }
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              subscribedToChannel: 1,
              subscritionsCount: 1,
              videos: 1,
              Lastvideo: 1,
            },
          }
        ],
      },
    },
    {
        $addFields: {
            subscribedChannel: {
                $first: "$subscribedChannel",
            }
        }
    },
    {
        $project: {
            _id: 1,
            subscribedChannel: 1,
            createdAt: 1
        },
    },
    {
        $sort: {
            createdAt: -1
        }
    }
  ]);

});

  

  return res
        .status(200)
        .json(new ApiResponse(200, subscribedChannels, "Subscribed Channels List"));


export { toggleSubscription,
     getUserChannelSubscribers, 
     getSubscribedChannels };
