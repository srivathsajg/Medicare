const mongoose = require("mongoose");
const { Schema } = mongoose;

const availabilitySchema = new Schema({
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  slots: [
    {
      time: { type: String, required: true },
      isBooked: { type: Boolean, default: false },
    },
  ],
});

// Compound index to ensure unique availability per doctor per date
availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

const DoctorAvailability = mongoose.model("DoctorAvailability", availabilitySchema);

module.exports = DoctorAvailability;
