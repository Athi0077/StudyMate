import React, { useState, useEffect } from 'react';
import { Bus, MapPin, User, Phone } from 'lucide-react';
import transportService from '../../services/transportService';

const ParentMyTransportCard = ({ childId, childName }) => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        setLoading(true);
        const res = await transportService.getParentTransport();
        const myChildTransport = res.data.assignments.find(a => 
          a.student === childId || 
          (a.student && a.student._id === childId)
        );
        setAssignment(myChildTransport);
      } catch (err) {
        setAssignment(null);
      } finally {
        setLoading(false);
      }
    };
    
    if (childId) {
      fetchTransport();
    }
  }, [childId]);

  if (loading) {
    return <div className="p-4 bg-gray-50 rounded-xl border animate-pulse h-40"></div>;
  }

  if (!assignment) {
    return null;
  }

  return (
    <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-600" /> School Transport ({childName})
        </h3>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
          🟢 Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-start gap-3 border-b border-gray-100 dark:border-slate-700 pb-3 mb-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Bus</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">{assignment.bus?.busNumber}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase">Route</p>
              <p className="font-bold text-blue-600">{assignment.route?.routeNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><User className="w-3 h-3" /> Driver</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{assignment.bus?.driver?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{assignment.bus?.driver?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex gap-3">
            <div className="mt-1 text-emerald-500"><MapPin size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Pickup Stop</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{assignment.pickupStop?.name}</p>
              <p className="text-xs font-semibold text-emerald-600">{assignment.pickupStop?.pickupTime}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 text-rose-500"><MapPin size={16} /></div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">Drop Stop</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{assignment.dropStop?.name}</p>
              <p className="text-xs font-semibold text-rose-600">{assignment.dropStop?.dropTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentMyTransportCard;
