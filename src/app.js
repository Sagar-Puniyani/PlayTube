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

export {app};