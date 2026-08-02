const { getMedicalIndicatorStatus, predictDietFromIndicators, predictDietPython } = require("./diet.service");
const { getFoodImageUrl } = require("./foodImage.service");
const DietPlan = require("../../modules/diet-recommendation/models/dietPlan.model");
const Record = require("../../modules/medical-records/models/record.model");
const User = require("../../modules/users/models/user.model");
const { extractTextFromImage, parseMedicalIndicators } = require("../../core/services/ocr.service");

const getLatestDietPlan = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    const user = await User.findById(patientId);
    if (!user) throw new Error("User not found");

    let dietPlan = await DietPlan.findOne({ patientId, date: today });

    const labTechs = await User.find({ role: "lab_technician" }).select("_id");
    const labTechIds = labTechs.map(lt => lt._id);

    const latestRecord = await Record.findOne({ 
      patientId, 
      doctorId: { $in: labTechIds } 
    }).sort({ createdAt: -1 });

    let ocrText = "";
    let rawIndicators = {};

    if (latestRecord) {
      if (latestRecord.fileUrl) {
        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(latestRecord.fileUrl);
        if (isImage) {
          ocrText = await extractTextFromImage(latestRecord.fileUrl);
        }
      }
      const textToParse = `${latestRecord.labResults || ""} ${latestRecord.description || ""} ${ocrText}`.trim();
      rawIndicators = parseMedicalIndicators(textToParse);
    }

    const indicatorsWithStatus = getMedicalIndicatorStatus(rawIndicators, user.gender);

    if (dietPlan) {
      return res.json({
        success: true,
        data: {
          ...dietPlan.toObject(),
          userProfile: {
            height: user.height,
            weight: user.weight,
            gender: user.gender,
            dob: user.dob
          },
          medicalRecord: latestRecord ? {
            diagnosis: latestRecord.diagnosis,
            symptoms: latestRecord.symptoms,
            description: latestRecord.description,
            labResults: latestRecord.labResults,
            title: latestRecord.title,
            fileUrl: latestRecord.fileUrl,
            indicators: indicatorsWithStatus,
            ocrExtracted: !!ocrText
          } : null
        },
      });
    }

    const userProfile = { height: user.height, weight: user.weight, gender: user.gender, dob: user.dob };
    
    // Call Python model (AI source of truth)
    const prediction = await predictDietPython(
      patientId,
      false,
      userProfile,
      rawIndicators
    );

    dietPlan = await DietPlan.create({
      patientId,
      date: today,
      ...prediction,
      importantComponents: prediction.targeting,
      medicalRecordId: latestRecord ? latestRecord._id : null,
    });

    res.json({
      success: true,
      data: {
        ...dietPlan.toObject(),
        userProfile,
        medicalRecord: latestRecord ? {
          diagnosis: latestRecord.diagnosis,
          symptoms: latestRecord.symptoms,
          description: latestRecord.description,
          labResults: latestRecord.labResults,
          title: latestRecord.title,
          fileUrl: latestRecord.fileUrl,
          indicators: indicatorsWithStatus,
          ocrExtracted: !!ocrText
        } : null
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDietRecommendation = async (req, res, next) => {
  try {
    const { indicators } = req.body;
    const user = await User.findById(req.user.id);
    const userProfile = { height: user.height, weight: user.weight, gender: user.gender, dob: user.dob };

    const result = await predictDietPython(
      req.user.id,
      false,
      userProfile,
      indicators || {}
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refreshDietPlan = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    const user = await User.findById(patientId);
    if (!user) throw new Error("User not found");

    const labTechs = await User.find({ role: "lab_technician" }).select("_id");
    const labTechIds = labTechs.map(lt => lt._id);

    const latestRecord = await Record.findOne({ 
      patientId, 
      doctorId: { $in: labTechIds } 
    }).sort({ createdAt: -1 });
    
    let ocrText = "";
    let rawIndicators = {};

    if (latestRecord) {
      if (latestRecord.fileUrl) {
        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(latestRecord.fileUrl);
        if (isImage) {
          ocrText = await extractTextFromImage(latestRecord.fileUrl);
        }
      }
      const textToParse = `${latestRecord.labResults || ""} ${latestRecord.description || ""} ${ocrText}`.trim();
      rawIndicators = parseMedicalIndicators(textToParse);
    }

    const indicatorsWithStatus = getMedicalIndicatorStatus(rawIndicators, user.gender);

    const userProfile = { height: user.height, weight: user.weight, gender: user.gender, dob: user.dob };
    const prediction = await predictDietPython(
      patientId,
      true, // Force random for refresh
      userProfile,
      rawIndicators
    );

    const dietPlan = await DietPlan.findOneAndUpdate(
      { patientId, date: today },
      { ...prediction, importantComponents: prediction.targeting, medicalRecordId: latestRecord ? latestRecord._id : null },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: {
        ...dietPlan.toObject(),
        userProfile,
        medicalRecord: latestRecord ? {
          diagnosis: latestRecord.diagnosis,
          symptoms: latestRecord.symptoms,
          description: latestRecord.description,
          labResults: latestRecord.labResults,
          title: latestRecord.title,
          fileUrl: latestRecord.fileUrl,
          indicators: indicatorsWithStatus,
          ocrExtracted: !!ocrText
        } : null
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFoodImage = async (req, res) => {
  const { q } = req.query;
  const imageUrl = await getFoodImageUrl(q);
  return res.json({ imageUrl });
};

module.exports = {
  getLatestDietPlan,
  getDietRecommendation,
  refreshDietPlan,
  getFoodImage,
};
