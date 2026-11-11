import foodModel from "../models/foodModel.js";
import fs from 'fs';

const addFood = async (req, res) =>{
    try {
        if (!req.file) {
            return res.json({success:false,message:"Please upload a product image"})
        }
        const price = Number(req.body.price);
        if (!req.body.name || !req.body.description || !req.body.category || !(price > 0)) {
            fs.unlink(`uploads/${req.file.filename}`,()=>{})
            return res.json({success:false,message:"Name, description, category and a valid price are required"})
        }

        const food = new foodModel({
            name:req.body.name,
            description:req.body.description,
            price:price,
            category:req.body.category,
            image:req.file.filename
        })
        await food.save();
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
        fs.unlink(`uploads/${food.image}`,()=>{})

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({success:true,message:"Product Removed"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {addFood, listFood, removeFood}
