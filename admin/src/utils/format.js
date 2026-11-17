// Small formatting helpers shared by the pages.

export const formatRand = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "R 0.00";
  return `R ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatRandWhole = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return "R 0";
  return `R ${Math.round(n).toLocaleString("en-US")}`;
};

// 1200 -> "1.2k", 2500000 -> "2.5M" (chart axes, donut centre)
export const formatCompact = (value) => {
  const n = Math.abs(Number(value) || 0);
  const trim = (x) => String(Math.round(x * 10) / 10);
  if (n >= 1e6) return `${trim(n / 1e6)}M`;
  if (n >= 1e3) return `${trim(n / 1e3)}k`;
  return String(Math.round(n));
};

export const formatDayShort = (date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const formatDayLong = (date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

export const timeAgo = (timestamp, now = Date.now()) => {
  const seconds = Math.max(0, (now - timestamp) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} min ago`;
  return `${Math.floor(seconds / 3600)} h ago`;
};
