import mongoose from "mongoose";

const replyschema = new mongoose.Schema(
    {
        connent: {
            type: String,
            required: true
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    },
    {
        timestamps: true
    }
);


export const Reply = mongoose.model("Reply", replyschema);