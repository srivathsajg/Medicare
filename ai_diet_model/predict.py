import sys
import json
from diet_model import DietModel

def main():
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        # Initialize model
        model = DietModel()
        
        # Extract data from input
        profile = input_data.get("profile", {})
        indicators = input_data.get("indicators", {})
        patient_id = input_data.get("patient_id", "default")
        force_random = input_data.get("force_random", False)
        
        # 1. Predict diet based on indicators
        plan = model.predict_diet(
            indicators=indicators,
            patient_id=patient_id, 
            force_random=force_random,
            profile=profile,
            spoonacular_api_key=input_data.get("spoonacular_api_key")
        )
        
        # Return result as JSON to stdout
        print(json.dumps(plan))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
