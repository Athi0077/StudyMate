import React, { useState, useEffect, useRef, useContext } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { Bus, Clock, MapPin, Activity, Navigation2, Search } from 'lucide-react';
import { io } from 'socket.io-client';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Bus Icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const PrincipalTransportTracking = () => {
  const { currentUser } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState('');
  
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchActiveSessions();
    fetchBuses();

    // Initialize Socket
    const token = localStorage.getItem('token');
    const socketUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');
    const socket = io(socketUrl, {
      auth: { token }
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket for tracking');
    });

    socket.on('transport:bus:location', (data) => {
      setSessions((prevSessions) => {
        const index = prevSessions.findIndex(s => s._id === data.sessionId);
        if (index > -1) {
          const newSessions = [...prevSessions];
          newSessions[index] = {
            ...newSessions[index],
            lastLatitude: data.latitude,
            lastLongitude: data.longitude,
            lastSpeed: data.speed,
            lastHeading: data.heading,
            lastUpdatedAt: data.timestamp
          };
          return newSessions;
        } else {
          // If we receive location for a session we don't have, maybe fetch it
          fetchActiveSessions();
          return prevSessions;
        }
      });
    });

    socket.on('transport:tracking:stop', (data) => {
      setSessions((prev) => prev.filter(s => s._id !== data.sessionId));
      toast(`${data.busNumber || 'A bus'} finished its trip`, { icon: '🏁' });
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const res = await transportService.getActiveSessions();
      setSessions(res.data.sessions);
    } catch (error) {
      toast.error('Failed to load active tracking sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await transportService.getBuses();
      setBuses(res.data.buses);
    } catch (err) {}
  };

  // Center map on Chennai or the first active session
  const defaultCenter = [13.0827, 80.2707];
  const center = sessions.length > 0 && sessions[0].lastLatitude 
    ? [sessions[0].lastLatitude, sessions[0].lastLongitude] 
    : defaultCenter;

  const getStatus = (lastUpdatedAt) => {
    if (!lastUpdatedAt) return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    const diff = (new Date() - new Date(lastUpdatedAt)) / 1000;
    if (diff < 30) return { label: '🟢 Live', color: 'bg-emerald-100 text-emerald-700' };
    if (diff < 120) return { label: '🟡 Delayed', color: 'bg-amber-100 text-amber-700' };
    return { label: '🔴 Offline', color: 'bg-rose-100 text-rose-700' };
  };

  const filteredSessions = selectedRoute 
    ? sessions.filter(s => s.route?._id === selectedRoute || s.route?.routeNumber === selectedRoute)
    : sessions;

  const uniqueRoutes = [...new Set(sessions.map(s => s.route?.routeNumber).filter(Boolean))];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Navigation2 className="text-blue-600" /> Live Bus Tracking
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Monitor active school buses in real-time</p>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Active Buses</p>
              <p className="text-2xl font-black text-blue-600">{sessions.length}</p>
            </div>
            <div className="border-l border-gray-200 dark:border-gray-700 pl-6">
              <p className="text-xs text-gray-500 uppercase font-bold">Total Fleet</p>
              <p className="text-2xl font-black text-gray-700 dark:text-gray-300">{buses.length}</p>
            </div>
          </div>
          <div className="w-full md:w-64">
            <select 
              value={selectedRoute}
              onChange={e => setSelectedRoute(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Routes</option>
              {uniqueRoutes.map(r => (
                <option key={r} value={r}>Route {r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Map Area */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm overflow-hidden h-full flex flex-col relative z-0">
            <MapContainer 
              center={center} 
              zoom={12} 
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {filteredSessions.map(session => {
                if (!session.lastLatitude || !session.lastLongitude) return null;
                return (
                  <Marker 
                    key={session._id} 
                    position={[session.lastLatitude, session.lastLongitude]}
                    icon={busIcon}
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="font-bold text-gray-800 text-sm">{session.bus?.busNumber}</p>
                        <p className="text-xs text-gray-500 mb-2">Route {session.route?.routeNumber}</p>
                        <p className="text-xs font-semibold">Speed: {session.lastSpeed?.toFixed(1) || 0} km/h</p>
                        <p className="text-[10px] text-gray-400 mt-1">Updated: {new Date(session.lastUpdatedAt).toLocaleTimeString()}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Sidebar Area */}
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-gray-100 dark:border-[#1E293B] shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-[#1E293B]">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Active Sessions
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {loading ? (
                <div className="p-4 text-center text-gray-400 animate-pulse">Loading sessions...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="p-6 text-center">
                  <Bus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No active tracking sessions</p>
                </div>
              ) : (
                filteredSessions.map(session => {
                  const status = getStatus(session.lastUpdatedAt);
                  return (
                    <div key={session._id} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-black text-gray-900 dark:text-white text-lg">{session.bus?.busNumber}</p>
                          <p className="text-xs font-bold text-blue-600">Route {session.route?.routeNumber}</p>
                        </div>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Speed</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">{session.lastSpeed?.toFixed(1) || 0} km/h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold">Driver</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-300">{session.driver?.name || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {session.lastUpdatedAt ? new Date(session.lastUpdatedAt).toLocaleTimeString() : 'N/A'}</span>
                        <button 
                          onClick={() => {
                            if (session.lastLatitude && session.lastLongitude && mapRef.current) {
                              mapRef.current.flyTo([session.lastLatitude, session.lastLongitude], 15);
                            }
                          }}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Locate
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalTransportTracking;
