// Product specifications: a list of {label, value}, e.g. {label:"Screen size", value:"13 inch"}
export const MAX_SPECS = 12;

// quick-add suggestions per category
export const SPEC_PRESETS = {
  "Phones": ["Screen size", "Storage", "RAM", "Camera", "Battery", "Colour"],
  "Laptops": ["Screen size", "Processor", "RAM", "Storage", "Battery", "Weight"],
  "Smart TV": ["Screen size", "Resolution", "Refresh rate", "Smart platform", "HDMI ports"],
  "Monitor": ["Screen size", "Resolution", "Refresh rate", "Panel type", "Response time"],
  "Taplets": ["Screen size", "Storage", "RAM", "Battery", "Connectivity"],
  "Accessories": ["Compatibility", "Connectivity", "Colour", "Warranty", "Battery"],
  "Office": ["Dimensions", "Material", "Weight", "Colour", "Warranty"],
  "Gaming": ["Platform", "Connectivity", "Colour", "Warranty", "Battery"],
};

// what a typical value looks like (shown as the placeholder)
const HINTS = {
  "screen size": "13 inch",
  "storage": "256GB",
  "ram": "8GB",
  "camera": "48MP",
  "battery": "5000mAh",
  "resolution": "1920 x 1080",
  "refresh rate": "144Hz",
  "weight": "1.3kg",
  "colour": "Midnight black",
  "warranty": "2 years",
  "processor": "Intel Core i5",
  "response time": "1ms",
  "panel type": "IPS",
  "connectivity": "Bluetooth 5.3",
  "hdmi ports": "3",
  "dimensions": "120 x 60 x 45 cm",
  "material": "Mesh and aluminium",
  "platform": "PlayStation 5",
  "compatibility": "Windows and macOS",
  "smart platform": "Google TV",
};
export const hintFor = (label) => HINTS[String(label || "").trim().toLowerCase()] || "13 inch";

export const ALL_LABELS = [...new Set(Object.values(SPEC_PRESETS).flat())].sort();

let counter = 0;
export const newRow = (label = "", value = "") => ({ id: `spec-${Date.now()}-${counter++}`, label, value });
export const toRows = (specs) => (Array.isArray(specs) ? specs : []).map((s) => newRow(s.label, s.value));

// trims, drops empty rows; `incomplete` counts rows that have only a name or only a value
export function cleanSpecs(rows) {
  const specs = [];
  let incomplete = 0;
  for (const row of rows) {
    const label = row.label.trim();
    const value = row.value.trim();
    if (!label && !value) continue;
    if (!label || !value) { incomplete++; continue; }
    specs.push({ label, value });
  }
  return { specs, incomplete };
}
