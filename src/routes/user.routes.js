import { Router } from "express";
import { ChangeUserPassword, UpdateAccountDetails, getCurrentUser, loginUser, logoutUser, refreshaccessToken, registerUser, updatecoverImage } from "../controllers/user.controllers.js";
import {upload} from '../middlewares/multer.middleware.js'
import { authToken } from "../middlewares/auth.middleware.js";

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

router.route("/updatecoverImage").put(authToken , 
    upload.fields(
        [
        {
            name : "coverImage",
            maxCount :1
        }
    ]
    ),
    updatecoverImage  )


export default router;