import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { getWeatherVisualState } from '../../utils/weatherUtils';
import { CloudRain, Wind, Droplets, MapPin, Loader2, ArrowRight } from 'lucide-react';


const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await api.get('/weather/current');
        setWeather(res.data.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 h-48 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 h-48 flex flex-col items-center justify-center text-center">
        <CloudRain className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 font-medium">Weather information is temporarily unavailable.</p>
      </div>
    );
  }

  const visualState = getWeatherVisualState(weather.current);
  const { current, location } = weather;

  return (
    <div className={`relative rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col justify-between h-48 transition-colors ${visualState.backgroundType}`}>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-1.5 opacity-90 mb-1">
            <MapPin size={14} />
            <span className="text-xs font-semibold tracking-wide uppercase">{location.name}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {current.temperature}°C
          </div>
          <div className="text-sm font-medium opacity-90 capitalize">
            {current.description}
          </div>
        </div>
        <div className="text-4xl drop-shadow-md">
          {visualState.icon}
        </div>
      </div>

      <div className="relative z-10 mt-auto pt-4 flex justify-between items-end border-t border-white/20">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[10px] uppercase opacity-80 font-semibold mb-0.5"><Droplets size={12}/> Humidity</span>
            <span className="text-sm font-bold">{current.humidity}%</span>
          </div>
          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[10px] uppercase opacity-80 font-semibold mb-0.5"><Wind size={12}/> Wind</span>
            <span className="text-sm font-bold">{current.windSpeed} km/h</span>
          </div>
        </div>
        
        <Link to="/weather" className="flex items-center gap-1 text-xs font-bold hover:underline opacity-90 transition hover:opacity-100">
          View <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default WeatherWidget;
