const axios = require("axios");

async function test() {
    try {
        const rand = Math.random().toString(36).substring(7);
        try {
            await axios.post("http://localhost:5000/api/auth/register", {
                name: "Test Patient",
                email: `patient_${rand}@mail.com`,
                password: "password123",
                role: "patient"
            });
        } catch (e) {
            console.log("Register error", e.response?.data || e.message);
        }

        const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
            email: `patient_${rand}@mail.com`,
            password: "password123",
            role: "patient"
        });
        
        const token = loginRes.data.token;
        console.log("Logged in, token:", token.substring(0, 10) + "...");

        // Fetch doctors
        const res = await axios.get("http://localhost:5000/api/patient/doctors", {
            params: {
                hospitalName: "Holy Cross Hospital",
                limit: 100,
                isEmergency: true
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Doctors fetched:", res.data.data.doctors.length);
        console.log("First doctor:", res.data.data.doctors[0]?.name);
    } catch (e) {
        console.error("Error:", e.response?.data || e.message);
    }
}

test();