import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comments } from "../models/comment.models.js";
import { Reply } from "../models/reply.models.js";

const createReply = asyncHandler(async (req, res) => {
    const {commentId, videoId} = req.params;
    const {content} = req.body;

    if ([commentId, videoId].some((feild) => feild.trim() === "") ) {
        throw new ApiError(407, "Error In Comment Identification ");
    }

    const commentInstance = await Comments.findById(commentId);
    if(!commentInstance) {
        throw new ApiError(404, "Comment Not Found");
    }

    const replyInstance = await Reply.create({
        content,
        comment: commentId,
        replyedBy: req.user._id,
        video: videoId
    });

    if(!replyInstance) {
        throw new ApiError(404, "Reply Not Found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, replyInstance, "Reply Created Successfully"));

})

const updateReply = asyncHandler(async (req, res) => {
})

const deleteReply = asyncHandler(async (req, res) => {
})  

const getAllCommentsReplies = asyncHandler(async (req, res) => {    
})


export {
    createReply,
    updateReply,
    deleteReply,
    getAllCommentsReplies
}