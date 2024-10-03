const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { lat, lon, city, units } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
  } else {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};