import {v2 as cloudinary} from "cloudinary";
import env from "../config/env.js";
import fs from "fs";

cloudinary.config({ 
  cloud_name: env.cloudinary_cloud_name, 
  api_key: env.cloudinary_api_key, 
  api_secret: env.cloudinary_cloud_secret,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(`File successfully uploaded on ${response.url}`);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export default {
  uploadOnCloudinary,
}
