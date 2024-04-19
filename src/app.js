import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";

const app = express();

// cross origin resource sharing 
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({
    limit : "16kb"
}))

app.use(express.urlencoded({ 
    extended: true,
    limit : "16kb"
}));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Arranging for the cookie
app.use(cookieParser())


// user router 
import userRouter from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"

// routes declaration 
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/dashboard", tweetRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/sagar" , (_ , res )=>{
    res.json({
        message : "OKAY"
    })
})

export {app};