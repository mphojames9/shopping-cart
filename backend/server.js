import 'dotenv/config'
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import imageModel from "./models/imageModel.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

//middleware
app.use(express.json())
app.use(cors())

// db connection
connectDB();

// api endpoints
app.use("/api/food",foodRouter)
// images: files that ship inside the repo (uploads/) first, then images uploaded through the admin panel (MongoDB)
app.use("/images",express.static('uploads',{maxAge:"7d"}))
app.get("/images/:name",async (req,res)=>{
    try {
        const image = await imageModel.findOne({filename:req.params.name});
        if (!image) return res.status(404).send("Image not found");
        res.set("Content-Type",image.contentType);
        res.set("Cache-Control","public, max-age=604800");
        res.send(image.data);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Error");
    }
})
app.use("/api/user",userRouter)
app.use("/api/cart",cartRouter)
app.use("/api/order",orderRouter)

app.get("/",(req,res)=>{
    res.send("API Working")
})

// upload / unexpected errors (e.g. wrong file type, file too large)
app.use((err,req,res,next)=>{
    console.log(err.message);
    res.status(400).json({success:false,message:err.message || "Error"})
})

app.listen(port,()=>{
    console.log(`Server Started on http://localhost:${port}`)
})
