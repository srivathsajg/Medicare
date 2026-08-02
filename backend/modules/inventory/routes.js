const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const { getInventory, getLowStock, updateStock, addItem } = require("./controller");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["pharmacist", "admin"]),
  getInventory
);

router.get(
  "/low-stock",
  authMiddleware,
  roleMiddleware(["pharmacist", "admin"]),
  getLowStock
);

router.patch(
  "/update-stock",
  authMiddleware,
  roleMiddleware(["pharmacist", "admin"]),
  updateStock
);

router.post(
  "/add",
  authMiddleware,
  roleMiddleware(["admin"]),
  addItem
);

module.exports = router;
