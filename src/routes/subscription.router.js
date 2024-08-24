import { Router } from "express";
import { getSubscriptions, subscribeTo } from "../controllers/subscriber.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.post("/subscribeTo",verifyJWT,subscribeTo)
router.post("/subscriptions",verifyJWT,getSubscriptions)


export default router