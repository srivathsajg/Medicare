/**
 * generateFoodImage.js
 * ====================
 * AI-Generated Food Image Pipeline for Medicare Diet Cards
 *
 * Strategy:
 *   1. Normalize the food title (strip quantities, brackets, fillers)
 *   2. Build a rich, food-photography AI prompt specific to the dish
 *   3. Generate via Pollinations.ai (free, no API key, deterministic via hash seed)
 *   4. Cache in sessionStorage to avoid re-generating on page re-renders
 *
 * Every food title gets a UNIQUE seed via MD5-like hash → unique image every time.
 */

// ─────────────────────────────────────────────
//  Placeholder (shown on error)
// ─────────────────────────────────────────────
export const FOOD_PLACEHOLDER =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop";


// ─────────────────────────────────────────────
//  Title Normalization
// ─────────────────────────────────────────────
export const normalizeFoodTitle = (title) => {
  if (!title) return "";

  let t = title.toLowerCase();

  // Remove bracketed text: (Spinach), (250g), (200ml)
  t = t.replace(/\s*\(.*?\)\s*/g, " ");

  // Remove measurements: 2, 150g, 200ml, 100kcal
  t = t.replace(/\b\d+\s*(ml|g|kcal|grams|pieces|pcs|chapatis|chapati)?\b/gi, " ");

  // Remove filler phrases (longest first)
  const FILLERS = [
    "with lots of veggies", "served with lots of", "with lots of",
    "and nut mix", "on a whole-wheat bun", "on a whole wheat bun",
    "with fruit and chia seeds", "breast with", "and vegetable",
    "with veggies", "with lemon", "served with", "lots of",
    "soaked", "roasted", "healthy", "on a", "with", "and"
  ].sort((a, b) => b.length - a.length);

  FILLERS.forEach((filler) => {
    const re = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    t = t.replace(re, " ");
  });

  // Strip punctuation, collapse spaces
  t = t.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  return t;
};


// ─────────────────────────────────────────────
//  Unique Hash Seed (NOT length-based!)
// ─────────────────────────────────────────────
const titleToSeed = (str) => {
  // Simple but effective djb2-style hash → always unique per string
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff; // keep positive 31-bit int
  }
  return hash % 1_000_000;
};


// ─────────────────────────────────────────────
//  Food Context Map (richer prompts for known dishes)
// ─────────────────────────────────────────────
const FOOD_CONTEXT_MAP = [
  { keys: ["palak paneer"],            desc: "paneer cubes in vibrant green spinach curry sauce" },
  { keys: ["moong dal khichdi"],       desc: "yellow moong dal khichdi rice porridge drizzled with ghee" },
  { keys: ["methi dal"],               desc: "green fenugreek lentil curry with mustard seeds and tadka" },
  { keys: ["masoor dal"],              desc: "red lentil dal with turmeric, tomato and garam masala" },
  { keys: ["raisins", "almonds"],      desc: "plump golden raisins and whole almonds in a white ceramic bowl" },
  { keys: ["pomegranate", "apple"],    desc: "ruby red pomegranate seeds and sliced green apple salad" },
  { keys: ["amla", "juice"],           desc: "fresh gooseberry amla juice in a glass, bright green" },
  { keys: ["makhana"],                 desc: "lightly salted puffed fox nuts in a dark bowl" },
  { keys: ["jaggery", "chana"],        desc: "raw jaggery pieces with golden roasted chickpeas on a plate" },
  { keys: ["beetroot", "soup"],        desc: "deep crimson beetroot soup in a dark premium bowl, cream swirl on top" },
  { keys: ["spinach", "beetroot", "smoothie"], desc: "vibrant dark red spinach beetroot smoothie in a tall glass" },
  { keys: ["chicken", "brown rice"],   desc: "juicy grilled chicken breast with steamed brown rice and broccoli" },
  { keys: ["grilled salmon"],          desc: "perfectly seared salmon fillet with herb crust and roasted asparagus" },
  { keys: ["tofu scramble"],           desc: "golden scrambled tofu with bell peppers, spinach and spices" },
  { keys: ["oatmeal", "berries"],      desc: "creamy oatmeal bowl topped with fresh blueberries and strawberries" },
  { keys: ["greek yogurt", "granola"], desc: "thick greek yogurt parfait with crunchy granola and honey drizzle" },
  { keys: ["apple", "almond butter"],  desc: "sliced red apple fanned on a plate with almond butter dip" },
  { keys: ["grilled fish"],            desc: "perfectly grilled white fish fillet with lemon wedges and herbs" },
  { keys: ["grilled chicken"],         desc: "chargrilled chicken with golden crust, fresh herbs and vegetables" },
  { keys: ["black bean burger"],       desc: "thick black bean veggie burger in a whole wheat bun with lettuce" },
  { keys: ["lentil soup"],             desc: "hearty golden lentil soup with crusty bread and fresh herbs" },
  { keys: ["quinoa salad"],            desc: "colorful quinoa salad with chickpeas, cucumber and cherry tomatoes" },
  { keys: ["overnight oats"],          desc: "overnight oats in a mason jar with chia seeds and sliced banana" },
  { keys: ["scrambled eggs"],          desc: "fluffy scrambled eggs on whole wheat toast with avocado slices" },
  { keys: ["soybean chunks"],          desc: "soybean chunks in rich tomato curry gravy" },
  { keys: ["steak"],                   desc: "medium-rare grilled steak with roasted sweet potato and broccoli" },
];

