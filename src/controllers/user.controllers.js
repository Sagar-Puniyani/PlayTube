import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiRespone.js"
import jwt  from "jsonwebtoken";

const GenerateAccessTokenandRefreshToken = async( userId ) => {
    try {
        const userInstance = await User.findById(userId);
        const accessToken = userInstance.GenerateAccessToken();
        const refreshToken = userInstance.GenerateRefreshToken();

        userInstance.refreshToken = refreshToken;
        await userInstance.save({ validateBeforeSave: false });

        return {
            accessToken ,
            refreshToken
        }
        
    } catch (err ) {
        throw new ApiError (506 , "Error in generating Refresh and Access Token " , err);
    }

}

const registerUser = asyncHandler(async (req , res ) =>{
    /* steps to register the user
        1. get all the detail fromn the frontend / postman 
        2. create the doc according to the user Model 
            2.1 add validation on the format of the feild of the user model 
            2.2 check if is already exists in the database - through username and the 
        3. take the coverImage and avatar of the user and save 
            it in the temp and save it in the cloudinary.
            3.1 check for avatar as it is required 
                while the uload on the cloudinary then check for 
                the avatar on the cloud 
        4. check for user is created or not 
        5. remove the password and the refresh token from response 
        6. return response.*/

    const {username , email , fullname , password }= req.body;
    console.log("Request body is : " , req.body);
    console.log("Request Files are :  " , req.files)

    if ( 
        [username , email , fullname , password ].some((feild) =>
            feild?.trim() === "")
    ){
        throw new ApiError(400 , "All feild are Compulsory ")
    }

    const existedUser = await User.findOne({
        $or : [ { username } , { email }]
    })

    if (existedUser){
        throw new ApiError(409 , "User Name and Email is Already been Taken ")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath
    if (req.files && req.files.coverImage instanceof Array && req.files.coverImage.length >0 ){
        coverImageLocalPath = req.files?.coverImage[0].path;
    }


    if (avatarLocalPath){
    console.log("req.files" ,req?.files?.avatar[0]?.path );
    }

    if (!avatarLocalPath){
        throw new ApiError(406 , "Avatar Image is not send properly ");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar){
        throw new ApiError(406 , "Avatar Image is not send properly ");
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        " -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(508, "Something sad and went wrong while registering the user");
    };

    res.status(201).json(
        new ApiResponse(200 , createdUser , "User Created Successfully ")
    );
})

const loginUser = asyncHandler(async (req , res ) => {
    /*  1. Takeout data from req.body
            1.1 check email or name 
            1.2 check the password 
        2. add refresh and access token on it 
        3. sent the tokens in the cookies 
    */

    const {username , email , password } = req.body;
        console.log("Request body is : " , req.body);
        console.log("my user is : ", username);
        console.log("my email is : ", email);
    

    if (!(username || email) ){
        res.json(new ApiError(400 ,"UserName and Email is required !!! "));
    }

    // find the user either by username or email 
    const userInstance  = await User.findOne({
        $or: [{username} , {email}]
    })

    // User is not in the DataBase 
    if (!userInstance ){
        res.json({"message" : "❌ error in Founding the object "});
        throw new ApiError(404 , "User Not Found !!! ")
    }

    // check the password correct or not 
    const PasswordInstance = await userInstance.isPasswordCorrect(password);
    if (!PasswordInstance ) {
        throw new ApiError (401 , " 😌 Invalid User Credentials ");
    }

    const {accessToken , refreshToken} = await GenerateAccessTokenandRefreshToken(userInstance._id);

    const  loggedInUser = await  User.findById(userInstance._id).select("-password -refreshToken");

    const options = {
        httpOnly : true ,
        secure : true 
    }

    res.status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , refreshToken , options)
        .json(
            new ApiResponse(
                200 ,
                {
                    user : loggedInUser ,  refreshToken , accessToken
                }
                ,
                "✅ Tokens Are Generated and send in Cookie "
            )
        );
    console.log("accessToken is : " , accessToken);
    console.log("RefreshToken is : " , refreshToken);
})

const logoutUser = asyncHandler(async(req , res ) => {

    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {refreshToken : null }
            },
            {
                new : true 
            }
        )

        const options = {
            httpOnly : true ,
            secure : true 
        }

        res.status(200)
            .clearCookie("accessToken" , options)
            .clearCookie("refreshToken" , options)
            .json(new ApiResponse(200 , {} , "User Logged Out"));

        // options 
    } catch (error) {
        
    }
})



