const analyzeSymptoms = async ({ symptoms, age }) => {
  return {
    prediction: "General Viral Infection",
    confidence: "Mock Result",
    details: {
      symptoms: symptoms || [],
      age: age || null,
    },
  };
};

module.exports = {
  analyzeSymptoms,
};

