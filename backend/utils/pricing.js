import foodModel from "../models/foodModel.js";

// Prices a cart ([{id,quantity}]) from the database, never from the browser.
// Money is handled in cents so percentages and totals never pick up floating point noise.
// Returns {lines,subtotalCents} or {error}.
export const priceItems = async (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return {error:"Your cart is empty"};
    }
    const foods = await foodModel.find({_id:{$in:items.map(i => i.id)}});
    const lines = [];
    let subtotalCents = 0;
    for (const item of items) {
        const food = foods.find(f => String(f._id) === String(item.id));
        const quantity = Number(item.quantity);
        if (!food || !Number.isInteger(quantity) || quantity < 1) {
            return {error:"One or more items are no longer available"};
        }
        lines.push({foodId:String(food._id),name:food.name,price:food.price,quantity});
        subtotalCents += Math.round(food.price * 100) * quantity;
    }
    return {lines,subtotalCents};
}
