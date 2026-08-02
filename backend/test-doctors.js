const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("./modules/users/models/user.model");

dotenv.config({ path: path.join(__dirname, ".env") });

const testQuery = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("Connected to MongoDB");
    
    // Simulate req.query
    const req = {
            query: {
                hospitalName: "Sree Siddaganga Hospitals",
                limit: 100,
                isEmergency: 'true'
            }
        };
    
    const { search, lat, lng, radius, page = 1, limit = 6, date, hospitalName, isEmergency } = req.query;
    let query = { role: "doctor" };

    if (hospitalName) {
        const searchName = hospitalName.replace(/(hospitals|hospital|clinics|clinic|centers|center|medical)/ig, '').trim();
        query.hospitalName = { $regex: searchName, $options: "i" };
        console.log("SearchName:", searchName);
    }

    if (lat && lng && !hospitalName) {
        query.location = {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: parseInt(radius) || 5000
            }
        };
    }

    if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        if (query.hospitalName) {
            query.$or = [
                { name: searchRegex },
                { specialization: searchRegex }
            ];
        } else {
            query.$or = [
                { name: searchRegex },
                { specialization: searchRegex },
                { hospitalName: searchRegex }
            ];
        }
    }

    let doctors = [];
    let totalDoctors = 0;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log("query:", query);

    if (date && isEmergency !== 'true') {
        console.log("Going into date filtering block");
        // ...
    } else {
        console.log("Going into simple else block");
        totalDoctors = await User.countDocuments(query);
        doctors = await User.find(query).select("-password").skip(skip).limit(parseInt(limit));
    }

    console.log("Total doctors found:", doctors.length);
    console.log(doctors.map(d => d.name));

    mongoose.disconnect();
};

testQuery();