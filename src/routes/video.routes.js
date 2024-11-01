import { Router } from "express";
import {
  addToWatchHistory,
  deleteVideo,
  deletParticularVideoFromWatchHistory,
  getAllVideos,
  getVideoById,
  incrementVideoCount,
  publishAVideo,
  toggleCommentSection,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controllers.js";
import { authToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(authToken);
// Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo)
  .post(incrementVideoCount);

router
  .route("/wh/:videoId")
  .post(addToWatchHistory)

router
  .route("/wh/:id")
  .delete(deletParticularVideoFromWatchHistory);



router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router.route("/toggle/comment/:videoId").patch(toggleCommentSection);

export default router;
