import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { Video } from "../models/video.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id?.trim()) {
    throw new ApiError(400, "no id parameters");
  }
  if(!mongoose.Types.ObjectId.isValid(id)){
    throw new ApiError(400, "not valid id")
  }
  const video = await Video.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(id)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        avatar:1,
                        fullname:1,
                        coverImage:1
                    }
                }
            ]
        }
    },
    {
        $lookup:{
          from:"likes",
          localField:"_id",
          foreignField:"video",
          as: "likers",

        }
    },
    {
        $unwind:{
            path:"$owner"
        }
    }
  
  ])
  if (!video) throw new ApiError(400, "video not found");
  if(video.length==0) throw new ApiError(400,"video not found")
  const result=await Video.updateOne({_id:id},{$inc:{views:1}})

  if(result.modifiedCount!==1) throw new ApiError(500,"views not updated")
  
  return res.status(200).json(new ApiRes(200, video, "sucessfully sent"));
});
const uploadVideo = asyncHandler(async (req, res) => {
  const owner = req.user._id;

  const localUrlToVideo = req.files?.video[0]?.path;
  if (!localUrlToVideo) throw new ApiError(400, "video not found");
    const duration=10
  const videoFile = await uploadOnCloudinary(localUrlToVideo);
  const localUrlToThumbNail = req.files?.thumbnail[0]?.path;
  if (!localUrlToThumbNail) throw new ApiError(400, "thumbnail not found");
  const thumbnail = await uploadOnCloudinary(localUrlToThumbNail);
  const { description, title } = req.body;
  if (!description) throw new ApiError(400, "description is required");
  if (!title) throw new ApiError(400, "title is required");
  const video=await Video.create({
    videoFile:videoFile.url,thumbnail:thumbnail.url,title,description,duration,owner,
  })
  return res.status(200).json(new ApiRes(200,video,"video sucessfully created"))
});
const getVideoByUsername=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()) throw new ApiError(400,"no username")
    const user=await User.findOne({username:username})
    if(!user) throw new ApiError(400,"user not found")
    const videos=await Video.find({owner:user._id})
if(!videos) throw new ApiError(404,"videos not found")
return res.status(200).json(new ApiRes(200,videos,"all videos right here"))
})
const deleteVideo=asyncHandler(async(req,res)=>{
  const videoId=req.body.videoId
  if(!videoId) throw new ApiError(400,"video Id not found")
  const video=await Video.findById(videoId)
  if(!video) throw new ApiError(400,"not valid id")
  const cloudinaryVideoUrl=video.videoFile
  console.log(cloudinaryVideoUrl)
  const cloudinaryThumbnailUrl=video.thumbnail
  const result1=await deleteOnCloudinary(cloudinaryVideoUrl,"video")
  if(result1.result!="ok") throw new Error("not deleted")
  const result2 = await deleteOnCloudinary(cloudinaryThumbnailUrl,"image")
  if(result2.result!=="ok") throw new ApiError(500,"not deleted")
  
  await Video.deleteOne({_id:videoId})
  return res.status(200).json(new ApiRes(200,{},"success"))
})

export { getVideoById,uploadVideo, getVideoByUsername,deleteVideo };
