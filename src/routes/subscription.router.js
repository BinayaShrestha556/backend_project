import { Router } from "express";
import { subscribeTo } from "../controllers/subscriber.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.post("/subscribeTo",verifyJWT,subscribeTo)

export default router