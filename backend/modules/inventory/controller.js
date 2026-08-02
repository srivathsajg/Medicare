const inventoryService = require("./service");

const getInventory = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getAllInventory();
    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const lowStock = await inventoryService.getLowStockInventory();
    res.json({
      success: true,
      data: lowStock,
    });
  } catch (error) {
    next(error);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const { name, quantityChange } = req.body;
    const item = await inventoryService.updateInventoryStock(name, quantityChange);
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const item = await inventoryService.addInventoryItem(req.body);
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getLowStock,
  updateStock,
  addItem,
};
