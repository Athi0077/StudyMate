const Bus = require("../models/Bus");
const Driver = require("../models/Driver");
const Route = require("../models/Route");
const BusStop = require("../models/BusStop");
const User = require("../models/User");
const Attendant = require("../models/Attendant");

// --- DRIVER ---
exports.createDriver = async (req, res) => {
  try {
    const { name, phone, password, licenseNumber, licenseExpiry, experience, emergencyContact, status } = req.body;
    
    // Create User for driver
    const user = await User.create({
      name,
      mobileNumber: phone,
      email: `driver_${Date.now()}@studymate.com`,
      password: password || "driver123", // Default if not provided
      role: "driver"
    });

    const driver = await Driver.create({
      name,
      phone,
      licenseNumber,
      licenseExpiry,
      experience,
      emergencyContact,
      status,
      user: user._id
    });
    res.status(201).json({ success: true, driver });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "License number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json({ success: true, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    res.json({ success: true, driver });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "License number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
    if (driver.user) {
      await User.findByIdAndDelete(driver.user);
    }
    res.json({ success: true, message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ATTENDANT ---
exports.createAttendant = async (req, res) => {
  try {
    const { name, phone, password, status } = req.body;
    
    const user = await User.create({
      name,
      mobileNumber: phone,
      email: `attendant_${Date.now()}@studymate.com`,
      password: password || "attendant123",
      role: "attendant"
    });

    const attendant = await Attendant.create({
      name,
      phone,
      status,
      user: user._id
    });
    res.status(201).json({ success: true, attendant });
  } catch (error) {
    if (error.code === 11000) {
      console.error("Duplicate key error:", error.keyValue);
      return res.status(409).json({ success: false, message: "Phone number already exists or duplicate data: " + JSON.stringify(error.keyValue) });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAttendants = async (req, res) => {
  try {
    const attendants = await Attendant.find().sort({ createdAt: -1 });
    res.json({ success: true, attendants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAttendant = async (req, res) => {
  try {
    const attendant = await Attendant.findByIdAndDelete(req.params.id);
    if (!attendant) return res.status(404).json({ success: false, message: "Attendant not found" });
    if (attendant.user) {
      await User.findByIdAndDelete(attendant.user);
    }
    res.json({ success: true, message: "Attendant deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- BUS ---
exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    const populatedBus = await Bus.findById(bus._id).populate('driver').populate('attendant');
    res.status(201).json({ success: true, bus: populatedBus });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Bus number or registration number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find().populate("driver").populate("attendant").sort({ createdAt: -1 });
    res.json({ success: true, buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate("driver").populate("attendant");
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    res.json({ success: true, bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('driver').populate('attendant');
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    res.json({ success: true, bus });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Bus number or registration number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    res.json({ success: true, message: "Bus deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyAssignedBus = async (req, res) => {
  try {
    const user = req.user;
    let query = {};
    if (user.role === 'driver') {
      const driver = await Driver.findOne({ user: user._id });
      if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found" });
      query = { driver: driver._id };
    } else if (user.role === 'attendant') {
      const attendant = await Attendant.findOne({ user: user._id });
      if (!attendant) return res.status(404).json({ success: false, message: "Attendant profile not found" });
      query = { attendant: attendant._id };
    } else {
      return res.status(403).json({ success: false, message: "Only driver or attendant can fetch assigned bus" });
    }

    const bus = await Bus.findOne(query).populate('driver').populate('attendant');
    if (!bus) return res.status(404).json({ success: false, message: "No bus assigned to you" });

    res.json({ success: true, bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ROUTE ---
exports.createRoute = async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({ success: true, route });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Route number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getRoutes = async (req, res) => {
  try {
    // Count stops for each route
    const routes = await Route.aggregate([
      {
        $lookup: {
          from: "busstops",
          localField: "_id",
          foreignField: "route",
          as: "stopsDetails"
        }
      },
      {
        $addFields: {
          stopsCount: { $size: "$stopsDetails" },
          id: "$_id" // Mongoose usually gives _id as string, aggregate doesn't automatically map id
        }
      },
      {
        $project: {
          stopsDetails: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ success: true, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: "Route not found" });
    const stops = await BusStop.find({ route: route._id }).sort({ sequence: 1 });
    res.json({ success: true, route, stops });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) return res.status(404).json({ success: false, message: "Route not found" });
    res.json({ success: true, route });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Route number already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: "Route not found" });
    // Also delete stops
    await BusStop.deleteMany({ route: req.params.id });
    res.json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- BUS STOP ---
exports.createBusStop = async (req, res) => {
  try {
    const stop = await BusStop.create(req.body);
    const populatedStop = await BusStop.findById(stop._id).populate("route");
    res.status(201).json({ success: true, stop: populatedStop });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.getBusStops = async (req, res) => {
  try {
    const stops = await BusStop.find().populate("route").sort({ route: 1, sequence: 1 });
    res.json({ success: true, stops });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getBusStop = async (req, res) => {
  try {
    const stop = await BusStop.findById(req.params.id).populate("route");
    if (!stop) return res.status(404).json({ success: false, message: "Bus stop not found" });
    res.json({ success: true, stop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateBusStop = async (req, res) => {
  try {
    const stop = await BusStop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("route");
    if (!stop) return res.status(404).json({ success: false, message: "Bus stop not found" });
    res.json({ success: true, stop });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.deleteBusStop = async (req, res) => {
  try {
    const stop = await BusStop.findByIdAndDelete(req.params.id);
    if (!stop) return res.status(404).json({ success: false, message: "Bus stop not found" });
    res.json({ success: true, message: "Bus stop deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
