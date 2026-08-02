/**
 * CANONICAL FOOD ALIAS RESOLUTION
 * Maps multiple title variations to a single canonical key.
 */

export const FOOD_ALIASES = {
  "soaked raisins and almonds": "raisins almonds",
  "raisins and almonds": "raisins almonds",
  "mixed nuts": "mixed nuts",
  "fruit and nut mix": "mixed nuts",
  "palak spinach paneer": "palak paneer",
  "palak paneer with chapatis": "palak paneer",
  "palak paneer with multigrain chapatis": "palak paneer",
  "beetroot and vegetable soup": "beetroot soup",
  "moong dal khichdi with veggies": "moong dal khichdi"
};

/**
 * Resolves a normalized food title to its canonical alias.
 */
export const resolveFoodAlias = (normalizedTitle) => {
    if (!normalizedTitle) return null;
    
    // Check direct alias mapping
    if (FOOD_ALIASES[normalizedTitle]) return FOOD_ALIASES[normalizedTitle];
    
    // Fuzzy keyword matching for common categories
    const title = normalizedTitle.toLowerCase();
    if (title.includes("nut") || title.includes("almond") || title.includes("raisin")) return "raisins almonds";
    if (title.includes("paneer")) return "palak paneer";
    if (title.includes("khichdi") || title.includes("dal")) return "moong dal khichdi";
    if (title.includes("soup")) return "beetroot soup";
    if (title.includes("egg")) return "boiled egg";
    if (title.includes("smoothie")) return "spinach smoothie";
    if (title.includes("oat")) return "oats breakfast";
    if (title.includes("fruit")) return "fruit bowl";
    
    return normalizedTitle; // Default to normalizedTitle if no alias found
};
