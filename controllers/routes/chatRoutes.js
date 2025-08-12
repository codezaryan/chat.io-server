const express = require('express');
const router = express.Router();
const { test } = require('../controllers/chatController');

router.get('/test', test);

module.exports = router;
