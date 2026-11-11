import express from 'express';
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import { adminMiddleware } from "../middleware/auth.js";
import multer from 'multer';

const foodRouter = express.Router();

// Image Storage Engine
const storage = multer.diskStorage({
    destination:"uploads",
    filename:(req,file,cb)=>{
        return cb(null, `${Date.now()}${file.originalname}`)
    }
})

const upload = multer({
    storage:storage,
    limits:{fileSize:5*1024*1024},
    fileFilter:(req,file,cb)=>{
        if (file.mimetype.startsWith("image/")) return cb(null,true);
        cb(new Error("Only image files are allowed"));
    }
})

foodRouter.post("/add",adminMiddleware,upload.single("image"),addFood)
foodRouter.get("/list",listFood)
foodRouter.post("/remove",adminMiddleware,removeFood);

export default foodRouter;
