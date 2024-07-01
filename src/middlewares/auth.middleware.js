import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
export const verifyJWT=asyncHandler(async (req, res, next)=>{
    const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")//gets the cookies from the req, if not available (in case of mobile browsers) the cookies is provided in req.header
    if(!token){
        throw new ApiError(401,"Unauthorized request")
    }
    const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)//verifying the token (actually its decrypting the encrypted data that we send (ie, _id,email,username, etc))
    const user=await User.findById(decodedToken?._id).select("-password -refreshToken")//gets the user by id that was decrypted using jwt
    if(!user){
        throw new ApiError(401,"Invalid Access Token")
    }
    req.user=user//adds the user property in req
    next()//end of middleware and tells it to procceed to next

})