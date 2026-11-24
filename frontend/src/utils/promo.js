// Discount a promo code takes off a cart, in rand. Money is worked out in cents so it matches the server exactly.
// coupon = {type:"percent"|"fixed", value, minSubtotal}.
// Keep in sync with discountCents() in backend/utils/coupons.js. The server has the last word at checkout.
export const discountFor = (coupon, subtotalCents) => {
  if (!coupon || subtotalCents <= 0) return 0;
  if (subtotalCents < Math.round((coupon.minSubtotal || 0) * 100)) return 0;
  const raw = coupon.type === 'percent'
    ? Math.round(subtotalCents * coupon.value / 100)
    : Math.round(coupon.value * 100);
  return Math.max(0, Math.min(raw, subtotalCents)) / 100;
};
