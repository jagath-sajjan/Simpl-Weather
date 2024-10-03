// Replace this line with your actual API key
// const apiKey = process.env.OPENWEATHER_API_KEY;

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geolocationBtn = document.getElementById('geolocation-btn');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const cityName = document.querySelector('.city-name');
const temperature = document.querySelector('.temperature');
const description = document.querySelector('.description');
const weatherIcon = document.getElementById('weather-icon-img');
const humidity = document.querySelector('.humidity');
const windSpeed = document.querySelector('.wind-speed');
const pressure = document.querySelector('.pressure');
const forecastContainer = document.querySelector('.forecast-container');
const loadingOverlay = document.querySelector('.loading-overlay');

let units = 'metric';
let searchHistory = [];
const MAX_HISTORY = 5;

const autocompleteList = document.createElement('div');
autocompleteList.setAttribute('class', 'autocomplete-items');
let currentFocus = -1;

searchBtn.addEventListener('click', () => getWeather(cityInput.value));
geolocationBtn.addEventListener('click', getGeolocation);
celsiusBtn.addEventListener('click', () => setUnits('metric'));
fahrenheitBtn.addEventListener('click', () => setUnits('imperial'));
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getWeather(cityInput.value);
});

function setUnits(newUnits) {
    units = newUnits;
    celsiusBtn.classList.toggle('active', units === 'metric');
    fahrenheitBtn.classList.toggle('active', units === 'imperial');
    if (cityName.textContent) getWeather(cityName.textContent);

    // Update the slider position
    const unitToggle = document.querySelector('.unit-toggle');
    if (units === 'metric') {
        unitToggle.classList.remove('fahrenheit');
    } else {
        unitToggle.classList.add('fahrenheit');
    }
}

function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function loadSearchHistory() {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
        searchHistory = JSON.parse(savedHistory);
    }
}

function saveSearchHistory() {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

async function getWeather(query) {
    if (!query) return;
    showLoading();

    try {
        let weatherData, forecastData;

        if (typeof query === 'string') {
            // If query is a string, assume it's a city name
            weatherData = await fetchWeatherData(query);
            forecastData = await fetchForecastData(query);
        } else if (typeof query === 'object' && query.lat && query.lon) {
            // If query is an object with lat and lon, use coordinates
            weatherData = await fetchWeatherDataByCoords(query.lat, query.lon);
            forecastData = await fetchForecastDataByCoords(query.lat, query.lon);
        } else {
            throw new Error('Invalid query');
        }

        updateCurrentWeather(weatherData);
        updateForecast(forecastData);
        updateBackground(weatherData.weather[0].main);

        // Add the location to search history
        addToSearchHistory(weatherData.name);
        cityInput.value = weatherData.name;
        autocompleteList.innerHTML = ''; // Clear autocomplete list
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('Location not found or an error occurred. Please try again.');
        cityInput.value = '';
    } finally {
        hideLoading();
    }
}

async function fetchWeatherData(city) {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&units=${units}`);
    if (!response.ok) throw new Error('City not found');
    return response.json();
}

async function fetchForecastData(city) {
    const response = await fetch(`/api/forecast?city=${encodeURIComponent(city)}&units=${units}`);
    if (!response.ok) throw new Error('Forecast data not available');
    return response.json();
}

function updateCurrentWeather(data) {
    cityName.textContent = data.name;
    temperature.textContent = `${Math.round(data.main.temp)}°${units === 'metric' ? 'C' : 'F'}`;
    description.textContent = data.weather[0].description;
    weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    windSpeed.textContent = `Wind: ${data.wind.speed} ${units === 'metric' ? 'm/s' : 'mph'}`;
    pressure.textContent = `Pressure: ${data.main.pressure} hPa`;

    animateUpdate();

    // Add fade-in animation
    [cityName, temperature, description, weatherIcon].forEach(el => {
        el.classList.add('fade-in');
        setTimeout(() => el.classList.remove('fade-in'), 500);
    });
}

function updateForecast(data) {
    forecastContainer.innerHTML = '';
    const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    dailyData.slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;

        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');
        forecastItem.innerHTML = `
            <div>${dayName}</div>
            <img src="http://openweathermap.org/img/wn/${icon}.png" alt="Weather Icon">
            <div>${temp}°${units === 'metric' ? 'C' : 'F'}</div>
        `;
        forecastContainer.appendChild(forecastItem);
    });

    // Add fade-in animation to forecast items
    forecastContainer.querySelectorAll('.forecast-item').forEach((item, index) => {
        setTimeout(() => item.classList.add('fade-in'), index * 100);
    });
}

function updateBackground(weatherCondition) {
    const backgrounds = {
        Clear: 'sunny',
        Clouds: 'cloudy',
        Rain: 'rainy',
        Snow: 'snowy',
        Thunderstorm: 'stormy'
    };
    const condition = backgrounds[weatherCondition] || 'nature';
    document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${condition}')`;
}

function animateUpdate() {
    const elements = [cityName, temperature, description, weatherIcon];
    elements.forEach(el => {
        el.classList.add('update');
        setTimeout(() => el.classList.remove('update'), 500);
    });
}

function getGeolocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                hideLoading();
                alert('Unable to retrieve your location. Using default city.');
                getWeather('New York');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Using default city.');
        getWeather('New York');
    }
}

