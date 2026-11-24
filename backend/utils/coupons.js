import couponModel from "../models/couponModel.js";

export const normalizeCode = (code) => String(code ?? "").trim().toUpperCase().replace(/\s+/g,"");

const rand = (n) => "R" + Number(n).toLocaleString("en-ZA",{minimumFractionDigits:Number.isInteger(Number(n))?0:2,maximumFractionDigits:2});

// What is wrong with using this coupon on a cart worth `subtotalCents`? Returns a message, or null when it works.
// A missing and a paused code give the same answer so nobody can probe which codes exist.
export const couponProblem = (coupon, subtotalCents, now = new Date()) => {
    if (!coupon || !coupon.active) return "That promo code is not valid";
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= now) return "That promo code has expired";
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return "That promo code has been fully redeemed";
    const minCents = Math.round((coupon.minSubtotal || 0) * 100);
    if (subtotalCents < minCents) return `Spend ${rand(coupon.minSubtotal)} or more on products to use this code`;
    return null;
}

// Discount in cents. It only ever reduces the products, never delivery, and never goes below zero or above the subtotal.
// Keep in sync with discountFor() in frontend/src/context/StoreContext.jsx.
export const discountCents = (coupon, subtotalCents) => {
    const raw = coupon.type === "percent"
        ? Math.round(subtotalCents * coupon.value / 100)
        : Math.round(coupon.value * 100);
    return Math.max(0, Math.min(raw, subtotalCents));
}

// Looks the code up and checks it against this cart. Returns {coupon,discountCents} or {error}.
export const evaluateCoupon = async (rawCode, subtotalCents) => {
    const code = normalizeCode(rawCode);
    if (!code) return {error:"Enter a promo code"};
    const coupon = await couponModel.findOne({code});
    const problem = couponProblem(coupon,subtotalCents);
    if (problem) return {error:problem};
    return {coupon,discountCents:discountCents(coupon,subtotalCents)};
}
