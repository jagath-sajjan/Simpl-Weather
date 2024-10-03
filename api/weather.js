const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { lat, lon, city, units } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  console.log('API Key:', apiKey ? 'Set' : 'Not set');
  console.log('Query params:', { lat, lon, city, units });

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is not set' });
  }

  let url;
  if (lat && lon) {
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
  } else if (city) {
    url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
  } else {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  console.log('Fetching URL:', url);

  try {
    const response = await fetch(url);
    const data = await response.text();
    
    console.log('OpenWeatherMap API response:', data);

    try {
      const jsonData = JSON.parse(data);
      res.status(200).json(jsonData);
    } catch (parseError) {
      console.error('Error parsing OpenWeatherMap API response:', parseError);
      res.status(500).json({ error: 'Invalid response from OpenWeatherMap API', details: data });
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: error.message });
  }
};
