import datetime
try:
    from .diet_data import DIET_DATA
except ImportError:
    from diet_data import DIET_DATA

class DietModel:
    def __init__(self):
        # Define normal ranges for common indicators
        # format: (min, max, unit)
        self.ranges = {
            "Hemoglobin": (12.0, 17.5, "g/dL"),
            "Blood Sugar (F)": (70, 100, "mg/dL"),
            "HbA1c": (4.0, 5.7, "%"),
            "Total Cholesterol": (125, 200, "mg/dL"),
            "LDL Cholesterol": (0, 100, "mg/dL"),
            "Triglycerides": (0, 150, "mg/dL"),
            "Vitamin B12": (200, 900, "pg/mL"),
            "Vitamin D": (30, 100, "ng/mL"),
            "Calcium": (8.5, 10.2, "mg/dL"),
            "Protein": (6.0, 8.3, "g/dL"),
            "Albumin": (3.4, 5.4, "g/dL"),
            "Iron": (60, 170, "mcg/dL"),
            "Ferritin": (30, 400, "ng/mL"),
            "Sodium": (135, 145, "mEq/L"),
            "Potassium": (3.6, 5.2, "mmol/L")
        }

    def analyze_indicators(self, indicators):
        """Analyzes indicators and returns which are high or low."""
        analysis = []
        for key, value in indicators.items():
            if key in self.ranges:
                ref_min, ref_max, unit = self.ranges[key]
                try:
                    val = float(value)
                    status = "Normal"
                    if val < ref_min:
                        status = "Low"
                    elif val > ref_max:
                        status = "High"
                    
                    analysis.append({
                        "indicator": key,
                        "value": val,
                        "status": status,
                        "range": f"{ref_min}-{ref_max} {unit}"
                    })
                except (ValueError, TypeError):
                    continue
        return analysis

    def _get_js_hash(self, string):
        """Port of JavaScript's string hashing logic."""
        hash_val = 0
        for char in string:
            hash_val = ((hash_val << 5) - hash_val) + ord(char)
            # Simulate 32-bit signed integer behavior
            hash_val &= 0xFFFFFFFF
            if hash_val & 0x80000000:
                hash_val -= 0x100000000
        return abs(hash_val)

    def predict_diet(self, indicators=None, patient_id="default", force_random=False, profile=None, spoonacular_api_key=None):
        if profile is None: profile = {}
        if indicators is None: indicators = {}

        # 1. Analyze Indicators
        analysis = self.analyze_indicators(indicators)
        
        # 2. Identify keys to target for diet
        # If an indicator is "Low", we suggest diet to increase it.
        # If "High", we might suggest a corrective diet (e.g. for Sugar/Cholesterol).
        low_indicators = [a["indicator"] for a in analysis if a["status"] == "Low"]
        high_indicators = [a["indicator"] for a in analysis if a["status"] == "High"]
        
        # Mapping high/low to DIET_DATA keys
        target_keys = []
        
        # For Low values, suggest diet to increase
        for key in low_indicators:
            if key in DIET_DATA:
                target_keys.append(key)
            elif key == "Iron" or key == "Ferritin":
                target_keys.append("Hemoglobin") # Iron/Ferritin mapped to Hemoglobin diet
            elif key == "Albumin":
                target_keys.append("Protein")
        
        # For High values like Sugar/Cholesterol, suggest restrictive diet
        for key in high_indicators:
            if key in ["Blood Sugar (F)", "HbA1c"]:
                target_keys.append("Blood Sugar (F)")
            elif key in ["Total Cholesterol", "LDL Cholesterol", "Triglycerides"]:
                target_keys.append("Total Cholesterol")

        if not target_keys:
            target_keys.append("general wellness")

        # 3. Calculate Profile Metadata
        age = 30
        dob = profile.get("dob")
        if dob:
            try:
                if isinstance(dob, str):
                    birth_date = datetime.datetime.strptime(dob.split('T')[0], '%Y-%m-%d')
                else:
                    birth_date = dob
                today = datetime.date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            except Exception: pass

        height_cm = float(profile.get("height", 170))
        weight_kg = float(profile.get("weight", 70))
        gender = profile.get("gender", "male").lower()
        
        # BMI Calculation
        bmi = weight_kg / ((height_cm / 100) ** 2)
        
        # BMR Calculation (Mifflin-St Jeor Equation)
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age
        if gender == "male": bmr += 5
        else: bmr -= 161
        
        # TDEE (Total Daily Energy Expenditure) - assuming sedentary
        tdee = bmr * 1.2
        
        # Determine BMI Status
        bmi_status = "Normal"
        if bmi < 18.5: bmi_status = "Low"
        elif 25 <= bmi < 30: bmi_status = "High"
        elif bmi >= 30: bmi_status = "Obesity"

        # Determine BMR Classification
        bmr_status = "Standard"
        if bmr < 1300: bmr_status = "Low"
        elif bmr > 2000: bmr_status = "High"

        # Calorie distribution
        portions = {
            "morning": 0.25,
            "afternoon": 0.35,
            "snacks": 0.10,
            "night": 0.30
        }

        # 4. Predict deterministic or random selection
        import random
        from food_image_helper import get_food_image_url
        
        # Use provided key or fallback to environment variable (if available)
        SPOONACULAR_API_KEY = spoonacular_api_key or "93a6cf37525a409fb544bed9748a2e4e"

        seed = str(random.random()) if force_random else str(patient_id)
        patient_hash = self._get_js_hash(seed)

        final_plan = {
            "morning": [],
            "afternoon": [],
            "snacks": [],
            "night": [],
            "metadata": {
                "bmi": round(bmi, 1),
                "bmiStatus": bmi_status,
                "bmr": int(round(bmr)),
                "bmrStatus": bmr_status,
                "dailyCalorieNeeds": int(round(tdee)),
                "analysis": analysis
            }
        }

        for key in target_keys:
            data = DIET_DATA.get(key, DIET_DATA["general wellness"])
            final_plan["morning"].extend(data["morning"])
            final_plan["afternoon"].extend(data["afternoon"])
            final_plan["snacks"].extend(data["snacks"])
            final_plan["night"].extend(data["night"])

        def estimate_macros(name, target_cal):
            # Macro heuristic based on food name
            low_name = name.lower()
            p_ratio, f_ratio, c_ratio = 0.25, 0.25, 0.50 # default
            
            if any(x in low_name for x in ["chicken", "steak", "fish", "egg", "tofu", "protein"]):
                p_ratio, f_ratio, c_ratio = 0.40, 0.30, 0.30
            elif any(x in low_name for x in ["oatmeal", "rice", "bread", "pasta", "fruit", "berries"]):
                p_ratio, f_ratio, c_ratio = 0.15, 0.15, 0.70
            elif any(x in low_name for x in ["salad", "veggie", "vegetable", "spinach"]):
                p_ratio, f_ratio, c_ratio = 0.20, 0.40, 0.40
            elif any(x in low_name for x in ["nuts", "seeds", "avocado", "almond", "walnut"]):
                p_ratio, f_ratio, c_ratio = 0.15, 0.70, 0.15

            return {
                "calories": int(target_cal),
                "protein": int((target_cal * p_ratio) / 4),
                "fat": int((target_cal * f_ratio) / 9),
                "carbs": int((target_cal * c_ratio) / 4),
                "quantity": f"{int(target_cal / 1.8)}g" # Approximate weight
            }

        def clean(arr, category_seed, cat_name):
            # Deduplicate by item name if it's a dict, otherwise by item string
            unique = []
            seen = set()
            for item in arr:
                item_name = item["name"] if isinstance(item, dict) else item
                if item_name not in seen:
                    unique.append(item)
                    seen.add(item_name)
                    
            if not unique: return []
            category_hash = self._get_js_hash(category_seed)
            combined_hash = patient_hash + category_hash
            start_idx = combined_hash % len(unique)
            
            # Now fetch the image dynamically for the selected item
            selected_item = unique[start_idx]
            target_cal = tdee * portions.get(cat_name, 0.25)
            
            item_name = selected_item["name"] if isinstance(selected_item, dict) else selected_item
            macros = estimate_macros(item_name, target_cal)
            
            result = {
                "name": item_name,
                "image": selected_item.get("image") if isinstance(selected_item, dict) else None,
                **macros
            }
            
            if not result["image"]:
                result["image"] = get_food_image_url(item_name, SPOONACULAR_API_KEY)
                
            return [result]

        return {
            "morning": clean(final_plan["morning"], "morning", "morning"),
            "afternoon": clean(final_plan["afternoon"], "afternoon", "afternoon"),
            "snacks": clean(final_plan["snacks"], "snacks", "snacks"),
            "night": clean(final_plan["night"], "night", "night"),
            "metadata": final_plan["metadata"],
            "targeting": list(set(target_keys))
        }
