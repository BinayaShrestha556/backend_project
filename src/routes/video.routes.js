import { Router } from "express";
import { optionalVerification, verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getOtherInfo, getSignature, getVideoById, getVideoByUsername, uploadVideo } from "../controllers/video.controller.js";


const router=Router()
router.route("/v/:id").get(getVideoById)
router.route("/upload").post(verifyJWT,upload.fields([
    {
        name:"thumbnail",
        maxCount:1
    }]),uploadVideo)
router.route("/uname/:username").get(getVideoByUsername)
router.route("/delete").post(verifyJWT,deleteVideo)
router.route("/get-other-info-on-video").get(optionalVerification,getOtherInfo)
router.route("/all-videos").get(getAllVideos)
router.route("/signature").get(verifyJWT,getSignature)
export default router