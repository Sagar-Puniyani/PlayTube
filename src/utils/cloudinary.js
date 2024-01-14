import fs from 'fs';
import dotenv from 'dotenv'
import {v2  as cloudinary} from 'cloudinary';
dotenv.config({ path: './.env' })

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null;
        // upload the file 
        const response = await cloudinary.uploader.upload(localFilePath , {
            folder : "assets",
            resource_type : "auto"
        })
        // file has been uploaded 
        console.log(" CLOUDINARY : file has been uploaded");
        console.log("CLOUDINARY : public url " , response.url);
        fs.unlinkSync(localFilePath) // remove the local save temp file
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the local save temp file
        console.error("CLOUDINARY : error " , error )
        throw error;
    }
}

export {uploadOnCloudinary}
