import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controllers.js"
import {authToken} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(authToken); // Apply verifyJWT authToken middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router