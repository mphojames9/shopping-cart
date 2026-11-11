// R12 999 / R199,50 (South African formatting)
export const formatPrice = (value) => {
  const n = Number(value) || 0;
  return "R" + n.toLocaleString("en-ZA", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

// The admin "Add product" form saves the category as "Taplets", so products are stored under that name.
// This only fixes how it is shown to shoppers.
export const categoryLabel = (name) => (name === "Taplets" ? "Tablets" : name);
