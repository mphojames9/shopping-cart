// Spotlight search brain: understands everyday shopping phrases such as
// "phones under R5000", "cheapest laptop", "gaming 2k-6k" and ranks products
// with typo tolerance. Pure functions, no React, so it is easy to test.
import { categoryLabel } from "./format";

const STOPWORDS = new Set([
  "a","an","the","for","me","my","i","we","you","want","need","looking","look","find","show","get","buy",
  "some","any","good","nice","best","top","please","pls","with","and","or","of","in","on","to","that",
  "is","are","can","have","has","something","anything","one","new","rand","rands","zar",
]);

// words that mean a category, keyed by the category name in lower case
const SYNONYMS = {
  phones: ["phone","phones","smartphone","smartphones","mobile","mobiles","cellphone","cellphones"],
  laptops: ["laptop","laptops","notebook","notebooks"],
  "smart tv": ["tv","tvs","television","televisions"],
  monitor: ["monitor","monitors"],
  taplets: ["tablet","tablets","taplet","taplets"],
  accessories: ["accessory","accessories"],
  office: ["office"],
  gaming: ["gaming","gamer","console","consoles"],
};

const words = (text) => {
  const lower = String(text || "").toLowerCase();
  const found = lower.match(/[a-z0-9]+/g) || [];
  // "13 inch" is also findable as "13inch", "16 gb" as "16gb"
  for (const m of lower.matchAll(/\b(\d+)\s+([a-z]+)/g)) found.push(m[1] + m[2]);
  return found;
};
const rand = (n) => "R" + Math.round(n).toLocaleString("en-ZA").replace(/\s/g, ",");

/* ------------------------------------------------------------------
   Categories: which words mean which category
------------------------------------------------------------------- */
export const buildCategoryWords = (products) => {
  const map = new Map();
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  for (const category of categories) {
    const list = new Set(SYNONYMS[category.toLowerCase()] || []);
    for (const name of [category.toLowerCase(), categoryLabel(category).toLowerCase()]) {
      if (/\s/.test(name)) continue;
      list.add(name);
      list.add(name.endsWith("s") ? name.slice(0, -1) : name + "s");
    }
    for (const word of list) if (!map.has(word)) map.set(word, category);
  }
  return map;
};

