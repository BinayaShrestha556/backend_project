import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";
 cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,
 })
 const uploadOnCloudinary= async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
       const res=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
       
        fs.unlinkSync(localFilePath)
        return res
    }catch(error){
        fs.unlinkSync(localFilePath)//remove the locally saved temporary file as the upload  operation got failed
        return null


    }
 }
 const deleteV=async()=>{
  cloudinary.config({
    cloud_name: 'dtnzu6ts5',
    api_key: '266457623286177',
    api_secret: 'q509zMyf4BcRGbeRfswIlzkftzU'
  });
  
  // Function to invalidate a cached file
  const invalidateCache = async (publicId) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
      console.log('Cache invalidation result:', result);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  };
  
  // Call the function with the public ID of the file you want to invalidate
  await invalidateCache('ovudh8kwaoibsptmrfa5');

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
 export {uploadOnCloudinary,deleteOnCloudinary,deleteV}
