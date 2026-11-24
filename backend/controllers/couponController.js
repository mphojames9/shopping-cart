import couponModel from "../models/couponModel.js";
import { priceItems } from "../utils/pricing.js";
import { evaluateCoupon, normalizeCode } from "../utils/coupons.js";

const CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;

// South Africa has no daylight saving, so "valid until 31 Dec" always means the end of that day at +02:00
const endOfDay = (yyyyMmDd) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
    const date = new Date(`${yyyyMmDd}T23:59:59.999+02:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

const shape = (coupon) => ({
    _id:coupon._id,
    code:coupon.code,
    type:coupon.type,
    value:coupon.value,
    minSubtotal:coupon.minSubtotal,
    maxUses:coupon.maxUses,
    usedCount:coupon.usedCount,
    expiresAt:coupon.expiresAt,
    active:coupon.active,
    createdAt:coupon.createdAt
})

// customer: "does this code work on my cart, and how much does it take off?"
const validateCoupon = async (req,res) => {
    try {
        const priced = await priceItems(req.body.items);
        if (priced.error) return res.json({success:false,message:priced.error});

        const result = await evaluateCoupon(req.body.code,priced.subtotalCents);
        if (result.error) return res.json({success:false,message:result.error});

        const {coupon} = result;
        res.json({
            success:true,
            coupon:{code:coupon.code,type:coupon.type,value:coupon.value,minSubtotal:coupon.minSubtotal},
            discount:result.discountCents / 100
        })
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Could not check that code, please try again"})
    }
}

// admin: every code, newest first
const listCoupons = async (req,res) => {
    try {
        const coupons = await couponModel.find({}).sort({createdAt:-1});
        res.json({success:true,data:coupons.map(shape)})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// admin: create a code
const addCoupon = async (req,res) => {
    try {
        const code = normalizeCode(req.body.code);
        if (!CODE_PATTERN.test(code)) {
            return res.json({success:false,message:"Use 3 to 20 letters, numbers, - or _ for the code"})
        }
        const type = req.body.type;
        if (type !== "percent" && type !== "fixed") {
            return res.json({success:false,message:"Choose a percentage or a fixed amount"})
        }
        const value = Number(req.body.value);
        if (!(value > 0) || (type === "percent" && value > 100) || value > 1000000) {
            return res.json({success:false,message:type === "percent" ? "A percentage must be between 1 and 100" : "Enter a discount amount above R0"})
        }
        const minSubtotal = Number(req.body.minSubtotal || 0);
        if (!(minSubtotal >= 0)) {
            return res.json({success:false,message:"The minimum spend cannot be negative"})
        }
        const maxUses = Number(req.body.maxUses || 0);
        if (!Number.isInteger(maxUses) || maxUses < 0) {
            return res.json({success:false,message:"Maximum uses must be a whole number (0 means unlimited)"})
        }
        let expiresAt = null;
        if (req.body.expiresAt) {
            expiresAt = endOfDay(String(req.body.expiresAt));
            if (!expiresAt) return res.json({success:false,message:"That expiry date is not valid"})
            if (expiresAt <= new Date()) return res.json({success:false,message:"The expiry date must be today or later"})
        }

        await couponModel.create({code,type,value,minSubtotal,maxUses,expiresAt});
        res.json({success:true,message:`Code ${code} created`})
    } catch (error) {
        if (error?.code === 11000) {
            return res.json({success:false,message:"A promo code with that name already exists"})
        }
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// admin: pause or resume a code
const setCouponStatus = async (req,res) => {
    try {
        if (typeof req.body.active !== "boolean") {
            return res.json({success:false,message:"Invalid status"})
        }
        const coupon = await couponModel.findByIdAndUpdate(req.body.id,{active:req.body.active},{new:true});
        if (!coupon) return res.json({success:false,message:"Promo code not found"})
        res.json({success:true,message:coupon.active ? `Code ${coupon.code} is live again` : `Code ${coupon.code} paused`})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// admin: delete a code (past orders keep the code they used)
const removeCoupon = async (req,res) => {
    try {
        const coupon = await couponModel.findByIdAndDelete(req.body.id);
        if (!coupon) return res.json({success:false,message:"Promo code not found"})
        res.json({success:true,message:`Code ${coupon.code} deleted`})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {validateCoupon,listCoupons,addCoupon,setCouponStatus,removeCoupon}
