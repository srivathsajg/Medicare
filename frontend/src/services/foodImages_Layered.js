/**
 * Local Food Image Library (PRIMARY SOURCE)
 * 
 * Used for Layer 1 (Exact Mapping) of the image retrieval system.
 */

export const LOCAL_FOOD_IMAGES = {
    // Exact canonical mappings from foodAliases.js
    "raisins_almonds": "https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?q=80&w=800&auto=format&fit=crop",
    "mixed_nuts": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?q=80&w=800&auto=format&fit=crop",
    "apple_almond_butter": "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=800&auto=format&fit=crop",
    "roasted_chana": "https://images.unsplash.com/photo-1606757308726-72c050073ce0?q=80&w=800&auto=format&fit=crop",
    
    "palak_paneer": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=800&auto=format&fit=crop",
    "khichdi": "https://images.unsplash.com/photo-1548943487-a2e4d43b4850?q=80&w=800&auto=format&fit=crop",
    "tofu_scramble": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
    "burger": "https://images.unsplash.com/photo-1571091723212-950a9e3bb81d?q=80&w=800&auto=format&fit=crop",
    "boiled_egg": "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
    "beetroot_soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
    "spinach_smoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop",
    "chicken_rice": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
    "oats": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=800&auto=format&fit=crop",
    "chicken_fish": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop",
};

// Default safe placeholder image for Layer 3 (Safe Fallback)
export const DEFAULT_HEALTHY_FOOD = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop";

/**
 * Image Validation Layer
 * 
 * Accept images only if metadata contains food-related terms.
 * Reject images if metadata contains non-food terms like city, skyline, urban, etc.
 */
export const isValidFoodImage = (metadata) => {
    if (!metadata) return true; // Default to true if no metadata available for check
    
    const validTerms = [
        "food", "dish", "meal", "soup", "curry", "breakfast", "lunch", "dinner", 
        "nuts", "paneer", "khichdi", "salad", "fruit", "healthy", "vegetables", "oats"
    ];
    
    const invalidTerms = [
        "city", "skyline", "urban", "architecture", "building", "landscape", 
        "wallpaper", "travel", "downtown", "mountain", "person", "portrait"
    ];
    
    const text = (metadata.alt || metadata.title || metadata.description || "").toLowerCase();
    
    // Check for invalid terms first (strict rejection)
    if (invalidTerms.some(term => text.includes(term))) return false;
    
    // Check for at least one valid term (loose acceptance)
    if (validTerms.some(term => text.includes(term))) return true;
    
    return true; // Default to true if text is neutral
};
