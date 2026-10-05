import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import transportService from '../../services/transportService';

const StudentMyTransportCard = () => {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransport();
  }, []);

  const fetchTransport = async () => {
    try {
      setLoading(true);
      const [assignRes, attRes] = await Promise.all([
        transportService.getMyTransport(),
        transportService.getTodayStudentAttendance().catch(() => ({ data: { attendance: null } }))
      ]);
      setAssignment(assignRes.data.assignment);
      setAttendance(attRes.data.attendance);
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
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/student/transport/tracking/${assignment.bus?._id || assignment.bus}`)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-full flex items-center gap-1 transition"
          >
            <Navigation2 className="w-3 h-3" /> Track Bus
          </button>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
            🟢 Active
          </span>
        </div>
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

        {/* Today's Attendance Section */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-center border-b border-gray-200 pb-2">Today's Transport Status</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Morning Boarding</p>
              {attendance?.morningBoarding === 'BOARDED' ? (
                <div><span className="text-xs font-bold text-emerald-600">🟢 Boarded</span><br/><span className="text-[9px] text-gray-400">{new Date(attendance.morningBoardingTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              ) : attendance?.morningBoarding === 'NOT_BOARDED' ? (
                <span className="text-xs font-bold text-rose-600">🔴 Not Boarded</span>
              ) : (
                <span className="text-xs font-bold text-gray-400">🟡 Not Marked</span>
              )}
            </div>
            
            <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">School Arrival</p>
              {attendance?.schoolArrival === 'ARRIVED' ? (
                <div><span className="text-xs font-bold text-emerald-600">🟢 Arrived</span><br/><span className="text-[9px] text-gray-400">{new Date(attendance.schoolArrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              ) : (
                <span className="text-xs font-bold text-gray-400">🟡 Not Marked</span>
              )}
            </div>

            <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Evening Boarding</p>
              {attendance?.eveningBoarding === 'BOARDED' ? (
                <div><span className="text-xs font-bold text-emerald-600">🟢 Boarded</span><br/><span className="text-[9px] text-gray-400">{new Date(attendance.eveningBoardingTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              ) : attendance?.eveningBoarding === 'NOT_BOARDED' ? (
                <span className="text-xs font-bold text-rose-600">🔴 Not Boarded</span>
              ) : (
                <span className="text-xs font-bold text-gray-400">🟡 Not Marked</span>
              )}
            </div>

            <div className="text-center p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Home Drop</p>
              {attendance?.homeDrop === 'DROPPED' ? (
                <div><span className="text-xs font-bold text-emerald-600">🟢 Dropped</span><br/><span className="text-[9px] text-gray-400">{new Date(attendance.homeDropTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              ) : (
                <span className="text-xs font-bold text-gray-400">🟡 Not Marked</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentMyTransportCard;
