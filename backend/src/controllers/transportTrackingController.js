const BusTrackingSession = require("../models/BusTrackingSession");
const Bus = require("../models/Bus");
const Route = require("../models/Route");
const StudentTransport = require("../models/StudentTransport");
const { getIo } = require("../utils/socket");

// Start tracking session
exports.startTrip = async (req, res) => {
  try {
    const { busId, routeId } = req.body;
    
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });

    // Validate driver assignment to bus (simple check)
    // If the bus has a driver field or we trust the user role 'driver'
    // For now we assume req.user is authorized if they have driver role (or admin)

    // Check if an active session already exists for this bus
    let session = await BusTrackingSession.findOne({ bus: busId, status: "ACTIVE" });
    if (session) {
      return res.status(400).json({ success: false, message: "Tracking session is already active for this bus", sessionId: session._id });
    }

    session = new BusTrackingSession({
      bus: busId,
      driver: req.user._id, // Assume logged in user is the driver
      route: routeId || bus.route,
      status: "ACTIVE"
    });

    await session.save();

    res.json({ success: true, sessionId: session._id, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stop tracking session
exports.stopTrip = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await BusTrackingSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    if (session.status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Session is not active" });
    }

    // Authorization: only the driver who started it or principal
    if (session.driver.toString() !== req.user._id.toString() && req.user.role !== "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized to stop this session" });
    }

    session.status = "COMPLETED";
    session.endedAt = new Date();
    await session.save();

    // Broadcast stop event
    const io = getIo();
    if (io) {
      io.to('role:principal').to(`bus:${session.bus.toString()}`).emit('transport:tracking:stop', {
        busId: session.bus,
        sessionId: session._id
      });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update location
exports.updateLocation = async (req, res) => {
  try {
    const { sessionId, busId, latitude, longitude, speed, heading, accuracy } = req.body;

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, message: "Invalid coordinates" });
    }

    const session = await BusTrackingSession.findOne({ _id: sessionId, status: "ACTIVE" }).populate("bus").populate("route");
    if (!session) {
      return res.status(404).json({ success: false, message: "Active tracking session not found" });
    }

    // Update session
    session.lastLatitude = latitude;
    session.lastLongitude = longitude;
    session.lastSpeed = speed || 0;
    session.lastHeading = heading || 0;
    session.lastUpdatedAt = new Date();
    
    await session.save();

    // Broadcast location to socket rooms
    const io = getIo();
    if (io) {
      const payload = {
        sessionId,
        busId: session.bus._id,
        busNumber: session.bus.busNumber,
        routeId: session.route?._id,
        routeNumber: session.route?.routeNumber,
        latitude,
        longitude,
        speed: session.lastSpeed,
        heading: session.lastHeading,
        accuracy,
        timestamp: session.lastUpdatedAt
      };

      // Broadcast to principals and parents/students listening to this bus
      io.to('role:principal').to(`bus:${session.bus._id.toString()}`).emit('transport:bus:location', payload);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all active sessions for Principal
exports.getActiveSessions = async (req, res) => {
  try {
    const sessions = await BusTrackingSession.find({ status: "ACTIVE" })
      .populate("bus")
      .populate("driver", "name phone")
      .populate("route");
    
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get session for a specific bus (Parent view)
exports.getSessionForBus = async (req, res) => {
  try {
    const { busId } = req.params;

    // Authorization check for parent/student
    if (req.user.role === 'parent' || req.user.role === 'parents') {
      // Find children assigned to this bus
      const childrenIds = req.user.children || [];
      const assignments = await StudentTransport.find({ 
        student: { $in: childrenIds },
        bus: busId,
        status: "ACTIVE"
      });
      if (assignments.length === 0) {
        return res.status(403).json({ success: false, message: "Forbidden: Child not assigned to this bus" });
      }
    } else if (req.user.role === 'student') {
      const assignment = await StudentTransport.findOne({
        student: req.user._id,
        bus: busId,
        status: "ACTIVE"
      });
      if (!assignment) {
        return res.status(403).json({ success: false, message: "Forbidden: Not assigned to this bus" });
      }
    }

    const session = await BusTrackingSession.findOne({ bus: busId, status: "ACTIVE" })
      .populate("bus", "busNumber registrationNumber")
      .populate("driver", "name phone")
      .populate("route", "routeNumber name stops");

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
