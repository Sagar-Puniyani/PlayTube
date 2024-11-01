import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Comments } from "../models/comment.models.js";
import { Like } from "../models/like.models.js";
import { Reply } from "../models/reply.models.js";
import {
  uploadOnCloudinary,
  UploadVideoOnCloudinary,
  deleteVideoFromClouydinary,
  deleteFromClouydinary,
} from "../utils/cloudinary.js";
import { WatchHistory } from "../models/watchHistory.models.js";

const getAllVideos = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      query,
      sortBy = "createdAt",
      sortType = "desc",
      channelUserId,
    } = req.query;
    const userId = req.user?._id;

    console.log("🚀 ~ file: video.controllers.js:~getAllVideos");
    console.log("page:", page, "limit:", limit);
    console.log("query:", query);
    console.log("sortBy:", sortBy);
    console.log("sortType:", sortType);
    console.log("channelUserId:", channelUserId);
    console.log("userId:", userId);

    const sortedOrder = sortType === "asc" ? 1 : -1;

    // Aggregation pipeline
    const pipeline = [
      {
        $match: {  ispublished: true },
      },
    ];

    if (!userId || !isValidObjectId(userId)) {
      return res.status(405).json(new ApiError(405, "User is not logged in properly"));
    }

    if (channelUserId && isValidObjectId(channelUserId)) {
      pipeline.push({
        $match: { owner: new mongoose.Types.ObjectId(channelUserId) },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "channel",
          pipeline: [
            {
              $project: { _id: 0, username: 1, avatar: 1 },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: { $first: "$channel" },
        },
      },
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          owner: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          updatedAt: 1,
          isPublished: 1,
          views: 1,
          commentSection: 1,
        },
      }
    );

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: query, $options: "im" } },
            { description: { $regex: query, $options: "im" } },
            { "owner.username": { $regex: query, $options: "im" } },
          ],
        },
      });
    }

    pipeline.push({
      $sort: { [sortBy]: sortedOrder },
    });

    // Pagination options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    console.log("Aggregation Pipeline:", JSON.stringify(pipeline));

    // Aggregate and paginate
    const videoAggregate = Video.aggregate(pipeline);
    const videoInstances = await Video.aggregatePaginate(videoAggregate, options);

    if (!videoInstances.docs.length) {
      return res.status(410).json(new ApiError(410, "Error in populating database call"));
    }

    return res.status(200).json(new ApiResponse(200, videoInstances, "Feed Videos"));
  } catch (error) {
    console.log("Error:", error.message);
    return res.status(500).json(new ApiError(500, "Server Error: " + error.message));
  }
});


const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    /*
            1. Take title and description from request querry 
            2. take Video and thumbnail files from request 
            3. upload files in cloudinay
            4. Take its duration 
            5. owner id come from the authToken 
            6. default publish status of video is true 
            7. No. of Views on the video ( default is 0 )
         */

    const userId = req.user?._id;
    if (!userId) {
      res.json(new ApiError(407, "User Never Logged In"));
    }

    if (!(title && description)) {
      res.json(new ApiError(410, "Title and Description are required"));
    }

    console.log("Title : ", title);
    console.log("description : ", description);

    const videofilePath = req.files?.videoFile[0]?.path;
    const thumbnailPath = req.files?.thumbnail[0]?.path;

    console.log("videofilePath ", videofilePath);
    console.log("thumbnailPath ", thumbnailPath);

    if (!videofilePath) {
      res.json(new ApiError(409, "Video File Not send Properly"));
    }

    if (!thumbnailPath) {
      res.json(new ApiError(411, "Thumbnail File Not send Properly"));
    }

    const uploadThumbnail = await uploadOnCloudinary(thumbnailPath);
    console.log("uploadThumbnail : ", uploadThumbnail);
    const uploadedVideo = await UploadVideoOnCloudinary(videofilePath);
    console.log(
      "uploadedVideo.duration 👀👀👀 : ",
      uploadedVideo.duration,
      " sec "
    );
    console.log("Public URL ID : ", uploadedVideo.public_id);

    console.log("First");
    const videoInstance = await Video.create({
      title,
      description,
      owner: userId,
      videofile: uploadedVideo.url,
      thumbnail: uploadThumbnail.url,
      duration: uploadedVideo.duration,
      views: 0,
      isPublished: true,
      commentSection: true,
    });
    console.log("Second");

    if (!videoInstance) {
      res.json(new ApiError(415, "Error While Upload Video To Database"));
    }

    console.log("👀👀👀👀👀videoInstance  : ", videoInstance);

    res.json(
      new ApiResponse(200, { data: videoInstance }, "Upload Video Successfully")
    );
  } catch (error) {
    res.json(new ApiError(500, "Server Error " + error.message));
  }
});

