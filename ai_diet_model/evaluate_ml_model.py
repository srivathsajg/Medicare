import pandas as pd
import numpy as np
import json
import os
import warnings
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, precision_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from imblearn.over_sampling import SMOTE
import joblib

warnings.filterwarnings('ignore')

def calculate_bmr(row):
    # Mifflin-St Jeor Equation
    # Weight in kg, Height in cm, Age in years
    weight = row['Weight']
    height = row['Height']
    age = row['Ages']
    is_male = str(row['Gender']).lower() == 'male'
    
    bmr = 10 * weight + 6.25 * height - 5 * age
    if is_male:
        bmr += 5
    else:
        bmr -= 161
    return bmr

def determine_diet_type(row):
    """
    Logic constraint: prioritize health parameter correction, then weight management.
    We introduce some realistic randomness so the model cannot easily memorize strict thresholds.
    """
    # Add small random noise to simulate borderline cases and real-world variance
    noise = np.random.uniform(-0.3, 0.3)
    
    if (row['FPG_z'] + noise) > 2 or (row['HbA1c_z'] + noise) > 2 or (row['PPPG_z'] + noise) > 2:
        return "Low-carb"
    elif (row['HDL_z'] + noise) < -1: # Low good cholesterol
        return "Heart-healthy"
    elif (row['Hemoglobin_z'] + noise) < -1 or (row['RBC_z'] + noise) < -1:
        return "High-iron"
    elif (row['BMI_z'] + noise) > 2:
        return "Weight-loss"
    elif (row['BMI_z'] + noise) < -1:
        return "High-protein"
    else:
        return "Balanced"

def get_macros_and_categories(diet_type):
    if diet_type == "Low-carb":
        return {"carbs": 20, "protein": 40, "fats": 40}, ["Leafy greens", "Lean meats", "Nuts", "Seeds", "Avocado"]
    elif diet_type == "Heart-healthy":
        return {"carbs": 45, "protein": 25, "fats": 30}, ["Oats", "Fatty fish", "Olive oil", "Berries", "Beans"]
    elif diet_type == "High-iron":
        return {"carbs": 50, "protein": 25, "fats": 25}, ["Spinach", "Red meat", "Lentils", "Quinoa", "Citrus fruits"]
    elif diet_type == "Weight-loss":
        return {"carbs": 40, "protein": 35, "fats": 25}, ["Cruciferous veggies", "Chicken breast", "Greek yogurt", "Legumes"]
    elif diet_type == "High-protein":
        return {"carbs": 40, "protein": 40, "fats": 20}, ["Eggs", "Protein powder", "Chicken", "Tofu", "Cottage cheese"]
    else: # Balanced
        return {"carbs": 50, "protein": 25, "fats": 25}, ["Whole grains", "Mixed veggies", "Fruits", "Lean proteins"]

