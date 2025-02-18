import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
export const verifyJWT=asyncHandler(async (req, res, next)=>{
    const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")//gets the cookies from the req, if not available (in case of mobile browsers) the cookies is provided in req.header
    if(!token){
        throw new ApiError(401,"Unauthorized request, no token")
    }
    const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if(!decodedToken) throw new ApiError(405,"token expired")//verifying the token (actually its decrypting the encrypted data that we send (ie, _id,email,username, etc))
    // console.log(decodedToken)
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    //gets the user by id that was decrypted using jwt
    // console.log(req.cookies.accessToken,user)
    if(!user){
        throw new ApiError(401,"Invalid Access Token")
    }
    req.user=user//adds the user property in req
    next()//end of middleware and tells it to procceed to next

})
export const optionalVerification =  asyncHandler(async(req,res,next)=>
{
    const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")//gets the cookies from the req, if not available (in case of mobile browsers) the cookies is provided in req.header
    if(!token){
        req.user=null
        
      return next()
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    if(!decodedToken) {
        req.user=null
        return next()
    }
    // console.log(decodedToken)
        //verifying the token (actually its decrypting the encrypted data that we send (ie, _id,email,username, etc))
    // console.log(decodedToken)
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
    //gets the user by id that was decrypted using jwt
    // console.log(req.cookies.accessToken,user)
    if(!user){
        req.user=null
        return next()
    }
    req.user=user//adds the user property in req
    next()
} catch (error) {
    req.user=null
    return next()
}
})