const STYLE_SUFFIX =
  "realistic food photography, professional studio lighting, " +
  "top-down perspective, dark premium background, " +
  "clean ceramic bowl or elegant white plate, " +
  "no text, no people, no watermark, 8k resolution, " +
  "healthcare nutrition app aesthetic";

const buildPrompt = (cleanTitle) => {
  for (const { keys, desc } of FOOD_CONTEXT_MAP) {
    if (keys.every((k) => cleanTitle.includes(k))) {
      return `${desc}, ${STYLE_SUFFIX}`;
    }
  }
  // Generic fallback — still rich and food-specific
  return `${cleanTitle}, delicious freshly prepared food dish, ${STYLE_SUFFIX}`;
};


// ─────────────────────────────────────────────
//  Session-level Cache (avoids flickering on re-renders)
// ─────────────────────────────────────────────
const SESSION_CACHE = {};

const getFromSession = (key) => {
  if (SESSION_CACHE[key]) return SESSION_CACHE[key];
  try {
    return sessionStorage.getItem(`food_turbo_v1_${key}`) || null;
  } catch {
    return null;
  }
};

const saveToSession = (key, url) => {
  SESSION_CACHE[key] = url;
  try {
    sessionStorage.setItem(`food_turbo_v1_${key}`, url);
  } catch {
    /* silent */
  }
};


// ─────────────────────────────────────────────
//  Main: generateFoodImage(foodTitle) → URL string
// ─────────────────────────────────────────────
/**
 * Synchronously returns a deterministic AI-generated image URL for a food title.
 * The URL points to Pollinations.ai which renders the image asynchronously.
 * Use onLoad/onError handlers in <img> to show skeleton loader while it loads.
 */
export const generateFoodImage = (foodTitle) => {
  if (!foodTitle) return FOOD_PLACEHOLDER;

  const clean = normalizeFoodTitle(foodTitle);
  if (!clean) return FOOD_PLACEHOLDER;

  // Check cache
  const cached = getFromSession(clean);
  if (cached) return cached;

  // Build prompt and seed
  const prompt = buildPrompt(clean);
  const seed = titleToSeed(clean);
  const encodedPrompt = encodeURIComponent(prompt);

  // Pollinations.ai — free AI image generation, no API key required
  // model=turbo is 5x faster than model=flux (~3-5 seconds vs 30+ seconds)
  const url =
    `https://image.pollinations.ai/prompt/${encodedPrompt}` +
    `?width=1200&height=900&nologo=true&seed=${seed}&model=turbo&enhance=false`;

  saveToSession(clean, url);
  return url;
};

// Keep backward-compat alias so PatientDietPlan import still works
export const getFoodImage = generateFoodImage;
