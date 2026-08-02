const dietData = require("./dietData");

const getMedicalIndicatorStatus = (indicators, gender = "male") => {
  if (!indicators) return null;
  
  const ranges = {
    "Hemoglobin": { min: gender === "male" ? 13.5 : 12.0, max: gender === "male" ? 17.5 : 15.5 },
    "Blood Sugar (F)": { min: 70, max: 100 },
    "FPG": { min: 70, max: 100 },
    "Blood Sugar (PP)": { min: 80, max: 140 },
    "PPPG": { min: 80, max: 140 },
    "HbA1c": { min: 4.0, max: 5.6 },
    "Glycated Hemoglobin": { min: 4.0, max: 5.6 },
    "Serum Creatinine": { min: 0.7, max: 1.2 },
    "Blood Urea": { min: 15, max: 40 },
    "Total Cholesterol": { min: 100, max: 200 },
    "Triglycerides": { min: 50, max: 150 },
    "HDL Cholesterol": { min: 40, max: 60 },
    "LDL Cholesterol": { min: 0, max: 100 },
    "VLDL": { min: 5, max: 40 },
    "Urine Sugar": { normal: ["negative", "nil", "trace"] },
    "RBC Count": { min: 4.5, max: 5.5 },
    "PCV": { min: 40, max: 50 },
    "MCV": { min: 83, max: 101 },
    "MCH": { min: 27, max: 32 },
    "MCHC": { min: 31.5, max: 34.5 },
    "RDW": { min: 11.6, max: 14.0 },
    "Ferritin": { min: 15.0, max: 150.0 },
    "Vitamin B12": { min: 211, max: 911 },
    "Folate": { min: 3.1, max: 17.5 },
    "WBC Count": { min: 4000, max: 10000 },
    "Sodium": { min: 135, max: 145 },
    "Potassium": { min: 3.5, max: 5.1 },
    "Calcium": { min: 8.5, max: 10.2 },
  };

  const results = {};
  for (const [key, value] of Object.entries(indicators)) {
    const range = ranges[key];
    
    if (range) {
      if (range.normal) {
        const valStr = (value || "").toLowerCase();
        if (range.normal.includes(valStr)) results[key] = { value, status: "normal" };
        else results[key] = { value, status: "high" };
        continue;
      }

      const val = parseFloat(value);
      if (val > range.max) results[key] = { value, status: "high" };
      else if (val < range.min) results[key] = { value, status: "low" };
      else results[key] = { value, status: "normal" };
    } else {
      results[key] = { value, status: "normal" };
    }
  }
  return results;
};

const predictDietFromIndicators = (indicators = {}, patientId = "default", forceRandom = false, profile = {}) => {
  // 1. Calculate Age from DOB
  let age = 30;
  if (profile.dob) {
    const birthDate = new Date(profile.dob);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  }

  // 2. Physical Profile
  const heightCm = parseFloat(profile.height) || 170;
  const weightKg = parseFloat(profile.weight) || 70;
  const gender = (profile.gender || "male").toLowerCase();

  // 3. BMI Calculation
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // 4. Analyze Indicators
  const analysis = getMedicalIndicatorStatus(indicators, gender);
  const targetKeys = new Set();

  for (const [key, result] of Object.entries(analysis || {})) {
    if (result.status === "low") {
      if (dietData[key]) targetKeys.add(key);
      else if (key === "Iron" || key === "Ferritin") targetKeys.add("Hemoglobin");
      else if (key === "Albumin") targetKeys.add("Protein");
    } else if (result.status === "high") {
      if (["Blood Sugar (F)", "FPG", "HbA1c", "Glycated Hemoglobin"].includes(key)) {
        targetKeys.add("Blood Sugar (F)");
      } else if (["Total Cholesterol", "LDL Cholesterol", "Triglycerides"].includes(key)) {
        targetKeys.add("Total Cholesterol");
      }
    }
  }

  if (targetKeys.size === 0) targetKeys.add("general wellness");

  const finalTargetKeys = [...targetKeys];

  // 5. BMR Calculation
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") bmr += 5;
  else bmr -= 161;

  // 6. Selection logic
  const getHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const seed = forceRandom ? Math.random().toString() : patientId.toString();
  const patientHash = getHash(seed);

  const finalPlan = {
    morning: [],
    afternoon: [],
    snacks: [],
    night: [],
    metadata: {
      bmi: bmi.toFixed(1),
      dailyCalorieNeeds: Math.round(bmr * 1.2),
      analysis
    }
  };

  finalTargetKeys.forEach((key) => {
    const data = dietData[key] || dietData["general wellness"];
    finalPlan.morning.push(...data.morning);
    finalPlan.afternoon.push(...data.afternoon);
    finalPlan.snacks.push(...data.snacks);
    finalPlan.night.push(...data.night);
  });

  const clean = (arr, categorySeed) => {
    const unique = [...new Set(arr)];
    if (unique.length === 0) return [];
    const categoryHash = getHash(categorySeed);
    const combinedHash = patientHash + categoryHash;
    const startIdx = combinedHash % unique.length;
    return [unique[startIdx]]; // Return only 1 item per meal category
  };

  return {
    morning: clean(finalPlan.morning, "morning"),
    afternoon: clean(finalPlan.afternoon, "afternoon"),
    snacks: clean(finalPlan.snacks, "snacks"),
    night: clean(finalPlan.night, "night"),
    metadata: finalPlan.metadata,
    targeting: finalTargetKeys
  };
};

const { spawn } = require("child_process");
const path = require("path");

const predictDietPython = (patientId = "default", forceRandom = false, profile = {}, indicators = {}) => {
  const spoonacularApiKey = process.env.SPOONACULAR_API_KEY;
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [
      path.join(__dirname, "../../../ai_diet_model/predict.py")
    ]);

    let dataString = "";
    let errorString = "";

    const inputData = JSON.stringify({
      patient_id: patientId,
      force_random: forceRandom,
      profile,
      indicators,
      spoonacular_api_key: spoonacularApiKey
    });

    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python model error:", errorString);
        return reject(new Error("Python diet model failed"));
      }
      try {
        resolve(JSON.parse(dataString));
      } catch (e) {
        reject(new Error("Failed to parse Python model output"));
      }
    });
  });
};

module.exports = {
  getMedicalIndicatorStatus,
  predictDietFromIndicators,
  predictDietPython,
};
