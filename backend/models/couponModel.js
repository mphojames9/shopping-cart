import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    // always stored upper case, e.g. WELCOME10
    code:{type:String,required:true,unique:true,uppercase:true,trim:true},
    type:{type:String,enum:["percent","fixed"],required:true},
    // percent: 1-100 (% off the products). fixed: rand amount off the products.
    value:{type:Number,required:true,min:0},
    // the products total (before delivery) must reach this for the code to work; 0 = no minimum
    minSubtotal:{type:Number,default:0,min:0},
    // paid orders allowed to use the code; 0 = unlimited
    maxUses:{type:Number,default:0,min:0},
    usedCount:{type:Number,default:0,min:0},
    // last moment the code works; null = never expires
    expiresAt:{type:Date,default:null},
    // admin can pause a code without deleting it
    active:{type:Boolean,default:true}
},{timestamps:true})

const couponModel = mongoose.models.coupon || mongoose.model("coupon",couponSchema);
export default couponModel;
