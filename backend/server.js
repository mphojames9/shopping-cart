import 'dotenv/config'
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import orderRouter from "./routes/orderRoutes.js";

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
app.use("/images",express.static('uploads'))
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
