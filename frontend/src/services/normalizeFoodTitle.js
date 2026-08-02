/**
 * FOOD TITLE NORMALIZATION
 * Normalizes a food title by removing quantities, descriptors, and symbols.
 * 
 * Example: "Palak (Spinach) Paneer with 2 Multigrain Chapatis" -> "palak paneer"
 */
export const normalizeFoodTitle = (title) => {
    if (!title) return "";
    
    let normalized = title.toLowerCase();
    
    // 1. Remove bracketed text like (Spinach) or (200ml)
    normalized = normalized.replace(/\s*\(.*?\)\s*/g, ' ');
    
    // 2. Remove specific quantities and numbers (2, 150g, 100 kcal)
    normalized = normalized.replace(/\b\d+\s*(ml|g|kcal|kcalories|grams|chapatis|pcs|pieces)?\b/gi, ' ');
    
    // 3. Remove common meal modifiers and fillers
    const fillers = [
        "with lots of veggies", "with veggies", "healthy", "and vegetable", 
        "and nut mix", "breast with", "with lots of", "on a whole wheat bun",
        "on a whole-wheat bun", "with fruit and chia seeds", "with lemon",
        "with", "and", "served with", "on a", "lots of", "soaked", "roasted"
    ];
    
    // Sort by length descending to replace longest phrases first
    const sortedFillers = fillers.sort((a, b) => b.length - a.length);
    sortedFillers.forEach(f => {
        const regex = new RegExp(`\\b${f}\\b`, 'gi');
        normalized = normalized.replace(regex, ' ');
    });
    
    // 4. Strip punctuation and extra whitespace
    normalized = normalized.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    return normalized;
};
