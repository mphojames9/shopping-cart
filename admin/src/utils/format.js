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
