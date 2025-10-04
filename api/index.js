import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv"
import userRouter from "./routes/user.route.js"
import authRouter from "./routes/auth.route.js"
import cookieParser from "cookie-parser";
import listingrouter from "./routes/listing.route.js"
import path from 'path';

dotenv.config();

mongoose.connect(process.env.MONGO).then(()=>{
    console.log("Connected to mongodb");
    }).catch((err)=>{
    console.log(err)
});

const __dirname=path.resolve();

const app=express()
app.listen(3000,()=>{
    console.log("Server is running...!")
})
app.use(express.json());
app.use(cookieParser());

app.use("/api/user", userRouter);
app.use("/api/auth",authRouter);
app.use("/api/listing", listingrouter);

app.use(express.static(path.join(__dirname,'/client/dist')));

app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,'client','dist','index.html'));
})

// Middleware to show error
app.use((err,req,res,next)=>{
    const statusCode=err.statusCode||500;
    const message=err.message||"Internal server error";
    return res.status(statusCode).json({
        success:false,
        statusCode,
        message
    })
})