require('dotenv').config();
const { getFoodImageUrl } = require('./ai/diet-recommendation/foodImage.service');

async function test() {
  const result = await getFoodImageUrl("Mixed nuts");
  console.log("Result:", result);
  process.exit(0);
}

test();
