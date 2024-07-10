import { Router } from "express";
import { addComment, deleteComments, getComments } from "../controllers/comments.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()
router.route("/:video").get(getComments)
router.route("/post-comment").post(verifyJWT,addComment)
router.route("/delete-comment").delete(verifyJWT,deleteComments)
export default router