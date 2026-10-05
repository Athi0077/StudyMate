import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { Bus, Calendar, MapPin, Search, AlertCircle } from 'lucide-react';

const AttendantDashboard = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedBus, setAssignedBus] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [date]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch assigned bus
      let busId = null;
      try {
        const busRes = await transportService.getMyAssignedBus();
        setAssignedBus(busRes.data.bus);
        busId = busRes.data.bus._id;
      } catch (err) {
        if (err.response?.status === 404) {
          setAssignedBus(null);
        } else {
          throw err;
        }
      }

      // 2. Fetch attendance for that bus
      if (busId) {
        const attRes = await transportService.getBusAttendance(busId, date);
        setAttendanceData(attRes.data.data || []);
      }

      // We might need a generic summary API if needed, or we just calculate from attendanceData locally
      // For attendant, local calculation is fine and reduces API calls
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attendanceData.length > 0) {
      calculateSummary(attendanceData);
    } else {
      setSummary(null);
    }
  }, [attendanceData]);

  const calculateSummary = (data) => {
    const summaryData = {
      totalAssigned: data.length,
      morningBoarded: data.filter(d => d.attendance?.morningBoarding === 'BOARDED').length,
      morningNotBoarded: data.filter(d => d.attendance?.morningBoarding === 'NOT_BOARDED').length,
      morningNotMarked: data.filter(d => !d.attendance?.morningBoarding || d.attendance?.morningBoarding === 'NOT_MARKED').length,
      eveningBoarded: data.filter(d => d.attendance?.eveningBoarding === 'BOARDED').length,
      eveningNotBoarded: data.filter(d => d.attendance?.eveningBoarding === 'NOT_BOARDED').length,
      eveningNotMarked: data.filter(d => !d.attendance?.eveningBoarding || d.attendance?.eveningBoarding === 'NOT_MARKED').length,
    };
    setSummary(summaryData);
  };

  const handleMark = async (studentId, routeId, event, status) => {
    if (!assignedBus) return;
    try {
      const payload = {
        studentId,
        busId: assignedBus._id,
        routeId,
        date,
        event,
        status
      };
      await transportService.markTransportAttendance(payload);
      toast.success(`Marked as ${status}`);
      
      // Refresh only attendance to keep it quick
      const attRes = await transportService.getBusAttendance(assignedBus._id, date);
      setAttendanceData(attRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const StatusButton = ({ currentStatus, targetStatus, label, onClick, time, activeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200' }) => {
    const isActive = currentStatus === targetStatus;
    return (
      <div className="flex flex-col items-center min-w-[70px]">
        <button 
          onClick={onClick}
          className={`w-full px-2 py-2 rounded-lg text-xs font-bold border transition ${
            isActive 
              ? activeColor
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isActive ? `🟢 ${label}` : label}
        </button>
        {isActive && time && (
          <span className="text-[10px] text-gray-500 mt-1 font-medium">{new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendant Dashboard</h2>
          <p className="text-gray-500 dark:text-gray-400">Track student boarding for your assigned bus</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
              <Bus size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500">Your Assigned Bus</p>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {assignedBus ? `${assignedBus.busNumber} (${assignedBus.registrationNumber})` : 'None'}
              </h3>
            </div>
          </div>
          <div className="w-48">
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-gray-50 dark:bg-[#1E293B] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#0F172A] p-12 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center animate-pulse text-gray-500 font-bold">
            Loading dashboard...
          </div>
        ) : !assignedBus ? (
          <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-2xl text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
            <h3 className="text-lg font-bold text-yellow-800">No Bus Assigned</h3>
            <p className="text-yellow-600 text-sm mt-1">You are not currently assigned to any active bus. Please contact the Principal.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Assigned</p>
                  <p className="text-2xl font-black text-blue-600">{summary.totalAssigned}</p>
                </div>
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Morning Boarded</p>
                  <p className="text-2xl font-black text-emerald-600">{summary.morningBoarded}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{summary.morningNotBoarded} Not Boarded | {summary.morningNotMarked} Pending</p>
                </div>
                <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-gray-100 dark:border-[#1E293B] shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-bold">Evening Boarded</p>
                  <p className="text-2xl font-black text-indigo-600">{summary.eveningBoarded}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{summary.eveningNotBoarded} Not Boarded | {summary.eveningNotMarked} Pending</p>
                </div>
              </div>
            )}

            {/* Attendance List */}
            {attendanceData.length === 0 ? (
              <div className="bg-white dark:bg-[#0F172A] p-12 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
                <p className="text-gray-500 font-bold">No students assigned to this bus.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {attendanceData.map(({ assignment, attendance }) => {
                  const student = assignment.student;
                  const routeId = assignment.route._id || assignment.route;
                  const att = attendance || {};
                  
                  return (
                    <div key={student._id} className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-sm flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                          {student.profilePic ? <img src={student.profilePic} className="w-full h-full rounded-full object-cover"/> : student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-900 dark:text-white">{student.name}</p>
                          <p className="text-xs text-gray-500">ID: {student.studentId || 'N/A'}</p>
                          <div className="mt-1 flex gap-2 text-xs">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">P: {assignment.pickupStop?.name}</span>
                            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">D: {assignment.dropStop?.name}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#1E293B]/50 p-3 rounded-xl">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500 text-center mb-1">Morning Pickup</p>
                          <div className="flex gap-1 justify-center">
                            <StatusButton 
                              currentStatus={att.morningBoarding} targetStatus="BOARDED" label="In" time={att.morningBoardingTime}
                              onClick={() => handleMark(student._id, routeId, 'MORNING_BOARDING', 'BOARDED')}
                            />
                            <StatusButton 
                              currentStatus={att.morningBoarding} targetStatus="NOT_BOARDED" label="Absent" time={att.morningBoardingTime}
                              activeColor="bg-rose-100 text-rose-700 border-rose-200"
                              onClick={() => handleMark(student._id, routeId, 'MORNING_BOARDING', 'NOT_BOARDED')}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500 text-center mb-1">School Arrival</p>
                          <div className="flex gap-1 justify-center">
                            <StatusButton 
                              currentStatus={att.schoolArrival} targetStatus="ARRIVED" label="Drop" time={att.schoolArrivalTime}
                              activeColor="bg-blue-100 text-blue-700 border-blue-200"
                              onClick={() => handleMark(student._id, routeId, 'SCHOOL_ARRIVAL', 'ARRIVED')}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500 text-center mb-1">Evening Pickup</p>
                          <div className="flex gap-1 justify-center">
                            <StatusButton 
                              currentStatus={att.eveningBoarding} targetStatus="BOARDED" label="In" time={att.eveningBoardingTime}
                              activeColor="bg-indigo-100 text-indigo-700 border-indigo-200"
                              onClick={() => handleMark(student._id, routeId, 'EVENING_BOARDING', 'BOARDED')}
                            />
                            <StatusButton 
                              currentStatus={att.eveningBoarding} targetStatus="NOT_BOARDED" label="Absent" time={att.eveningBoardingTime}
                              activeColor="bg-rose-100 text-rose-700 border-rose-200"
                              onClick={() => handleMark(student._id, routeId, 'EVENING_BOARDING', 'NOT_BOARDED')}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500 text-center mb-1">Home Drop</p>
                          <div className="flex gap-1 justify-center">
                            <StatusButton 
                              currentStatus={att.homeDrop} targetStatus="DROPPED" label="Drop" time={att.homeDropTime}
                              activeColor="bg-amber-100 text-amber-700 border-amber-200"
                              onClick={() => handleMark(student._id, routeId, 'HOME_DROP', 'DROPPED')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AttendantDashboard;