/* ------------------------------------------------------------------
   Understanding the query
------------------------------------------------------------------- */
// 5000, R5000, r 5 000, R1,299, 5k, 2.5k, 5000 rand
const MONEY_SRC = String.raw`(?<![a-z0-9])(?:r\s?(?<rg>\d{1,3}(?:[ \u00a0,]\d{3})+)(?!\d)|(?<pre>r\s?)?(?<num>\d{1,3}(?:,\d{3})+(?!\d)|\d+(?:\.\d+)?))(?:\s?(?<k>k)\b)?(?:\s?(?<rand>rands?|zar)\b)?`;
// "55 inch", "256gb", "120hz" are specs, not prices
const SPEC_AFTER = /^\s*(?:inch(?:es)?\b|in\b|["”″]|gb\b|tb\b|mb\b|mp\b|hz\b|mah\b|cm\b|mm\b|kg\b|g\b|w\b|%|ghz\b|fps\b)/;

const MAX_KW = /(?:\b(?:under|below|beneath|less than|cheaper than|up to|upto|max|maximum|within|at most|no more than|not more than|budget of|budget)|<=?)\s*$/;
const MIN_KW = /(?:\b(?:over|above|more than|at least|min|minimum|from|starting at|starts at|exceeding)|>=?)\s*$/;
const AROUND_KW = /(?:\b(?:around|about|approx|approximately|roughly|circa)|~)\s*$/;
const FOR_KW = /\bfor\s*$/;
const BETWEEN_KW = /\b(?:between|from)\s*$/;

const SORTS = [
  ["asc", "Cheapest first", /\b(?:least expensive|lowest price|low cost|cheapest|cheap|budget|affordable|lowest)\b/],
  ["desc", "Priciest first", /\b(?:most expensive|highest price|high[ -]end|priciest|expensive|premium|luxury|flagship)\b/],
];

const findNumbers = (work) => {
  const found = [];
  const re = new RegExp(MONEY_SRC, "g");
  let m;
  while ((m = re.exec(work))) {
    const g = m.groups;
    const digits = g.rg ? g.rg.replace(/[ \u00a0,]/g, "") : g.num.replace(/,/g, "");
    const end = m.index + m[0].length;
    if (SPEC_AFTER.test(work.slice(end))) continue;
    found.push({
      start: m.index,
      end,
      value: parseFloat(digits) * (g.k ? 1000 : 1),
      k: !!g.k,
      marked: !!(g.rg || g.pre || g.k || g.rand),
      currency: !!(g.rg || g.pre || g.rand), // R5000 / 5000 rand (a bare "4k" is a screen resolution)
    });
  }
  return found;
};

export function parseQuery(raw, categoryWords = new Map()) {
  const text = String(raw || "").toLowerCase();
  let work = text; // parts we understand are blanked out (same length) so positions stay valid
  const blank = (start, end) => { work = work.slice(0, start) + " ".repeat(end - start) + work.slice(end); };

  const chips = [];
  let minPrice = null;
  let maxPrice = null;
  let sort = null;
  const setMax = (v) => { maxPrice = maxPrice == null ? v : Math.min(maxPrice, v); };
  const setMin = (v) => { minPrice = minPrice == null ? v : Math.max(minPrice, v); };

  // ----- prices
  const numbers = findNumbers(work);
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    const next = numbers[i + 1];
    const before = work.slice(0, n.start);

    // range: "between 2000 and 5000", "2k-6k", "3000 to 8000"
    if (next) {
      const connector = /^\s*(-|–|—|to|and)\s*$/.exec(work.slice(n.end, next.start));
      const between = BETWEEN_KW.exec(before);
      const dashLike = connector && connector[1] !== "and";
      if (connector && (between || (dashLike && (n.marked || next.marked || (n.value >= 100 && next.value >= 100))))) {
        let lo = n.value;
        const hi = next.value;
        if (next.k && !n.k && lo < 1000) lo *= 1000; // "2-6k"
        const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
        const start = between ? between.index : n.start;
        blank(start, next.end);
        setMin(a);
        setMax(b);
        chips.push({ kind: "price", label: `${rand(a)} – ${rand(b)}`, ranges: [[start, next.end]] });
        i++;
        continue;
      }
    }

    let role = null;
    let start = n.start;
    let hit;
    if ((hit = MAX_KW.exec(before))) { role = "max"; start = hit.index; }
    else if ((hit = MIN_KW.exec(before))) { role = "min"; start = hit.index; }
    else if ((hit = AROUND_KW.exec(before))) { role = "around"; start = hit.index; }
    else if ((hit = FOR_KW.exec(before)) && (n.marked || n.value >= 100)) { role = "max"; start = hit.index; }
    else if (n.currency) role = "max"; // "phones R5000" reads as a budget; "4k tv" does not
    if (!role) continue;

    blank(start, n.end);
    if (role === "max") { setMax(n.value); chips.push({ kind: "price", label: `Under ${rand(n.value)}`, ranges: [[start, n.end]] }); }
    if (role === "min") { setMin(n.value); chips.push({ kind: "price", label: `Over ${rand(n.value)}`, ranges: [[start, n.end]] }); }
    if (role === "around") {
      setMin(n.value * 0.75);
      setMax(n.value * 1.25);
      chips.push({ kind: "price", label: `Around ${rand(n.value)}`, ranges: [[start, n.end]] });
    }
  }

  // ----- sort words
  for (const [direction, label, re] of SORTS) {
    if (sort) break;
    const hit = re.exec(work);
    if (!hit) continue;
    sort = direction;
    blank(hit.index, hit.index + hit[0].length);
    chips.push({ kind: "sort", label, ranges: [[hit.index, hit.index + hit[0].length]] });
  }

  // ----- what is left are the words to look for
  const tokens = [];
  const re = /[a-z0-9]+/g;
  let m;
  while ((m = re.exec(work))) {
    const token = m[0];
    if (STOPWORDS.has(token)) continue;
    if (token.length === 1 && !/\d/.test(token)) continue;
    tokens.push({ text: token, start: m.index, end: m.index + token.length, category: categoryWords.has(token) });
  }

  // a mistyped category word ("laptp", "moniter") still counts as that category
  for (const token of tokens) {
    if (token.category || token.text.length < 4) continue;
    for (const [word, category] of categoryWords) {
      if (wordMatch(token.text, word, 5) >= 0.55) {
        token.category = true;
        token.resolved = category;
        break;
      }
    }
  }

  // category words become chips too, so people can see (and drop) what was understood
  const byCategory = new Map();
  for (const token of tokens) {
    const category = categoryWords.get(token.text) || token.resolved;
    if (!category) continue;
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push([token.start, token.end]);
  }
  for (const [category, ranges] of byCategory) {
    chips.push({ kind: "category", label: categoryLabel(category), ranges });
  }
  chips.sort((a, b) => a.ranges[0][0] - b.ranges[0][0]);
  chips.forEach((chip, i) => { chip.id = `${chip.kind}-${i}`; });

  return {
    raw: String(raw || ""),
    tokens,
    chips,
    minPrice,
    maxPrice,
    sort,
    specific: tokens.some((t) => !t.category),
    empty: tokens.length === 0 && minPrice == null && maxPrice == null && !sort,
  };
}

// take one understood part (a chip) back out of what was typed
export function removeChip(raw, chip) {
  let out = String(raw || "");
  for (const [start, end] of [...chip.ranges].sort((a, b) => b[0] - a[0])) {
    out = out.slice(0, start) + " " + out.slice(end);
  }
  return out.replace(/\s{2,}/g, " ").replace(/^\s+/, "");
}

/* ------------------------------------------------------------------
   Finding and ranking products
------------------------------------------------------------------- */
// Damerau-Levenshtein (adjacent swaps count as one typo) with an early exit
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      row[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

// how well one typed word matches one product word: 1 exact ... 0 not at all
function wordMatch(token, word, minPrefix = 2) {
  if (word === token) return 1;
  if (token === word + "s" || token === word + "es") return 0.95; // "laptops" ~ "laptop"
  if (token.length >= minPrefix && word.startsWith(token)) return 0.8; // "iphon" ~ "iphone"
  // typos only apply to words: "16gb" is not a typo of "12gb"
  if (token.length >= 4 && token[0] === word[0] && !/\d/.test(token) && !/\d/.test(word)) { // "laptp", "samsng"
    const limit = token.length >= 8 ? 2 : 1;
    const whole = editDistance(token, word, limit);
    // typo in the first part of a longer word ("samsng" ~ "samsungx"); an exact prefix is
    // a prefix match, which minPrefix already decided about
    const start = word.length > token.length ? editDistance(token, word.slice(0, token.length), limit) : limit + 1;
    if (whole <= limit || (start > 0 && start <= limit)) return 0.55;
  }
  return 0;
}

const bestMatch = (token, list, minPrefix) => list.reduce((best, word) => Math.max(best, wordMatch(token, word, minPrefix)), 0);

export function buildIndex(products, categoryWords) {
  const wordsOf = new Map();
  for (const [word, category] of categoryWords) {
    if (!wordsOf.has(category)) wordsOf.set(category, []);
    wordsOf.get(category).push(word);
  }
  return products.map((product) => ({
    product,
    nameWords: words(product.name),
    catWords: wordsOf.get(product.category) || words(categoryLabel(product.category || "")),
    descWords: words(product.description),
    specWords: words((product.specs || []).map((spec) => `${spec.label} ${spec.value}`).join(" ")),
  }));
}

// name matters most, then category, then the description.
// A category word ("phones") must match the name or the category: a charger whose
// description says "charges phones" is not a phone. Specs ("13 inch", "16GB") count more
// than the free-text description.
function tokenScore(token, entry, categoryWord) {
  const parts = [
    3 * bestMatch(token, entry.nameWords),
    2.2 * bestMatch(token, entry.catWords, 5),
    categoryWord ? 0 : 1.4 * bestMatch(token, entry.specWords),
    categoryWord ? 0 : 0.9 * bestMatch(token, entry.descWords),
  ];
  const best = Math.max(...parts);
  if (best === 0) return 0;
  return best + 0.15 * (parts.filter((p) => p > 0).length - 1);
}

export function searchProducts(index, parsed) {
  const { tokens, minPrice, maxPrice, sort } = parsed;
  const texts = tokens.map((t) => t.text);
  const scored = index
    .filter(({ product }) => (minPrice == null || product.price >= minPrice) && (maxPrice == null || product.price <= maxPrice))
    .map((entry) => {
      const parts = tokens.map((t) => tokenScore(t.text, entry, t.category));
      return { product: entry.product, score: parts.reduce((a, b) => a + b, 0), matched: parts.filter((p) => p > 0).length };
    });

  let results = scored.filter((r) => r.matched === texts.length);
  let partial = false;
  if (results.length === 0 && texts.length > 1) {
    // nothing matches every word: fall back to the closest matches
    results = scored.filter((r) => r.matched > 0 && r.matched >= Math.ceil(texts.length / 2));
    partial = results.length > 0;
  }

  const byPrice = (dir) => (a, b) => (dir === "desc" ? b.product.price - a.product.price : a.product.price - b.product.price);
  if (sort) results.sort((a, b) => byPrice(sort)(a, b) || b.score - a.score);
  else if (parsed.specific) results.sort((a, b) => b.score - a.score || a.product.price - b.product.price);
  else results.sort(byPrice(maxPrice != null && minPrice == null ? "desc" : "asc")); // best you can get within a budget

  return { results, partial };
}

/* ------------------------------------------------------------------
   Highlighting the matched part of a product name
------------------------------------------------------------------- */
export function highlight(text, tokens) {
  const lower = text.toLowerCase();
  const marks = [];
  for (const { text: token } of tokens) {
    const variants = new Set([token]);
    if (token.length > 3 && token.endsWith("s")) variants.add(token.slice(0, -1));
    for (const variant of variants) {
      let from = 0;
      for (;;) {
        const at = lower.indexOf(variant, from);
        if (at < 0) break;
        if (at === 0 || !/[a-z0-9]/.test(lower[at - 1])) marks.push([at, at + variant.length]);
        from = at + variant.length;
      }
    }
  }
  marks.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const mark of marks) {
    const last = merged[merged.length - 1];
    if (last && mark[0] <= last[1]) last[1] = Math.max(last[1], mark[1]);
    else merged.push([...mark]);
  }
  const parts = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), hit: false });
    parts.push({ text: text.slice(start, end), hit: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts.length ? parts : [{ text, hit: false }];
}

/* ------------------------------------------------------------------
   "Try asking" ideas built from the real catalogue (each one is checked to return results)
------------------------------------------------------------------- */
const NICE_PRICES = [500, 1000, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 30000, 50000];
const nicePrice = (value) => NICE_PRICES.find((n) => n >= value) || Math.ceil(value / 10000) * 10000;

export function buildSuggestions(products, categoryWords, count = 4) {
  if (!products.length) return [];
  const byCategory = new Map();
  for (const product of products) {
    if (!product.category) continue;
    if (!byCategory.has(product.category)) byCategory.set(product.category, []);
    byCategory.get(product.category).push(product.price);
  }
  const ranked = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);
  const label = (category) => categoryLabel(category).toLowerCase();

  const ideas = [];
  ranked.forEach(([category, prices], i) => {
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (i === 0) ideas.push(`${label(category)} under R${nicePrice(median)}`);
    if (i === 1) ideas.push(`cheapest ${label(category)}`);
    if (i === 2) ideas.push(`most expensive ${label(category)}`);
    if (i === 3) ideas.push(`${label(category)} over R${nicePrice(sorted[0])}`);
  });
  for (const [category] of ranked) ideas.push(label(category));

  const index = buildIndex(products, categoryWords);
  const seen = new Set();
  return ideas
    .filter((idea) => {
      if (seen.has(idea)) return false;
      seen.add(idea);
      return searchProducts(index, parseQuery(idea, categoryWords)).results.length > 0;
    })
    .slice(0, count);
}
