

import { v2 as cloudinary } from "cloudinary"


// Configure Cloudinary with your credentials
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
invalidateCache('ovudh8kwaoibsptmrfa5');