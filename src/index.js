// require('dotenv').config({path : './.env'})
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({ path: './.env' })

// ; is added to iif function 
;( async()=>{
    try{
        await connectDB();
        app.listen(process.env.PORT , () => {
            console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
        })
    }
    catch(err){
        console.log("MONGODB CONNECTION ERROR !!! " , err);
        throw err;
    }

} )()




/*
const app = express()

(async() => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}`/`${DB_NAME}`);
        app.on("Error" , (err)=>{
            console.log("Error" , err);
            throw err;
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`App is up and running on port : ${process.env.PORT}`);
        })
    }
    catch( err ){
        console.error("Error in DB Connection : " , err );
        throw err;
    }
})()
*/
