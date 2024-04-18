import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";


const getAllVideos = asyncHandler(async (req, res) => {
try {
        const { page = 1, limit = 10, thumbnailQuery , query, sortBy, sortType , channelUserId} = req.query;
        const userId = req.user?._id;
        
    
        // Aggregation pipeline injecting on the need basis 
        // When ever query fired pipeline must be changed according to that.🧐
        pipeline =  [];
    
        if (!userId &&  !isValidObjectId(userId) ){
            res.json(
                new ApiError(405 , "User is logged In Properly" )
            )
        }
    
        // channelUserId is the Id of User who owns the particular channel
        if (channelUserId){
            pipeline.push({
                $match :{
                    owner : new mongoose.Types.ObjectId.createFromHexString(userId)
                }
            })
        }
    
        // sorting on basis of sortBy and type of sort is sortType
        if ( sortBy ){
            pipeline.push({
                $sort:{
                    [sortBy] : sortType === "acs" ? 1 : -1
                }
            })
        }
        else {
            pipeline.push({
                $sort : {
                    createdAt : -1 
                }
            })
        }
    
        // query for thumbnail 
        if ( thumbnailQuery ){
            pipeline.push({
                $match :{
                    thumbnail : {
                        $regex : thumbnailQuery ,
                        $options : 'im'
                    } 
                }
            })
        }
    
        // query for title 
        if ( query ){
            pipeline.push({
                $match :{
                    title : {
                        $regex : query,
                        $options : 'im'
                    } 
                }
            })
        }
    
        // is video Published 
        pipeline.push( {
            $match : {
                ispublished : true
            }
        })
    
        // User Details 
        pipeline.push({
            $lookup : {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
            },
            $project : {
                _id : 0,
                username : 1,
                avatar : 1
            }
        })
    
    
        // page and limit of videos 
        const options = {
            page : parseInt(page , 10),
            limit : parseInt(limit , 10)
        }
    
        // Instances of those video output query 
        const VidoeInstances = await Video.aggregate(pipeline , options);

        /*
        const videoInstances = await Video.aggregate(pipeline).skip((options.page - 1) * options.limit).limit(options.limit);
        */
        if (!VidoeInstances) {
            res.json(
                new ApiError(410 , "Error in Populating Database Call")
            )
        }
    
        return res.json(
            new ApiResponse(
                200 , VidoeInstances , "Feed Videos"
            )
        )
} catch (error) {
    res.json(
        new ApiError(500 , "Server Error " + error.message )
    )
}


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}