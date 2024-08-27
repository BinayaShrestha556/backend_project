import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { Video } from "../models/video.model.js";
import { deleteOnCloudinary, signature, uploadOnCloudinary } from "../utils/cloudinary.js";

import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const getVideoById = asyncHandler(async (req, res) => {
  const id=req.params.id
  
  if (!id?.trim()) {
    throw new ApiError(400, "no id parameters");
  }
  if(!mongoose.Types.ObjectId.isValid(id)){
    throw new ApiError(400, "not valid id")
  }
  // const video = await Video.aggregate([
  //   {
  //       $match:{
  //           _id:new mongoose.Types.ObjectId(id)
  //       }
  //   },
  //   {
  //       $lookup:{
  //           from:"users",
  //           localField:"owner",
  //           foreignField:"_id",
  //           as:"owner",
  //           pipeline:[
  //             {
  //               $lookup: {
  //                 from: "subscriptions",
  //                 localField: "_id",
  //                 foreignField: "channel",
  //                 as: "subscribers",
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "subscriptions",
  //                 localField: "_id",
  //                 foreignField: "subscribers",
  //                 as: "subscribedTo",
  //               },
  //             },
  //             {
  //               $addFields: {
  //                 subscribersCount: {
  //                   $size: "$subscribers",
  //                 },
  //                 subscribedToCount: {
  //                   $size: "$subscribedTo",
  //                 },
          
  //                 isSubscribed: {
  //                   $cond: {
  //                     if: { $in: [req.user?._id, "$subscribers.subscriber"] },
  //                     then: true,
  //                     else: false,
  //                   },
  //                 },
  //               },
  //             },
  //               {
  //                   $project:{
  //                       username:1,
  //                       avatar:1,
  //                       fullname:1,
  //                       coverImage:1,
  //                       subscribersCount:1,
  //                       subscribedToCount:1,
  //                       isSubscribed:1
  //                   }
  //               }
  //           ]
  //       }
  //   },
  //   {
  //       $lookup:{
  //         from:"likes",
  //         localField:"_id",
  //         foreignField:"video",
  //         as: "likers",

  //       }
  //   },
  //   {
  //     $addFields: {
  //       likesNumber: {
  //         $size: "$likers",
  //       },
      
  //     },
  //   },
  //   {
  //     $project: {
  //       likers:0

  //     },
  //   },
  //   {
  //       $unwind:{
  //           path:"$owner"
  //       }
  //   }
  
  // ])
  const video = await Video.findById(id)
  if (!video) throw new ApiError(400, "video not found");
  if(video.length==0) throw new ApiError(400,"video not found")
  const result=await Video.updateOne({_id:id},{$inc:{views:1}})

  if(result.modifiedCount!==1) throw new ApiError(500,"views not updated")
  
  return res.status(200).json(new ApiRes(200, video, "sucessfully sent"));
});
const uploadVideo = asyncHandler(async (req, res) => {
  const owner = req.user._id;

 
 
  const thumbnailLocalPath = req.files.thumbnail?req.files.thumbnail[0]:null; //getting the avatar if it exists, the req.files is added by the middleware multer
  if (!thumbnailLocalPath) return res.status(400).json( {message: "thumbnail required"});
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath.buffer,"thumbnails");
  // console.log(thumbnail)
  const { description, title,videoUrl,duration } = req.body;
  // console.log(req.body)
  if (!description) throw new ApiError(400, "description is required");
  if (!title) throw new ApiError(400, "title is required");
try {
    const video=await Video.create({
      videoFile:videoUrl,thumbnail:thumbnail.url,title,description,duration,owner,
    })
    return res.status(200).json(new ApiRes(200,video,"video sucessfully created"))
    
} catch (error) {
 console.log(error) 
 return res.status(500).json(new ApiRes(500,{},"video not sucessfully created"))

}
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
  
  const cloudinaryThumbnailUrl=video.thumbnail
  const result1=await deleteOnCloudinary(cloudinaryVideoUrl,"video")
  if(result1.result!="ok") throw new Error("not deleted")
  const result2 = await deleteOnCloudinary(cloudinaryThumbnailUrl,"image")
  if(result2.result!=="ok") throw new ApiError(500,"not deleted")
  
  await Video.deleteOne({_id:videoId})
  return res.status(200).json(new ApiRes(200,{},"success"))
})
const getAllVideos=asyncHandler(async(req,res)=>{
  const videos=await Video.aggregate([
    {
      $match:{}
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
  if(videos.length==0||!videos){
    throw new ApiError(500,"sorry videos not found")
  }
  return res.status(200).json(new ApiRes(200,videos))
})
const getOtherInfo=asyncHandler(async(req,res)=>{
  const id=req.body.videoId
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
                $lookup: {
                  from: "subscriptions",
                  localField: "_id",
                  foreignField: "channel",
                  as: "subscribers",
                },
              },
              {
                $lookup: {
                  from: "subscriptions",
                  localField: "_id",
                  foreignField: "subscribers",
                  as: "subscribedTo",
                },
              },
              {
                $addFields: {
                  subscribersCount: {
                    $size: "$subscribers",
                  },
                  subscribedToCount: {
                    $size: "$subscribedTo",
                  },
          
                  isSubscribed: {
                    $cond: {
                      if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
                {
                    $project:{
                        username:1,
                        avatar:1,
                        fullname:1,
                        coverImage:1,
                        subscribersCount:1,
                        subscribedToCount:1,
                        isSubscribed:1
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
      $addFields: {
        likesNumber: {
          $size: "$likers",
        },
      
      },
    },
    {
      $project: {
        likesNumber:1,
        owner:1

      },
    },
    {
        $unwind:{
            path:"$owner"
        }
    }
  
  ])
  if (!video) throw new ApiError(400, "video not found");
  if(video.length==0) throw new ApiError(400,"video not found")
  return res.status(200).json(new ApiRes(200, video, "sucessfully sent"));

})
const getSignature=asyncHandler(async(req,res)=>{

  try {
    const cloudinary=await signature()
    return res.status(200).json(new ApiRes(200,cloudinary,"sent"))
  } catch (error) {
    console.log(error)
    return res.status(500).json(new ApiRes(500,{},"something wrong"))
  }
  
})

export { getVideoById,uploadVideo, getVideoByUsername,deleteVideo,getAllVideos,getOtherInfo ,getSignature};