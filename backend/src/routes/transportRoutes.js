const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const transportController = require("../controllers/transportController");
const studentTransportController = require("../controllers/studentTransportController");
const transportAttendanceController = require("../controllers/transportAttendanceController");
const transportTrackingController = require("../controllers/transportTrackingController");

router.get("/debug-indexes", async (req, res) => {
  const User = require("../models/User");
  const Attendant = require("../models/Attendant");
  const Driver = require("../models/Driver");
  const userIndexes = await User.collection.indexes();
  const attendantIndexes = await Attendant.collection.indexes();
  const driverIndexes = await Driver.collection.indexes();
  res.json({ userIndexes, attendantIndexes, driverIndexes });
});

router.use(protect);

// Routes for students and parents
router.get("/my-transport", requireRole("student"), studentTransportController.getMyTransport);
router.get("/my-transport-attendance", requireRole("student"), transportAttendanceController.getTodayStudentAttendance);
router.get("/my-transport-attendance/:studentId", requireRole("student", "parent", "parents"), transportAttendanceController.getTodayStudentAttendance);
router.get("/parent-transport", requireRole("parent", "parents"), studentTransportController.getParentChildrenTransport);

// Add student history route that parents and students can access (with checks inside)
router.get("/student-assignments/:studentId/history", transportAttendanceController.getStudentHistory);

// Tracking views for Parents/Students
router.get("/tracking/bus/:busId", transportTrackingController.getSessionForBus);

// My Assigned Bus for Driver and Attendant
router.get("/my-bus", requireRole("driver", "attendant"), transportController.getMyAssignedBus);

// Driver routes (assuming drivers have role 'driver', or we can allow principal for testing)
// We use a middleware to check if user is driver or principal
const requireDriverOrPrincipal = requireRole("driver", "principal");

router.post("/tracking/start", requireDriverOrPrincipal, transportTrackingController.startTrip);
router.post("/tracking/stop", requireDriverOrPrincipal, transportTrackingController.stopTrip);
router.post("/tracking/location", requireDriverOrPrincipal, transportTrackingController.updateLocation);

// Staff Routes (Driver / Attendant)
router.get("/routes", requireRole("principal", "driver", "attendant"), transportController.getRoutes);

// Attendance (Principal & Attendant)
router.post("/attendance", requireRole("principal", "attendant"), transportAttendanceController.markAttendance);
router.get("/attendance/bus", requireRole("principal", "attendant"), transportAttendanceController.getBusAttendance);

// Restrict all below to principal
router.use(requireRole("principal"));

// Drivers
router.post("/drivers", transportController.createDriver);
router.get("/drivers", transportController.getDrivers);
router.get("/drivers/:id", transportController.getDriver);
router.put("/drivers/:id", transportController.updateDriver);
router.delete("/drivers/:id", transportController.deleteDriver);

// Attendants
router.post("/attendants", transportController.createAttendant);
router.get("/attendants", transportController.getAttendants);
router.delete("/attendants/:id", transportController.deleteAttendant);

// Buses
router.post("/buses", transportController.createBus);
router.get("/buses", transportController.getBuses);
router.get("/buses/:id", transportController.getBus);
router.put("/buses/:id", transportController.updateBus);
router.delete("/buses/:id", transportController.deleteBus);

// Routes
router.post("/routes", transportController.createRoute);
router.get("/routes/:id", transportController.getRoute);
router.put("/routes/:id", transportController.updateRoute);
router.delete("/routes/:id", transportController.deleteRoute);

// Bus Stops
router.post("/stops", transportController.createBusStop);
router.get("/stops", transportController.getBusStops);
router.get("/stops/:id", transportController.getBusStop);
router.put("/stops/:id", transportController.updateBusStop);
router.delete("/stops/:id", transportController.deleteBusStop);

// Student Assignments
router.post("/student-assignments", studentTransportController.assignTransport);
router.get("/student-assignments", studentTransportController.getAllAssignments);
router.get("/student-assignments/summary", studentTransportController.getTransportSummary);
router.get("/student-assignments/:studentId", studentTransportController.getStudentTransport);
router.put("/student-assignments/:studentId", studentTransportController.updateStudentTransport);
router.delete("/student-assignments/:studentId", studentTransportController.removeStudentTransport);

// Transport Attendance (Principal)
router.get("/attendance/summary", transportAttendanceController.getSummary);
router.get("/attendance/bus-summary", transportAttendanceController.getBusWiseSummary);

// Principal Tracking Dashboard
router.get("/tracking/sessions", transportTrackingController.getActiveSessions);

module.exports = router;
