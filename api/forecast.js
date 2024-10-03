const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { lat, lon, city, units } = req.query;
  const apiKey = 'fc9485f42bc343c260487345988240b1'; // Use the API key directly

  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${units}`;
  } else {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await fetch(url);
    const data = await response.text();
    
    console.log('OpenWeatherMap API response status:', response.status);
    console.log('OpenWeatherMap API response body:', data);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API responded with status ${response.status}: ${data}`);
    }

    const jsonData = JSON.parse(data);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    res.status(500).json({ error: error.message });
  }
};
