const Inventory = require("./models/inventory.model");
const socket = require("../../core/socket");

const getAllInventory = async () => {
  return await Inventory.find().sort({ name: 1 });
};

const getLowStockInventory = async () => {
  const inventory = await Inventory.find();
  return inventory.filter(item => item.stock <= item.minStockLevel);
};

const updateInventoryStock = async (name, quantityChange) => {
  const item = await Inventory.findOne({ name });
  if (!item) {
    throw new Error(`Inventory item '${name}' not found`);
  }
  
  item.stock += quantityChange;
  await item.save();

  try {
    const io = socket.getIO();
    io.emit("inventory-updated", {
      name: item.name,
      stock: item.stock,
      status: item.stock <= item.minStockLevel ? (item.stock <= 5 ? 'critical' : 'low') : 'ok'
    });
  } catch (socketErr) {
    console.warn("Socket notification failed for inventory update:", socketErr.message);
  }

  return item;
};

const addInventoryItem = async (data) => {
  const item = await Inventory.create(data);
  
  try {
    const io = socket.getIO();
    io.emit("inventory-updated", {
      name: item.name,
      stock: item.stock,
      status: item.stock <= item.minStockLevel ? (item.stock <= 5 ? 'critical' : 'low') : 'ok'
    });
  } catch (socketErr) {
    console.warn("Socket notification failed for new inventory item:", socketErr.message);
  }
  
  return item;
};

module.exports = {
  getAllInventory,
  getLowStockInventory,
  updateInventoryStock,
  addInventoryItem,
};
