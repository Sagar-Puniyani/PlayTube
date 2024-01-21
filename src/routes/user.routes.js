import { Router } from "express";
import { ChangeUserPassword, 
    UpdateAccountDetails, 
    getCurrentUser, 
    getUserProfile, 
    loginUser, 
    logoutUser, 
    refreshaccessToken,
    registerUser, 
    updateAvatarImage, 
    updatecoverImage } from "../controllers/user.controllers.js";
import {upload} from '../middlewares/multer.middleware.js'
import { authToken,
        getAvatarAssets, 
        getCoverImageAssets } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields(
        [ 
        {
            name : "avatar",
            maxCount : 1
        } , 
        {
            name : "coverImage",
            maxCount :1
        }]
    ),
    registerUser)

router.route("/login").post(loginUser);

router.route("/logout").get( authToken , logoutUser)
router.route("/regenerateToken").get( refreshaccessToken)
router.route("/changepassword").post( authToken , ChangeUserPassword)
router.route("/getCurrentUser").get(authToken ,  getCurrentUser)
router.route("/UpdateAccountDetails").post(authToken , UpdateAccountDetails)

router.route("/updatecoverImage")
    .put(
        authToken , 
        getCoverImageAssets,
        upload.single("coverImage"),
        updatecoverImage  
        )

router.route("/updateAvatarImage")
    .put(authToken , 
        getAvatarAssets,
        upload.single("avatar"),
        updateAvatarImage  
        )

router.route("/getChannelProfile/:username")
        .get(authToken , 
            getUserProfile
            )

export default router;