import pandas as pd
import os
from diet_model import DietModel
import json

def train_model(dataset_path):
    print(f"--- Training Diet Model using Dataset: {dataset_path} ---")
    
    # 1. Load lab tests
    lab_test_file = os.path.join(dataset_path, "lab_test.csv")
    if not os.path.exists(lab_test_file):
        print(f"Error: {lab_test_file} not found.")
        return

    df = pd.read_csv(lab_test_file)
    print(f"Found {len(df)} lab tests in dataset.")

    # 2. Initialize Model
    model = DietModel()
    
    # 3. "Training" - Ensuring model ranges match dataset tests
    # We'll map dataset test names to model indicator keys
    test_mapping = {
        "Hemoglobin Test": "Hemoglobin",
        "Blood Sugar Fasting": "Blood Sugar (F)",
        "HbA1c Test": "HbA1c",
        "Lipid Profile": ["Total Cholesterol", "LDL Cholesterol", "Triglycerides"],
        "Vitamin B12 Test": "Vitamin B12",
        "Vitamin D Test": "Vitamin D",
        "Serum Calcium": "Calcium",
        "Total Protein Test": "Protein",
        "Serum Iron": "Iron",
        "Ferritin Test": "Ferritin",
        "Sodium Test": "Sodium",
        "Potassium Test": "Potassium"
    }

    print("\nValidating model coverage for lab tests:")
    covered = 0
    for _, row in df.iterrows():
        name = row['test_name']
        if name in test_mapping:
            keys = test_mapping[name]
            if isinstance(keys, str): keys = [keys]
            for k in keys:
                if k in model.ranges:
                    print(f" [OK] {name} -> {k}")
                    covered += 1
                else:
                    print(f" [MISSING] {name} -> {k} (no range defined)")
    
    print(f"\nModel coverage: {covered} indicators ready.")

    # 4. Save "trained" configuration (in this case, just validating the logic)
    # Since it's a rule-based model, "training" is about data integrity.
    config = {
        "dataset_version": "1.0",
        "total_tests": len(df),
        "covered_indicators": covered,
        "ranges": model.ranges
    }
    
    with open("model_config.json", "w") as f:
        json.dump(config, f, indent=4)
    
    print("\nModel configuration saved to model_config.json")
    print("--- Training Complete ---")

if __name__ == "__main__":
    dataset_path = r"D:\PROJECTS\Medicare\Dataset"
    train_model(dataset_path)
