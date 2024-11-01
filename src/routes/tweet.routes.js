import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";
import {
  getUserTweets,
  updateTweet,
  deleteTweet,
  createTweet,
} from "../controllers/tweet.controllers.js";

const router = Router();

router.route("/").post(authToken, createTweet);

router.route("/getUserTweet/").get(authToken, getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
