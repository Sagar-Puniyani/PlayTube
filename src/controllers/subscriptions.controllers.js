import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError } from "../utils/ApiError.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if( !channelId ){
        res.json(
            new ApiError(407 , "Error In Channel Identification ")
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if( !channelId ){
        res.json(
            new ApiError(407 , "Error In Channel Identification ")
        )
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if( !subscriberId ){
        res.json(
            new ApiError(407 , "Error In Subscription Identification ")
        )
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}