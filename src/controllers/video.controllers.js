import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Comments } from "../models/comment.models.js"
import { Like } from "../models/like.models.js"
import { Reply } from "../models/reply.models.js"
import {
    uploadOnCloudinary,
    UploadVideoOnCloudinary,
    deleteVideoFromClouydinary,
    deleteFromClouydinary,
} from "../utils/cloudinary.js"
import { WatchHistory } from "../models/watchHistory.models.js";


// get All video is for default UI of PlayTube according to page and limit
const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, channelUserId } = req.query;
        const userId = req.user?._id;


        // Aggregation pipeline injecting on the need basis 
        // When ever query fired pipeline must be changed according to that.🧐
        pipeline = [];

        if (!userId && !isValidObjectId(userId)) {
            res.json(
                new ApiError(405, "User is logged In Properly")
            )
        }

        // channelUserId is the Id of User who owns the particular channel
        if (channelUserId) {
            pipeline.push({
                $match: {
                    owner: new mongoose.Types.ObjectId.createFromHexString(userId)
                }
            })
        }

        // // query for thumbnail 
        // if (thumbnailQuery) {
        //     pipeline.push({
        //         $match: {
        //             thumbnail: {
        //                 $regex: thumbnailQuery,
        //                 $options: 'im'
        //             }
        //         }
        //     })
        // }


        // is video Published 
        pipeline.push({
            $match: {
                ispublished: true
            }
        })

        // User Details 
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            _id: 0,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
            {
                $addFields: {
                    owner: {
                        $first: "$channel"
                    }
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
                }
            }
        );

        // query for title 
        if (query) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: query, $options: 'im' } },
                        { description: { $regex: query, $options: 'im' } },
                        { "owner.username": { $regex: query, $options: 'im' } },
                    ]
                }
            })
        }

        // sorting on basis of sortBy and type of sort is sortType
        if (sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortType === "acs" ? 1 : -1
                }
            })
        }
        else {
            pipeline.push({
                $sort: {
                    createdAt: -1
                }
            })
        }

        // page and limit of videos 
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        }

        // Instances of those video output query 
        const VidoeInstances = await Video.aggregate(pipeline, options);

        /*
        const videoInstances = await Video.aggregate(pipeline).skip((options.page - 1) * options.limit).limit(options.limit);
        */
        if (!VidoeInstances) {
            res.json(
                new ApiError(410, "Error in Populating Database Call")
            )
        }

        return res.json(
            new ApiResponse(
                200, VidoeInstances, "Feed Videos"
            )
        )
    } catch (error) {
        res.json(
            new ApiError(500, "Server Error " + error.message)
        )
    }


})

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
            res.json(
                new ApiError(407, "User Never Logged In")
            )
        }

        if (!(title && description)) {
            res.json(
                new ApiError(410, "Title and Description are required")
            )
        }

        console.log("Title : ", title);
        console.log("description : ", description);


        const videofilePath = req.files?.videoFile[0]?.path;
        const thumbnailPath = req.files?.thumbnail[0]?.path;

        console.log("videofilePath ", videofilePath);
        console.log("thumbnailPath ", thumbnailPath);

        if (!videofilePath) {
            res.json(
                new ApiError(409, "Video File Not send Properly")
            )
        }

        if (!thumbnailPath) {
            res.json(
                new ApiError(411, "Thumbnail File Not send Properly")
            )
        }

        const uploadThumbnail = await uploadOnCloudinary(thumbnailPath);
        console.log("uploadThumbnail : ", uploadThumbnail);
        const uploadedVideo = await UploadVideoOnCloudinary(videofilePath);
        console.log("uploadedVideo.duration 👀👀👀 : ", uploadedVideo.duration, " sec ");
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
            commentSection: true
        })
        console.log("Second");


        if (!videoInstance) {
            res.json(
                new ApiError(415, "Error While Upload Video To Database")
            )
        }

        console.log("👀👀👀👀👀videoInstance  : ", videoInstance);

        res.json(
            new ApiResponse(200, { "data": videoInstance }, "Upload Video Successfully")
        )
    } catch (error) {
        res.json(
            new ApiError(500, "Server Error " + error.message)
        )
    }
})

