import express from 'express';
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import { adminMiddleware } from "../middleware/auth.js";
import multer from 'multer';

const foodRouter = express.Router();

const upload = multer({
    storage:multer.memoryStorage(), // saved to MongoDB by the controller, not to disk
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
