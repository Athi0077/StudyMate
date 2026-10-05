const StudentTransport = require("../models/StudentTransport");
const Bus = require("../models/Bus");
const Route = require("../models/Route");
const BusStop = require("../models/BusStop");
const User = require("../models/User");

exports.assignTransport = async (req, res) => {
  try {
    const { student, bus, route, pickupStop, dropStop } = req.body;

    // Check if active assignment exists
    let existing = await StudentTransport.findOne({ student, status: "ACTIVE" });
    
    if (existing) {
      // If it exists, update it instead of creating a duplicate
      existing.bus = bus;
      existing.route = route;
      existing.pickupStop = pickupStop;
      existing.dropStop = dropStop;
      await existing.save();
      const updated = await StudentTransport.findById(existing._id)
        .populate("bus")
        .populate("route")
        .populate("pickupStop")
        .populate("dropStop");
      return res.status(200).json({ success: true, assignment: updated, message: "Transport updated" });
    }

    const assignment = await StudentTransport.create({
      student, bus, route, pickupStop, dropStop, status: "ACTIVE"
    });
    
    const populated = await StudentTransport.findById(assignment._id)
      .populate("bus")
      .populate("route")
      .populate("pickupStop")
      .populate("dropStop");

    res.status(201).json({ success: true, assignment: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStudentTransport = async (req, res) => {
  try {
    const assignment = await StudentTransport.findOne({ student: req.params.studentId, status: "ACTIVE" })
      .populate({ path: "bus", populate: { path: "driver" } })
      .populate("route")
      .populate("pickupStop")
      .populate("dropStop");
      
    if (!assignment) {
      return res.status(404).json({ success: false, message: "No active transport assigned" });
    }
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await StudentTransport.find({ status: "ACTIVE" })
      .populate("student", "name studentId")
      .populate("bus", "busNumber")
      .populate("route", "routeNumber");
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStudentTransport = async (req, res) => {
  try {
    const assignment = await StudentTransport.findOneAndUpdate(
      { student: req.params.studentId, status: "ACTIVE" },
      req.body,
      { new: true, runValidators: true }
    )
    .populate("bus")
    .populate("route")
    .populate("pickupStop")
    .populate("dropStop");

    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.removeStudentTransport = async (req, res) => {
  try {
    const assignment = await StudentTransport.findOneAndUpdate(
      { student: req.params.studentId, status: "ACTIVE" },
      { status: "INACTIVE" },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found" });
    res.json({ success: true, message: "Transport assignment removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTransport = async (req, res) => {
  try {
    const assignment = await StudentTransport.findOne({ student: req.user._id, status: "ACTIVE" })
      .populate({ path: "bus", populate: { path: "driver" } })
      .populate("route")
      .populate("pickupStop")
      .populate("dropStop");
      
    if (!assignment) {
      return res.status(404).json({ success: false, message: "No active transport assigned" });
    }
    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Also let's add an endpoint to get transport for a parent's children
exports.getParentChildrenTransport = async (req, res) => {
  try {
    const parentId = req.user._id; // assuming auth middleware sets req.user
    // Find students linked to this parent (either parent has student refs, or students have parent ref)
    // The prompt says "Use existing parent -> student relationship."
    // Let's check User model to see how it's linked
    // Usually parents have a `children` array
    const parent = await User.findById(parentId).populate("children");
    if (!parent) return res.status(404).json({ success: false, message: "Parent not found" });

    const childrenIds = parent.children.map(c => c._id);
    const assignments = await StudentTransport.find({ student: { $in: childrenIds }, status: "ACTIVE" })
      .populate("student")
      .populate({ path: "bus", populate: { path: "driver" } })
      .populate("route")
      .populate("pickupStop")
      .populate("dropStop");

    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransportSummary = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student", status: "active" });
    const assignedStudents = await StudentTransport.countDocuments({ status: "ACTIVE" });
    res.json({ 
      success: true, 
      summary: {
        totalStudents,
        assignedStudents,
        notAssigned: totalStudents - assignedStudents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
