/**
 * Canonical Food Title Mapping & Local Image Library
 * 
 * Used for normalization and Layer 1 (Exact Mapping) of the image retrieval system.
 */

export const CANONICAL_MAPPINGS = {
    // Snacks
    "mixed nuts": "mixed nuts",
    "fruit and nut mix": "mixed nuts",
    "apple with almond butter": "apple almond butter",
    "jaggery and roasted chana": "roasted chana",
    "roasted chickpeas": "roasted chana",
    
    // Main Meals
    "moong dal khichdi": "khichdi",
    "moong dal khichdi with lots of veggies": "khichdi",
    "tofu scramble with veggies": "tofu scramble",
    "tofu scramble": "tofu scramble",
    "black bean burger on a whole wheat bun": "burger",
    "black bean burger": "burger",
    "grilled fish or chicken with lemon": "chicken fish",
    "grilled fish or chicken": "chicken fish",
    "boiled egg": "boiled egg",
    "boiled eggs": "boiled egg",
    "overnight oats with fruit and chia seeds": "oats",
    "overnight oats": "oats",
    "beetroot and vegetable soup": "beetroot soup",
    "beetroot soup": "beetroot soup",
    "spinach smoothie": "spinach smoothie",
    "green smoothie": "spinach smoothie",
    "chicken breast with brown rice": "chicken rice",
    "grilled chicken": "chicken rice",
};

export const LOCAL_FOOD_IMAGES = {
    "mixed nuts": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?q=80&w=800&auto=format&fit=crop",
    "apple almond butter": "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=800&auto=format&fit=crop",
    "roasted chana": "https://images.unsplash.com/photo-1606757308726-72c050073ce0?q=80&w=800&auto=format&fit=crop",
    "khichdi": "https://images.unsplash.com/photo-1548943487-a2e4d43b4850?q=80&w=800&auto=format&fit=crop",
    "tofu scramble": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
    "burger": "https://images.unsplash.com/photo-1571091723212-950a9e3bb81d?q=80&w=800&auto=format&fit=crop",
    "chicken fish": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop",
    "oats": "https://images.unsplash.com/photo-1517673400267-0251440c45dc?q=80&w=800&auto=format&fit=crop",
    "boiled egg": "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800&auto=format&fit=crop",
    "beetroot soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
    "spinach smoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop",
    "chicken rice": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
    "salmon": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop",
};

export const DEFAULT_HEALTHY_FOOD = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop";
