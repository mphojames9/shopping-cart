import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import couponModel from "../models/couponModel.js";
import { priceItems } from "../utils/pricing.js";
import { evaluateCoupon } from "../utils/coupons.js";

const DELIVERY_FEE = 40; // keep in sync with frontend/src/context/StoreContext.jsx
const STATUSES = ["Processing","Out for delivery","Delivered"];
const ADDRESS_FIELDS = ["firstName","lastName","email","street","city","province","zipCode","country","phone"];

const getStripe = () => process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const frontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173/shopping-cart").replace(/\/$/,"");

// customer: create the order and a Stripe Checkout session
const placeOrder = async (req,res) => {
    let newOrder;
    let stripeCoupon;
    try {
        const stripe = getStripe();
        if (!stripe) {
            return res.status(503).json({success:false,message:"Payments are not configured yet"})
        }

        const {items,address,couponCode} = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({success:false,message:"Your cart is empty"})
        }
        if (!address || ADDRESS_FIELDS.some(f => !String(address[f] ?? "").trim())) {
            return res.status(400).json({success:false,message:"Please fill in all delivery details"})
        }
        const cleanAddress = Object.fromEntries(ADDRESS_FIELDS.map(f => [f,String(address[f]).trim()]));

        // prices always come from the database, never from the browser
        const priced = await priceItems(items);
        if (priced.error) {
            return res.status(400).json({success:false,message:priced.error})
        }
        const {lines,subtotalCents} = priced;

        // a promo code is checked again here: the cart page only showed what it would do
        let coupon = null;
        let discountCents = 0;
        if (String(couponCode ?? "").trim()) {
            const result = await evaluateCoupon(couponCode,subtotalCents);
            if (result.error) {
                // couponError lets the shop drop the stale code instead of leaving the customer stuck
                return res.status(400).json({success:false,message:result.error,couponError:true})
            }
            coupon = result.coupon;
            discountCents = result.discountCents;
        }
        const amount = (subtotalCents - discountCents + DELIVERY_FEE * 100) / 100;

        newOrder = await orderModel.create({
            userId:req.userId,items:lines,amount,address:cleanAddress,
            couponCode:coupon?.code,discount:discountCents / 100
        });

        // Stripe takes the discount as a one-use coupon on this checkout session
        if (discountCents > 0) {
            stripeCoupon = await stripe.coupons.create({
                amount_off:discountCents,currency:"zar",duration:"once",max_redemptions:1,name:coupon.code
            });
        }

        const session = await stripe.checkout.sessions.create({
            mode:"payment",
            payment_method_types:["card"],
            customer_email:cleanAddress.email,
            line_items:[
                ...lines.map(l => ({
                    price_data:{currency:"zar",product_data:{name:l.name},unit_amount:Math.round(l.price*100)},
                    quantity:l.quantity
                })),
                {price_data:{currency:"zar",product_data:{name:"Delivery Fee"},unit_amount:DELIVERY_FEE*100},quantity:1}
            ],
            ...(stripeCoupon ? {discounts:[{coupon:stripeCoupon.id}]} : {}),
            success_url:`${frontendUrl()}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${frontendUrl()}/verify?success=false&orderId=${newOrder._id}`
        });

        newOrder.stripeSessionId = session.id;
        await newOrder.save();
        res.json({success:true,session_url:session.url})
    } catch (error) {
        console.log(error);
        if (newOrder) await orderModel.findByIdAndDelete(newOrder._id).catch(()=>{});
        if (stripeCoupon) await getStripe()?.coupons.del(stripeCoupon.id).catch(()=>{});
        res.status(500).json({success:false,message:"Could not start payment"})
    }
}

// customer: called when Stripe sends them back. Payment is checked with Stripe, not the URL.
const verifyOrder = async (req,res) => {
    try {
        const order = await orderModel.findById(req.body.orderId);
        if (!order || order.userId !== req.userId) {
            return res.status(404).json({success:false,message:"Order not found"})
        }
        if (order.payment) {
            return res.json({success:true,message:"Paid"})
        }

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (session.payment_status === "paid") {
            // flip unpaid -> paid exactly once, so a promo code is only counted once even if this runs twice
            const flipped = await orderModel.findOneAndUpdate({_id:order._id,payment:false},{payment:true});
            if (flipped && order.couponCode) {
                await couponModel.updateOne({code:order.couponCode},{$inc:{usedCount:1}}).catch(()=>{});
            }
            await userModel.findByIdAndUpdate(req.userId,{cartData:{}});
            return res.json({success:true,message:"Paid"})
        }

        if (session.status === "open") {
            await stripe.checkout.sessions.expire(session.id).catch(()=>{});
        }
        await orderModel.findByIdAndDelete(order._id);
        res.json({success:false,message:"Payment was not completed"})
    } catch (error) {
        console.log(error);
        res.status(500).json({success:false,message:"Error"})
    }
}

// customer: their paid orders
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.userId,payment:true}).sort({date:-1});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// admin: all paid orders
const listOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({payment:true}).sort({date:-1});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// admin: change an order's status
const updateStatus = async (req,res) => {
    try {
        const {orderId,status} = req.body;
        if (!STATUSES.includes(status)) {
            return res.json({success:false,message:"Invalid status"})
        }
        await orderModel.findByIdAndUpdate(orderId,{status});
        res.json({success:true,message:"Status Updated"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

export {placeOrder,verifyOrder,userOrders,listOrders,updateStatus}
