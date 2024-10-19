import mongoose from "mongoose";

const replyschema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },
        replyedBy: {
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