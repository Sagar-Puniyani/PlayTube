import mongoose  from "mongoose";

const palylistschema = new mongoose.Schema(
    {
        
    },
    {
        timestamps : true
    }
);

export const palylist = mongoose.model("playlist" , palylistschema)