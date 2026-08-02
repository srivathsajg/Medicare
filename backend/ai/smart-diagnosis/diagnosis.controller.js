const { analyzeSymptoms } = require("./diagnosis.service");

const analyzeDiagnosis = async (req, res, next) => {
  try {
    const { symptoms, age } = req.body;

    const result = await analyzeSymptoms({
      symptoms,
      age,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeDiagnosis,
};