const getVideoById = asyncHandler(async (req, res) => {
     /*
        if video is get to UI on Video Player than 
        view Count should be increased by +1(having the separate function)
        in different controller
        and its impact on another tables
     */
  try {
    const { videoId } = req.params;
    //TODO: get video by id
    if (!videoId || !isValidObjectId(videoId)) {
      return res.json(new ApiError(409, "Video Id is Not properly Conveyed"));
    }
    console.log("Video ID : ", videoId);

    const videoInstance = await Video.findById(videoId);
    console.log("Video Found");
    if (!videoInstance) {
      return res.json(new ApiError(407, "Video Database is Not Uploaded"));
    }

    console.log("Video Instance : ", videoInstance);
    console.log("Aggregation Started");

    // const videoAggregate = await Video.aggregate([
    //   {
    //     $match: {
    //       _id: mongoose.Types.ObjectId(videoId),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "owner",
    //       foreignField: "_id",
    //       as: "owner",
    //       pipeline: [
    //         {
    //           $lookup: {
    //             from: "subscriptions",
    //             localField: "_id",
    //             foreignField: "channel",
    //             as: "subscriptions",
    //           },
    //         },
    //         {
    //           $addFields: {
    //             subscribersCount: {
    //               $size: "$subscriptions",
    //             },
    //             isSubscribed: {
    //               $cond: {
    //                 if: {
    //                   $in: [req?.user?._id, "$subscriptions.subscriber"],
    //                 },
    //                 then: true,
    //                 else: false,
    //               },
    //             },
    //           },
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             username: 1,
    //             avatar: 1,
    //             subscribersCount: 1,
    //             isSubscribed: 1,
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "likes",
    //       localField: "_id",
    //       foreignField: "video",
    //       as: "likes",
    //       pipeline: [
    //         {
    //           $match: {
    //             comment: { $exists: false },
    //             reply: { $exists: false },
    //           },
    //         },
    //       ],
    //     },
    //   },
    //   {
    //     $addFields: {
    //       owner: {
    //         $first: "$owner",
    //       },
    //       likecount: {
    //         $size: "$likes",
    //       },
    //       isLiked: {
    //         $cond: {
    //           if: {
    //             $in: [req?.user?._id, "$likes.likedBy"],
    //           },
    //           then: true,
    //           else: false,
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       videoFile: 1,
    //       owner: 1,
    //       title: 1,
    //       description: 1,
    //       duration: 1,
    //       createdAt: 1,
    //       views: 1,
    //       likesCount: 1,
    //       isLiked: 1,
    //       thumbnail: 1,
    //       commentSection: 1,
    //     },
    //   },
    // ]);

    const videoAggregate = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
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
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriptions",
              },
            },
            {
              $addFields: {
                subscribersCount: {
                  $size: "$subscriptions", // Corrected typo: 'subscribersCount'
                },
                isSubscribed: {
                  $cond: {
                    if: {
                      $in: [new mongoose.Types.ObjectId(req?.user?._id), "$subscriptions.subscriber"], // Ensure req.user._id is passed
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                isSubscribed: 1, // Consistent field name
              },
            },
          ],
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
                comment: { $exists: false },
                reply: { $exists: false },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
          likesCount: {
            $size: "$likes", // Consistent naming: likesCount
          },
          isLiked: {
            $cond: {
              if: {
                $in: [new mongoose.Types.ObjectId(req?.user?._id), "$likes.likedBy"], // Ensure req.user._id is passed
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          videoFile: 1,
          owner: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          views: 1,
          likesCount: 1, // Use consistent field name
          isLiked: 1,
          thumbnail: 1,
          commentSection: 1,
        },
      },
    ]);
     

    if (!videoAggregate  || videoAggregate.length === 0) {
      return res.json(new ApiError(407, "Video Database is Not Full populated"));
    }

    console.log("Video Aggregate : ", videoAggregate);

    return res.json(
      new ApiResponse(206, { data: videoInstance }, { message: "Video Found" })
    );
  } catch (error) {
    console.error("Error in Get Video By Id: ", error.message);
    res.status(404) .json(new ApiError(404, "Error Get Video By Id " + error.message));
  }
});



