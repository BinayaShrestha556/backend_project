import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, isLiked, likeComment, likeVideo } from "../controllers/likes.controller.js";

const router=Router()
router.route("/like").post(verifyJWT,likeVideo)
router.route("/isliked").post(verifyJWT,isLiked)
router.route("/liked").get(verifyJWT,getLikedVideos)
router.route("/like-comment").post(verifyJWT,likeComment)





export default router