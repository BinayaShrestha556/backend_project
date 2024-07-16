import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
app.use(
  cors({
    origin:["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
//routes
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/user",userRouter)

import videoRouter from './routes/video.routes.js'
app.use("/api/v1/video",videoRouter)

import likesRouter from "./routes/likes.router.js"
app.use("/api/v1/likes",likesRouter)

import commentsRouter from "./routes/comments.router.js"
app.use("/api/v1/comments",commentsRouter)


export default app;
