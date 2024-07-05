import { Router } from "express";
import {
  changeDetails,
  changePassword,
  currentUser,
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
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/current-user").post(verifyJWT,currentUser)
router.route("/change-details").post(verifyJWT,changeDetails)

router.route("/change-avatar").post(verifyJWT,upload.fields([
  {
    name:"avatar",
    maxCount:1
  }
]),updateAvatar)
router.route("/change-cover").post(verifyJWT,upload.fields([
  {
    name:"cover",
    maxCount:1
  }
]),updateCover)

export default router;
