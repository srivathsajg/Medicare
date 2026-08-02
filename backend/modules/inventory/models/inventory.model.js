const mongoose = require("mongoose");

const { Schema } = mongoose;

const inventorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  unit: {
    type: String,
    default: "units",
  },
  minStockLevel: {
    type: Number,
    default: 10,
  },
  category: {
    type: String,
  },
  price: {
    type: Number,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

inventorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
