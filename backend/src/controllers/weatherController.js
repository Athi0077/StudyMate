const weatherService = require('../services/weatherService');

exports.getCurrentWeather = async (req, res) => {
  try {
    const data = await weatherService.getCurrentWeather();
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const data = await weatherService.getForecast();
    res.json({ success: true, data });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
};
