# webprog-assignment4-weather-dashboard
# Weather Dashboard

Type a city name and get its live weather: the current conditions and a 3-day forecast. Built with plain HTML, CSS and JavaScript (no frameworks or libraries) for Web Development, Assignment 4.

## Features

- Search by city name, with the Search button or the Enter key
- Current temperature, conditions with an icon, humidity, wind speed and the "feels like" temperature
- 3-day forecast with the highest and lowest temperature of each day
- Loading state: a message with a spinner, and the Search button is disabled while a request runs
- Clear error messages, with a Retry button that repeats the last search
- Responsive, mobile-first layout with one breakpoint at 600px

## API

The app uses [Open-Meteo](https://open-meteo.com), with two endpoints:

| Purpose | Endpoint |
|---|---|
| Turn a city name into latitude and longitude | `https://geocoding-api.open-meteo.com/v1/search` |
| Current weather and daily forecast | `https://api.open-meteo.com/v1/forecast` |

## API key setup

- **Obtaining a key:** none is needed. Open-Meteo can be used without an API key and without creating an account, so there is nothing to sign up for.
- **Using a key:** nothing to configure. The app does not send a key, and there is no `.env` or `config.js` file to create.
- **Security:** there is no secret in this repository. The `.gitignore` still lists `config.js` and `.env`, so a key would never be committed if the app is later switched to an API that requires one.

## How to run

1. Clone the repository:

   ```bash
   git clone https://github.com/georges0saab/webprog-assignment4-weather-dashboard.git
   ```

2. Open `index.html` in a browser.

There is no install step and no build step. An internet connection is needed to fetch the weather.

## How it works

1. The user submits the form. A blank or spaces-only input is rejected right away, without a request.
2. `loadWeather(city)` asks the geocoding API for the city's coordinates, then asks the forecast API for the weather at those coordinates.
3. `renderWeatherData(data)` fills the page. Every value comes from the response, nothing is hardcoded, and all text is written with `textContent`.
4. `setStatus(state, message)` controls what the user sees in the four states: idle, loading, success and error.

The weather code from the API is a number, so a lookup table in `script.js` turns it into a description and an emoji. A code that is not in the table shows "Unknown" instead of breaking the page.

## Error handling

`getJSON(url)` wraps `fetch` in `try/catch` and checks `response.ok`, because `fetch` does not reject on HTTP errors such as 404. Every failure ends up in one `catch`, and the user sees a message in plain words:

| Situation | What the user sees |
|---|---|
| City not found | City not found. Check the spelling. |
| No connection (offline, DNS, CORS) | Couldn't reach the server. Check your connection. |
| Rate limit (HTTP 429) | Too many requests. Wait a moment and try again. |
| Server error (HTTP 5xx) | The weather service is having problems. Try again later. |
| Any other HTTP error | Something went wrong. Try again. |
| Empty or spaces-only input | Please enter a city name. |

Handled errors are logged with `console.warn`, so the console stays free of uncaught errors.

## Accessibility

- The input has a visible label, and every control shows a focus ring for keyboard users
- The status message uses `role="status"`, so screen readers announce changes
- The emoji icon has an `aria-label` with the description of the weather
- The spinner stops for users who prefer reduced motion

## Project structure

```
index.html        page structure
style.css         layout, colors, states and the responsive breakpoint
script.js         fetching, rendering and the loading and error states
screenshots/      screenshots of the running app (Beirut and Sidon)
```

## Credits

Weather data by [Open-Meteo.com](https://open-meteo.com).