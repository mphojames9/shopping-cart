import mongoose from "mongoose";
import userModel from "../models/userModel.js";

const addToCart = async (req,res) => {
    try {
        const {itemId} = req.body;
        if (!mongoose.isValidObjectId(itemId)) {
            return res.json({success:false,message:"Invalid item"})
        }
        await userModel.findByIdAndUpdate(req.userId,{$inc:{[`cartData.${itemId}`]:1}});
        res.json({success:true,message:"Added to cart"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const removeFromCart = async (req,res) => {
    try {
        const {itemId} = req.body;
        if (!mongoose.isValidObjectId(itemId)) {
            return res.json({success:false,message:"Invalid item"})
        }
        const user = await userModel.findById(req.userId);
        const cartData = {...(user.cartData || {})};
        if (cartData[itemId] > 1) {
            cartData[itemId] -= 1;
        } else {
            delete cartData[itemId];
        }
        await userModel.findByIdAndUpdate(req.userId,{cartData});
        res.json({success:true,message:"Removed from cart"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const getCart = async (req,res) => {
    try {
        const user = await userModel.findById(req.userId);
        res.json({success:true,cartData:user.cartData || {}})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// Adds a guest cart ({productId: qty}) into the saved cart when someone logs in
const mergeCart = async (req,res) => {
    try {
        const items = req.body.items || {};
        const user = await userModel.findById(req.userId);
        const cartData = {...(user.cartData || {})};
        for (const [id,qty] of Object.entries(items)) {
            const n = Number(qty);
            if (!mongoose.isValidObjectId(id) || !Number.isInteger(n) || n < 1) continue;
            cartData[id] = (cartData[id] || 0) + n;
        }
        await userModel.findByIdAndUpdate(req.userId,{cartData});
        res.json({success:true,cartData})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {addToCart,removeFromCart,getCart,mergeCart}
