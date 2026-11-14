import foodModel from "../models/foodModel.js";
import imageModel from "../models/imageModel.js";
import fs from 'fs';

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

export {addFood, listFood, removeFood}
