/**
 * LOCAL FOOD IMAGE LIBRARY (PRIMARY SOURCE)
 * Use this as the PRIMARY image source.
 */

export const LOCAL_FOOD_IMAGES = {
  "raisins almonds": "/images/raisins_almonds.jpg",
  "mixed nuts": "/images/mixed_nuts.jpg",
  "palak paneer": "/images/palak_paneer.jpg",
  "moong dal khichdi": "/images/moong_dal_khichdi.jpg",
  "beetroot soup": "/images/beetroot_soup.jpg",
  "boiled egg": "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
  "spinach smoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop",
  "fruit bowl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
  "oats breakfast": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=800&auto=format&fit=crop"
};

// DEFAULT SAFE FALLBACK
export const DEFAULT_HEALTHY_FOOD = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop";

/**
 * IMAGE VALIDATION LAYER
 * Accept image only if metadata contains food-related terms.
 * Reject image if metadata contains urban/landscape terms.
 */
export const isValidFoodImage = (metadata) => {
    if (!metadata) return true; // Default to true if no metadata available for check
    
    // Accept image only if metadata contains food-related terms:
    const validTerms = [
        "food", "dish", "meal", "soup", "curry", "breakfast", "lunch", "dinner", 
        "nuts", "paneer", "khichdi", "salad", "fruit", "healthy"
    ];
    
    // Reject image if metadata contains:
    const invalidTerms = [
        "city", "skyline", "urban", "architecture", "building", "landscape", 
        "wallpaper", "travel", "downtown", "mountain", "person", "portrait"
    ];
    
    const text = (metadata.alt || metadata.title || metadata.description || "").toLowerCase();
    
    // Reject image if metadata contains invalid terms
    if (invalidTerms.some(term => text.includes(term))) return false;
    
    // Accept image only if metadata contains food-related terms
    if (validTerms.some(term => text.includes(term))) return true;
    
    return false; // Reject if no valid terms found
};
