import { Router } from "express";
import {
  changeDetails,
  changePassword,
  currentUser,
  getUserChannel,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updateCover,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-access").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").post(verifyJWT,currentUser)
router.route("/change-details").patch(verifyJWT,changeDetails)

router.route("/change-avatar").patch(verifyJWT,upload.fields([
  {
    name:"avatar",
    maxCount:1
  }
]),updateAvatar)
router.route("/change-cover").patch(verifyJWT,upload.fields([
  {
    name:"cover",
    maxCount:1
  }
]),updateCover)
router.route("/channel/:username").get(verifyJWT,getUserChannel)
router.route("/history").get(verifyJWT,getWatchHistory)
export default router;
