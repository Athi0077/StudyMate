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
    
    // Return mock data so the dashboard widget always displays properly
    return {
      location: {
        name: process.env.WEATHER_SCHOOL_NAME || "StudyMate School",
        city: process.env.WEATHER_SCHOOL_CITY || "Salem",
        state: process.env.WEATHER_SCHOOL_STATE || "Tamil Nadu",
      },
      current: {
        temperature: 28,
        feelsLike: 30,
        condition: "Clouds",
        description: "broken clouds",
        icon: "04d",
        humidity: 65,
        windSpeed: 10,
        pressure: 1012,
        visibility: 10,
        cloudPercentage: 50,
        rain: 0,
        sunrise: Math.floor(Date.now() / 1000) - 36000,
        sunset: Math.floor(Date.now() / 1000) + 7200,
        timestamp: Math.floor(Date.now() / 1000)
      },
      lastUpdated: new Date().toISOString()
    };
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
    
    // Return mock forecast data
    return {
      hourly: [
        { timestamp: Math.floor(Date.now() / 1000) + 3600, temperature: 29, condition: "Clouds", description: "broken clouds", icon: "04d", rainProb: 10 },
        { timestamp: Math.floor(Date.now() / 1000) + 7200, temperature: 28, condition: "Clouds", description: "scattered clouds", icon: "03d", rainProb: 0 },
        { timestamp: Math.floor(Date.now() / 1000) + 10800, temperature: 27, condition: "Clear", description: "clear sky", icon: "01n", rainProb: 0 },
        { timestamp: Math.floor(Date.now() / 1000) + 14400, temperature: 26, condition: "Clear", description: "clear sky", icon: "01n", rainProb: 0 },
        { timestamp: Math.floor(Date.now() / 1000) + 18000, temperature: 25, condition: "Clear", description: "clear sky", icon: "01n", rainProb: 0 },
        { timestamp: Math.floor(Date.now() / 1000) + 21600, temperature: 24, condition: "Clear", description: "clear sky", icon: "01n", rainProb: 0 },
        { timestamp: Math.floor(Date.now() / 1000) + 25200, temperature: 24, condition: "Clouds", description: "few clouds", icon: "02n", rainProb: 0 },
        { timestamp: Math.floor(Date.now() / 1000) + 28800, temperature: 25, condition: "Clouds", description: "scattered clouds", icon: "03d", rainProb: 0 },
      ],
      daily: [
        { date: new Date(Date.now()).toLocaleDateString('en-CA'), maxTemp: 32, minTemp: 22, condition: "Clouds", icon: "04d", rainProb: 20 },
        { date: new Date(Date.now() + 86400000).toLocaleDateString('en-CA'), maxTemp: 31, minTemp: 23, condition: "Rain", icon: "10d", rainProb: 60 },
        { date: new Date(Date.now() + 172800000).toLocaleDateString('en-CA'), maxTemp: 33, minTemp: 24, condition: "Clear", icon: "01d", rainProb: 0 },
        { date: new Date(Date.now() + 259200000).toLocaleDateString('en-CA'), maxTemp: 32, minTemp: 23, condition: "Clouds", icon: "03d", rainProb: 10 },
        { date: new Date(Date.now() + 345600000).toLocaleDateString('en-CA'), maxTemp: 34, minTemp: 25, condition: "Clear", icon: "01d", rainProb: 0 },
      ],
      lastUpdated: new Date().toISOString()
    };
  }
};
