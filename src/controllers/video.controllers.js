import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import {    uploadOnCloudinary,
            UploadVideoOnCloudinary,
            deleteVideoFromClouydinary,
        } from "../utils/cloudinary.js"


// get All video is for default UI of PlayTube
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
try {
        const { title, description} = req.body;
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
        if ( !userId ) {
            res.json(
                new ApiError( 407 , "User Never Logged In")
            )
        }
    
        if ( !(title && description )){
            res.json(
                new ApiError(410 , "Title and Description are required")
            )
        }

        console.log("Title : " , title );
        console.log("description : " , description );


        const videofilePath = req.files?.videoFile[0]?.path;
        const thumbnailPath  = req.files?.thumbnail[0]?.path;

        console.log("videofilePath " , videofilePath);
        console.log("thumbnailPath " , thumbnailPath);
    
        if ( !videofilePath ){
            res.json(
                new ApiError(409 , "Video File Not send Properly")
            )
        }
    
        if ( !thumbnailPath ){
            res.json(
                new ApiError(411 , "Thumbnail File Not send Properly")
            )
        }
    
        const uploadThumbnail = await uploadOnCloudinary(thumbnailPath);
        console.log("uploadThumbnail : " , uploadThumbnail);
        const uploadedVideo = await UploadVideoOnCloudinary(videofilePath);
        console.log("uploadedVideo.duration 👀👀👀 : " , uploadedVideo.duration , " sec ");
        console.log("Public URL ID : " , uploadedVideo.public_id );
        
        
        
        console.log("First");
        const videoInstance  = await Video.create({
            title,
            description ,
            owner : userId,
            videofile : uploadedVideo.url,
            thumbnail : uploadThumbnail.url,
            duration : uploadedVideo.duration,
            views : 0,
            isPublished : true,
        })
        console.log("Second");
    
        
        if ( !videoInstance ){
            res.json( 
                new ApiError(415 , "Error While Upload Video To Mongo")
            )
        }

        console.log("👀👀👀👀👀videoInstance  : " , videoInstance  );

        res.json(
            new ApiResponse(200 , {"data" : videoInstance},    "Upload Video Successfully" )
        )
} catch (error) {
    res.json(
        new ApiError(500 , "Server Error " + error.message )
    )
}
})

const getVideoById = asyncHandler(async (req, res) => {

    /*
        if video is get to UI on Video Player than 
        view Count should be increased by +1
     */
try {
        const { videoId } = req.params
        //TODO: get video by id
        if ( !videoId ){
            return res.json(
                new ApiError( 409 , "Video Id is Not properly Conveyed")
            )
        }
        console.log("Video ID : " , videoId);

        const Videoupdate = {
            $inc : {views : 1}
        }
    
        const videoInstance = await Video.findByIdAndUpdate(videoId , Videoupdate , {
            new : true
        });
        console.log("Video Found");
        if ( !videoInstance ) {
            return res.json(
                new ApiError(407 , "Video Mongo is Not Uploaded")
            )
        }


        return res.json(
            new ApiResponse(206, {data : videoInstance } , {message : "Video Found"})
        )
} catch (error) {
    res.json( 
        new ApiError(404 , "Error Get Video By Id " + error.message)
    )
}
})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        // update video details like title, description, thumbnail
    
        if ( !videoId ){
            return res.json(
                new ApiError( 406 , "Video Identity didn't provided")
            )}

        
        console.log("video Id : " , videoId);
    
        const {title , description , thumbnail } = req.body;
        const updateFilter = {};
        
        if ( !(title || description || thumbnail) ){
            return res.json(
                new ApiError(409 , "There no change detected")
            )
        }
    
        if ( title ) updateFilter.title = title;
        if ( description) updateFilter.description = description;
    
        const thumbnailPath  = req.file?.path;
        console.log("thumbnailPath : " , thumbnailPath);
        if ( thumbnailPath ) {
            const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);
            updateFilter.thumbnail = uploadedThumbnail.url;
        }

        console.log(" Update Filter : " , updateFilter);
    
        const videoInstance = await Video.findByIdAndUpdate(videoId , updateFilter , {
            new : true 
        })

        console.log("videoInstance : " , videoInstance);
        if ( !videoInstance ) {
            return res.json(
                new ApiError(408 , "There No Mongo Instance")
            )
        }

    
        return res.json( 
            new ApiResponse(207 , {data : videoInstance} , {message : "Video Update Successfully"})
        )
    } catch (error) {
        res.json( 
            new ApiError(404 , "Error Get Video By Id " + error.message)
        )
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        // delete video
    
        if( !videoId ) {
            res.json( 
                new ApiError(209 , "There no change detected")
            )
        }
    
        // 1. first is to delete Video from Cloudinary
        const videoInstance = await Video.findById(videoId);
        console.log("Video Url : " , videoInstance.videofile);
    
        if ( !videoInstance ) {
            return res.json(
                new ApiError(408 , "VideoInstance is not found  properly")
            )
        }
    
        const publicUrlID = videoInstance.videofile.split("videos/")[1].split(".")[0];
        console.log("publicUrlID : " , publicUrlID );
    
        await deleteVideoFromClouydinary("videos/"+publicUrlID);
    
        const DeleteVideo = await Video.findByIdAndDelete(videoId)
        console.log(" Deletion of Document ❌: " , DeleteVideo);
    
        if ( !DeleteVideo ) {
            return res.json(
                new ApiError(408 , "Video is not Deleted  properly")
            )
        }

        return res.json(
            new  ApiResponse(201 , {data : DeleteVideo} , {message : "Video Deletion is Done"})
        )
    } catch (error) {
        res.json( 
            new ApiError(404 , "Error Delete Video By Id " + error.message)
        )
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
    
        if( !videoId ) {
            res.json( 
                new ApiError(209 , "There no change detected")
            )
        }
        const videoInstance = await Video.findById(videoId);
        const ToggleStatus = await Video.findByIdAndUpdate( videoId,
        {
            $set :{
                ispublished : !videoInstance.ispublished
            }
        },
        {
            new : true
        })
        
    
        if ( !videoInstance ){
            return res.json(
                new ApiError( 403 , "Video Did not Get By Mongo")
            )
        }
        if ( !ToggleStatus ){
            return res.json(
                new ApiError( 403 , "Video Did not Get By Mongo")
            )
        }
    
        return res.json(
            new ApiResponse(200 , {data : ToggleStatus} , {message : "Togglge Publish Status"})
        )
    } catch (error) {
        res.json( 
            new ApiError(404 , "Error Toggle VideoSta Status " + error.message)
        )
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}