import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiRespone.js"

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
    console.log("username = " , username );
    console.log("email = " , email );
    console.log("fullname = " , fullname );
    console.log("password = " , password );

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
    const coverImageLocalPath = req.files?.coverImage[0].path
    if (avatarLocalPath && coverImageLocalPath){
    console.log("req.files" ,req.files?.avatar[0]?.path );
    }

    if (!avatarLocalPath){
        throw new ApiError(406 , "Avatar Image is not send properly ")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError(406 , "Avatar Image is not send properly ")
    }

    const user = User.create({
        fullname,
        email,
        username : username.toLowerCase(),
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(508 , "Something went wrong while registration ")
    }

    res.status(201).json(
        new ApiResponse(200 , createdUser , "User Created Successfully ")
    )
})
export {registerUser}