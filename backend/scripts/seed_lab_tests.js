const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const LabTest = require("../modules/lab/models/labTest.model");

dotenv.config({ path: path.join(__dirname, "../.env") });

const seedLabTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const csvPath = path.join(__dirname, "../../Dataset/lab_test.csv");
    const data = fs.readFileSync(csvPath, "utf8");
    const lines = data.split("\n");

    const tests = [];
    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line: test_id,test_name,price
      // Note: test_name might contain commas? Assuming simple CSV for now based on snippet.
      const parts = line.split(",");
      if (parts.length >= 3) {
        const testId = parseInt(parts[0]);
        // Handle potential commas in name if it was quoted, but snippet showed simple names.
        // Let's assume name is the middle part(s).
        const price = parseInt(parts[parts.length - 1]);
        const testName = parts.slice(1, parts.length - 1).join(",").replace(/"/g, "");

        if (!isNaN(testId) && !isNaN(price)) {
          tests.push({
            testId,
            testName,
            price,
          });
        }
      }
    }

    if (tests.length > 0) {
      await LabTest.deleteMany({}); // Clear existing tests to avoid duplicates/conflicts
      await LabTest.insertMany(tests);
      console.log(`Seeded ${tests.length} lab tests successfully.`);
    } else {
      console.log("No lab tests found in CSV.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding lab tests:", error);
    process.exit(1);
  }
};

seedLabTests();
