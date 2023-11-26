import fs from 'fs';
import {v2  as cloudinary} from 'cloudinary';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null;
        // upload the file 
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
        // file has been uploaded 
        console.log(" CLOUDINARY : file has been uploaded");
        console.log("CLOUDINARY : public url " , response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the local save temp file
        console.error("CLOUDINARY : error " , error )
        throw error;
    }
}

export {uploadOnCloudinary}
