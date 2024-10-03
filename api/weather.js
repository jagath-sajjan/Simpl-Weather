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
    
    console.log('OpenWeatherMap API response status:', response.status);
    console.log('OpenWeatherMap API response headers:', response.headers.raw());
    console.log('OpenWeatherMap API response body:', data);

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
````

2. Now, let's modify the `script.js` file to handle errors more gracefully:

````javascript:script.js
async function getWeatherByCoords(lat, lon) {
    try {
        const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=${units}`);
        const weatherData = await weatherResponse.text();
        console.log('Weather API response:', weatherData);

        let parsedWeatherData;
        try {
            parsedWeatherData = JSON.parse(weatherData);
        } catch (parseError) {
            console.error('Error parsing weather data:', parseError);
            throw new Error('Invalid response from weather API');
        }

        if (parsedWeatherData.error) {
            throw new Error(parsedWeatherData.error);
        }
        
        updateCurrentWeather(parsedWeatherData);

        const forecastResponse = await fetch(`/api/forecast?lat=${lat}&lon=${lon}&units=${units}`);
        const forecastData = await forecastResponse.text();
        console.log('Forecast API response:', forecastData);

        let parsedForecastData;
        try {
            parsedForecastData = JSON.parse(forecastData);
        } catch (parseError) {
            console.error('Error parsing forecast data:', parseError);
            throw new Error('Invalid response from forecast API');
        }

        if (parsedForecastData.error) {
            throw new Error(parsedForecastData.error);
        }
        
        updateForecast(parsedForecastData);

        updateBackground(parsedWeatherData.weather[0].main);

        addToSearchHistory(parsedWeatherData.name);
        cityInput.value = parsedWeatherData.name;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(`An error occurred: ${error.message}. Please check the console for more details.`);
    } finally {
        hideLoading();
    }
}
