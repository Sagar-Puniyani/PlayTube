import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controllers.js";
import {upload} from '../middlewares/multer.middleware.js'

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
export default router;