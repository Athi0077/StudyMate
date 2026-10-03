// In-memory cache
const cache = {
  current: {
    data: null,
    timestamp: null
  },
  forecast: {
    data: null,
    timestamp: null
  }
};

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes cache

const getConfig = () => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const lat = process.env.WEATHER_SCHOOL_LATITUDE || '11.6643';
  const lon = process.env.WEATHER_SCHOOL_LONGITUDE || '78.1460';
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('OpenWeather API Key not configured');
  }

  return { apiKey, lat, lon };
};

exports.getCurrentWeather = async () => {
  try {
    const now = Date.now();
    
    // Return cached data if valid
    if (cache.current.data && cache.current.timestamp && (now - cache.current.timestamp < CACHE_DURATION_MS)) {
      return cache.current.data;
    }

    const { apiKey, lat, lon } = getConfig();
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch weather data');
    }

    const normalized = {
      location: {
        name: process.env.WEATHER_SCHOOL_NAME || "StudyMate School",
        city: process.env.WEATHER_SCHOOL_CITY || "Salem",
        state: process.env.WEATHER_SCHOOL_STATE || "Tamil Nadu",
      },
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // convert m/s to km/h
        pressure: data.main.pressure,
        visibility: data.visibility ? data.visibility / 1000 : null, // in km
        cloudPercentage: data.clouds?.all || 0,
        rain: data.rain ? data.rain['1h'] || 0 : 0,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        timestamp: data.dt
      },
      lastUpdated: new Date().toISOString()
    };

    // Update Cache
    cache.current.data = normalized;
    cache.current.timestamp = now;

    return normalized;
  } catch (error) {
    console.error('Weather Service Error (Current):', error.message);
    if (cache.current.data) return cache.current.data; // Stale data fallback
    throw new Error('Weather information is temporarily unavailable.');
  }
};

exports.getForecast = async () => {
  try {
    const now = Date.now();
    
    // Return cached data if valid
    if (cache.forecast.data && cache.forecast.timestamp && (now - cache.forecast.timestamp < CACHE_DURATION_MS)) {
      return cache.forecast.data;
    }

    const { apiKey, lat, lon } = getConfig();
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch forecast data');
    }

    // Process hourly (next 24 hours approximately = next 8 items since every 3 hours)
    const hourly = data.list.slice(0, 8).map(item => ({
      timestamp: item.dt,
      temperature: Math.round(item.main.temp),
      condition: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      rainProb: item.pop ? Math.round(item.pop * 100) : 0
    }));

    // Process daily (group by day)
    const dailyMap = {};
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          temps: [],
          conditions: [],
          icons: [],
          rainProbs: []
        };
      }
      dailyMap[date].temps.push(item.main.temp);
      dailyMap[date].conditions.push(item.weather[0].main);
      dailyMap[date].icons.push(item.weather[0].icon);
      if (item.pop !== undefined) dailyMap[date].rainProbs.push(item.pop);
    });

    const daily = Object.values(dailyMap).slice(0, 5).map(day => {
      // Find most frequent condition for the day
      const conditionCounts = {};
      day.conditions.forEach(c => conditionCounts[c] = (conditionCounts[c] || 0) + 1);
      let mainCondition = day.conditions[0];
      let maxCount = 0;
      for (const [cond, count] of Object.entries(conditionCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mainCondition = cond;
        }
      }

      // Find corresponding icon (simplified)
      const iconIndex = day.conditions.indexOf(mainCondition);
      const icon = iconIndex !== -1 ? day.icons[iconIndex] : day.icons[0];

      return {
        date: day.date,
        maxTemp: Math.round(Math.max(...day.temps)),
        minTemp: Math.round(Math.min(...day.temps)),
        condition: mainCondition,
        icon,
        rainProb: day.rainProbs.length ? Math.round(Math.max(...day.rainProbs) * 100) : 0
      };
    });

    const normalized = {
      hourly,
      daily,
      lastUpdated: new Date().toISOString()
    };

    cache.forecast.data = normalized;
    cache.forecast.timestamp = now;

    return normalized;
  } catch (error) {
    console.error('Weather Service Error (Forecast):', error.message);
    if (cache.forecast.data) return cache.forecast.data; // Stale data fallback
    throw new Error('Weather forecast information is temporarily unavailable.');
  }
};
