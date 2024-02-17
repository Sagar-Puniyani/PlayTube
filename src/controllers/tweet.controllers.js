import { Tweet } from "../models/tweet.models";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiRespone";
import { asyncHandler } from "../utils/asyncHandler";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {owner } = req.user?._id
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