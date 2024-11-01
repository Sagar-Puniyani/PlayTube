import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscriptions.controllers.js";

const router = Router();

router.use(authToken);

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router;
