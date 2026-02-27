import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [manualLocation, setManualLocation] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const data = await getLocal([
      "weatherApiKey",
      "weatherLocation",
      "manualLocation",
    ]);
    if (data.weatherApiKey) {
      setApiKey(data.weatherApiKey);
    }
    if (data.weatherLocation) {
      setLocation(data.weatherLocation);
    }
    if (data.manualLocation) {
      setManualLocation(data.manualLocation);
    }
  }

  async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Get location name from coordinates
            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
            );
            const data = await response.json();
            const locationName = data[0]
              ? `${data[0].name}, ${data[0].country}`
              : "Unknown";

            const newLocation = {
              lat: latitude,
              lon: longitude,
              name: locationName,
            };
            setLocation(newLocation);
            await setLocal({ weatherLocation: newLocation });
            resolve(newLocation);
          } catch (error) {
            reject(error);
          }
        },
        (error) => reject(error),
        { timeout: 10000 }
      );
    });
  }

  async function fetchWeather() {
    if (!apiKey) {
      setError("Please set your OpenWeatherMap API key in settings");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let currentLocation = location;

      if (!currentLocation) {
        if (manualLocation.trim()) {
          // Use manual location
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
              manualLocation
            )}&limit=1&appid=${apiKey}`
          );
          const data = await response.json();
          if (data.length === 0) {
            throw new Error("Location not found");
          }
          currentLocation = {
            lat: data[0].lat,
            lon: data[0].lon,
            name: data[0].name,
          };
        } else {
          // Get current location
          currentLocation = await getCurrentLocation();
        }
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${currentLocation.lat}&lon=${currentLocation.lon}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error("Weather API error");
      }

      const data = await response.json();
      setWeather(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    await setLocal({
      weatherApiKey: apiKey,
      manualLocation: manualLocation,
    });
    setShowSettings(false);
    if (apiKey) {
      fetchWeather();
    }
  }

  function getWeatherIcon(condition) {
    const iconMap = {
      "01d": "☀️",
      "01n": "🌙",
      "02d": "⛅",
      "02n": "☁️",
      "03d": "☁️",
      "03n": "☁️",
      "04d": "☁️",
      "04n": "☁️",
      "09d": "🌧️",
      "09n": "🌧️",
      "10d": "🌦️",
      "10n": "🌧️",
      "11d": "⛈️",
      "11n": "⛈️",
      "13d": "❄️",
      "13n": "❄️",
      "50d": "🌫️",
      "50n": "🌫️",
    };
    return iconMap[condition] || "🌤️";
  }

  if (!apiKey) {
    return (
      <div className="fixed top-4 right-4 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 p-4 max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Weather</div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1 transition-colors"
          >
            Setup
          </button>
        </div>
        <div className="text-xs opacity-80">
          Add OpenWeatherMap API key to see weather
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 p-4 max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Weather</div>
          <div className="flex gap-1">
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "↻"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1 transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>

        {error && <div className="text-xs text-red-300 mb-2">{error}</div>}

        {weather ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {getWeatherIcon(weather.weather[0].icon)}
              </span>
              <span className="text-lg font-semibold">
                {Math.round(weather.main.temp)}°C
              </span>
            </div>
            <div className="text-xs opacity-80 mb-1">
              {weather.weather[0].description}
            </div>
            <div className="text-xs opacity-60">
              {location?.name || weather.name}
            </div>
          </div>
        ) : (
          <div className="text-xs opacity-80">
            Click refresh to load weather
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Weather Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  OpenWeatherMap API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Get free key at openweathermap.org"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                />
                <div className="text-xs opacity-60 mt-1">
                  Free tier allows 1000 calls/day
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Manual Location (optional)
                </label>
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="e.g., London, UK"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                />
                <div className="text-xs opacity-60 mt-1">
                  Leave empty to use your current location
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
