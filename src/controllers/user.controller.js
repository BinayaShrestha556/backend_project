import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRes } from "../utils/ApiRes.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body; //get the details from request
  if (
    [fullname, username, email, password].some((field) => field.trim() === "") //validating if the fields are missing
  ) {
    return res.status(400).json( {message: "all field are required"}); //throws an error through the ApiError class which extends the error class
  }
  const userExists = await User.findOne({ $or: [{ username }, { email }] }); //getting the user from the database
  if (userExists) {return res.status(409).json( {message:"username already exists"})
   //throwing error if user already exists
  }
  const avatarLocalPath = req.files?.avatar[0]?.path; //getting the avatar if it exists, the req.files is added by the middleware multer
  if (!avatarLocalPath) return res.status(400).json( {message: "avatar required"});
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  let coverImage;
  // console.log(req.files.avatar);
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage > 0
  ) {
    coverImage = req.files.coverImage[0].path;
  }
  if (!avatar) return res.status(400).json( {message: "avatar required"});

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
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const refreshTokenObject = {
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
    };

    user.refreshToken.push(refreshTokenObject); // Append the new refresh token
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!(email || username)) {
    return res.status(400).json( {message: "username or email is required"});
  }
  if (!password) {
    return res.status(400).json( {message: "incorrect user credentials"});
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
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // Verify the incoming refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // console.log("Decoded Token:", decodedToken);

    // Find the user associated with the refresh token
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    // console.log("User Refresh Tokens:", user.refreshToken);

    // Check if the incoming refresh token exists in the user's refresh tokens array
    const refreshTokenObject = user.refreshToken.find(
      (tokenObj) => tokenObj.token === incomingRefreshToken
    );
    if (!refreshTokenObject) {
      throw new ApiError(401, "Refresh token not found");
    }
    // console.log("Refresh Token Object:", refreshTokenObject);

    // Check if the refresh token has expired
    if (new Date(refreshTokenObject.expiresAt) < new Date()) {
      throw new ApiError(401, "Refresh token has expired");
    }

    // Generate new access token
    const accessToken = user.generateAccessToken();

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(new ApiRes(200, { accessToken }, "Access token refreshed"));
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new ApiError(401, error.message);
  }
});
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword); //checking if the password is correct by using the methods defined in user.routes
  if (!isPasswordCorrect) {
    throw new ApiError(401, "incorrect password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiRes(200, {}, "password changed successfully"));
});
const currentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiRes(200, req.user, "user sent"));
});
const changeDetails = asyncHandler(async (req, res) => {
  const { fullname } = req.body;
  if (!fullname) return res.status(400).json( {message: "fields are required"});
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname } },
    { new: true }
  ).select("-password -refreshToken");
  return res.status(200).json(new ApiRes(200, user, "name has been changed"));
});
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath); //getting the avatar if it exists, the req.files is added by the middleware multer
  if (!avatarLocalPath) return res.status(400).json( {message: "avatar required"});
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(
      500,
      "something went wrong while uploading to cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(500, "something went wrong");
  }
  return res
    .status(200)
    .json(new ApiRes(200, { user }, "avatar sucessfully changed"));
});
const updateCover = asyncHandler(async (req, res) => {
  const coverLocalPath = req.files?.cover[0]?.path;
  console.log(coverLocalPath); //getting the avatar if it exists, the req.files is added by the middleware multer
  if (!coverLocalPath) return res.status(400).json( {message: "cover required"});
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if (!coverImage) {
    throw new ApiError(
      500,
      "something went wrong while uploading to cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(500, "something went wrong");
  }
  return res
    .status(200)
    .json(new ApiRes(200, { user }, "avatar sucessfully changed"));
});
const getUserChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    return res.status(400).json( {message: "username not provided"});
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
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
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel doesn't exist");
  }
  return res.status(200).json(new ApiRes(200, channel[0], "channel detched"));
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },

    },
    {
      $lookup:{
        from:"videos",
        foreignField:"_id",
        localField:"watchHistory",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "owner",
              pipeline:[
                { 
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                },{
                $project:{
                  thumbnail:1,
                  _id:1,
                  title:1,
                  views:1,
                  


                }}
              ]
            }
            
          },
          
        ]
      }
    }
  ]);
  return res.status(200).json(new ApiRes(200,user[0]?.watchHistory,"watch history fetched"))
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  currentUser,
  changeDetails,
  updateAvatar,
  updateCover,
  getWatchHistory,
  getUserChannel
};
