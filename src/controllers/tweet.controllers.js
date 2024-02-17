import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const  owner  = req.user?._id;
    console.log( "Owner : ", owner);
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
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}