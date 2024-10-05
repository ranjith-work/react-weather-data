import React, { useEffect, useState } from "react";
import {
	Wind,
	Humidity,
	Location,
	Clear,
	Clouds,
	Rain,
	Drizzle,
	Thunderstorm,
	Snow,
	Mist,
	Squall,
	Tornado,
	Hurricane,
	Smoke,
	Others,
	Left,
	Right,
	Celsius,
	Fahrenheit,
} from "./icons";
import Tooltip from "./Tooltip"; // Import Tooltip component
import "./WeatherWidget.css";

const WeatherWidget = ({
	apiKey,
	city: defaultCity,
	units,
	color,
	enableForecast,
	autoUpdateWeather = 600000,
}) => {
	const weatherIcons = {
		Clear: Clear,
		Clouds: Clouds,
		Rain: Rain,
		Drizzle: Drizzle,
		Thunderstorm: Thunderstorm,
		Snow: Snow,
		Mist: Mist,
		Smoke: Smoke,
		Squall: Squall,
		Tornado: Tornado,
		Hurricane: Hurricane,
		Others: Others,
	};

	const [weatherData, setWeatherData] = useState(null);
	const [forecastData, setForecastData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [showArrows, setShowArrows] = useState(false);

	const [tooltipText, setTooltipText] = useState("");
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
	const [isTooltipVisible, setIsTooltipVisible] = useState(false);

	const [city, setCity] = useState(defaultCity);
	const [cityId, setCityId] = useState("4350049");

	const [hasLocation, setHasLocation] = useState(false);
	const [unit, setUnit] = useState(units);

	// Fetch weather based on the current city or coordinates
	const fetchWeather = async (latitude = null, longitude = null) => {
		setLoading(true);
		try {
			let weatherUrl;
			if (latitude && longitude) {
				weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`;
			} else {
				weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
			}

			const response = await fetch(weatherUrl);
			if (!response.ok) {
				throw new Error("Failed to fetch current weather data");
			}
			const currentData = await response.json();
			setCityId(currentData.id);
			setWeatherData(currentData);

			const forecastResponse = await fetch(
				`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`
			);
			if (!forecastResponse.ok) {
				throw new Error("Failed to fetch forecast data");
			}
			const forecastData = await forecastResponse.json();

			const today = new Date().getDate();
			const dailyForecast = [];
			let dayCount = 0;

			forecastData.list.forEach((item) => {
				const forecastDate = new Date(item.dt_txt).getDate();
				if (
					forecastDate !== today &&
					!dailyForecast.some(
						(f) => new Date(f.dt_txt).getDate() === forecastDate
					)
				) {
					dailyForecast.push(item);
					dayCount++;
				}
				if (dayCount === 3) return;
			});

			setForecastData(dailyForecast);
		} catch (error) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	// Fetch weather on component mount or when city is updated
	useEffect(() => {
		fetchWeather();
	}, [city, units, apiKey]);

	// Function to fetch user's current location and update the city
	const handleGetLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;
					// Reverse geocoding to get city name
					const locationResponse = await fetch(
						`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
					);
					const locationData = await locationResponse.json();
					setCity(locationData.name); // Set the city based on the current location
					fetchWeather(latitude, longitude); // Fetch weather using coordinates
					setHasLocation(true);
				},
				(error) => {
					console.error("Error getting location", error);
					alert("Unable to retrieve your location.");
				}
			);
		} else {
			alert("Geolocation is not supported by this browser.");
		}
	};

	// Auto update weather
	useEffect(() => {
		fetchWeather();

		const intervalId = setInterval(() => {
			fetchWeather();
		}, autoUpdateWeather);

		return () => clearInterval(intervalId);
	}, [city, unit, apiKey]);

	const handleUnitToggle = () => {
		setUnit((prevUnit) => (prevUnit === "metric" ? "imperial" : "metric"));
	};

	const handleMouseMove = (event) => {
		const tooltipWidth = 100;
		const tooltipHeight = 30;
		const positionX = event.clientX + 10;
		const positionY = event.clientY + 10;

		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		const adjustedX =
			positionX + tooltipWidth > windowWidth
				? windowWidth - tooltipWidth - 10
				: positionX;
		const adjustedY =
			positionY + tooltipHeight > windowHeight
				? windowHeight - tooltipHeight - 10
				: positionY;

		setTooltipPosition({
			x: adjustedX,
			y: adjustedY,
		});
	};

	const handleMouseEnter = (event) => {
		const tooltipValue = event.currentTarget.getAttribute("data-rwd-tooltip");
		handleMouseMove(event);
		setTooltipText(tooltipValue);
		setIsTooltipVisible(true);
	};

	const handleMouseLeave = () => {
		setIsTooltipVisible(false);
	};

	const toggleSlide = () => {
		if (!enableForecast) return;
		setCurrentSlide((prevSlide) => (prevSlide === 0 ? 1 : 0));
	};

	if (loading) {
		return (
			<div className="demo">
				<div className="rwd-container">Loading weather data...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="demo">
				<div className="rwd-container rwd-error">Error: {error}</div>
			</div>
		);
	}

	if (!weatherData) {
		return (
			<div className="demo">
				<div className="rwd-container rwd-no-data">
					No weather data available
				</div>
			</div>
		);
	}

	const currentWeatherCondition = weatherData.weather[0].main;
	const CurrentWeatherIcon =
		weatherIcons[currentWeatherCondition] || weatherIcons.Others;
	const { main, weather, wind } = weatherData;

	const capitalizeDescription = (description) => {
		return description
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	};

	return (
		<div className="demo">
			{isTooltipVisible && (
				<Tooltip text={tooltipText} position={tooltipPosition} />
			)}
			<div
				className="rwd-container"
				onMouseEnter={() => enableForecast && setShowArrows(true)}
				onMouseLeave={() => enableForecast && setShowArrows(false)}>
				{enableForecast && showArrows && (
					<>
						<span className="left-arrow" onClick={() => toggleSlide()}>
							<Left />
						</span>
						<span className="right-arrow" onClick={() => toggleSlide()}>
							<Right />
						</span>
					</>
				)}

				<div
					className={`rwd-slide-content ${
						currentSlide === 0 ? "slide-current" : "slide-forecast"
					}`}>
					{currentSlide === 0 ? (
						<div className="rwd-current">
							<div
								className="rwd-current-icon"
								data-rwd-tooltip={capitalizeDescription(weather[0].description)}
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}>
								<CurrentWeatherIcon color={color} />
							</div>
							<div className="rwd-current-data">
								<div className="rwd-city">
									<div>{city}</div>
									<div style={{ cursor: "pointer" }}>
										<span
											onClick={handleGetLocation}
											aria-label="Get current location">
											<Location color={hasLocation ? "green" : "red"} />
										</span>
										<span onClick={handleUnitToggle} aria-label="Convert unit">
											{unit === "metric" ? <Fahrenheit /> : <Celsius />}
										</span>
									</div>
								</div>
								<div className="rwd-temp">
									{main.temp} {unit === "imperial" ? "°F" : "°C"}
								</div>
								<div className="rwd-measures">
									<span
										data-rwd-tooltip={`Humidity: ${main.humidity}%`}
										onMouseEnter={handleMouseEnter}
										onMouseLeave={handleMouseLeave}>
										<Humidity color={color} /> {main.humidity}%
									</span>

									<span
										data-rwd-tooltip={`Wind: ${wind.speed} ${
											unit === "imperial" ? "mph" : "m/s"
										}`}
										onMouseEnter={handleMouseEnter}
										onMouseLeave={handleMouseLeave}>
										<Wind color={color} /> {wind.speed}{" "}
										{unit === "imperial" ? "mph" : "m/s"}
									</span>
								</div>
								<div className="rwd-owm-link">
									<a
										href={`https://openweathermap.org/city/${cityId}`}
										target="blank">
										More on Open Weather Map
									</a>
								</div>
							</div>
						</div>
					) : enableForecast ? (
						<div className="rwd-forecast">
							<div
								key={4}
								className="rwd-forecast-item"
								data-rwd-tooltip={capitalizeDescription(weather[0].description)}
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}>
								<div className="rwd-forecast-item-date">Today</div>
								<div className="rwd-forecast-item-icon">
									<CurrentWeatherIcon color={color} />
								</div>
								<div className="rwd-forecast-item-temp">
									{Math.round(main.temp)}
									{unit === "imperial" ? "°F" : "°C"}
								</div>
							</div>
							{forecastData.slice(0, 3).map((day, index) => {
								const forecastCondition = day.weather[0].main;
								const ForecastWeatherIcon =
									weatherIcons[forecastCondition] || weatherIcons.Others;
								return (
									<div
										key={index}
										className="rwd-forecast-item"
										data-rwd-tooltip={capitalizeDescription(
											day.weather[0].description
										)}
										onMouseEnter={handleMouseEnter}
										onMouseLeave={handleMouseLeave}>
										<div className="rwd-forecast-item-date">
											{new Date(day.dt_txt).toLocaleDateString("en-US", {
												weekday: "short",
											})}
										</div>
										<div className="rwd-forecast-item-icon">
											<ForecastWeatherIcon color={color} />
										</div>
										<div className="rwd-forecast-item-temp">
											{Math.round(day.main.temp)}
											{unit === "imperial" ? "°F" : "°C"}
										</div>
									</div>
								);
							})}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

export default WeatherWidget;
