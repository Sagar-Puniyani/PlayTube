import mongoose  from "mongoose";

const palylistschema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true 
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }

    },
    {
        timestamps : true
    }
);

export const Playlist = mongoose.model("Playlist" , palylistschema)