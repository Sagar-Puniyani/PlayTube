import fs from "fs";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
dotenv.config({ path: "./.env" });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.error("No local file path provided.");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "assets",
      resource_type: "auto",
    });
    // file has been uploaded
    console.log(" CLOUDINARY : file has been uploaded");
    console.log("CLOUDINARY : public url ", response.public_id);
    fs.unlinkSync(localFilePath); // remove the local save temp file
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the local save temp file
    console.error("CLOUDINARY : error ", error);
    throw error;
  }
};
const UploadVideoOnCloudinary = async (localFilePath) => {
  try {
    const byteArrayBuffer = fs.readFileSync(localFilePath);
    console.log("byteArrayBuffer : ", byteArrayBuffer.length);
    // Upload the video content to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(
        localFilePath,
        {
          folder: "videos",
          resource_type: "video",
        },
        (error, result) => {
          if (error) {
            reject(error); // Reject the promise if an error occurs
          } else {
            resolve(result); // Resolve the promise with the upload result
          }
        }
      );
    });

    // Log the upload result
    console.log("Upload Result:", uploadResult.url);
    console.log("Upload duration :", uploadResult.duration);
    fs.unlinkSync(localFilePath);
    return uploadResult; // Return the upload result if needed
  } catch (error) {
    // Handle any errors that occur during the upload process
    fs.unlinkSync(localFilePath);
    console.error("Error uploading video to Cloudinary:", error.message);
    throw error; // Re-throw the error to propagate it upwards
  }
};

/*
const UploadVideoOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath){
            console.error("No local file path provided.");
            return null
        };
        
        const response = await cloudinary.uploader.upload(localFilePath , {
            folder : "videos",
            resource_type : "video"
        })
        // file has been uploaded 
        console.log(" CLOUDINARY : file has been uploaded");
        console.log("CLOUDINARY : public url " , response.public_id);
        fs.unlinkSync(localFilePath) // remove the local save temp file
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the local save temp file
        console.error("CLOUDINARY video : error " , error )
        throw error;
    }
}
*/

const deleteFromClouydinary = async (assestpath) => {
  try {
    if (!assestpath) return null;
    console.log("assestpath : ", assestpath);
    const response = await cloudinary.uploader.destroy(assestpath, {
      resource_type: "image",
    });
    // file has been deleted
    console.log(" CLOUDINARY : file has been deleted");
    console.log("CLOUDINARY : public url ", response);
  } catch (error) {
    console.error("CLOUDINARY : error ", error);
    throw error;
  }
};

const deleteVideoFromClouydinary = async (assestpath) => {
  try {
    console.log("Try To delete The Video");
    if (!assestpath) return null;
    console.log("assestpath : ", assestpath);
    const response = await cloudinary.uploader.destroy(assestpath, {
      resource_type: "video",
    });
    // file has been deleted
    console.log(" CLOUDINARY : file has been deleted");
    console.log("CLOUDINARY : public url ", response);
  } catch (error) {
    console.error("CLOUDINARY : error ", error);
    throw error;
  }
};

export {
  uploadOnCloudinary,
  deleteFromClouydinary,
  UploadVideoOnCloudinary,
  deleteVideoFromClouydinary,
};
