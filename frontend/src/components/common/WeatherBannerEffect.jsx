import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { getWeatherVisualState } from '../../utils/weatherUtils';

const WeatherBannerEffect = () => {
  const [effectType, setEffectType] = useState(null);
  const [weatherIcon, setWeatherIcon] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await api.get('/weather/current');
        if (res.data.success && res.data.data) {
          const visualState = getWeatherVisualState(res.data.data.current);
          setEffectType(visualState.effectType);
          setWeatherIcon(visualState.icon);
        }
      } catch (err) {
        // Silently fail for banner effect
      }
    };
    fetchWeather();
  }, []);

  if (!effectType || effectType === 'none') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] z-0 transition-opacity duration-1000">
      
      {/* Background Atmosphere Layer */}
      <div className="absolute inset-0 bg-white/5 dark:bg-black/5" />

      {/* Floating Weather Icon */}
      {weatherIcon && (
        <div className="animate-float-icon drop-shadow-md">
          {weatherIcon}
        </div>
      )}

      {/* Sun Glow */}
      {effectType === 'sunny' && (
        <div className="weather-sunny-glow"></div>
      )}
      
      {/* Clouds Layer */}
      {(effectType === 'cloudy' || effectType === 'partly-cloudy' || effectType === 'rain' || effectType === 'heavy-rain' || effectType === 'thunderstorm') && (
        <div className="weather-effect-container">
          <div className="weather-cloud" style={{ top: '-10%', width: '400px', height: '150px', animationDuration: '60s', opacity: 0.4 }}></div>
          <div className="weather-cloud" style={{ top: '30%', width: '300px', height: '100px', animationDuration: '45s', animationDelay: '-10s', opacity: 0.25 }}></div>
          <div className="weather-cloud" style={{ top: '60%', width: '500px', height: '180px', animationDuration: '70s', animationDelay: '-30s', opacity: 0.35 }}></div>
        </div>
      )}

      {/* Dense Clouds for Overcast/Heavy Rain/Thunderstorm */}
      {(effectType === 'overcast' || effectType === 'heavy-rain' || effectType === 'thunderstorm') && (
        <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/20 mix-blend-multiply"></div>
      )}

      {/* Rain Layer */}
      {(effectType === 'rain' || effectType === 'drizzle' || effectType === 'heavy-rain' || effectType === 'thunderstorm') && (
        <div className="weather-effect-container opacity-40">
          <div className="weather-rain-layer"></div>
          {effectType !== 'drizzle' && <div className="weather-rain-layer-2"></div>}
        </div>
      )}

      {/* Thunderstorm Flash */}
      {effectType === 'thunderstorm' && (
        <div className="weather-effect-container">
          <div className="weather-lightning"></div>
        </div>
      )}

      {/* Snow Layer */}
      {effectType === 'snow' && (
        <div className="weather-effect-container opacity-50">
          <div className="weather-snow-layer"></div>
        </div>
      )}

      {/* Fog/Mist Layer */}
      {(effectType === 'fog' || effectType === 'mist') && (
        <div className="weather-effect-container">
          <div className="weather-fog-layer"></div>
        </div>
      )}
    </div>
  );
};

export default WeatherBannerEffect;
