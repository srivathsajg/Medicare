const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../modules/users/models/user.model");

dotenv.config({ path: path.join(__dirname, "../.env") });

const ROLES_TO_DELETE = ["doctor", "pharmacist", "patient", "delivery"];

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

const purge = async () => {
  try {
    await connectDB();
    console.log("Connected to database");

    const preCount = await User.countDocuments({ role: { $in: ROLES_TO_DELETE } });
    console.log(`Found ${preCount} users with roles: ${ROLES_TO_DELETE.join(", ")}`);

    const result = await User.deleteMany({ role: { $in: ROLES_TO_DELETE } });
    console.log(`Deleted ${result.deletedCount} users.`);
  } catch (err) {
    console.error("Purge failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

purge();
