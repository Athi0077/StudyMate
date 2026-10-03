import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { getWeatherVisualState } from '../utils/weatherUtils';
import { MapPin, Wind, Droplets, Eye, Gauge, CloudRain, Sunrise, Sunset, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../components/layout/Layout';

const WeatherPage = () => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchWeatherData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [currentRes, forecastRes] = await Promise.all([
        api.get('/weather/current'),
        api.get('/weather/forecast')
      ]);
      setCurrentWeather(currentRes.data.data);
      setForecast(forecastRes.data.data);
      setError(false);
      if (isRefresh) toast.success('Weather updated');
    } catch (err) {
      setError(true);
      if (isRefresh) toast.error('Failed to update weather');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(() => {
      fetchWeatherData();
    }, 15 * 60 * 1000); // refresh every 15 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10 mb-4" />
          <p className="text-gray-500 font-medium">Fetching school weather data...</p>
        </div>
      </Layout>
    );
  }

  if (error || !currentWeather || !forecast) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center flex flex-col items-center max-w-2xl mx-auto mt-10">
            <CloudRain className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Weather Unavailable</h2>
            <p className="text-gray-500 mb-6">Weather information for the school is temporarily unavailable. Please try again later.</p>
            <button onClick={() => fetchWeatherData(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const { current, location } = currentWeather;
  const visualState = getWeatherVisualState(current);

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString([], { weekday: 'long' });
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Weather</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} /> {location.name}, {location.city}
            </p>
          </div>
          <button 
            onClick={() => fetchWeatherData(true)} 
            disabled={refreshing}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition dark:hover:bg-gray-800 disabled:opacity-50"
            title="Refresh Weather"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Main Hero Card */}
        <div className={`relative rounded-3xl overflow-hidden shadow-lg p-6 md:p-10 ${visualState.backgroundType} transition-colors duration-500`}>
          {/* We reuse the CSS animations if they are global, otherwise just a static nice background is here based on visualState.backgroundType */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-6xl md:text-8xl drop-shadow-md">{visualState.icon}</span>
                <div>
                  <div className="text-5xl md:text-7xl font-bold tracking-tighter drop-shadow-sm">
                    {current.temperature}°
                  </div>
                  <div className="text-xl md:text-2xl font-medium opacity-90 capitalize mt-1">
                    {current.description}
                  </div>
                </div>
              </div>
              <p className="text-sm md:text-base opacity-80 mt-2 font-medium">Feels like {current.feelsLike}°C</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 bg-black/10 dark:bg-white/10 p-5 rounded-2xl backdrop-blur-sm flex-1 max-w-sm w-full">
              <div className="flex items-center gap-3">
                <Droplets className="opacity-70 w-6 h-6" />
                <div>
                  <p className="text-xs uppercase font-semibold opacity-70">Humidity</p>
                  <p className="text-lg font-bold">{current.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="opacity-70 w-6 h-6" />
                <div>
                  <p className="text-xs uppercase font-semibold opacity-70">Wind</p>
                  <p className="text-lg font-bold">{current.windSpeed} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Gauge className="opacity-70 w-6 h-6" />
                <div>
                  <p className="text-xs uppercase font-semibold opacity-70">Pressure</p>
                  <p className="text-lg font-bold">{current.pressure} hPa</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Eye className="opacity-70 w-6 h-6" />
                <div>
                  <p className="text-xs uppercase font-semibold opacity-70">Visibility</p>
                  <p className="text-lg font-bold">{current.visibility ? `${current.visibility} km` : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 flex gap-6 text-sm font-medium border-t border-white/20 pt-4">
            <div className="flex items-center gap-2"><Sunrise size={18} className="opacity-80"/> Sunrise: {formatTime(current.sunrise)}</div>
            <div className="flex items-center gap-2"><Sunset size={18} className="opacity-80"/> Sunset: {formatTime(current.sunset)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Hourly Forecast */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Today's Forecast</h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-2">
                {forecast.hourly.map((hour, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl w-24 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{formatTime(hour.timestamp)}</span>
                    <span className="text-3xl my-2">
                      {getWeatherVisualState(hour).icon}
                    </span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">{hour.temperature}°</span>
                    {hour.rainProb > 0 && (
                      <span className="text-[10px] font-bold text-blue-500 mt-2 flex items-center gap-1">
                        <Droplets size={10} /> {hour.rainProb}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">5-Day Forecast</h3>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {forecast.daily.map((day, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-200 w-24">
                      {formatDate(day.date)}
                    </span>
                    <div className="flex items-center gap-3 w-32">
                      <span className="text-2xl">{getWeatherVisualState(day).icon}</span>
                      {day.rainProb > 0 && (
                        <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                          <Droplets size={12} /> {day.rainProb}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-sm font-bold text-right w-20">
                      <span className="text-gray-800 dark:text-white">{day.maxTemp}°</span>
                      <span className="text-gray-400 dark:text-gray-500">{day.minTemp}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default WeatherPage;
