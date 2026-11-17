// Turns the paid-order list + product list into everything the Dashboard shows.
import { formatRandWhole } from "./format";

const DAY = 86400000;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const STATUSES = ["Processing", "Out for delivery", "Delivered"];

export const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const itemsOf = (order) => (Array.isArray(order.items) ? order.items : []);

// one bucket per calendar day, starting at `start`
const bucketByDay = (orders, start, days) => {
  const buckets = Array.from({ length: days }, (_, i) => ({
    date: addDays(start, i),
    revenue: 0,
    orders: 0,
    items: 0,
  }));
  for (const order of orders) {
    const index = Math.round((startOfDay(order.date) - start) / DAY);
    if (index < 0 || index >= days) continue;
    const bucket = buckets[index];
    bucket.revenue += Number(order.amount) || 0;
    bucket.orders += 1;
    bucket.items += itemsOf(order).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }
  return buckets;
};

const totalsOf = (buckets) => {
  const revenue = buckets.reduce((sum, b) => sum + b.revenue, 0);
  const orders = buckets.reduce((sum, b) => sum + b.orders, 0);
  const items = buckets.reduce((sum, b) => sum + b.items, 0);
  return { revenue, orders, items, aov: orders ? revenue / orders : 0 };
};

// null = nothing to compare, isNew = there were no sales before, otherwise a percentage
export const deltaOf = (current, previous) => {
  if (!previous) return current ? { isNew: true, pct: null } : null;
  return { isNew: false, pct: ((current - previous) / previous) * 100 };
};

export function buildStats(orders, foods, days, nowValue = new Date()) {
  const valid = orders.filter((order) => !Number.isNaN(new Date(order.date).getTime()));
  const today = startOfDay(nowValue);
  const start = addDays(today, -(days - 1));
  const previousStart = addDays(start, -days);

  const current = bucketByDay(valid, start, days);
  const previous = bucketByDay(valid, previousStart, days);
  const totals = totalsOf(current);
  const prevTotals = totalsOf(previous);
  const deltas = {
    revenue: deltaOf(totals.revenue, prevTotals.revenue),
    orders: deltaOf(totals.orders, prevTotals.orders),
    items: deltaOf(totals.items, prevTotals.items),
    aov: deltaOf(totals.aov, prevTotals.aov),
  };

  const inPeriod = valid.filter((order) => {
    const day = startOfDay(order.date);
    return day >= start && day <= today;
  });

  // ----- products sold in the period
  const foodById = new Map(foods.map((food) => [String(food._id), food]));
  const sold = new Map();
  for (const order of inPeriod) {
    for (const item of itemsOf(order)) {
      const quantity = Number(item.quantity) || 0;
      const key = String(item.foodId || item.name);
      const entry = sold.get(key) || {
        key,
        foodId: item.foodId ? String(item.foodId) : null,
        fallbackName: item.name,
        units: 0,
        revenue: 0,
      };
      entry.units += quantity;
      entry.revenue += quantity * (Number(item.price) || 0);
      sold.set(key, entry);
    }
  }
  const products = [...sold.values()].map((entry) => {
    const food = entry.foodId ? foodById.get(entry.foodId) : null;
    return {
      ...entry,
      exists: !!food,
      name: food?.name || entry.fallbackName || "Removed product",
      image: food?.image || null,
      category: food?.category || "Other",
    };
  });
  const top = [...products].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 5);

  // ----- revenue by category (top 5 + "Other")
  const byCategory = new Map();
  for (const product of products) {
    byCategory.set(product.category, (byCategory.get(product.category) || 0) + product.revenue);
  }
  const otherRevenue = byCategory.get("Other") || 0;
  byCategory.delete("Other");
  const ranked = [...byCategory.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const categories = ranked.slice(0, 5);
  const rest = ranked.slice(5).reduce((sum, c) => sum + c.revenue, 0) + otherRevenue;
  if (rest > 0) categories.push({ name: "Other", revenue: rest });
  const categoryTotal = categories.reduce((sum, c) => sum + c.revenue, 0);

  // ----- order pipeline (all paid orders, not just this period)
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const order of valid) {
    const status = STATUSES.includes(order.status) ? order.status : "Processing";
    counts[status] += 1;
  }

  // ----- plain-language insights
  const insights = [];
  if (deltas.revenue && !deltas.revenue.isNew) {
    const pct = Math.round(Math.abs(deltas.revenue.pct));
    if (pct >= 1) {
      const up = deltas.revenue.pct > 0;
      insights.push({
        id: "trend",
        tone: up ? "up" : "down",
        icon: up ? "up" : "down",
        title: `Revenue is ${up ? "up" : "down"} ${pct}%`,
        body: `${formatRandWhole(totals.revenue)} compared with ${formatRandWhole(prevTotals.revenue)} in the previous ${days} days.`,
      });
    }
  } else if (deltas.revenue?.isNew) {
    insights.push({
      id: "trend",
      tone: "up",
      icon: "up",
      title: "Sales are picking up",
      body: `Nothing sold in the previous ${days} days, then ${totals.orders} ${totals.orders === 1 ? "order" : "orders"} in this period.`,
    });
  }

  if (counts.Processing > 0) {
    const n = counts.Processing;
    insights.push({
      id: "processing",
      tone: "warn",
      icon: "orders",
      title: `${n} ${n === 1 ? "order needs" : "orders need"} attention`,
      body: "Paid and still marked Processing. Tap to review them.",
      to: "/orders?status=Processing",
    });
  }

  if (days >= 30 && inPeriod.length >= 6 && totals.revenue > 0) {
    const perDay = new Array(7).fill(0);
    for (const order of inPeriod) perDay[new Date(order.date).getDay()] += Number(order.amount) || 0;
    const best = perDay.indexOf(Math.max(...perDay));
    const share = Math.round((perDay[best] / totals.revenue) * 100);
    if (share >= 20) {
      insights.push({
        id: "weekday",
        tone: "info",
        icon: "day",
        title: `${WEEKDAYS[best]} is your strongest day`,
        body: `${share}% of this period's revenue came in on ${WEEKDAYS[best]}s.`,
      });
    }
  }

  const soldIds = new Set(products.filter((p) => p.foodId).map((p) => p.foodId));
  const unsold = foods.filter((food) => !soldIds.has(String(food._id)));
  if (inPeriod.length > 0 && unsold.length > 0) {
    insights.push({
      id: "unsold",
      tone: "info",
      icon: "products",
      title: `${unsold.length} ${unsold.length === 1 ? "product hasn't" : "products haven't"} sold`,
      body: `No sales in the last ${days} days. A fresh photo or price tweak might help.`,
      to: "/list",
    });
  }

  if (inPeriod.length === 0) {
    insights.push({
      id: "quiet",
      tone: "info",
      icon: "quiet",
      title: "A quiet stretch",
      body: `No paid orders in the last ${days} days.`,
    });
  }

  return {
    days,
    series: { current, previous },
    totals,
    prevTotals,
    deltas,
    top,
    categories,
    categoryTotal,
    pipeline: { counts, total: valid.length },
    insights: insights.slice(0, 4),
    periodOrders: inPeriod.length,
    hasPrevious: prevTotals.orders > 0,
  };
}
