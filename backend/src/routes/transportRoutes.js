const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const transportController = require("../controllers/transportController");
const studentTransportController = require("../controllers/studentTransportController");

router.use(protect);

// Routes for students and parents
router.get("/my-transport", requireRole("student"), studentTransportController.getMyTransport);
router.get("/parent-transport", requireRole("parent", "parents"), studentTransportController.getParentChildrenTransport);

// Restrict all below to principal
router.use(requireRole("principal"));

// Drivers
router.post("/drivers", transportController.createDriver);
router.get("/drivers", transportController.getDrivers);
router.get("/drivers/:id", transportController.getDriver);
router.put("/drivers/:id", transportController.updateDriver);
router.delete("/drivers/:id", transportController.deleteDriver);

// Buses
router.post("/buses", transportController.createBus);
router.get("/buses", transportController.getBuses);
router.get("/buses/:id", transportController.getBus);
router.put("/buses/:id", transportController.updateBus);
router.delete("/buses/:id", transportController.deleteBus);

// Routes
router.post("/routes", transportController.createRoute);
router.get("/routes", transportController.getRoutes);
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

module.exports = router;
