import React, { useState, useEffect } from 'react';
import { Bus, Map, MapPin, X, AlertCircle } from 'lucide-react';
import transportService from '../../services/transportService';
import toast from 'react-hot-toast';

const StudentTransportDetails = ({ studentId, studentName }) => {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [history, setHistory] = useState([]);
  
  // Data lists
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    bus: '',
    route: '',
    pickupStop: '',
    dropStop: ''
  });

  useEffect(() => {
    fetchAssignment();
  }, [studentId]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const [transRes, histRes] = await Promise.all([
        transportService.getStudentTransport(studentId).catch(err => {
          if (err.response?.status !== 404) throw err;
          return { data: { assignment: null } };
        }),
        transportService.getStudentHistory(studentId).catch(() => ({ data: { history: [] } }))
      ]);
      setAssignment(transRes.data.assignment);
      setHistory(histRes.data.history);
    } catch (err) {
      toast.error('Failed to load transport details');
      setAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setFormData({
      bus: assignment ? assignment.bus?._id : '',
      route: assignment ? assignment.route?._id : '',
      pickupStop: assignment ? assignment.pickupStop?._id : '',
      dropStop: assignment ? assignment.dropStop?._id : ''
    });
    setStep(1);
    setIsModalOpen(true);
    fetchBuses();
  };

  const fetchBuses = async () => {
    try {
      const res = await transportService.getBuses();
      setBuses(res.data.buses.filter(b => b.status === 'ACTIVE'));
    } catch (err) {
      toast.error('Failed to load buses');
    }
  };

  const fetchRoutes = async (busId) => {
    try {
      const res = await transportService.getRoutes();
      const allRoutes = res.data.routes.filter(r => r.status === 'ACTIVE');
      // If the selected bus has a fixed route, we'd filter it here.
      // Assuming buses can be assigned to any route for flexibility unless fixed.
      const busObj = buses.find(b => b._id === busId);
      if (busObj && busObj.route) {
        setRoutes(allRoutes.filter(r => r.id === busObj.route));
      } else {
        setRoutes(allRoutes);
      }
    } catch (err) {
      toast.error('Failed to load routes');
    }
  };

  const fetchStops = async (routeId) => {
    try {
      const res = await transportService.getBusStops();
      setStops(res.data.stops.filter(s => s.route?._id === routeId || s.route === routeId));
    } catch (err) {
      toast.error('Failed to load stops');
    }
  };

  // When bus changes
  useEffect(() => {
    if (formData.bus) {
      fetchRoutes(formData.bus);
    }
  }, [formData.bus]);

  // When route changes
  useEffect(() => {
    if (formData.route) {
      fetchStops(formData.route);
    }
  }, [formData.route]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        student: studentId,
        bus: formData.bus,
        route: formData.route,
        pickupStop: formData.pickupStop,
        dropStop: formData.dropStop
      };
      
      if (assignment) {
        await transportService.updateStudentTransport(studentId, payload);
        toast.success('Transport updated successfully');
      } else {
        await transportService.assignTransport(payload);
        toast.success('Transport assigned successfully');
      }
      setIsModalOpen(false);
      fetchAssignment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transport assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove Transport Assignment?\n\nThis will remove the student's active bus assignment.\n\n[Cancel] [Remove Assignment]")) return;
    try {
      await transportService.removeStudentTransport(studentId);
      toast.success('Assignment removed');
      fetchAssignment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove assignment');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading transport details...</div>;
  }

  const selectedBus = buses.find(b => b._id === formData.bus);
  const selectedRoute = routes.find(r => r.id === formData.route || r._id === formData.route);
  const selectedPickup = stops.find(s => s._id === formData.pickupStop);
  const selectedDrop = stops.find(s => s._id === formData.dropStop);

  return (
    <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-600" /> Transport Details
        </h3>
        {assignment && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            🟢 Active
          </span>
        )}
      </div>

      {!assignment ? (
        <div className="text-center py-10 space-y-4">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Bus className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-200">No transport assigned</h4>
            <p className="text-sm text-gray-500 mt-1">This student is not currently assigned to any school bus.</p>
          </div>
          <button 
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition"
          >
            Assign Bus
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-[#172235] p-5 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase">Assigned Bus</p>
              <p className="text-lg font-black text-gray-900 dark:text-slate-100">{assignment.bus?.busNumber}</p>
              <p className="text-xs text-gray-500">{assignment.bus?.registrationNumber}</p>
            </div>
            <div className="bg-gray-50 dark:bg-[#172235] p-5 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase">Route</p>
              <p className="text-lg font-black text-blue-600">{assignment.route?.routeNumber} - {assignment.route?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0b1120] p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 shadow-sm flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-lg text-emerald-600 mt-1">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Pickup Stop</p>
                <p className="text-base font-bold text-gray-900 dark:text-slate-100">{assignment.pickupStop?.name}</p>
                <p className="text-lg font-black text-emerald-600">{assignment.pickupStop?.pickupTime}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0b1120] p-5 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm flex items-start gap-4">
              <div className="bg-rose-100 dark:bg-rose-900/40 p-2 rounded-lg text-rose-600 mt-1">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Drop Stop</p>
                <p className="text-base font-bold text-gray-900 dark:text-slate-100">{assignment.dropStop?.name}</p>
                <p className="text-lg font-black text-rose-600">{assignment.dropStop?.dropTime}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-[#1E293B]">
            <button 
              onClick={openModal}
              className="px-5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 font-bold rounded-xl transition"
            >
              Update Assignment
            </button>
            <button 
              onClick={handleRemove}
              className="px-5 py-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-xl transition"
            >
              Remove Transport
            </button>
          </div>
        </div>
      )}

      {/* Attendance History */}
      {assignment && (
        <div className="mt-8 border-t border-gray-100 dark:border-[#1E293B] pt-6">
          <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 uppercase">Attendance History</h4>
          {history.length === 0 ? (
            <p className="text-xs text-gray-500">No attendance records found.</p>
          ) : (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-100 dark:border-[#1E293B] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-[#172235] text-gray-500 dark:text-gray-400 font-bold uppercase">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Morning</th>
                    <th className="p-3 text-center">Arrival</th>
                    <th className="p-3 text-center">Evening</th>
                    <th className="p-3 text-center">Drop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                  {history.map((record) => (
                    <tr key={record._id} className="text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#172235]/50">
                      <td className="p-3">{record.date}</td>
                      <td className="p-3 text-center">
                        {record.morningBoarding === 'BOARDED' ? <span className="text-emerald-600">Boarded</span> : record.morningBoarding === 'NOT_BOARDED' ? <span className="text-rose-600">Not Boarded</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        {record.schoolArrival === 'ARRIVED' ? <span className="text-blue-600">Arrived</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        {record.eveningBoarding === 'BOARDED' ? <span className="text-indigo-600">Boarded</span> : record.eveningBoarding === 'NOT_BOARDED' ? <span className="text-rose-600">Not Boarded</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="p-3 text-center">
                        {record.homeDrop === 'DROPPED' ? <span className="text-amber-600">Dropped</span> : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-[#1E293B]">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {assignment ? 'Update Transport Assignment' : 'Assign Bus'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Student</label>
                    <input type="text" disabled value={studentName} className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Bus *</label>
                    <select 
                      value={formData.bus} 
                      onChange={e => { setFormData({ ...formData, bus: e.target.value, route: '', pickupStop: '', dropStop: '' }); }}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Choose Bus --</option>
                      {buses.map(b => (
                        <option key={b._id} value={b._id}>{b.busNumber} ({b.registrationNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Select Route *</label>
                    <select 
                      disabled={!formData.bus}
                      value={formData.route} 
                      onChange={e => { setFormData({ ...formData, route: e.target.value, pickupStop: '', dropStop: '' }); }}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="">-- Choose Route --</option>
                      {routes.map(r => (
                        <option key={r.id || r._id} value={r.id || r._id}>{r.routeNumber} - {r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      disabled={!formData.bus || !formData.route}
                      onClick={() => setStep(2)}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      Next: Select Stops
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <button onClick={() => setStep(1)} className="text-sm font-bold text-blue-600 mb-2 block">&larr; Back to Route</button>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Pickup Stop *</label>
                    <select 
                      value={formData.pickupStop} 
                      onChange={e => setFormData({ ...formData, pickupStop: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Choose Pickup --</option>
                      {stops.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    {selectedPickup && (
                      <p className="text-sm text-emerald-600 font-bold mt-1">Pickup Time: {selectedPickup.pickupTime}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Drop Stop *</label>
                    <select 
                      value={formData.dropStop} 
                      onChange={e => setFormData({ ...formData, dropStop: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Choose Drop --</option>
                      {stops.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    {selectedDrop && (
                      <p className="text-sm text-rose-600 font-bold mt-1">Drop Time: {selectedDrop.dropTime}</p>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button 
                      disabled={!formData.pickupStop || !formData.dropStop}
                      onClick={() => setStep(3)}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      Review Assignment
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Confirm Assignment
                    </h4>
                    <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                      <div className="flex justify-between border-b border-blue-200/50 pb-2">
                        <span className="font-semibold">Student:</span> <span>{studentName}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-200/50 py-2">
                        <span className="font-semibold">Bus:</span> <span>{selectedBus?.busNumber}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-200/50 py-2">
                        <span className="font-semibold">Route:</span> <span>{selectedRoute?.routeNumber}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-200/50 py-2">
                        <span className="font-semibold">Pickup:</span> <span>{selectedPickup?.name} ({selectedPickup?.pickupTime})</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="font-semibold">Drop:</span> <span>{selectedDrop?.name} ({selectedDrop?.dropTime})</span>
                      </div>
                    </div>
                  </div>

                  {assignment && (
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold border border-amber-200">
                      Warning: This will overwrite the current active assignment for this student.
                    </div>
                  )}

                  <div className="pt-4 flex justify-between">
                    <button onClick={() => setStep(2)} className="text-gray-500 font-bold hover:text-gray-700">
                      Back
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Saving...' : 'Confirm Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTransportDetails;
