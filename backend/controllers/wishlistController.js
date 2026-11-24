import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

const MAX_MERGE = 200; // a guest list can never be bigger than the shop itself; this just stops abuse

// customer: the saved product ids
const getWishlist = async (req,res) => {
    try {
        const user = await userModel.findById(req.userId);
        res.json({success:true,wishlist:user?.wishlist || []})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const addToWishlist = async (req,res) => {
    try {
        const {itemId} = req.body;
        if (!mongoose.isValidObjectId(itemId)) {
            return res.json({success:false,message:"Invalid item"})
        }
        if (!await foodModel.exists({_id:itemId})) {
            return res.json({success:false,message:"Product not found"})
        }
        // $addToSet: saving the same product twice is harmless
        await userModel.findByIdAndUpdate(req.userId,{$addToSet:{wishlist:String(itemId)}});
        res.json({success:true,message:"Saved to wishlist"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const removeFromWishlist = async (req,res) => {
    try {
        const {itemId} = req.body;
        if (!mongoose.isValidObjectId(itemId)) {
            return res.json({success:false,message:"Invalid item"})
        }
        await userModel.findByIdAndUpdate(req.userId,{$pull:{wishlist:String(itemId)}});
        res.json({success:true,message:"Removed from wishlist"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// Adds a guest wishlist (["productId",...]) into the saved one when someone logs in
const mergeWishlist = async (req,res) => {
    try {
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const ids = [...new Set(items.map(String))]
            .filter((id) => mongoose.isValidObjectId(id))
            .slice(0,MAX_MERGE);

        // only products that still exist
        const found = ids.length ? await foodModel.find({_id:{$in:ids}}).select("_id") : [];
        const valid = found.map((food) => String(food._id));

        const user = valid.length
            ? await userModel.findByIdAndUpdate(req.userId,{$addToSet:{wishlist:{$each:valid}}},{new:true})
            : await userModel.findById(req.userId);
        res.json({success:true,wishlist:user?.wishlist || []})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {getWishlist,addToWishlist,removeFromWishlist,mergeWishlist}
