import mongoose from "mongoose";

const playlistvideoschema = new mongoose.Schema(
    {
        playlistId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Playlist"
        },
        videoId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        }
    },
    {
        timestamps : true
    }
)

export const PlaylistVideo = mongoose.model("PlaylistVideo" , playlistvideoschema)