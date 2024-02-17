import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware";

const route = Router();

route.use(authToken);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router