export const getWeatherVisualState = (weatherData) => {
  if (!weatherData) return { condition: 'UNKNOWN', label: 'Unknown', icon: '☁️', effectType: 'none', backgroundType: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200' };

  // Use the main weather condition or description from OpenWeather
  // weatherData structure comes from our backend normalized format
  const condition = weatherData.condition?.toLowerCase() || '';
  const description = weatherData.description?.toLowerCase() || '';
  
  if (condition.includes('clear')) {
    return {
      condition: 'SUNNY',
      label: 'Clear',
      icon: '☀️',
      effectType: 'sunny',
      backgroundType: 'bg-gradient-to-br from-blue-400 to-blue-200 text-white'
    };
  }
  
  if (condition.includes('cloud')) {
    if (description.includes('few') || description.includes('scattered') || description.includes('partly')) {
      return {
        condition: 'PARTLY_CLOUDY',
        label: 'Partly Cloudy',
        icon: '⛅',
        effectType: 'partly-cloudy',
        backgroundType: 'bg-gradient-to-br from-blue-300 to-gray-200 text-gray-800'
      };
    }
    return {
      condition: 'OVERCAST',
      label: 'Cloudy',
      icon: '☁️',
      effectType: 'cloudy',
      backgroundType: 'bg-gradient-to-br from-gray-400 to-gray-300 text-gray-800'
    };
  }

  if (condition.includes('rain')) {
    if (description.includes('heavy')) {
      return {
        condition: 'HEAVY_RAIN',
        label: 'Heavy Rain',
        icon: '🌧️',
        effectType: 'heavy-rain',
        backgroundType: 'bg-gradient-to-br from-gray-700 to-gray-500 text-white'
      };
    }
    return {
      condition: 'RAIN',
      label: 'Rain',
      icon: '🌧️',
      effectType: 'rain',
      backgroundType: 'bg-gradient-to-br from-gray-600 to-gray-400 text-white'
    };
  }

  if (condition.includes('drizzle')) {
    return {
      condition: 'DRIZZLE',
      label: 'Light Rain',
      icon: '🌦️',
      effectType: 'drizzle',
      backgroundType: 'bg-gradient-to-br from-gray-400 to-gray-300 text-gray-800'
    };
  }

  if (condition.includes('thunderstorm')) {
    return {
      condition: 'THUNDERSTORM',
      label: 'Thunderstorm',
      icon: '⛈️',
      effectType: 'thunderstorm',
      backgroundType: 'bg-gradient-to-br from-gray-800 to-gray-600 text-white'
    };
  }

  if (condition.includes('snow')) {
    return {
      condition: 'SNOW',
      label: 'Snow',
      icon: '❄️',
      effectType: 'snow',
      backgroundType: 'bg-gradient-to-br from-blue-100 to-white text-gray-800'
    };
  }

  if (condition.includes('mist') || condition.includes('fog')) {
    return {
      condition: 'FOG',
      label: 'Fog',
      icon: '🌫️',
      effectType: 'fog',
      backgroundType: 'bg-gradient-to-br from-gray-300 to-gray-200 text-gray-700'
    };
  }

  if (condition.includes('haze')) {
    return {
      condition: 'HAZE',
      label: 'Haze',
      icon: '🌁',
      effectType: 'haze',
      backgroundType: 'bg-gradient-to-br from-orange-200 to-gray-300 text-gray-800'
    };
  }

  // Default fallback
  return {
    condition: 'UNKNOWN',
    label: weatherData.condition || 'Unknown',
    icon: '🌥️',
    effectType: 'none',
    backgroundType: 'bg-gradient-to-br from-blue-100 to-gray-100 text-gray-800'
  };
};