const refreshaccessToken = asyncHandler( async(req , res ) => {
try {
        const incomingrefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if (!incomingrefreshToken){
            throw new ApiError(403 , "Unauthorized request 🤔 ");
        }
    
        const decodedToken = jwt.verify(
            incomingrefreshToken,
            process.env.REFERSH_TOKEN_SECRET
        )
        
        const userInstance = await User.findById(decodedToken?._id)
    
        if (!userInstance){
            throw new ApiError(403 , "Invalid refresh Token and  request ");
        }
    
        if (userInstance?.refreshToken !== incomingrefreshToken){
            throw new ApiError(402 , "RefreshToken is expired ")
        }
    
        const options = {
            httpOnly : true ,
            secure : true 
        }
    
    
        const {accessToken , refreshToken} = await GenerateAccessTokenandRefreshToken(userInstance?._id)
    
    
        res.status(200)
            .cookie("accessToken" , accessToken , options)
            .cookie("refreshToken" , refreshToken , options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken , refreshToken},
                    "The Tokens are Generated SuccessFully "
                )
            )
} catch (error) {
    throw new ApiError(
        405 ,
        error?.message || "Invalid Refresh Token catched"
    )
}

})


const ChangeUserPassword = asyncHandler( async( req , res ) => {
    try {
        const {odlPassword , newPassword } = req.body
    
        const userInstance = await User.findById(req.user?._id );
        const isPasswordCorrect = await userInstance.isPasswordCorrect(odlPassword);
    
        if (!isPasswordCorrect){
            res.json(
                new ApiError( 407 , "Password is Not Correct ❌")
            ) 
        }
    
        userInstance.password = newPassword;
        await userInstance.save({ validateBeforeSave: false });
        
        return res.status(200)
            .json(new ApiResponse(200 , {} , "Password is changed !! "))
    } catch (error) {
        throw new ApiError(405 , "Failed while changing the password" ,error.message)
    }
})


const getCurrentUser = asyncHandler(async (req , res ) => {
    return res.status(200)
            .json(
                new ApiResponse(200 , req.user , "User Fetched Successfully !! 👍")
                )

})


const UpdateAccountDetails = asyncHandler(async(req , res ) => {
    const {fullname , email } = req.body;

    if (!(fullname ||  email)){
        throw new ApiError(409 , 
                "All feild are Not Empty ");
    }

    const userInstance = await User.findByIdAndUpdate(req.user?._id , 
        {
            $set : {
                fullname,
                email
            }
        },
        {
            new : true
        }).select(" -password -refreshToken");

        return res.status(200)
                .json(new ApiResponse(
                    200,
                    userInstance,
                    "Account Details are changed Successfully ✅"
                ))

})

const updatecoverImage = asyncHandler(async(req , res) => {
    try {
        const coverImagepath = req.file?.path;
        console.log("coverImagepath " ,  coverImagepath );
        if ( !coverImagepath ) {
            res.json(
                new ApiError(419 , 
                    "CoverImage Path is Missing ")
            )
        }
    
        const CoverImageInstance = await uploadOnCloudinary(coverImagepath)
    
        if (!CoverImageInstance.url){
            res.json(
                new ApiError(409 , 
                    "CoverImage Not uploaded Successfully ")
            )
        }
    
        const CoverImageUplodedInstance = await User.findByIdAndUpdate(
            req.user?._id ,
            {
                $set : {
                    coverImage : CoverImageInstance.url
                }
            },
            {new : true }
        ).select(" -password -refreshToken ")
    
        return res.json(
            new ApiResponse(
                200,
                CoverImageUplodedInstance,
                "CoverImage Updated Successfully ✅"
            )
        )
    } catch (error) {
        throw new ApiError(
            406 , 
            "Error while Updating Cover Image ❌",
            error
        )
    }
})


const updateAvatarImage = asyncHandler( async(req , res ) => {
    try {
        const avatarpath = req.file?.path;
        console.log("avatarpath " ,  avatarpath );
        if ( !avatarpath ) {
            res.json(
                new ApiError(419 , 
                    "Avatar Path is Missing ")
            )
        }
    
        const AvatarInstance = await uploadOnCloudinary(avatarpath)
    
        if (!AvatarInstance.url){
            res.json(
                new ApiError(409 , 
                    "Avatar  Not uploaded")
            )
        }
    
        const AvatarUplodedInstance = await User.findByIdAndUpdate(
            req.user?._id ,
            {
                $set : {
                    avatar : AvatarInstance.url
                }
            },
            {new : true }
        ).select(" -password -refreshToken ")
    
        return res.json(
            new ApiResponse(
                200,
                AvatarUplodedInstance,
                "Avatar Updated Successfully ✅"
            )
        )
    } catch (error) {
        throw new ApiError(
            406 , 
            "Error while Updating Cover Image ❌",
            error
        )
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshaccessToken,
    ChangeUserPassword,
    getCurrentUser,
    UpdateAccountDetails,
    updatecoverImage,
    updateAvatarImage
};