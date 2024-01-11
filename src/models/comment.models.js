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
        }
    },
    {
        timestamps : true 
    }
)


commentschema.plugin(mongooseAggregatePaginate)


export const Comments = mongoose.model("Comment" , videoSchema)