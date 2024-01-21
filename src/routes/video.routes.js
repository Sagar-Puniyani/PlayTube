import { Router } from "express";
import { authToken } from "../middlewares/auth.middleware.js";

const route = Router();
// Apply the auth Verification to all the Routes in the file 
route.use(authToken);


