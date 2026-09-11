const weatherIcon = document.getElementById('weather-icon');
const weatherTemperature = document.getElementById('weather-temperature');
const weatherCondition = document.getElementById('weather-condition');
const forecastGrid = document.getElementById('forecast-grid');
const weatherMessage = document.getElementById('weather-message');
const weatherRetry = document.getElementById('weather-retry');

const weatherTypes = {
	clear: { icon: '☀️', label: 'Clear skies' },
	cloudy: { icon: '☁️', label: 'Cloudy' },
	fog: { icon: '🌫️', label: 'Misty' },
	rain: { icon: '🌧️', label: 'Rainy' },
	snow: { icon: '❄️', label: 'Snowy' },
	storm: { icon: '⛈️', label: 'Stormy' }
};

function weatherType(code) {
	if (code === 0) return weatherTypes.clear;
	if (code <= 3) return weatherTypes.cloudy;
	if (code <= 48) return weatherTypes.fog;
	if (code <= 67 || (code >= 80 && code <= 82)) return weatherTypes.rain;
	if (code <= 77 || (code >= 85 && code <= 86)) return weatherTypes.snow;
	return weatherTypes.storm;
}

function setWeatherState(message, showRetry) {
	weatherMessage.textContent = message;
	weatherRetry.hidden = !showRetry;
}

function renderForecast(daily) {
	forecastGrid.replaceChildren();
	daily.time.forEach((date, index) => {
		const condition = weatherType(daily.weather_code[index]);
		const day = document.createElement('div');
		day.className = 'forecast-day';
		day.innerHTML = `
			<span class="forecast-name">${index === 0 ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</span>
			<span class="forecast-icon" aria-label="${condition.label}" role="img">${condition.icon}</span>
			<span class="forecast-temperatures"><strong class="forecast-high">${Math.round(daily.temperature_2m_max[index])}°</strong><span class="forecast-low">${Math.round(daily.temperature_2m_min[index])}°</span></span>`;
		forecastGrid.appendChild(day);
	});
}

function loadWeather() {
	weatherIcon.textContent = '◌';
	weatherTemperature.textContent = '--°';
	weatherCondition.textContent = 'Finding the forecast';
	forecastGrid.replaceChildren();
	setWeatherState('Allow location access to see your local weather.', false);

	if (!navigator.geolocation) {
		weatherCondition.textContent = 'Unavailable';
		setWeatherState('Your browser does not support location services.', true);
		return;
	}

	navigator.geolocation.getCurrentPosition(async ({ coords }) => {
		try {
			const params = new URLSearchParams({
				latitude: coords.latitude,
				longitude: coords.longitude,
				current: 'temperature_2m,weather_code',
				daily: 'weather_code,temperature_2m_max,temperature_2m_min',
				temperature_unit: 'fahrenheit',
				forecast_days: '5',
				timezone: 'auto'
			});
			const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
			if (!response.ok) throw new Error('Weather request failed');
			const data = await response.json();
			const current = data.current;
			const condition = weatherType(current.weather_code);
			weatherIcon.textContent = condition.icon;
			weatherTemperature.textContent = `${Math.round(current.temperature_2m)}°F`;
			weatherCondition.textContent = condition.label;
			renderForecast(data.daily);
			setWeatherState('Current conditions near you', false);
		} catch (error) {
			weatherCondition.textContent = 'Unavailable';
			setWeatherState('The forecast could not be loaded right now.', true);
		}
	}, () => {
		weatherCondition.textContent = 'Location needed';
		setWeatherState('Enable location to see your weather.', true);
	});
}

weatherRetry.addEventListener('click', loadWeather);
loadWeather();
