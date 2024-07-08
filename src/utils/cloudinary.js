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
 export {uploadOnCloudinary,deleteOnCloudinary}
