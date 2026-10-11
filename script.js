const GEO = 'https://geocoding-api.open-meteo.com/v1/search';//GEO and WX are the two APIs that we will be using to get the weather data. 
const WX = 'https://api.open-meteo.com/v1/forecast';         //GEO is used to get the latitude and longitude of the city,
                                                             //and WX is used to get the weather data for that location. 
async function getJSON(url) {
    const response = await fetch(url);

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
