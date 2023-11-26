import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const registerUser = asyncHandler(async (req , res ) =>{
    /* steps to register the user
        1. get all the detail fromn the frontend / postman 
        2. create the doc according to the user Model 

            2.1 add validation on the format of the feild of the user model 
            2.2 check if is already exists in the database - through username and the 

        3. take the coverImage and avatar of the user and save 
            it in the temp and save it in the cloudinary.

            3.1 check for avatar as it is required 

        5. in case of error in the uploading of the file in the 
            cloud then catch the error and resolve the 
            [ as we have the back up as the temp folder to send the image again ]
        6. palce the above steps inside the try catch block the  
            make it save and secure 

        
    */

        res.status(200).json({
            message : "ok"
        })
})

export {registerUser}