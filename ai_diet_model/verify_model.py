import json
from diet_model import DietModel

def test_model():
    model = DietModel()
    
    # Sample indicators (some low, some high)
    indicators = {
        'Hemoglobin': '10.5',   # Low
        'Blood Sugar (F)': '145', # High
        'Vitamin B12': '150',     # Low
        'Total Cholesterol': '220', # High
        'Serum Calcium': '9.0',   # Normal
        'Serum Iron': '45',       # Low
    }
    
    profile = {
        "dob": "1990-01-01",
        "height": 175,
        "weight": 75,
        "gender": "male"
    }
    
    # Predict diet based on indicators
    plan = model.predict_diet(indicators=indicators, patient_id="test_patient", profile=profile)
    
    print("\n--- Initial Predicted Diet Plan (One item per meal) ---")
    print(f"Targeting: {plan['targeting']}")
    print("\nMorning: ", plan['morning'])
    print("Afternoon: ", plan['afternoon'])
    print("Snacks: ", plan['snacks'])
    print("Night: ", plan['night'])

    # Test Refresh
    print("\n--- Testing Refresh (should change items) ---")
    refreshed_plan = model.predict_diet(indicators=indicators, patient_id="test_patient", profile=profile, force_random=True)
    print("\nMorning: ", refreshed_plan['morning'])
    print("Afternoon: ", refreshed_plan['afternoon'])
    print("Snacks: ", refreshed_plan['snacks'])
    print("Night: ", refreshed_plan['night'])

if __name__ == "__main__":
    test_model()
