import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentschema = new mongoose.Schema(
    {
        connent : {
            type : String,
            required : true 
        },
        video : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        tweet : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet"
        }
    },
    {
        timestamps : true 
    }
)


commentschema.plugin(mongooseAggregatePaginate)


export const Comments = mongoose.model("Comment" , commentschema)