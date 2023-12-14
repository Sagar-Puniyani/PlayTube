import { User } from "../models/user.models";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import Jwt from "jsonwebtoken";

const authToken = asyncHandler(async(req , res , next ) =>{
    try {
        const accessToken = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer " , "");
    
        if (!accessToken ){
            const error =   new ApiError(401 , "❌ User Never Loged In ")
            res.json(error )
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
        const err = new ApiError(505 , error?.message || "Something Went Wrong while logout process  ");
        res.json(err)
    }
})

export {authToken};