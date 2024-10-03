const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { lat, lon, city, units } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    console.log('API Key:', apiKey ? 'Set' : 'Not set');
    console.log('Query params:', { lat, lon, city, units });

    if (!apiKey) {
      console.error('API key is not set');
      return res.status(500).json({ error: 'API key is not set' });
    }

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
    } else {
      console.error('Missing parameters');
      return res.status(400).json({ error: 'Missing parameters' });
    }

    console.log('Fetching URL:', url);

    const response = await fetch(url);
    const data = await response.text();
    
    console.log('OpenWeatherMap API response status:', response.status);
    console.log('OpenWeatherMap API response headers:', JSON.stringify(response.headers.raw()));
    console.log('OpenWeatherMap API response body:', data);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap API responded with status ${response.status}: ${data}`);
    }

    const jsonData = JSON.parse(data);
    res.status(200).json(jsonData);
  } catch (error) {
    console.error('Error in weather API:', error);
    res.status(500).json({ error: error.message });
  }
};
