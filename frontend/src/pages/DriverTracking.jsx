import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { Bus, Navigation, Play, Square, AlertCircle, SignalHigh, SignalLow, MapPin } from 'lucide-react';

const DriverTracking = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [routes, setRoutes] = useState([]);
  
  const [session, setSession] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await transportService.getBuses();
      setBuses(res.data.buses.filter(b => b.status === 'ACTIVE'));
    } catch (err) {}
  };

  const fetchRoutes = async () => {
    try {
      const res = await transportService.getRoutes();
      setRoutes(res.data.routes.filter(r => r.status === 'ACTIVE'));
    } catch (err) {}
  };

  const startTracking = async () => {
    if (!selectedBus || !selectedRoute) {
      toast.error('Please select Bus and Route');
      return;
    }
    
    // Check GPS permission first
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    try {
      const res = await transportService.startTracking({ busId: selectedBus, routeId: selectedRoute });
      setSession(res.data.session);
      setIsTracking(true);
      toast.success('Trip started successfully!');
      
      // Start GPS Watch
      startGpsWatch(res.data.sessionId, selectedBus);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start trip');
    }
  };

  const startGpsWatch = (sessionId, busId) => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocationError('');
        const { latitude, longitude, speed, heading, accuracy } = position.coords;
        setCurrentLocation({ latitude, longitude, speed: speed || 0, accuracy });

        // Throttle updates to every 5 seconds
        const now = Date.now();
        if (now - lastUpdateRef.current > 5000) {
          lastUpdateRef.current = now;
          transportService.updateLocation({
            sessionId,
            busId,
            latitude,
            longitude,
            speed: (speed || 0) * 3.6, // Convert m/s to km/h
            heading: heading || 0,
            accuracy
          }).catch(err => console.error("Location update failed:", err));
        }
      },
      (error) => {
        setLocationError(error.message);
        toast.error(`GPS Error: ${error.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const stopTracking = async () => {
    if (!session) return;
    try {
      await transportService.stopTracking({ sessionId: session._id });
      setIsTracking(false);
      setSession(null);
      setCurrentLocation(null);
      toast.success('Trip stopped successfully!');
      
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to stop trip');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Bus className="text-blue-600" /> Driver App
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Start trip to share live location</p>
        </div>

        {locationError && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl flex items-start gap-3 border border-rose-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold">{locationError}</p>
          </div>
        )}

        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
          {isTracking ? (
            <div className="space-y-6 text-center">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 animate-pulse">
                <Navigation className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-emerald-600">Live Tracking Active</h3>
                <p className="text-gray-500 text-sm font-bold mt-1">Your location is being shared securely.</p>
              </div>

              {currentLocation && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Speed</p>
                    <p className="font-bold text-gray-800 dark:text-white">{(currentLocation.speed * 3.6).toFixed(1)} km/h</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">GPS Accuracy</p>
                    <p className="font-bold text-gray-800 dark:text-white flex items-center justify-center gap-1">
                      {currentLocation.accuracy < 20 ? <SignalHigh className="w-4 h-4 text-emerald-500"/> : <SignalLow className="w-4 h-4 text-amber-500"/>}
                      {currentLocation.accuracy.toFixed(0)}m
                    </p>
                  </div>
                </div>
              )}

              <button 
                onClick={stopTracking}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-rose-600/30"
              >
                <Square className="w-5 h-5 fill-current" /> Stop Trip
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Bus</label>
                <select 
                  value={selectedBus} 
                  onChange={e => setSelectedBus(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Choose Bus --</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>{b.busNumber} ({b.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Route</label>
                <select 
                  value={selectedRoute} 
                  onChange={e => setSelectedRoute(e.target.value)}
                  className="w-full p-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map(r => (
                    <option key={r._id || r.id} value={r._id || r.id}>{r.routeNumber} - {r.name}</option>
                  ))}
                </select>
              </div>

              <button 
                onClick={startTracking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 mt-6"
              >
                <Play className="w-5 h-5 fill-current" /> Start Trip
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DriverTracking;
