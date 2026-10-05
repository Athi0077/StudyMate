import api from '../utils/api';

const transportService = {
  // Drivers
  getDrivers: () => api.get('/transport/drivers'),
  getDriver: (id) => api.get(`/transport/drivers/${id}`),
  createDriver: (data) => api.post('/transport/drivers', data),
  updateDriver: (id, data) => api.put(`/transport/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/transport/drivers/${id}`),

  // Attendants
  getAttendants: () => api.get('/transport/attendants'),
  createAttendant: (data) => api.post('/transport/attendants', data),
  deleteAttendant: (id) => api.delete(`/transport/attendants/${id}`),

  // Buses
  getBuses: () => api.get('/transport/buses'),
  getBus: (id) => api.get(`/transport/buses/${id}`),
  createBus: (data) => api.post('/transport/buses', data),
  updateBus: (id, data) => api.put(`/transport/buses/${id}`, data),
  deleteBus: (id) => api.delete(`/transport/buses/${id}`),
  getMyAssignedBus: () => api.get('/transport/my-bus'),

  // Routes
  getRoutes: () => api.get('/transport/routes'),
  getRoute: (id) => api.get(`/transport/routes/${id}`),
  createRoute: (data) => api.post('/transport/routes', data),
  updateRoute: (id, data) => api.put(`/transport/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/transport/routes/${id}`),

  // Bus Stops
  getBusStops: () => api.get('/transport/stops'),
  getBusStop: (id) => api.get(`/transport/stops/${id}`),
  createBusStop: (data) => api.post('/transport/stops', data),
  updateBusStop: (id, data) => api.put(`/transport/stops/${id}`, data),
  deleteBusStop: (id) => api.delete(`/transport/stops/${id}`),

  // Student Transport Assignments
  getAllAssignments: () => api.get('/transport/student-assignments'),
  getStudentTransport: (studentId) => api.get(`/transport/student-assignments/${studentId}`),
  assignTransport: (data) => api.post('/transport/student-assignments', data),
  updateStudentTransport: (studentId, data) => api.put(`/transport/student-assignments/${studentId}`, data),
  removeStudentTransport: (studentId) => api.delete(`/transport/student-assignments/${studentId}`),
  getTransportSummary: () => api.get('/transport/student-assignments/summary'),

  // Transport Attendance
  markTransportAttendance: (data) => api.post('/transport/attendance', data),
  getBusAttendance: (busId, date) => api.get(`/transport/attendance/bus?busId=${busId}&date=${date}`),
  getAttendanceSummary: (date) => api.get(`/transport/attendance/summary?date=${date}`),
  getBusWiseSummary: (date) => api.get(`/transport/attendance/bus-summary?date=${date}`),
  getStudentHistory: (studentId) => api.get(`/transport/student-assignments/${studentId}/history`),
  getTodayStudentAttendance: (studentId) => api.get(`/transport/my-transport-attendance${studentId ? `/${studentId}` : ''}`),
  
  // Tracking
  startTracking: (data) => api.post('/transport/tracking/start', data),
  stopTracking: (data) => api.post('/transport/tracking/stop', data),
  updateLocation: (data) => api.post('/transport/tracking/location', data),
  getActiveSessions: () => api.get('/transport/tracking/sessions'),
  getSessionForBus: (busId) => api.get(`/transport/tracking/bus/${busId}`),

  // Views for Student & Parent
  getMyTransport: () => api.get('/transport/my-transport'),
  getParentTransport: () => api.get('/transport/parent-transport')
};

export default transportService;
