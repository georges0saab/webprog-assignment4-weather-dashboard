const GEO = 'https://geocoding-api.open-meteo.com/v1/search';//GEO and WX are the two APIs that we will be using to get the weather data. 
const WX = 'https://api.open-meteo.com/v1/forecast';         //GEO is used to get the latitude and longitude of the city,
                                                             //and WX is used to get the weather data for that location. 

// Open-Meteo gives the weather as a WMO code (a number), so this table turns each code into a text and an emoji.
const WEATHER_CODES = {
    0: { text: 'Clear sky', emoji: '☀️' },
    1: { text: 'Mainly clear', emoji: '🌤️' },
    2: { text: 'Partly cloudy', emoji: '⛅' },
    3: { text: 'Overcast', emoji: '☁️' },
    45: { text: 'Fog', emoji: '🌫️' },
    48: { text: 'Rime fog', emoji: '🌫️' },
    51: { text: 'Light drizzle', emoji: '🌦️' },
    53: { text: 'Drizzle', emoji: '🌦️' },
    55: { text: 'Dense drizzle', emoji: '🌦️' },
    56: { text: 'Light freezing drizzle', emoji: '🌧️' },
    57: { text: 'Freezing drizzle', emoji: '🌧️' },
    61: { text: 'Light rain', emoji: '🌧️' },
    63: { text: 'Rain', emoji: '🌧️' },
    65: { text: 'Heavy rain', emoji: '🌧️' },
    66: { text: 'Light freezing rain', emoji: '🌧️' },
    67: { text: 'Freezing rain', emoji: '🌧️' },
    71: { text: 'Light snow', emoji: '❄️' },
    73: { text: 'Snow', emoji: '❄️' },
    75: { text: 'Heavy snow', emoji: '❄️' },
    77: { text: 'Snow grains', emoji: '❄️' },
    80: { text: 'Light rain showers', emoji: '🌦️' },
    81: { text: 'Rain showers', emoji: '🌦️' },
    82: { text: 'Violent rain showers', emoji: '🌦️' },
    85: { text: 'Light snow showers', emoji: '❄️' },
    86: { text: 'Heavy snow showers', emoji: '❄️' },
    95: { text: 'Thunderstorm', emoji: '⛈️' },
    96: { text: 'Thunderstorm with hail', emoji: '⛈️' },
    99: { text: 'Thunderstorm with heavy hail', emoji: '⛈️' }
};

const statusEl = document.getElementById('status');
const retryBtn = document.getElementById('retry');
const searchBtn = document.getElementById('search-btn');
const resultsEl = document.getElementById('results');
let lastCity = ''; // remembers the last search so the Retry button can repeat it

async function getJSON(url) {
    let response;

    try {
        response = await fetch(url);
    } catch (error) {
        throw new Error('network'); // fetch only rejects when no response arrived at all (offline, DNS, CORS)
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
}

async function loadWeather(city) { //loadWeather is the main function that will be called when the user submits the form. It takes the city name as an argument and returns the weather data for that city.
    const q = new URLSearchParams({ name: city, count: 1 });
    const geo = await getJSON(`${GEO}?${q}`);

    if (!geo.results?.length) {
        throw new Error('not-found');
    }

    const { latitude, longitude, name } = geo.results[0];

    const p = new URLSearchParams({//p is the query parameters that will be sent to the WX API. It includes the latitude and longitude of the city, the number of forecast days, the timezone, and the current and daily weather data that we want to retrieve.
        latitude,//latitude and longitude are the coordinates of the city that we got from the GEO API.
        longitude,
        forecast_days: 3,
        timezone: 'auto',
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'temperature_2m_max,temperature_2m_min'
    });

    return { name, ...(await getJSON(`${WX}?${p}`)) };//We are using the spread operator to merge the name of the city with the weather data that we got from the WX API. The result is an object that contains the name of the city and the weather data for that city.
}

// Turns an error into a message for the user, in plain words.
function friendly(error) {
    const message = error.message;

    if (message === 'not-found') {
        return 'City not found. Check the spelling.';
    }
    if (message === 'network') {
        return "Couldn't reach the server. Check your connection.";
    }
    if (message === 'HTTP 429') {
        return 'Too many requests. Wait a moment and try again.';
    }
    if (message.startsWith('HTTP 5')) {
        return 'The weather service is having problems. Try again later.';
    }
    return 'Something went wrong. Try again.';
}

// One place that controls what the user sees: idle, loading, success or error.
function setStatus(state, message = '') {
    statusEl.dataset.state = state;                // the CSS styles each state with this
    statusEl.textContent = message;
    searchBtn.disabled = state === 'loading';      // no second request while one is running
    retryBtn.hidden = state !== 'error';           // Retry only makes sense after an error
}

// Returns the text and emoji for a weather code. If the code is not in the table, it returns a default instead of crashing.
function describeWeather(code) {
    return WEATHER_CODES[code] || { text: 'Unknown', emoji: '❔' };
}

function renderWeatherData(weatherData) {
    const { name, current, daily } = weatherData;
    const { text, emoji } = describeWeather(current.weather_code);

    // textContent (not innerHTML) because this text comes from an outside API
    document.getElementById('city-name').textContent = name;
    document.getElementById('temp').textContent = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('description').textContent = text;

    const icon = document.getElementById('icon');
    icon.textContent = emoji;
    icon.setAttribute('aria-label', text); // the icon is an emoji, so screen readers read the description instead

    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('feels-like').textContent = `${Math.round(current.apparent_temperature)}°C`;

    // replaceChildren removes the old days first, so a new search never adds on top of the previous one
    document.getElementById('forecast').replaceChildren(
        ...daily.time.map((day, i) => {
            const li = document.createElement('li');
            li.textContent = `${day}: ${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°`;
            return li;
        })
    );

    resultsEl.hidden = false;
}

// Runs a whole search: loading, then the result or an error. The form and the Retry button both use it.
async function search(city) {
    if (statusEl.dataset.state === 'loading') {
        return; // a request is already running
    }

    lastCity = city;
    setStatus('loading', `Loading ${city}…`);

    try {
        const weatherData = await loadWeather(city);
        renderWeatherData(weatherData);
        setStatus('success');
    } catch (error) {
        resultsEl.hidden = true; // do not leave the old city on screen next to an error
        setStatus('error', friendly(error));
        console.warn('Weather request failed:', error); // handled, so a warning and not an error
    }
}

document.getElementById('search-form').addEventListener('submit', (event) => {//We are adding an event listener to the form that will be triggered when the user submits the form. The event listener will call the loadWeather function and display the weather data on the page.
    event.preventDefault();
    const city = document.getElementById('city-input').value.trim(); // the required attribute does not stop spaces, so trim first

    if (!city) {
        setStatus('error', 'Please enter a city name.');
        retryBtn.hidden = true; // nothing to retry
        return;
    }

    search(city);
});

retryBtn.addEventListener('click', () => search(lastCity));