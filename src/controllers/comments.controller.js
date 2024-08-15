import mongoose from "mongoose";
import { Comment } from "../models/comments.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Likes } from "../models/likes.model.js";

const addComment = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const { content, video,parent } = req.body;
  if ([content, video].some((e) => e?.trim() === "" || null || undefined))
    throw new ApiError(400, "provide content and video id");
  const videoCheck = await Video.findById(video);
  if (!videoCheck) throw new ApiError(400, "video not found");

  if(parent){
    const comment = await Comment.create({ owner, content, video,parent });
    if (!comment) throw new ApiError(500, "error while creating data");
    await Comment.updateOne({_id:parent},{$push:{replies:comment._id}})
  }
  else{
    const comment = await Comment.create({ owner, content, video });
    if (!comment) throw new ApiError(500, "error while creating data");
    
  }
  
  return res.status(200).json(new ApiRes(200,{},"created"));
});

const getComments = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) throw new ApiError(400, "video id required");
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parent:{$exists:false},
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "replies",
        foreignField: "_id",
        as: "replies",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    avatar: 1,
                    username: 1,
                    fullname: 1,
                  },
                },
              ],
            },
          },
          {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
          },
          {
            $addFields:{
                noOfLikes:{
                    $size:"$likes"
                }
            }
          },
          {
            $project:{
                content:1,
                owner:1,
                noOfLikes:1,
                createdAt:1
                
            }
          },{
            $unwind:{
              path:"$owner"
            }
          }
        ],
      },
    },
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  avatar: 1,
                  username: 1,
                  fullname: 1,
                },
              },
            ],
          },
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"comment",
            as:"likes"
        }
      },
      {
        $addFields:{
            noOfLikes:{
                $size:"$likes"
            }
        }
      },
      {
        $project:{
            content:1,
            owner:1,
            noOfLikes:1,
            replies:1,
            createdAt:1
            
        }
      },
      {
        $unwind:{
          path:"$owner"
        }
      }

  ]);

  
  return res.status(200).json(new ApiRes(200, comments, "success"));
});
const deleteComments=asyncHandler(async(req,res)=>{
    const {commentId}=req.body
    if(!commentId) throw new ApiError(400,"comment id required")
    const comment=await Comment.findById(commentId)
    if(!commentId)  throw new ApiError(400,"comment doesnt exist")
    if(comment.replies?.length!=0){
      
       const deleteComments=await Comment.deleteMany({parent:commentId})
       if(deleteComments.deletedCount==0) throw new ApiError(500,"not deleted replies")
       
    }
    const deletedComment=await Comment.findByIdAndDelete(commentId)
    // if(deletedComment.deletedCount==0) throw new ApiError(400,"comment doesnt exist")
    return res.status(200).json(new ApiRes(200,{},"deleted"))
})

export { addComment, getComments, deleteComments };
