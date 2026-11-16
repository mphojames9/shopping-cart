import foodModel from "../models/foodModel.js";
import imageModel from "../models/imageModel.js";
import fs from 'fs';
import mongoose from 'mongoose';

const addFood = async (req, res) =>{
    try {
        if (!req.file) {
            return res.json({success:false,message:"Please upload a product image"})
        }
        const price = Number(req.body.price);
        if (!req.body.name || !req.body.description || !req.body.category || !(price > 0)) {
            return res.json({success:false,message:"Name, description, category and a valid price are required"})
        }

        // the image goes into MongoDB (Render's disk does not survive a redeploy)
        const filename = `${Date.now()}-${req.file.originalname}`.replace(/[^\w.-]/g,"_");
        await imageModel.create({filename,contentType:req.file.mimetype,data:req.file.buffer});

        try {
            const food = new foodModel({
                name:req.body.name,
                description:req.body.description,
                price:price,
                category:req.body.category,
                image:filename
            })
            await food.save();
        } catch (error) {
            await imageModel.deleteOne({filename}).catch(()=>{});
            throw error;
        }
        res.json({success:true,message:"Product Added"})
    }catch (error) {
        console.log(error)
        res.json({success:false,message:"Error"})
    }
}

// all food list
const listFood = async (req,res) => {
    try {
        const foods = await foodModel.find({});
        res.json({success:true,data:foods})
    }catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const removeFood = async (req,res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (!food) {
            return res.json({success:false,message:"Product not found"})
        }
        await imageModel.deleteOne({filename:food.image});
        fs.unlink(`uploads/${food.image}`,()=>{}) // old images that shipped inside the repo

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({success:true,message:"Product Removed"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// edit an existing product: details and, optionally, a new photo
const updateFood = async (req, res) => {
    try {
        const id = req.body.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.json({success:false,message:"Product not found"})
        }
        const food = await foodModel.findById(id);
        if (!food) {
            return res.json({success:false,message:"Product not found"})
        }

        const name = String(req.body.name || "").trim();
        const description = String(req.body.description || "").trim();
        const category = String(req.body.category || "").trim();
        const price = Number(req.body.price);
        if (!name || !description || !category || !(price > 0)) {
            return res.json({success:false,message:"Name, description, category and a valid price are required"})
        }

        // a new photo is optional; when sent it goes into MongoDB under a brand new filename,
        // so the old image can never be served from a stale cache
        const oldImage = food.image;
        let newImage = null;
        if (req.file) {
            newImage = `${Date.now()}-${req.file.originalname}`.replace(/[^\w.-]/g,"_");
            await imageModel.create({filename:newImage,contentType:req.file.mimetype,data:req.file.buffer});
        }

        try {
            food.name = name;
            food.description = description;
            food.category = category;
            food.price = price;
            if (newImage) food.image = newImage;
            await food.save();
        } catch (error) {
            if (newImage) await imageModel.deleteOne({filename:newImage}).catch(()=>{});
            throw error;
        }

        // product saved: the replaced photo is no longer needed (unless another product still uses it)
        if (newImage && oldImage && oldImage !== newImage) {
            const stillUsed = await foodModel.exists({image:oldImage});
            if (!stillUsed) {
                await imageModel.deleteOne({filename:oldImage}).catch(()=>{});
                fs.unlink(`uploads/${oldImage}`,()=>{}) // old images that shipped inside the repo
            }
        }

        res.json({success:true,message:"Product Updated",data:food})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"Error"})
    }
}

export {addFood, listFood, removeFood, updateFood}
