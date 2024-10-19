import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";
import {
  createReply,
  deleteReply,
  getAllCommentsReplies,
  updateReply,
} from "../controllers/reply.controllers.js";

const router = Router();
router.use(authToken);

router.route("/:commentId").post(getAllCommentsReplies);

router.route("/:commentId/:videoId").post(createReply);

router.route("/:replyId").patch(updateReply).delete(deleteReply);

export default router;
