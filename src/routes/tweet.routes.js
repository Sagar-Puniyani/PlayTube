import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";
import {getUserTweets ,
        updateTweet,
        deleteTweet,
        createTweet} from "../controllers/tweet.controllers.js";

const router = Router();

router.use(authToken);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router