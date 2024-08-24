import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const subscribeTo=asyncHandler(async(req,res,next)=>{
    const {_id}=req.user
    const {channel}=req.body
    if(!channel) {
        next(new ApiError(400,"channel not provided") )
        // res.status(401).json(new ApiRes(401,{},"feild channel is empty"))

    }
    const exists=await Subscription.findOne({$and:[{subscriber:_id},{channel}]})
    if(exists){
        await Subscription.findByIdAndDelete(exists._id)
        return res.status(200).json(new ApiRes(200,{},"unsubscribed"))
    }
   
   
    const subscription=await Subscription.create({subscriber:_id,channel})
    if(!subscription){
        next(new ApiError(500,"database not updated") )
       
    }
    return res.status(200).json(new ApiRes(200,{},"subscribed"))

})
const getSubscriptions=asyncHandler(async(req,res)=>{
    const {_id}=req.user
    if(!_id){
        throw new ApiError(400,"user id not found");

    }
    const subscriptions= await Subscription.aggregate([
        {
            $match:{
                subscriber:_id
            }
        },
        {
         $lookup:{
            from:"users",
            foreignField:"_id",
            localField:"channel",
            as:"channel",
            pipeline:[{
                
                $project:{
                    username:1,
                    avatar:1
                }
            }
                
            ]
         }   
        },
      {
        $unwind:"$channel"
      },
      {
        $project:{
            subscriber:0
        }
      }
    ])
    
    return res.status(200).json(new ApiRes(200,subscriptions,"success"))
    
})

export {subscribeTo,getSubscriptions}