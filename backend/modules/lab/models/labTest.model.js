const mongoose = require("mongoose");

const labTestSchema = new mongoose.Schema({
  testId: { type: Number, required: true, unique: true },
  testName: { type: String, required: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.model("LabTest", labTestSchema);
