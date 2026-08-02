const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");

/**
 * Extracts text from an image using Tesseract OCR (which uses a CNN-based engine).
 * @param {string} relativeFilePath - The relative path to the image file from the backend root.
 * @returns {Promise<string>} - The extracted text.
 */
const extractTextFromImage = async (relativeFilePath) => {
  try {
    // Construct absolute path relative to the backend root (one level up from this file's folder)
    const backendRoot = path.join(__dirname, "../../");
    const absolutePath = path.join(backendRoot, relativeFilePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`OCR: File not found at ${absolutePath}`);
      return "";
    }

    console.log(`OCR: Starting text extraction for ${absolutePath}...`);
    
    const { data: { text } } = await Tesseract.recognize(
      absolutePath,
      'eng',
      { 
        logger: m => console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`) 
      }
    );

    console.log("OCR: Extraction complete.");
    return text.trim();
  } catch (error) {
    console.error("OCR Error:", error.message);
    return "";
  }
};

/**
 * Parses medical indicators from a block of text.
 * @param {string} text - The text to parse.
 * @returns {Object} - An object containing found indicators and their values.
 */
const parseMedicalIndicators = (text) => {
  if (!text) return {};

  const indicators = {
    // Hematology
    "RBC Count": [/\brbc\b(?:\s*count)?[\s:\|\-]*([\d\.]+)/i],
    "Hemoglobin": [/(?:hemoglobin|hgb|hb).*?([\d\.]+)/i],
    "PCV": [/\bpcv\b.*?([\d\.]+)/i, /packed\s*cell\s*volume.*?([\d\.]+)/i],
    "WBC Count": [/\b(?:wbc|white\s*blood\s*cell)\b.*?([\d\.]+)/i, /total\s*wbc.*?([\d\.]+)/i],
    "Platelets": [/\bplatelet(?:s|s\s*count)?\b.*?([\d\.]+)/i, /\bplt\b.*?([\d\.]+)/i],
    "MCV": [/\bmcv\b.*?([\d\.]+)/i],
    "MCH": [/\bmch\b.*?([\d\.]+)/i],
    "MCHC": [/\bmchc\b.*?([\d\.]+)/i],
    "RDW": [/\brdw\b.*?([\d\.]+)/i],
    "Ferritin": [/ferritin.*?([\d\.]+)/i],
    "Vitamin B12": [/(?:vitamin\s*b12|b12).*?([\d\.]+)/i],
    "Folate": [/(?:folate|folic\s*acid).*?([\d\.]+)/i],

    // Lipid Profile
    "Total Cholesterol": [/(?:total\s*cholesterol|cholesterol(?!\s*(?:hdl|ldl|vldl)))\b.*?([\d\.]+)/i],
    "Triglycerides": [/\b(?:triglycerides|tg)\b.*?([\d\.]+)/i],
    "HDL Cholesterol": [/\bhdl\b.*?([\d\.]+)/i],
    "LDL Cholesterol": [/\bldl\b.*?([\d\.]+)/i],
    "VLDL": [/\bvldl\b.*?([\d\.]+)/i],

    // Diabetes / Sugar
    "Blood Sugar (F)": [/(?:fasting\s*plasma\s*glucose|fasting\s*blood\s*sugar|fbs|glucose\s*\(f\)).*?([\d\.]+)/i, /\bfpg\b.*?([\d\.]+)/i],
    "Blood Sugar (PP)": [/(?:postprandial\s*plasma\s*glucose|pp\s*blood\s*sugar|ppbs|glucose\s*\(pp\)).*?([\d\.]+)/i, /\bpppg\b.*?([\d\.]+)/i],
    "HbA1c": [/(?:hba.c|glycated\s*hemoglobin).*?([\d\.]+)/i],
    "Urine Sugar": [/urine\s*routine\s*\(sugar\)\b[\s:\|\-]*(\w+)/i, /urine\s*sugar\b[\s:\|\-]*(\w+)/i],

    // Kidney Function
    "Serum Creatinine": [/creatinine.*?([\d\.]+)/i],
    "Blood Urea": [/urea.*?([\d\.]+)/i, /\bbun\b.*?([\d\.]+)/i],
    "Uric Acid": [/uric\s*acid.*?([\d\.]+)/i],

    // Liver Function
    "SGOT (AST)": [/(?:sgot|ast).*?([\d\.]+)/i],
    "SGPT (ALT)": [/(?:sgpt|alt).*?([\d\.]+)/i],
    "Bilirubin": [/bilirubin.*?([\d\.]+)/i],
    "Albumin": [/albumin.*?([\d\.]+)/i],

    // Electrolytes
    "Calcium": [/calcium.*?([\d\.]+)/i],
    "Sodium": [/\bsodium\b.*?([\d\.]+)/i],
    "Potassium": [/\bpotassium\b.*?([\d\.]+)/i],
    
    // Additional Parameters from AIG report
    "FPG": [/fpg[\s:\|\-]*([\d\.]+)/i],
    "PPPG": [/pppg[\s:\|\-]*([\d\.]+)/i],
    "Glycated Hemoglobin": [/glycated\s*hemoglobin[\s:\|\-]*([\d\.]+)/i],
  };

  const results = {};

  for (const [name, patterns] of Object.entries(indicators)) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        results[name] = match[1];
        break; // Stop at first match for this indicator
      }
    }
  }

  return results; // results only contains found indicators
};

module.exports = {
  extractTextFromImage,
  parseMedicalIndicators,
};