const getVideoById = asyncHandler(async (req, res) => {

    /*
        if video is get to UI on Video Player than 
        view Count should be increased by +1
        in different controller
        and its impact on another tables
     */
    try {
        const { videoId } = req.params
        //TODO: get video by id
        if (!videoId && !isValidObjectId(videoId)) {
            return res.json(
                new ApiError(409, "Video Id is Not properly Conveyed")
            )
        }
        console.log("Video ID : ", videoId);


        const videoInstance = await Video.findById(videoId);
        console.log("Video Found");
        if (!videoInstance) {
            return res.json(
                new ApiError(407, "Video Database is Not Uploaded")
            )
        }

        const video = await Video.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(videoId)
                }
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
                                foreignField: "owner",
                                as: "subscriptions",
                            }
                        },
                        {
                            $addFields: {
                                subcribersCount: {
                                    $size: "$subscriptions"
                                },
                                issubscribed: {
                                    $cond: {
                                        if: {
                                            $in: [req?.user?._id, "$subscriptions.subscriber"]
                                        },
                                        then: false,
                                        else: true
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                                subscribersCount: 1,
                                isSubscribed: 1,
                            }
                        }
                    ]
                }
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
                                reply: { $exists: false }
                            }
                        }
                    ]

                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    },
                    likecount: {
                        $size: "$likes"
                    },
                    isLiked: {
                        $cond: {
                            if: {
                                $in: [req?.user?._id, "$likes.likedBy"]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
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
                    likesCount: 1,
                    isLiked: 1,
                    thumbnail: 1,
                    commentSection: 1,
                }
            }
        ]);

        if (!video || video.length === 0) {
            new ApiResponse(400, { message: "Video Not Found" });
        }

        return res.json(
            new ApiResponse(206, { data: videoInstance }, { message: "Video Found" })
        )
    } catch (error) {
        res.json(
            new ApiError(404, "Error Get Video By Id " + error.message)
        )
    }
})

const incrementVideoCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId && !isValidObjectId(videoId)) {
        return res.json(
            new ApiError(406, "Video Identity didn't provided")
        )
    }

    const updationInVideoInstance = {
        $inc: {
            views: 1
        }
    }
    const videoInstance = await Video.findByIdAndUpdate(videoId, updationInVideoInstance, { new: true });

    if (!videoInstance) {
        return res.json(
            new ApiError(407, "Video Database is Not Uploaded")
        )
    }
    return res.json(
        new ApiResponse(206, { data: videoInstance }, { message: "View Count Increment" })
    )
});

const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId && !isValidObjectId(videoId)) {
        return res.json(
            new ApiError(406, "Video Identity didn't provided")
        )
    }

    const videoInstance = await Video.findById(videoId);

    if (!videoInstance) {
        return res.json(
            new ApiError(407, "Video Database is Not Uploaded")
        )
    }

    // add video to watch history
    const watchHistory = await WatchHistory.create({
        userId: req.user?._id,
        video: videoId,
    })

    if (!watchHistory) {
        return res.json(
            new ApiError(507, "Failed To Add To Watch History")
        )
    }

    return res.json(
        new ApiResponse(206, { data: watchHistory }, { message: "Added To Watch History" })
    )
});

