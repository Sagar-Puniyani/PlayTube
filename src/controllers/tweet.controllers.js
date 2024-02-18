import mongoose,{ isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async (req, res) => {
    const  owner  = req.user?._id;
    if (! owner ){
        res.json(
            new ApiError(407 ,
                "User is Not Found ")
        )
    }


    const { content } = req.body;

    if (! content ) {
        res.send(
            new ApiResponse( 406, {}, "Add some Content to Tweet" )
        )
    }

    const tweetInstance = await  Tweet.create({
        owner,
        content 
    })
    
    if ( !tweetInstance ) {
        res.json(
            new ApiError(
                409,
                "Error while creating tweet"
            )
        )
    }
    
    const createdtweet = await Tweet.findById(tweetInstance._id) 


    res.status(200)
        .json(
            new ApiResponse(
                200 , createdtweet , "User is Created "
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params?.userId;

    if ( !isValidObjectId(userId) ){
        res.json(
            new ApiError( 408 , "Object Id is Invalid " )
        )
    }

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
                pipeline : [
                    {
                        $lookup: {
                            from: "likes",
                            localField: "_id",
                            foreignField: "tweet",
                            as: "likes"
                        }
                    },
                    {
                        $project: {
                            content : 1 
                        }
                    }
                ]
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

    if (!tweets) {
        res.json(
            new ApiError(410 , "Error in Populating Database Call")
        )
    }

    return res.json(
        new ApiResponse(
            200 , tweets , "Tweets and Their Likes"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const tweetId  = req.params?.tweetId;

    if ( !tweetId) {
        res.json(
            new ApiError(409 , "Invalid Tweet Signature")
        )
    }

    const { content } = req.body;

    if ( !content ){
        res.json(
            new ApiError(407 , "Add Some Content to tweet")
        )
    }

    const tweetInstance = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set : {
                content
            }
        },
        {
            new : true 
        }
    )

    if ( !tweetInstance ){
        res.json(
            new ApiError(407 , "Error in the Updatation of Tweet")
        )
    }

    res.json(
        new ApiResponse(200 , tweetInstance , "Updation is Done Successfully !! ")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params?.tweetId;

    if ( !tweetId) {
        res.json(
            new ApiError(409 , "Invalid Tweet Signature")
        )
    }

    const deleteTweetInstance = await Tweet.deleteOne({
        _id : new mongoose.Types.ObjectId(tweetId)
    })

    if ( !deleteTweetInstance ){
        res.json(
        new ApiError(408 , "Error While Deletion of the Tweet")    
        )
    }

    res.json(
        new ApiResponse(200 , deleteTweetInstance , "Deletion Process is Done")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}