async function getWeatherByCoords(lat, lon) {
    try {
        const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=${units}`);
        const weatherData = await weatherResponse.json();
        updateCurrentWeather(weatherData);

        const forecastResponse = await fetch(`/api/forecast?lat=${lat}&lon=${lon}&units=${units}`);
        const forecastData = await forecastResponse.json();
        updateForecast(forecastData);

        updateBackground(weatherData.weather[0].main);

        // Add the location name to search history
        addToSearchHistory(weatherData.name);
        cityInput.value = weatherData.name;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('An error occurred. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Add this array of common cities for autocomplete
const commonCities = [
    'New York', 'London', 'Paris', 'Tokyo', 'Sydney', 'Dubai', 'Mumbai', 'Singapore', 'Hong Kong', 'Berlin',
    'Moscow', 'Toronto', 'Los Angeles', 'Chicago', 'Bangkok', 'Seoul', 'Shanghai', 'Beijing', 'Istanbul', 'Rome',
    'Madrid', 'Amsterdam', 'Vienna', 'Prague', 'Stockholm', 'Copenhagen', 'Oslo', 'Helsinki', 'Athens', 'Cairo',
    'Cape Town', 'Rio de Janeiro', 'Buenos Aires', 'Mexico City', 'San Francisco', 'Vancouver', 'Montreal', 'Dublin',
    'Edinburgh', 'Manchester', 'Barcelona', 'Lisbon', 'Milan', 'Munich', 'Frankfurt', 'Brussels', 'Geneva', 'Zurich',
    'Warsaw', 'Budapest', 'Bucharest', 'Sofia', 'Kiev', 'St. Petersburg', 'Jakarta', 'Kuala Lumpur', 'Manila', 'Hanoi',
    'Bangkok', 'Taipei', 'Osaka', 'Melbourne', 'Brisbane', 'Perth', 'Auckland', 'Wellington', 'Fiji', 'Hawaii',
    'Las Vegas', 'Miami', 'Orlando', 'New Orleans', 'Seattle', 'Boston', 'Washington D.C.', 'Dallas', 'Houston',
    'Phoenix', 'Denver', 'Atlanta', 'Detroit', 'Minneapolis', 'Portland', 'Sacramento', 'San Diego', 'Austin',
    'Nashville', 'Bengaluru', 'Delhi', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow'
];

// Function to initialize autocomplete
function initAutocomplete() {
    const input = document.getElementById('city-input');
    input.parentNode.appendChild(autocompleteList);

    input.addEventListener('input', debounce(function() {
        const inputValue = this.value.toLowerCase().trim();
        autocompleteList.innerHTML = '';
        currentFocus = -1;

        if (inputValue.length > 0) {
            const matchingCities = [...new Set([...searchHistory, ...commonCities])]
                .filter(city => city.toLowerCase().startsWith(inputValue))
                .slice(0, 5); // Limit to 5 suggestions

            matchingCities.forEach((city, index) => {
                const div = document.createElement('div');
                div.innerHTML = `<strong>${city.substr(0, inputValue.length)}</strong>${city.substr(inputValue.length)}`;
                div.addEventListener('click', function() {
                    input.value = city;
                    autocompleteList.innerHTML = '';
                    getWeather(city);
                });
                div.addEventListener('mouseover', function() {
                    currentFocus = index;
                    addActive(autocompleteList.getElementsByTagName('div'));
                });
                autocompleteList.appendChild(div);
            });
        }
    }, 300));

    input.addEventListener('keydown', function(e) {
        let items = autocompleteList.getElementsByTagName('div');
        if (e.key === 'ArrowDown') {
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1) {
                if (items[currentFocus]) items[currentFocus].click();
            } else {
                getWeather(this.value);
            }
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target !== input && e.target !== autocompleteList) {
            autocompleteList.innerHTML = '';
        }
    });
}

function addActive(items) {
    if (!items) return false;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (items.length - 1);
    items[currentFocus].classList.add("autocomplete-active");
    items[currentFocus].scrollIntoView({ block: 'nearest' });
}

function removeActive(items) {
    for (let item of items) {
        item.classList.remove("autocomplete-active");
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add this new function to handle search history
function addToSearchHistory(city) {
    const index = searchHistory.indexOf(city);
    if (index > -1) {
        searchHistory.splice(index, 1);
    }
    searchHistory.unshift(city);
    if (searchHistory.length > MAX_HISTORY) {
        searchHistory.pop();
    }
    saveSearchHistory();
}

// Call the initAutocomplete function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadSearchHistory();
    initAutocomplete();
    
    // Use geolocation as the default
    getGeolocation();
});

// Add these new functions to handle fetching by coordinates
async function fetchWeatherDataByCoords(lat, lon) {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=${units}`);
    if (!response.ok) throw new Error('Weather data not available');
    return response.json();
}

async function fetchForecastDataByCoords(lat, lon) {
    const response = await fetch(`/api/forecast?lat=${lat}&lon=${lon}&units=${units}`);
    if (!response.ok) throw new Error('Forecast data not available');
    return response.json();
}
