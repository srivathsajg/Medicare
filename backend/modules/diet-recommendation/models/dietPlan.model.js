const mongoose = require("mongoose");
const { Schema } = mongoose;

const dietPlanSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD for daily refresh
    required: true,
  },
  morning: {
    type: [{ 
      name: String, 
      image: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      quantity: String
    }],
    default: [],
  },
  afternoon: {
    type: [{ 
      name: String, 
      image: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      quantity: String
    }],
    default: [],
  },
  snacks: {
    type: [{ 
      name: String, 
      image: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      quantity: String
    }],
    default: [],
  },
  night: {
    type: [{ 
      name: String, 
      image: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      quantity: String
    }],
    default: [],
  },
  metadata: {
    bmi: Number,
    bmiStatus: String,
    bmr: Number,
    bmrStatus: String,
    dailyCalorieNeeds: Number,
    analysis: Schema.Types.Mixed
  },
  importantComponents: {
    type: [String],
    default: [],
  },
  medicalRecordId: {
    type: Schema.Types.ObjectId,
    ref: "Record",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one plan per patient per day
dietPlanSchema.index({ patientId: 1, date: 1 }, { unique: true });

const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

module.exports = DietPlan;
