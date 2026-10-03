const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Weather endpoints are read-only but should be protected for school users
router.use(protect);

router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecast);

module.exports = router;
