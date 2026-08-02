const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../modules/users/models/user.model");
const bcrypt = require("bcryptjs");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.HOSPITAL_ADMIN_EMAIL || "holycross@gmail.com";
    const adminPassword = process.env.HOSPITAL_ADMIN_PASSWORD || "holycross@6766";
    const adminName = process.env.HOSPITAL_ADMIN_NAME || "Holy Cross Admin";
    
    // Apollo Hospital Admin
    const apolloAdminEmail = "apollo@gmail.com";
    const apolloAdminPassword = "apollo@password";
    const apolloAdminName = "Apollo Hospital Admin";

    const deliveryUser = {
      name: "Delivery1",
      email: "delivery@mail.com",
      password: "password123",
      role: "delivery",
    };

    // Ensure Holy Cross Hospital Admin exists
    let adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      adminUser.name = adminName;
      adminUser.role = "admin";
      adminUser.hospitalName = "Holy Cross Hospital";
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log(`Admin user ${adminEmail} ensured/updated.`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        hospitalName: "Holy Cross Hospital"
      });
      console.log(`Admin user ${adminEmail} created successfully.`);
    }

    // Ensure Apollo Hospital Admin exists
    let apolloUser = await User.findOne({ email: apolloAdminEmail });
    if (apolloUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(apolloAdminPassword, salt);
      apolloUser.name = apolloAdminName;
      apolloUser.role = "admin";
      apolloUser.hospitalName = "Apollo Hospital";
      apolloUser.password = hashedPassword;
      await apolloUser.save();
      console.log(`Admin user ${apolloAdminEmail} ensured/updated.`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(apolloAdminPassword, salt);
      await User.create({
        name: apolloAdminName,
        email: apolloAdminEmail,
        password: hashedPassword,
        role: "admin",
        hospitalName: "Apollo Hospital"
      });
      console.log(`Admin user ${apolloAdminEmail} created successfully.`);
    }

    // Add a test doctor for Apollo Hospital
    const apolloDoctorEmail = "apollodoc@gmail.com";
    let apolloDoctor = await User.findOne({ email: apolloDoctorEmail });
    if (!apolloDoctor) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);
      await User.create({
        name: "Dr. Apollo Specialist",
        email: apolloDoctorEmail,
        password: hashedPassword,
        role: "doctor",
        hospitalName: "Apollo Hospital",
        specialization: "Emergency Medicine",
        experience: "12 Years"
      });
      console.log(`Doctor for Apollo created successfully.`);
    }

    // Super Admin (System Admin)
    const superAdminEmail = "superadmin@gmail.com";
    const superAdminPassword = "superadmin123";
    const superAdminName = "Medicare System Admin";

    let superUser = await User.findOne({ email: superAdminEmail });
    if (superUser) {
      const salt = await bcrypt.genSalt(10);
      superUser.password = await bcrypt.hash(superAdminPassword, salt);
      superUser.name = superAdminName;
      superUser.role = "admin";
      superUser.hospitalName = ""; // Explicitly empty
      await superUser.save();
      console.log(`Super Admin ${superAdminEmail} ensured/updated.`);
    } else {
      const salt = await bcrypt.genSalt(10);
      await User.create({
        name: superAdminName,
        email: superAdminEmail,
        password: await bcrypt.hash(superAdminPassword, salt),
        role: "admin",
        hospitalName: ""
      });
      console.log(`Super Admin ${superAdminEmail} created successfully.`);
    }

    // Seed a default delivery user if missing
    const existingUser = await User.findOne({ email: deliveryUser.email });

    if (existingUser) {
      console.log(`User ${deliveryUser.email} already exists.`);
      console.log(`User ID: ${existingUser._id}`);
      console.log(`Role: ${existingUser.role}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(deliveryUser.password, salt);

      await User.create({
        ...deliveryUser,
        password: hashedPassword,
      });

      console.log(`User ${deliveryUser.email} created successfully.`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();