const incrementVideoCount = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    return res.json(new ApiError(406, "Video Identity didn't provided"));
  }

  const updationInVideoInstance = {
    $inc: {
      views: 1,
    },
  };
  const videoInstance = await Video.findByIdAndUpdate(
    videoId,
    updationInVideoInstance,
    { new: true }
  );

  if (!videoInstance) {
    return res.json(new ApiError(407, "Video Database is Not Uploaded"));
  }
  return res.json(
    new ApiResponse(
      206,
      { data: videoInstance },
      { message: "View Count Increment" }
    )
  );
});

const addToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    return res.json(new ApiError(406, "Video Identity didn't provided"));
  }

  const videoInstance = await Video.findById(videoId);

  if (!videoInstance) {
    return res.json(new ApiError(407, "Video Database is Not Uploaded"));
  }

  // add video to watch history
  const watchHistory = await WatchHistory.create({
    userId: req.user?._id,
    videoId: videoId,
  });

  if (!watchHistory) {
    return res.json(new ApiError(507, "Failed To Add To Watch History"));
  }

  return res.json(
    new ApiResponse(
      206,
      { data: watchHistory },
      { message: "Added To Watch History" }
    )
  );
});

const deletParticularVideoFromWatchHistory = asyncHandler(async (req, res) => {
  
  console.log("🧐 ~route: /wh/:watchHistoryId , deletewatchHistory")
  const watchHistoryId = req.params.id;
  console.log("watchHistoryId : ", req.params);


  if (!watchHistoryId || !isValidObjectId(watchHistoryId)) {
    return res.status(406).json(
      new ApiError(406, "Watch History Identity didn't provided")
    );
  }


  const watchHistoryInstance =
    await WatchHistory.findByIdAndDelete(watchHistoryId);

  if (!watchHistoryInstance) {
    return res.json(
      new ApiError(407, "Video From WatchHistory is Not Uploaded")
    );
  }

  return res.json(
    new ApiResponse(
      206,
      { data: watchHistoryInstance },
      { message: "Deleted From Watch History" }
    )
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    // update video details like title, description, thumbnail

    if (!videoId || !isValidObjectId(videoId)) {
      return res.json(new ApiError(406, "Video Identity didn't provided"));
    }

    const videoPreviousInstance = await Video.findById(videoId);

    if (!videoPreviousInstance) {
      return res.json(new ApiError(407, "Video is Not Found"));
    }

    const previousVideoUrl = videoPreviousInstance.thumbnail;

    console.log("video Id : ", videoId);

    const { title, description, thumbnail } = req.body;
    const updateFilter = {};

    if (!(title || description || thumbnail)) {
      return res.json(new ApiError(409, "There no change detected"));
    }

    if (title) updateFilter.title = title;
    if (description) updateFilter.description = description;

    const thumbnailPath = req.file?.path;
    console.log("thumbnailPath : ", thumbnailPath);
    if (thumbnailPath) {
      const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);
      updateFilter.thumbnail = uploadedThumbnail.url;
    }

    console.log(" Update Filter : ", updateFilter);

    const videoInstance = await Video.findByIdAndUpdate(videoId, updateFilter, {
      new: true,
    });

    console.log("videoInstance : ", videoInstance);
    if (!videoInstance) {
      return res.json(new ApiError(408, "There No Database Instance"));
    }

    // delete previous video from cloudinary
    if (previousVideoUrl) {
      const publicUrlID = videoPreviousInstance.videofile
        .split("videos/")[1]
        .split(".")[0];
      await deleteVideoFromClouydinary("videos/" + publicUrlID);
    }

    return res.json(
      new ApiResponse(
        207,
        { data: videoInstance },
        { message: "Video Update Successfully" }
      )
    );
  } catch (error) {
    res.json(new ApiError(404, "Error Get Video By Id " + error.message));
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    // delete video

    if (!videoId || !isValidObjectId(videoId)) {
      res.status(209).json(new ApiError(209, "There no change detected"));
    }

    // 1. first is to delete Video from Cloudinary
    const videoInstance = await Video.findById(videoId);
    console.log("Video Url : ", videoInstance.videofile);

    if (!videoInstance) {
      return res.json(
        new ApiError(408, "VideoInstance is not found  properly")
      );
    }

    const DeleteVideo = await Video.findByIdAndDelete(videoId);
    console.log(" Deletion of Document ❌: ", DeleteVideo);

    if (!DeleteVideo) {
      return res.json(new ApiError(408, "Video is not Deleted  properly"));
    }

    const publicVideoUrlID = videoInstance.videofile
      .split("videos/")[1]
      .split(".")[0];
    console.log("publicVideoUrlID : ", publicVideoUrlID);
    const publicThumbnailUrl = videoInstance.thumbnail
      .split("assets/")[1]
      .split(".")[0];
    console.log("publicThumbnailUrl : ", publicThumbnailUrl);



    await deleteVideoFromClouydinary("videos/" + publicVideoUrlID);
    await deleteFromClouydinary("assets/" + publicThumbnailUrl);

    // Delete Video, Videos Comments and comment Replies Likes
    await Like.deleteMany({ video: videoId });
    await Comments.deleteMany({ video: videoId });
    await Reply.deleteMany({ video: videoId });
    await WatchHistory.deleteMany({ videoId: videoId });

    console.log("Video Deletion is Done");
    return res.json(
      new ApiResponse(
        201,
        DeleteVideo ,
        { message: "Video Deletion is Done" }
      )
    );
  } catch (error) {
    console.log("Error : ", error);
    return res.json(new ApiError(404, "Error Delete Video By Id " + error.message));
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
      res.json(new ApiError(209, "There no change detected"));
    }
    const videoInstance = await Video.findById(videoId);
    const ToggleStatus = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          ispublished: !videoInstance.ispublished,
        },
      },
      {
        new: true,
      }
    );

    if (!videoInstance) {
      return res.json(new ApiError(403, "Video Did not Get By Database"));
    }
    if (!ToggleStatus) {
      return res.json(new ApiError(403, "Video Did not Get By Database"));
    }

    return res.json(
      new ApiResponse(
        200,
        { data: ToggleStatus },
        { message: "Togglge Publish Status" }
      )
    );
  } catch (error) {
    res.json(
      new ApiError(404, "Error Toggle Video Status " + error.message)
    );
  }
});

