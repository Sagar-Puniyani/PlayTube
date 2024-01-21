import { User }  from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Jwt from "jsonwebtoken";

const authToken = asyncHandler(async(req , res , next ) =>{
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log("accessToken ", accessToken);
    
        if (!accessToken ){
            res.json({
                'status' : 409,
                'message' : 'User Never Logged In 🤷‍♀️🤷‍♀️🤷‍♀️ [User Nahi milla ]'
            })
        }
    
        const DecodedToken = Jwt.verify(
            accessToken ,
            process.env.ACCESS_TOKEN_SECRET
        )
    
        const userInstance  = await User.findById(DecodedToken?._id).select("-password -refreshToken")
    
    
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

const getAvatarAssets =  (req , res , next  ) => {
    try {
        const assestpath = req.cookies?.PublicIdAvatarAssets ||
                            req.query.PublicIdAvatarAssets ||
                            req.header("PublicIdAvatarAssets")
    
        if ( !assestpath ) {
            res.json(
                new ApiError(
                    406 , "❌ Assets of Avatar is not found "
                )
            )
        }
        
        console.log("assestpath ✅✅✅✅ " , assestpath);
        req.user.public_id = assestpath;
        next();
    } catch (error) {
        console.error("Avatar Assets Error : " , error);
        throw error
    }
}

const getCoverImageAssets = (req , res , next ) => {
    try {
        const assestpath = req.cookies?.PublicIdCoverImageAssets ||
                            req.query.PublicIdCoverImageAssets ||
                            req.header("PublicIdCoverImageAssets")
    
        if ( !assestpath ) {
            res.json(
                new ApiError(
                    406 , "❌ Assets of CoverImage is not found "
                )
            )
        }
        
        console.log("assestpath ✅✅✅✅ " , assestpath);
        req.user.public_id = assestpath;
        next();
    } catch (error) {
        console.error("CoverImage Assets Error : " , error);
        throw error
    }
}
export {authToken,
        getAvatarAssets,
        getCoverImageAssets
        };