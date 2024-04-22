import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controllers";

const router = Router();

router.route('/').get(healthcheck);

export default router;