const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("MongoDB not connected - running in DEV MODE");
    console.error(err.message);
  }
};

module.exports = connectDB;
