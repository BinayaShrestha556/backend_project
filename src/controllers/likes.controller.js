import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { Video } from "../models/video.model.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Likes } from "../models/likes.model.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
const likeVideo=asyncHandler(async(req,res)=>{
    const video=req.body.videoId
    if(!video) throw new ApiError(400,"send video id mf")
    const likedBy = req.user._id
    
    let like=await Likes.deleteOne({$and:[{video:video},{likedBy:likedBy}]})
    if(like.deletedCount==0){
        like=await Likes.create({video,likedBy})
        return res.status(200).json(new ApiRes(200,"liked"))
        
    }
    return res.status(200).json(new ApiRes(200,"unliked"))
})
const isLiked=asyncHandler(async(req,res)=>{
    const video=req.body.video
    const likedBy=req.user._id
    if(!video) throw new ApiError(400,"gimme some video id you stupid fuck")
    const like=await Likes.findOne({$and:[{video},{likedBy}]})
    if(like) return res.status(200).json(new ApiRes(200,{liked:true},"is liked"))
    return res.status(200).json(new ApiRes(200,{liked:false},"isn't liked"))

})
const getLikedVideos=asyncHandler(async(req,res)=>{
    const {_id}=req.user
    const videos=await Likes.aggregate([
        {
            $match:{
                
                    "likedBy":_id,
                    "video":{$exists:true,$ne:null}
                
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as: "video",
                pipeline:[
                    {
                        $project:{
                            thumbnail:1,
                            videoFile:1,
                            title: 1,
                            description:1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        }
    ])
    if(!videos) throw new ApiError(400,"error while fetching liked video")
    return res.status(200).json(new ApiRes(200,videos,"sent"))
})
const likeComment=asyncHandler(async(req,res)=>{
    const comment=req.body.commentId
    if(!comment) throw new ApiError(400,"send comment id mf")
    const likedBy = req.user._id
    
    let like=await Likes.deleteOne({$and:[{comment:comment},{likedBy:likedBy}]})
    if(like.deletedCount==0){
        like=await Likes.create({comment,likedBy})
        return res.status(200).json(new ApiRes(200,"liked"))
        
    }
    return res.status(200).json(new ApiRes(200,"unliked"))
})

export {likeVideo,isLiked,getLikedVideos,likeComment}