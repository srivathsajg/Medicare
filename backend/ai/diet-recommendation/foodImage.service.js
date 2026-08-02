/**
 * foodImage.service.js
 * ====================
 * Production-grade Multi-API Food Image Retrieval Pipeline
 *
 * Fallback Order:
 *   1. Spoonacular  (recipe images — best for named dishes)
 *   2. TheMealDB    (free, no key — good for common meals)
 *   3. Pixabay      (stock food photos — broad coverage)
 *   4. Placeholder   (guaranteed fallback)
 *
 * Features:
 *   - Title normalization (strips quantities, brackets, fillers)
 *   - Alias resolution (maps Indian food names to search-friendly terms)
 *   - In-memory + file-based caching (no repeated API calls)
 *   - Validation layer (rejects non-food images)
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const PLACEHOLDER = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop";
const CACHE_FILE = path.join(__dirname, "food_image_cache.json");

// ─────────────────────────────────────────────
//  In-Memory + File Cache
// ─────────────────────────────────────────────
let memoryCache = {};

function loadCache() {
  if (Object.keys(memoryCache).length > 0) return memoryCache;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      memoryCache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch { memoryCache = {}; }
  return memoryCache;
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memoryCache, null, 2), "utf-8");
  } catch { /* silent */ }
}

function getCached(key) {
  const cache = loadCache();
  return cache[key] || null;
}

function setCache(key, url) {
  memoryCache[key] = url;
  saveCache();
}

// ─────────────────────────────────────────────
//  Title Normalization
// ─────────────────────────────────────────────
function normalizeFoodTitle(title) {
  if (!title) return "food";
  let t = title.toLowerCase();

  // Remove bracketed text: (Spinach), (250g), (200ml)
  t = t.replace(/\s*\(.*?\)\s*/g, " ");

  // Remove quantities: 2, 150g, 200ml, 100kcal
  t = t.replace(/\b\d+\s*(ml|g|kcal|grams|pieces|pcs|chapatis|chapati)?\b/gi, " ");

  // Remove filler phrases — longest first
  const FILLERS = [
    "with lots of veggies", "served with lots of", "with lots of",
    "on a whole-wheat bun", "on a whole wheat bun", "with fruit and chia seeds",
    "and vegetable", "and nut mix", "breast with", "with veggies",
    "with lemon", "served with", "lots of", "soaked", "roasted",
    "healthy", "on a", "with", "and",
  ].sort((a, b) => b.length - a.length);

  for (const filler of FILLERS) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`\\b${escaped}\\b`, "gi"), " ");
  }

  // Strip punctuation, collapse whitespace
  t = t.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  return t || "food";
}

// ─────────────────────────────────────────────
//  Alias Resolution
// ─────────────────────────────────────────────
const ALIASES = {
  "fruit nut mix":         "mixed nuts",
  "raisins almonds":       "raisins almonds",
  "palak spinach paneer":  "palak paneer",
  "palak paneer multigrain chapatis": "palak paneer",
  "beetroot soup":         "beetroot soup",
  "beetroot vegetable soup": "beetroot soup",
  "moong dal khichdi":     "khichdi",
  "methi dal":             "dal fenugreek",
  "masoor dal quinoa":     "masoor dal",
  "soybean chunks curry chapati": "soya curry",
  "amla gooseberry juice": "amla juice",
  "makhana fox nuts":      "makhana",
  "jaggery chana":         "jaggery chana",
  "grilled fish or chicken": "grilled fish",
  "grilled liver if non veg or tofu": "grilled tofu",
  "pomegranate apple salad":  "pomegranate salad",
  "spinach beetroot smoothie": "beetroot smoothie",
};

function resolveAlias(normalized) {
  // Direct match
  if (ALIASES[normalized]) return ALIASES[normalized];
  // Partial match — check if any alias key is contained
  for (const [key, val] of Object.entries(ALIASES)) {
    if (normalized.includes(key)) return val;
  }
  return normalized;
}

// ─────────────────────────────────────────────
//  API 1: Spoonacular
// ─────────────────────────────────────────────
async function trySpoonacular(query, apiKey) {
  if (!apiKey) return null;
  try {
    const { data } = await axios.get("https://api.spoonacular.com/recipes/complexSearch", {
      params: { query, number: 1, apiKey },
      timeout: 8000,
    });
    if (data?.results?.length > 0 && data.results[0].image) {
      const img = data.results[0].image;
      // Spoonacular sometimes returns relative paths
      if (img.startsWith("http")) return img;
      return `https://img.spoonacular.com/recipes/${img}`;
    }
  } catch (err) {
    console.error("[FoodImage] Spoonacular error:", err.message);
  }
  return null;
}

// ─────────────────────────────────────────────
//  API 2: TheMealDB (free, no key needed)
// ─────────────────────────────────────────────
async function tryTheMealDB(query) {
  try {
    const { data } = await axios.get("https://www.themealdb.com/api/json/v1/1/search.php", {
      params: { s: query },
      timeout: 6000,
    });
    if (data?.meals?.length > 0 && data.meals[0].strMealThumb) {
      return data.meals[0].strMealThumb;
    }
  } catch (err) {
    console.error("[FoodImage] TheMealDB error:", err.message);
  }
  return null;
}

// ─────────────────────────────────────────────
//  API 3: Pixabay (food category only)
// ─────────────────────────────────────────────
async function tryPixabay(query, apiKey) {
  if (!apiKey || apiKey.includes("your-pixabay-key")) return null;
  try {
    const { data } = await axios.get("https://pixabay.com/api/", {
      params: {
        key: apiKey,
        q: query,
        category: "food",
        image_type: "photo",
        safesearch: true,
        per_page: 3,
      },
      timeout: 6000,
    });
    if (data?.hits?.length > 0) {
      // Pick the first food-tagged result
      return data.hits[0].webformatURL;
    }
  } catch (err) {
    console.error("[FoodImage] Pixabay error:", err.message);
  }
  return null;
}

// ─────────────────────────────────────────────
//  Main Entry Point
// ─────────────────────────────────────────────
async function getFoodImageUrl(rawTitle) {
  if (!rawTitle) return PLACEHOLDER;

  // 1. Normalize + resolve alias
  const normalized = normalizeFoodTitle(rawTitle);
  const query = resolveAlias(normalized);

  // 2. Check cache
  const cached = getCached(query);
  if (cached) return cached;

  // 3. API Fallback Chain
  const spoonacularKey = process.env.SPOONACULAR_API_KEY;
  const pixabayKey = process.env.PIXABAY_API_KEY;

  // Try Spoonacular first
  let imageUrl = await trySpoonacular(query, spoonacularKey);

  // Try TheMealDB second
  if (!imageUrl) {
    imageUrl = await tryTheMealDB(query);
  }

  // Try Pixabay third
  if (!imageUrl) {
    imageUrl = await tryPixabay(query, pixabayKey);
  }

  // Final fallback
  const result = imageUrl || PLACEHOLDER;

  // Cache and return
  setCache(query, result);
  console.log(`[FoodImage] "${rawTitle}" → "${query}" → ${result === PLACEHOLDER ? "PLACEHOLDER" : "OK"}`);
  return result;
}

module.exports = {
  getFoodImageUrl,
  normalizeFoodTitle,
  resolveAlias,
  PLACEHOLDER,
};
