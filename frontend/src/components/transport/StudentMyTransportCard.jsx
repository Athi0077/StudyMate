import React, { useState, useEffect } from 'react';
import { Bus, MapPin } from 'lucide-react';
import transportService from '../../services/transportService';

const StudentMyTransportCard = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransport();
  }, []);

  const fetchTransport = async () => {
    try {
      setLoading(true);
      const res = await transportService.getMyTransport();
      setAssignment(res.data.assignment);
    } catch (err) {
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-white p-6 rounded-3xl shadow-soft animate-pulse h-48"></div>;
  }

  if (!assignment) {
    return null; // Don't show the card if no transport is assigned
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-soft">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-600" /> My School Transport
        </h3>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
          🟢 Active
        </span>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex justify-between items-center border-b border-blue-100 pb-2 mb-2">
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase">Bus</p>
              <p className="font-bold text-blue-900">{assignment.bus?.busNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-blue-500 uppercase">Route</p>
              <p className="font-bold text-blue-900">{assignment.route?.routeNumber}</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-1">
            <div className="flex gap-3">
              <div className="mt-1 text-emerald-500"><MapPin size={16} /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Pickup</p>
                <p className="text-sm font-bold text-gray-800">{assignment.pickupStop?.name}</p>
                <p className="text-xs font-semibold text-emerald-600">{assignment.pickupStop?.pickupTime}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 text-rose-500"><MapPin size={16} /></div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Drop</p>
                <p className="text-sm font-bold text-gray-800">{assignment.dropStop?.name}</p>
                <p className="text-xs font-semibold text-rose-600">{assignment.dropStop?.dropTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMyTransportCard;
