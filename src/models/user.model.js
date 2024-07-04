import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
 
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});
const userSchema =new mongoose.Schema(//database schema of user
  {
    username: {
      type: String,
      required: true,
      unique: true,
      
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String, //url from services like cloudinary and aws
      required: true,
    },
    coverImage: {
      type: String, //url
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    
    refreshToken: 
      [refreshTokenSchema]
    
  },
  { timestamps: true }
);
userSchema.pre("save",async function (next){//acts just like middleware and is executed before any database operation
  if(!this.isModified("password")) return next();//if password is not modified then just goes to next step using next()
  this.password=await bcrypt.hash(this.password,10);//id not then encrypts the password and sets the password
  next()

})
userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
  return jwt.sign({
    _id: this._id,
    email:this.email,
    username:this.username,
    fullname:this.fullname
  },process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  })
  
}
userSchema.methods.generateRefreshToken=function(){
  return jwt.sign({
    _id: this._id,

  },process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  })
}
export const User = mongoose.model("User", userSchema);
