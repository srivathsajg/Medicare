const express = require("express");
const router = express.Router();
const controller = require("./controller");
const auth = require("../../middleware/authMiddleware");

router.get("/", auth, controller.universalSearch);

module.exports = router;
