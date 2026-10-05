import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { Bus, Clock, Navigation2, ArrowLeft, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

const ParentTransportTracking = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchSession();

    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to tracking socket');
    });

    socket.on('transport:bus:location', (data) => {
      if (data.busId === busId) {
        setSession((prev) => {
          if (!prev) {
            fetchSession(); // Fetch full session if we just received an update
            return prev;
          }
          const updated = {
            ...prev,
            lastLatitude: data.latitude,
            lastLongitude: data.longitude,
            lastSpeed: data.speed,
            lastHeading: data.heading,
            lastUpdatedAt: data.timestamp
          };
          if (mapRef.current && data.latitude && data.longitude) {
            mapRef.current.flyTo([data.latitude, data.longitude]);
          }
          return updated;
        });
      }
    });

    socket.on('transport:tracking:stop', (data) => {
      if (data.busId === busId) {
        toast('Bus has finished its trip.', { icon: '🏁' });
        setSession(null);
        setError('Bus is no longer being tracked.');
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [busId]);

  const fetchSession = async () => {
    try {
      const res = await transportService.getSessionForBus(busId);
      if (res.data.session) {
        setSession(res.data.session);
        setError('');
        
        // Fetch stops
        if (res.data.session.route?._id) {
          transportService.getRoute(res.data.session.route._id)
            .then(routeRes => {
              setStops(routeRes.data.stops || []);
            })
            .catch(() => {});
        }
      } else {
        setError('Bus is not currently being tracked.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You are not authorized to view this bus.');
      } else {
        setError('Bus is not currently being tracked.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (lastUpdatedAt) => {
    if (!lastUpdatedAt) return { label: 'Unknown', color: 'text-gray-500' };
    const diff = (new Date() - new Date(lastUpdatedAt)) / 1000;
    if (diff < 30) return { label: 'Live', color: 'text-emerald-500' };
    if (diff < 120) return { label: 'Delayed', color: 'text-amber-500' };
    return { label: 'Offline', color: 'text-rose-500' };
  };

  // Distance calculator (Haversine)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateNextStop = () => {
    if (!session?.lastLatitude || !session?.lastLongitude || stops.length === 0) return null;
    
    // Find closest stop that has coordinates
    let closestStop = null;
    let minDistance = Infinity;

    for (const stop of stops) {
      if (stop.latitude && stop.longitude) {
        const dist = getDistance(session.lastLatitude, session.lastLongitude, stop.latitude, stop.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestStop = stop;
        }
      }
    }
    
    if (!closestStop) return null;

    let etaText = 'ETA unavailable';
    if (session.lastSpeed > 0 && minDistance !== Infinity) {
      const timeHours = minDistance / session.lastSpeed;
      const timeMins = Math.round(timeHours * 60);
      etaText = timeMins < 1 ? 'Less than a minute' : `${timeMins} minutes`;
    }

    return { stop: closestStop, distance: minDistance, etaText };
  };

  const nextStopInfo = calculateNextStop();
  const center = session?.lastLatitude ? [session.lastLatitude, session.lastLongitude] : [13.0827, 80.2707];

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading live tracking...</div>
        ) : error || !session ? (
          <div className="bg-white dark:bg-[#0F172A] p-12 rounded-3xl border border-gray-100 dark:border-[#1E293B] text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Tracking Unavailable</h3>
            <p className="text-gray-500 mt-2">{error}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-100 dark:border-[#1E293B] overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-[#1E293B] flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Navigation2 className="text-blue-600" /> Track School Bus
                </h2>
                <div className="flex gap-4 mt-2">
                  <p className="text-sm text-gray-500 font-bold">Bus: <span className="text-gray-800 dark:text-gray-200">{session.bus?.busNumber}</span></p>
                  <p className="text-sm text-gray-500 font-bold">Route: <span className="text-gray-800 dark:text-gray-200">{session.route?.routeNumber}</span></p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 text-center min-w-[120px]">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${getStatus(session.lastUpdatedAt).color.replace('text-', 'bg-')}`}></span>
                  <p className={`font-black ${getStatus(session.lastUpdatedAt).color}`}>
                    {getStatus(session.lastUpdatedAt).label}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Speed</p>
                <p className="font-bold text-gray-800 dark:text-white">{session.lastSpeed?.toFixed(1) || 0} km/h</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Next Stop</p>
                <p className="font-bold text-gray-800 dark:text-white truncate" title={nextStopInfo?.stop?.name || 'Unavailable'}>
                  {nextStopInfo?.stop?.name || 'Unavailable'}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">ETA</p>
                <p className="font-bold text-gray-800 dark:text-white truncate">
                  {nextStopInfo?.etaText || '-'}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Updated</p>
                <p className="font-bold text-gray-800 dark:text-white flex justify-center items-center gap-1 text-sm">
                  <Clock className="w-3 h-3 text-blue-500" /> {session.lastUpdatedAt ? new Date(session.lastUpdatedAt).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="h-[450px] relative z-0">
              {session.lastLatitude && session.lastLongitude ? (
                <MapContainer 
                  center={center} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[session.lastLatitude, session.lastLongitude]} icon={busIcon}>
                    <Popup>Your Child's Bus</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                  <p className="text-gray-500 font-bold">Waiting for GPS location...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ParentTransportTracking;
