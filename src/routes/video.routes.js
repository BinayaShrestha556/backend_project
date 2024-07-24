import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, getVideoByUsername, uploadVideo } from "../controllers/video.controller.js";


const router=Router()
router.route("/v/:id").get(getVideoById)
router.route("/upload").post(verifyJWT,upload.fields([
    {
        name:"thumbnail",
        maxCount:1
    },
    {
        name:"video",
        maxCount:1
    }]),uploadVideo)
router.route("/uname/:username").get(getVideoByUsername)
router.route("/delete").delete(verifyJWT,deleteVideo)
router.route("/all-videos").get(getAllVideos)
export default router