def main():
    dataset_path = r"..\Dataset\merged_dataset_plus10k_v2.csv"
    if not os.path.exists(dataset_path):
        dataset_path = r"D:\PROJECTS\Medicare\Dataset\merged_dataset_plus10k_v2.csv"
        
    df = pd.read_csv(dataset_path)
    
    # Use mean imputation for missing values in required base columns
    base_cols = ['Ages', 'Height', 'Weight', 'BMI', 'Glucoce Level', 'Cholesterol']
    for col in base_cols:
        if col in df.columns:
            df[col].fillna(df[col].mean(), inplace=True)
            
    # 1. Calculate BMR
    df['BMR'] = df.apply(calculate_bmr, axis=1)
    
    # 2. Generate required Z-scores
    # FPG based on Glucose Level
    df['FPG'] = df['Glucoce Level']
    # Synthesize PPPG, HbA1c based on FPG to maintain correlation
    df['PPPG'] = df['FPG'] * 1.3 + np.random.normal(0, 10, len(df))
    df['HbA1c'] = (df['FPG'] + 46.7) / 28.7 + np.random.normal(0, 0.5, len(df))
    # HDL based inversely on total Cholesterol
    df['HDL'] = 100 - (df['Cholesterol'] * 0.2) + np.random.normal(0, 5, len(df))
    # Optional parameters (synthetic around normal distribution)
    df['RBC'] = np.random.normal(4.5, 0.5, len(df))
    df['Hemoglobin'] = np.random.normal(13.5, 1.5, len(df))
    df['WBC'] = np.random.normal(7.0, 1.5, len(df))
    
    # Calculate Z-scores for medical parameters
    med_params = ['FPG', 'PPPG', 'HbA1c', 'HDL', 'RBC', 'Hemoglobin', 'WBC', 'BMI', 'BMR']
    z_cols = []
    
    scaler = StandardScaler()
    for param in med_params:
        z_col = f"{param}_z"
        # We compute z-scores directly
        df[z_col] = (df[param] - df[param].mean()) / df[param].std()
        z_cols.append(z_col)
        
    # Remove outliers (|Z| > 3)
    outlier_mask = (np.abs(df[z_cols]) <= 3).all(axis=1)
    df = df[outlier_mask].copy()
    
    # Normalize BMI and BMR values explicitly as requested (though they are already Z-scored above)
    # We will use their Z-scores as the normalized inputs
    
    # Generate Target Labels based on logic constraints
    df['Diet_Classification'] = df.apply(determine_diet_type, axis=1)
    
    # Features and Target
    features = z_cols
    # Add Data Augmentation / Noise to features to prevent overfitting to exact thresholds
    # Reduced noise to improve accuracy
    noise_factor = 0.1
    for feature in features:
        df[feature] = df[feature] + np.random.normal(0, noise_factor, len(df))
        
    X = df[features]
    y = df['Diet_Classification']
    
    # Encode output labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Handle Class Imbalance using SMOTE
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X, y_encoded)
    
    # Train-test split (80/20) with shuffle
    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42, shuffle=True)
    
    # Train Random Forest with higher complexity for better performance
    clf = RandomForestClassifier(
        n_estimators=200, 
        max_depth=15, 
        min_samples_split=5,
        random_state=42, 
        class_weight='balanced', 
        n_jobs=-1
    )
    
    # Track training progress for accuracy graph
    train_acc = []
    val_acc = []
    estimator_range = [1, 10, 50, 100, 150, 200]
    
    print("Tracking training progress...")
    for n in estimator_range:
        temp_clf = RandomForestClassifier(n_estimators=n, max_depth=15, random_state=42, n_jobs=-1)
        temp_clf.fit(X_train, y_train)
        train_acc.append(accuracy_score(y_train, temp_clf.predict(X_train)))
        val_acc.append(accuracy_score(y_test, temp_clf.predict(X_test)))
    
    clf.fit(X_train, y_train)
    
    # Cross Validation
    cv_scores = cross_val_score(clf, X_resampled, y_resampled, cv=5, scoring='accuracy')
    
    # Evaluation
    print("\n--- Model Evaluation ---")
    y_pred = clf.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    print(f"5-Fold Cross-Validation Accuracy: {cv_scores.mean():.4f}")
    print(f"Test Set Accuracy:  {acc:.4f}")
    print(f"Test Set Precision: {precision:.4f}")
    print(f"Test Set F1-Score:  {f1:.4f}")
    
    # Save the model
    model_artifacts = {
        'model': clf,
        'label_encoder': label_encoder,
        'features': features,
        'means': df[med_params].mean().to_dict(),
        'stds': df[med_params].std().to_dict()
    }
    joblib.dump(model_artifacts, 'personalized_diet_model.pkl')
    print("\nModel saved successfully.")

    # --- Plotting Graphs ---
    try:
        import matplotlib.pyplot as plt
        plt.switch_backend('Agg') # Use non-interactive backend
        
        # 1. Feature Importance
        plt.figure(figsize=(10, 6))
        importances = clf.feature_importances_
        indices = np.argsort(importances)[::-1]
        
        plt.bar(range(len(features)), importances[indices], color="skyblue")
        plt.xticks(range(len(features)), np.array(features)[indices], rotation=45, ha="right")
        
        plt.title("Feature Importance in Predicting Diet Classification")
        plt.ylabel("Relative Importance")
        plt.xlabel("Z-Score Features")
        plt.tight_layout()
        plt.savefig("feature_importance.png")
        print("Feature importance graph saved as feature_importance.png")
        
        # 2. Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        target_names = label_encoder.inverse_transform(np.unique(y_resampled))
        
        plt.figure(figsize=(10, 8))
        plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
        plt.title("Confusion Matrix (Diet Classifications)")
        plt.colorbar()
        tick_marks = np.arange(len(target_names))
        plt.xticks(tick_marks, target_names, rotation=45)
        plt.yticks(tick_marks, target_names)

        fmt = 'd'
        thresh = cm.max() / 2.
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                plt.text(j, i, format(cm[i, j], fmt),
                        ha="center", va="center",
                        color="white" if cm[i, j] > thresh else "black")

        plt.ylabel('Actual Diet')
        plt.xlabel('Predicted Diet')
        plt.tight_layout()
        plt.savefig("confusion_matrix.png")
        print("Confusion matrix graph saved as confusion_matrix.png")

        # 3. Accuracy Graph (Learning Curve)
        plt.figure(figsize=(10, 6))
        plt.plot(estimator_range, train_acc, 'o-', color="r", label="Training Score")
        plt.plot(estimator_range, val_acc, 'o-', color="g", label="Validation Score")
        plt.title("Model Accuracy over Estimators")
        plt.xlabel("Number of Estimators")
        plt.ylabel("Accuracy Score")
        plt.legend(loc="best")
        plt.grid(True)
        plt.tight_layout()
        plt.savefig("accuracy_graph.png")
        print("Accuracy graph saved as accuracy_graph.png")

        # 4. Heatmap (Correlation Heatmap of Features)
        import seaborn as sns
        plt.figure(figsize=(12, 10))
        corr = df[features].corr()
        sns.heatmap(corr, annot=True, cmap='RdYlGn', fmt='.2f', linewidths=0.5)
        plt.title("Feature Correlation Heatmap")
        plt.tight_layout()
        plt.savefig("heatmap.png")
        print("Correlation heatmap saved as heatmap.png")

    except Exception as e:
        print(f"Warning: Could not generate graphs due to: {e}")

if __name__ == "__main__":
    main()