const toggleCommentSection = asyncHandler(async (req, res) => {
  try {
    console.log("🚀 ~ file: video.controllers.js:toggleCommentSection ~ toggleCommentSection:")
    const { videoId } = req.params;
  
    if (!videoId || !isValidObjectId(videoId)) {
      res.status(209).json(new ApiError(209, "There no change detected"));
    }
  
    const videoInstance = await Video.findById(videoId);
    console.log("videoInstance : ", videoInstance);
  
    // only owner can toggle comment section
    if (videoInstance?.owner.toString() !== req?.user?._id) {
      return res.status(403).json(new ApiError(403, "Only Owner Can Toggle Comment Section"));
    }
  
    const ToogleCommentSection = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          commentSection: !videoInstance.commentSection,
        },
      },
      {
        new: true,
      }
    );
  
    console.log("ToogleCommentSection : ", ToogleCommentSection);
  
    if (!ToogleCommentSection) {
      return res.status(409).json(new ApiError(403, "Video Did not Get By Database"));
    }
  
    return res
      .status(200)
      .json(
      new ApiResponse(
        200,
        { commentSection: ToogleCommentSection.commentSection },
        { message: "Togglge Comment Section" }
      )
    );
  } catch (error) {
    console.error("Error : ", error.message);
    return res.json(new ApiError(404, "Error Toggle Comment Section " + error.message));
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  incrementVideoCount,
  addToWatchHistory,
  deletParticularVideoFromWatchHistory,
  togglePublishStatus,
  toggleCommentSection,
};
