const TransportAttendance = require("../models/TransportAttendance");
const StudentTransport = require("../models/StudentTransport");
const User = require("../models/User");
const Bus = require("../models/Bus");

// Mark transport attendance for a specific student, bus, route, and date
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, busId, routeId, date, event, status } = req.body;

    // Validate assignment
    const assignment = await StudentTransport.findOne({ student: studentId, status: "ACTIVE" });
    if (!assignment) {
      return res.status(400).json({ success: false, message: "Student is not assigned to any transport" });
    }
    
    if (assignment.bus.toString() !== busId) {
      return res.status(400).json({ success: false, message: "Student is not assigned to this bus" });
    }

    // Find or create attendance record for this date
    let attendance = await TransportAttendance.findOne({ student: studentId, date });
    if (!attendance) {
      attendance = new TransportAttendance({
        student: studentId,
        bus: busId,
        route: routeId || assignment.route,
        date,
        markedBy: req.user._id
      });
    }

    const now = new Date();

    switch (event) {
      case "MORNING_BOARDING":
        if (attendance.morningBoarding !== "NOT_MARKED" && attendance.morningBoarding === status) {
          return res.status(409).json({ success: false, message: `Already marked as ${status}` });
        }
        attendance.morningBoarding = status;
        attendance.morningBoardingTime = now;
        break;
      case "SCHOOL_ARRIVAL":
        if (attendance.schoolArrival !== "NOT_MARKED" && attendance.schoolArrival === status) {
          return res.status(409).json({ success: false, message: `Already marked as ${status}` });
        }
        attendance.schoolArrival = status;
        attendance.schoolArrivalTime = now;
        break;
      case "EVENING_BOARDING":
        if (attendance.eveningBoarding !== "NOT_MARKED" && attendance.eveningBoarding === status) {
          return res.status(409).json({ success: false, message: `Already marked as ${status}` });
        }
        attendance.eveningBoarding = status;
        attendance.eveningBoardingTime = now;
        break;
      case "HOME_DROP":
        if (attendance.homeDrop !== "NOT_MARKED" && attendance.homeDrop === status) {
          return res.status(409).json({ success: false, message: `Already marked as ${status}` });
        }
        attendance.homeDrop = status;
        attendance.homeDropTime = now;
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid event" });
    }

    attendance.markedBy = req.user._id;
    await attendance.save();

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance for a bus on a specific date
exports.getBusAttendance = async (req, res) => {
  try {
    const { busId, date } = req.query;
    if (!busId || !date) {
      return res.status(400).json({ success: false, message: "Bus ID and date are required" });
    }

    // Get all assigned students to this bus
    const assignments = await StudentTransport.find({ bus: busId, status: "ACTIVE" })
      .populate("student", "name studentId profilePic")
      .populate("pickupStop", "name")
      .populate("dropStop", "name");

    const attendances = await TransportAttendance.find({ bus: busId, date });

    const result = assignments.map(assignment => {
      const att = attendances.find(a => a.student.toString() === assignment.student._id.toString());
      return {
        assignment,
        attendance: att || null
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a specific student's transport attendance history
exports.getStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Authorization check
    if (req.user.role === "student" && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    
    if (req.user.role === "parent") {
      const parent = await User.findById(req.user._id);
      if (!parent.children.includes(studentId)) {
        return res.status(403).json({ success: false, message: "Forbidden: Not your child" });
      }
    }

    const limit = parseInt(req.query.limit) || 30;
    const history = await TransportAttendance.find({ student: studentId })
      .sort({ date: -1 })
      .limit(limit)
      .populate("bus", "busNumber")
      .populate("route", "routeNumber");

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get today's attendance for a specific student (or logged in student)
exports.getTodayStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    
    // Authorization check
    if (req.user.role === "student" && req.user._id.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    
    if (req.user.role === "parent" || req.user.role === "parents") {
      const parent = await User.findById(req.user._id);
      if (!parent.children.includes(studentId)) {
        return res.status(403).json({ success: false, message: "Forbidden: Not your child" });
      }
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD local logic

    const attendance = await TransportAttendance.findOne({ student: studentId, date: today })
      .populate("bus", "busNumber")
      .populate("route", "routeNumber");

    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get transport attendance summary for Principal
exports.getSummary = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    
    const activeAssignmentsCount = await StudentTransport.countDocuments({ status: "ACTIVE" });
    const attendances = await TransportAttendance.find({ date });

    let morningBoarded = 0;
    let morningNotBoarded = 0;
    let eveningBoarded = 0;
    let eveningNotBoarded = 0;

    attendances.forEach(att => {
      if (att.morningBoarding === "BOARDED") morningBoarded++;
      else if (att.morningBoarding === "NOT_BOARDED") morningNotBoarded++;
      
      if (att.eveningBoarding === "BOARDED") eveningBoarded++;
      else if (att.eveningBoarding === "NOT_BOARDED") eveningNotBoarded++;
    });

    const summary = {
      date,
      totalAssigned: activeAssignmentsCount,
      morningBoarded,
      morningNotBoarded,
      morningNotMarked: activeAssignmentsCount - (morningBoarded + morningNotBoarded),
      eveningBoarded,
      eveningNotBoarded,
      eveningNotMarked: activeAssignmentsCount - (eveningBoarded + eveningNotBoarded),
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get bus-wise summary for Principal
exports.getBusWiseSummary = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    
    const activeAssignments = await StudentTransport.find({ status: "ACTIVE" }).populate("bus", "busNumber");
    const attendances = await TransportAttendance.find({ date }).populate("bus", "busNumber");
    
    const busStats = {};
    
    activeAssignments.forEach(a => {
      if (!a.bus) return;
      const busId = a.bus._id.toString();
      if (!busStats[busId]) {
        busStats[busId] = {
          busId,
          busNumber: a.bus.busNumber,
          totalStudents: 0,
          morningBoarded: 0,
          eveningBoarded: 0
        };
      }
      busStats[busId].totalStudents++;
    });

    attendances.forEach(att => {
      if (!att.bus) return;
      const busId = att.bus._id.toString();
      if (busStats[busId]) {
        if (att.morningBoarding === "BOARDED") busStats[busId].morningBoarded++;
        if (att.eveningBoarding === "BOARDED") busStats[busId].eveningBoarded++;
      }
    });

    res.json({ success: true, busSummary: Object.values(busStats) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
