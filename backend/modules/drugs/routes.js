const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const { search } = require('./controller');

// Allow doctors to search
router.get('/search', authMiddleware, search);

module.exports = router;
