import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import transportService from '../services/transportService';
import toast from 'react-hot-toast';
import { Bus, Calendar, MapPin, Search } from 'lucide-react';

const PrincipalTransportAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [date]);

  const fetchInitialData = async () => {
    try {
      const [busRes, routeRes, summaryRes] = await Promise.all([
        transportService.getBuses(),
        transportService.getRoutes(),
        transportService.getAttendanceSummary(date)
      ]);
      setBuses(busRes.data.buses.filter(b => b.status === 'ACTIVE'));
      setRoutes(routeRes.data.routes.filter(r => r.status === 'ACTIVE'));
      setSummary(summaryRes.data.summary);
    } catch (err) {
      toast.error('Failed to load initial data');
    }
  };

  useEffect(() => {
    if (selectedBus) {
      fetchBusAttendance();
    } else {
      setAttendanceData([]);
    }
  }, [selectedBus, date]);

  const fetchBusAttendance = async () => {
    setLoading(true);
    try {
      const res = await transportService.getBusAttendance(selectedBus, date);
      setAttendanceData(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (studentId, routeId, event, status) => {
    try {
      const payload = {
        studentId,
        busId: selectedBus,
        routeId,
        date,
        event,
        status
      };
      await transportService.markTransportAttendance(payload);
      toast.success(`Marked as ${status}`);
      fetchBusAttendance();
      
      // Update summary
      const summaryRes = await transportService.getAttendanceSummary(date);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  // Filter routes based on selected bus (if bus has fixed route, else show all related routes from assignments or just show all for manual filter)
  // For simplicity, we just filter the students table by route if a route is selected
  const filteredData = selectedRoute 
    ? attendanceData.filter(d => d.assignment.route?._id === selectedRoute)
    : attendanceData;

  const StatusButton = ({ currentStatus, targetStatus, label, onClick, time, activeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200' }) => {
    const isActive = currentStatus === targetStatus;
    return (
      <div className="flex flex-col items-center">
        <button 
          onClick={onClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bus Boarding Attendance</h2>
          <p className="text-gray-500 dark:text-gray-400">Track student transport attendance</p>
        </div>

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

        {/* Selectors */}
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-[#1E293B] shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-auto flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-gray-50 dark:bg-[#1E293B] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-auto flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Bus</label>
            <select 
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-gray-50 dark:bg-[#1E293B] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Bus --</option>
              {buses.map(b => (
                <option key={b._id} value={b._id}>{b.busNumber} ({b.registrationNumber})</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-auto flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filter by Route (Optional)</label>
            <select 
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              disabled={!selectedBus}
              className="w-full p-2.5 border border-gray-200 dark:border-[#334155] rounded-xl bg-gray-50 dark:bg-[#1E293B] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">-- All Routes --</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.routeNumber} - {r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        {!selectedBus ? (
          <div className="bg-white dark:bg-[#0F172A] p-12 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <Bus className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Select a Bus</h3>
            <p className="text-gray-500 text-sm mt-1">Please select a bus to view and mark attendance.</p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Loading students...</div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white dark:bg-[#0F172A] p-12 rounded-2xl border border-gray-100 dark:border-[#1E293B] text-center">
            <p className="text-gray-500 font-bold">No students assigned to this bus/route.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-[#1E293B] overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-gray-300 uppercase text-xs font-bold border-b border-gray-100 dark:border-[#1E293B]">
                <tr>
                  <th className="p-4 rounded-tl-2xl">Student</th>
                  <th className="p-4">Stops</th>
                  <th className="p-4 text-center">Morning Boarding</th>
                  <th className="p-4 text-center">School Arrival</th>
                  <th className="p-4 text-center">Evening Boarding</th>
                  <th className="p-4 text-center rounded-tr-2xl">Home Drop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                {filteredData.map(({ assignment, attendance }) => {
                  const student = assignment.student;
                  const routeId = assignment.route._id || assignment.route;
                  const att = attendance || {};
                  
                  return (
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-[#172235]/50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {student.profilePic ? <img src={student.profilePic} className="w-full h-full rounded-full object-cover"/> : student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{student.name}</p>
                            <p className="text-[10px] text-gray-500">ID: {student.studentId || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="font-bold text-emerald-600">P: {assignment.pickupStop?.name}</p>
                        <p className="font-bold text-rose-600 mt-1">D: {assignment.dropStop?.name}</p>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <StatusButton 
                            currentStatus={att.morningBoarding} targetStatus="BOARDED" label="Boarded" time={att.morningBoardingTime}
                            onClick={() => handleMark(student._id, routeId, 'MORNING_BOARDING', 'BOARDED')}
                          />
                          <StatusButton 
                            currentStatus={att.morningBoarding} targetStatus="NOT_BOARDED" label="Not Boarded" time={att.morningBoardingTime}
                            activeColor="bg-rose-100 text-rose-700 border-rose-200"
                            onClick={() => handleMark(student._id, routeId, 'MORNING_BOARDING', 'NOT_BOARDED')}
                          />
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <StatusButton 
                            currentStatus={att.schoolArrival} targetStatus="ARRIVED" label="Arrived" time={att.schoolArrivalTime}
                            activeColor="bg-blue-100 text-blue-700 border-blue-200"
                            onClick={() => handleMark(student._id, routeId, 'SCHOOL_ARRIVAL', 'ARRIVED')}
                          />
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <StatusButton 
                            currentStatus={att.eveningBoarding} targetStatus="BOARDED" label="Boarded" time={att.eveningBoardingTime}
                            activeColor="bg-indigo-100 text-indigo-700 border-indigo-200"
                            onClick={() => handleMark(student._id, routeId, 'EVENING_BOARDING', 'BOARDED')}
                          />
                          <StatusButton 
                            currentStatus={att.eveningBoarding} targetStatus="NOT_BOARDED" label="Not Boarded" time={att.eveningBoardingTime}
                            activeColor="bg-rose-100 text-rose-700 border-rose-200"
                            onClick={() => handleMark(student._id, routeId, 'EVENING_BOARDING', 'NOT_BOARDED')}
                          />
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <StatusButton 
                            currentStatus={att.homeDrop} targetStatus="DROPPED" label="Dropped" time={att.homeDropTime}
                            activeColor="bg-amber-100 text-amber-700 border-amber-200"
                            onClick={() => handleMark(student._id, routeId, 'HOME_DROP', 'DROPPED')}
                          />
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrincipalTransportAttendance;
