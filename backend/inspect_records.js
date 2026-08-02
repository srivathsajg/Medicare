require('dotenv').config();
const mongoose = require('mongoose');
const Record = require('./modules/medical-records/models/record.model');
const fs = require('fs');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const records = await Record.find({ fileUrl: /\.(jpg|jpeg|png|pdf)$/i }).select('title diagnosis fileUrl');
  fs.writeFileSync('records_out.json', JSON.stringify({ records }, null, 2));
  process.exit(0);
}

check();
