import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const connectDB = async() =>{
    try {
        console.log(`${process.env.MONGODB_URL}/${DB_NAME}`)
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n MongoDB connected !! DB Host : ${connectionInstance.connection.watch}`);
    }
    catch(err) {
        console.error("Error in connection of DB : " , err);
        process.exit(1)
    }
}

export default connectDB