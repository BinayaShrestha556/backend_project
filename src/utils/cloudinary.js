import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";
import streamifier from 'streamifier';

 cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,
 })
 const uploadOnCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
const signature=async()=>{
  const timestamp = Math.round(new Date().getTime() / 1000); // Current time in seconds

  try {
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        upload_preset:"ml_default"
        // Replace with your preset name
      },
      process.env.API_SECRET
    );
    return {timestamp,signature}
  } catch (error) {
    console.log(error)
  }
}

 const deleteOnCloudinary = async (cloudinaryFilePath,type) => {
    try {
      const splitedUrl = cloudinaryFilePath.split("/");
      const id = splitedUrl[splitedUrl.length - 1].split(".")[0];
      console.log(id)
      let result
      try {
        result = await cloudinary.uploader.destroy(id,{resource_type:type,invalidate:true});
        
      } catch (error) {
        console.log(error)
      }
      console.log(result)
      if (result.result !== 'ok') {
        throw new Error('Not deleted');
      }
      
      return result;
    } catch (error) {
      console.error(error);
      throw new Error('Something went wrong while deleting');
    }
  };
 export {uploadOnCloudinary,deleteOnCloudinary,signature}
