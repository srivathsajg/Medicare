require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./modules/users/models/user.model');
const fs = require('fs');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const doctors = await User.find({ role: 'doctor' }).select('name hospitalName hospitalAddress');
  const admins = await User.find({ role: 'admin' }).select('name hospitalName hospitalAddress');
  fs.writeFileSync('out.json', JSON.stringify({ doctors, admins }, null, 2));
  process.exit(0);
}

check();
