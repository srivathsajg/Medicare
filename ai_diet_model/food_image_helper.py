"""
food_image_helper.py
====================
AI-Generated Food Image Pipeline for Medicare Diet Plan

Strategy:
  - Normalize food title -> build a rich, food-photography prompt
  - Generate image via Pollinations.ai (free, no API key required)
  - Cache results by normalized title to avoid re-generating
  - Unique deterministic seed per food name (hash-based, not length-based)
"""

import json
import os
import re
import sys
import hashlib

CACHE_FILE = os.path.join(os.path.dirname(__file__), "food_image_cache.json")

PLACEHOLDER = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop"


# ─────────────────────────────────────────────
#  Cache Utilities
# ─────────────────────────────────────────────
def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


# ─────────────────────────────────────────────
#  Title Normalization
# ─────────────────────────────────────────────
def normalize_food_title(title: str) -> str:
    """
    Clean a raw food title into a minimal search key.
    "Palak (Spinach) Paneer with 2 Multigrain Chapatis (250g)"
      -> "palak paneer multigrain chapati"
    """
    if not title:
        return ""

    t = title.lower()

    # Remove bracketed text (Spinach), (250g), (200ml)
    t = re.sub(r"\s*\(.*?\)\s*", " ", t)

    # Remove pure numeric quantities (standalone numbers)
    t = re.sub(r"\b\d+\s*(ml|g|kcal|grams|pieces|pcs|chapatis|chapati)?\b", " ", t, flags=re.IGNORECASE)

    # Remove filler phrases (longest first to avoid partial matches)
    FILLERS = sorted([
        "with lots of veggies", "served with lots of", "with lots of",
        "and nut mix", "on a whole-wheat bun", "on a whole wheat bun",
        "with fruit and chia seeds", "breast with", "and vegetable",
        "with veggies", "with lemon", "served with", "lots of",
        "soaked", "roasted", "healthy", "on a", "with", "and"
    ], key=len, reverse=True)

    for filler in FILLERS:
        t = re.sub(r"\b" + re.escape(filler) + r"\b", " ", t, flags=re.IGNORECASE)

    # Strip punctuation and collapse whitespace
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()

    return t


# ─────────────────────────────────────────────
#  Prompt Builder
# ─────────────────────────────────────────────
STYLE_SUFFIX = (
    "realistic food photography, professional studio lighting, "
    "top-down perspective, dark premium background, "
    "served in a clean ceramic bowl or elegant plate, "
    "no text, no people, no watermark, high resolution, 8k, "
    "healthcare nutrition app aesthetic"
)

# Indian / specific food keyword mappings for richer prompts
FOOD_CONTEXT_MAP = {
    "palak paneer": "paneer cubes in vibrant green spinach curry",
    "moong dal khichdi": "yellow moong dal khichdi rice porridge with ghee",
    "methi dal": "fenugreek lentil curry with mustard seeds",
    "masoor dal": "red lentil dal with turmeric and garam masala",
    "raisins almonds": "golden raisins and whole almonds in a white ceramic bowl",
    "pomegranate apple": "sliced red pomegranate and green apple salad",
    "amla juice": "fresh gooseberry amla juice in a glass",
    "makhana": "puffed fox nuts makhana in a bowl",
    "jaggery chana": "jaggery pieces with roasted golden chickpeas",
    "beetroot soup": "deep red beetroot soup in a dark bowl with cream swirl",
    "spinach beetroot smoothie": "deep red and green smoothie in a tall glass",
    "chicken breast brown rice": "grilled chicken breast with fluffy brown rice and steamed broccoli",
    "grilled salmon": "perfectly grilled salmon fillet with roasted vegetables",
    "tofu scramble": "scrambled golden tofu with colorful bell peppers and spinach",
    "oatmeal berries": "creamy oatmeal topped with fresh blueberries and strawberries",
    "greek yogurt granola": "thick greek yogurt topped with crunchy granola and fresh fruit",
}


def build_prompt(food_title: str, clean_title: str) -> str:
    """
    Build a rich, specific AI image generation prompt for a food title.
    """
    # Check context map for known Indian / specific foods
    for key, description in FOOD_CONTEXT_MAP.items():
        if key in clean_title:
            return f"{description}, {STYLE_SUFFIX}"

    # Generic prompt: use the clean title directly
    return f"{clean_title}, delicious food dish, freshly prepared, {STYLE_SUFFIX}"


# ─────────────────────────────────────────────
#  Deterministic Seed (hash-based, NOT length-based)
# ─────────────────────────────────────────────
def title_to_seed(title: str) -> int:
    """
    Convert a string into a stable integer seed for image generation.
    Using MD5 hash ensures every unique title gets a unique seed.
    """
    digest = hashlib.md5(title.encode("utf-8")).hexdigest()
    # Take first 8 hex chars -> int (max 4,294,967,295)
    return int(digest[:8], 16) % 1_000_000


# ─────────────────────────────────────────────
#  Main Entry Point
# ─────────────────────────────────────────────
def get_food_image_url(food_title: str, api_key: str = None) -> str:
    """
    Generate or retrieve a food image URL for a given food title.

    Pipeline:
      raw title -> normalize -> check cache -> build prompt
        -> Pollinations.ai AI generation URL (unique seed per dish)
        -> cache & return
    """
    if not food_title:
        return PLACEHOLDER

    clean_title = normalize_food_title(food_title)
    if not clean_title:
        return PLACEHOLDER

    # Check cache first
    cache = load_cache()
    if clean_title in cache:
        return cache[clean_title]

    # Build the AI image prompt
    prompt = build_prompt(food_title, clean_title)

    # Create a unique seed from the food title (not from length!)
    seed = title_to_seed(clean_title)

    # Encode prompt for URL
    encoded_prompt = prompt.replace(" ", "%20").replace(",", "%2C")

    # Pollinations.ai — free AI image generation, no API key needed
    image_url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?width=1200&height=900&nologo=true&seed={seed}&model=flux"
    )

    # Cache and return
    cache[clean_title] = image_url
    save_cache(cache)

    return image_url