const deletParticularVideoFromWatchHistory = asyncHandler(async (req, res) => {
    const watchHistoryId = req.params.watchHistoryId;

    if (!watchHistoryId && !isValidObjectId(watchHistoryId)) {
        return res.json(
            new ApiError(406, "Watch History Identity didn't provided")
        )
    }

    const watchHistoryInstance = await WatchHistory.findByIdAndDelete(watchHistoryId);

    if (!watchHistoryInstance) {
        return res.json(
            new ApiError(407, "Video From WatchHistory is Not Uploaded")
        )
    }

    return res.json(
        new ApiResponse(206, { data: watchHistoryInstance }, { message: "Deleted From Watch History" })
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        // update video details like title, description, thumbnail

        if (!videoId && !isValidObjectId(videoId)) {
            return res.json(
                new ApiError(406, "Video Identity didn't provided")
            )
        }

        const videoPreviousInstance = await Video.findById(videoId);

        if (!videoPreviousInstance) {
            return res.json(
                new ApiError(407, "Video is Not Found")
            )
        }

        const previousVideoUrl = videoPreviousInstance.thumbnail;


        console.log("video Id : ", videoId);

        const { title, description, thumbnail } = req.body;
        const updateFilter = {};

        if (!(title || description || thumbnail)) {
            return res.json(
                new ApiError(409, "There no change detected")
            )
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
            new: true
        })

        console.log("videoInstance : ", videoInstance);
        if (!videoInstance) {
            return res.json(
                new ApiError(408, "There No Database Instance")
            )
        }

        // delete previous video from cloudinary
        if (previousVideoUrl) {
            const publicUrlID = videoPreviousInstance.videofile.split("videos/")[1].split(".")[0];
            await deleteVideoFromClouydinary("videos/" + publicUrlID);
        }

        return res.json(
            new ApiResponse(207, { data: videoInstance }, { message: "Video Update Successfully" })
        )
    } catch (error) {
        res.json(
            new ApiError(404, "Error Get Video By Id " + error.message)
        )
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        // delete video

        if (!videoId && !isValidObjectId(videoId)) {
            res.json(
                new ApiError(209, "There no change detected")
            )
        }

        // 1. first is to delete Video from Cloudinary
        const videoInstance = await Video.findById(videoId);
        console.log("Video Url : ", videoInstance.videofile);

        if (!videoInstance) {
            return res.json(
                new ApiError(408, "VideoInstance is not found  properly")
            )
        }

        const DeleteVideo = await Video.findByIdAndDelete(videoId)
        console.log(" Deletion of Document ❌: ", DeleteVideo);

        if (!DeleteVideo) {
            return res.json(
                new ApiError(408, "Video is not Deleted  properly")
            )
        }

        const publicVideoUrlID = videoInstance.videofile.split("videos/")[1].split(".")[0];
        console.log("publicVideoUrlID : ", publicVideoUrlID);
        const publicThumbnailUrl = videoInstance.thumbnail.split("assets/")[1].split(".")[0];
        console.log("publicThumbnailUrl : ", publicThumbnailUrl);

        await deleteVideoFromClouydinary("videos/" + publicUrlID);
        await deleteFromClouydinary("assets/" + publicThumbnailUrl);


        // Delete Video, Videos Comments and comment Replies Likes
        await Like.deleteMany({ video: videoId });
        await Comments.deleteMany({ video: videoId });
        await Reply.deleteMany({ video: videoId });
        await WatchHistory.deleteMany({ videoId: videoId });

        return res.json(
            new ApiResponse(201, { data: DeleteVideo }, { message: "Video Deletion is Done" })
        )
    } catch (error) {
        res.json(
            new ApiError(404, "Error Delete Video By Id " + error.message)
        )
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!videoId && !isValidObjectId(videoId)) {
            res.json(
                new ApiError(209, "There no change detected")
            )
        }
        const videoInstance = await Video.findById(videoId);
        const ToggleStatus = await Video.findByIdAndUpdate(videoId,
            {
                $set: {
                    ispublished: !videoInstance.ispublished
                }
            },
            {
                new: true
            })


        if (!videoInstance) {
            return res.json(
                new ApiError(403, "Video Did not Get By Database")
            )
        }
        if (!ToggleStatus) {
            return res.json(
                new ApiError(403, "Video Did not Get By Database")
            )
        }

        return res.json(
            new ApiResponse(200, { data: ToggleStatus }, { message: "Togglge Publish Status" })
        )
    } catch (error) {
        res.json(
            new ApiError(404, "Error Toggle VideoSta Status " + error.message)
        )
    }
})

const toggleCommentSection = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId && !isValidObjectId(videoId)) {
        res.json(
            new ApiError(209, "There no change detected")
        )
    }

    const videoInstance = await Video.findById(videoId);

    // only owner can toggle comment section
    if (videoInstance?.owner.toString() !== req?.user?._id) {
        return res.json(
            new ApiError(403, "Only Owner Can Toggle Comment Section")
        )
    }

    const ToogleCommentSection = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                commentsection: !videoInstance.commentsection
            }
        },
        {
            new: true
        }
    );


    if(!ToogleCommentSection) {
        return res.json(
            new ApiError(403, "Video Did not Get By Database")
        )
    }

    return res.json(
        new ApiResponse(200, { commentSection: ToogleCommentSection.commentsection }, { message: "Togglge Comment Section" })
    )




})

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
    toggleCommentSection
}