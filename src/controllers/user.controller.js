import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRes } from "../utils/ApiRes.js";
import jwt from "jsonwebtoken";
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body; //get the details from request
  if (
    [fullname, username, email, password].some((field) => field.trim() === "") //validating if the fields are missing
  ) {
    throw new ApiError(400, "all field are required"); //throws an error through the ApiError class which extends the error class
  }
  const userExists = await User.findOne({ $or: [{ username }, { email }] }); //getting the user from the database
  if (userExists) {
    throw new ApiError(409, "user already exist"); //throwing error if user already exists
  }
  const avatarLocalPath = req.files?.avatar[0]?.path; //getting the avatar if it exists, the req.files is added by the middleware multer
  if (!avatarLocalPath) throw new ApiError(400, "avatar required");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  console.log(req.files.avatar);
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage > 0
  ) {
    coverImage = req.files.coverImage[0].path;
  }
  if (!avatar) throw new ApiError(400, "avatar required");

  const user = await User.create({
    //creating the user if everything goes correct
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken " //get the user object without the mentioned field
  );

  if (!createdUser)
    throw new ApiError(500, "something went wrong while storing the values");
  return res
    .status(201)
    .json(new ApiRes(200, createdUser, "user registered successfully"));
}); //sending the response if the user is successfully created
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // Calculate expiration date for refresh token (e.g., 30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    user.refreshToken=[user.refreshToken]
    const refreshTokenObject = {
      token: refreshToken,
      expiresAt: expiresAt
    };

    user.refreshToken.push(refreshTokenObject);
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!(email || username)) {
    throw new ApiError(400, "username or email is required");
  }
  if (!password) {
    throw new ApiError(400, "incorrect user credentials");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] }); //finds the user object on the basis of username or email
  if (!user) {
    throw new ApiError(404, "user doesnt exist");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password); //checking if the password is correct by using the methods defined in user.routes
  if (!isPasswordCorrect) {
    throw new ApiError(401, "incorrect password");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id); //generates the access token and refresh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    //this secures the cookies so that it can only be changed using server and not by user or frontend
    httpOnly: true,
    secure: true,
  };
  
  return res
    .status(200)
    .cookie("accessToken", accessToken, options) //sets the cookies
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRes(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user logged in successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, //req.user is given by middleware auth.middleware.js
    { $set: { refreshToken: undefined } }, //sets the refresh token to undefined in the database
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options) //clearing the cookies
    .clearCookie("refreshToken", options)
    .json(new ApiRes(200, {}, "user had been logged out successfully"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
  }

  try {
      const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedToken?._id)
      console.log(user)
  
      if (!user) {
          throw new ApiError(401, "Invalid refresh token")
      }
  
      if (user?.refreshToken.some(e=>e!==incomingRefreshToken)) {
          throw new ApiError(401, "Refresh token is expired or used")
          
      }
  
      const options = {
          httpOnly: true,
          secure: true
      }
  
      const accessToken=user.generateAccessToken()
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(
          new ApiRes(
              200, 
              {accessToken},
              "Access token refreshed"
          )
      )
  } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})
const changePassword=asyncHandler(async(req,res)=>{
  const {currentPassword,newPassword}=req.body
  const user=await User.findById(req.user._id)
  const isPasswordCorrect=user.isPasswordCorrect(currentPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"password not correct")
  }
  user.password=newPassword
  await user.save({validateBeforeSave:false})
  return res.status(200).json(new ApiRes(200,{},"password changed successfully"))
  

})
export { registerUser, loginUser, logoutUser, refreshAccessToken , changePassword};
