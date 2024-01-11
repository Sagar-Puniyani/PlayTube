import mongoose  from "mongoose";

const likeschema  = new mongoose.Schema(
    {
        comment: {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Comment"
        },
        video : {
            type  : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        },
        likedBy : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        tweeets : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Tweet"
        }
    },
    {
        timestamps : true 
    }
);

export const Like = mongoose.model("Like" , likeschema);