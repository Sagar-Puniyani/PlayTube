import { User }  from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";

const authToken = asyncHandler(async(req , res , next ) =>{
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("accessToken ", accessToken);
    
        if (!accessToken ){
            res.json({
                'status' : 409,
                'message' : 'User Never Logged In'
            })
        }
    
        const DecodedToken = Jwt.verify(
            accessToken ,
            process.env.ACCESS_TOKEN_SECRET
        )
    
        const userInstance  = await User.findById(DecodedToken?._id).select("-password -refreshToken")
    
        /* TODO: 
            Disscusion 
        */
    
    
        if (!userInstance ){
            const error = new ApiError(401 , "❌ user invalid AccessToken ")
            res.json(error )
        }
        req.user = userInstance;
        next();

    } catch (error) {
        const err = new ApiError(508 , error?.message || "Something Went Wrong while logout process  ");
        res.json(err)
    }
})

export {authToken};