const Bus = require("../models/Bus");
const Driver = require("../models/Driver");
const Route = require("../models/Route");
const BusStop = require("../models/BusStop");

// --- DRIVER ---
exports.createDriver = async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
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
    res.json({ success: true, message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- BUS ---
exports.createBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    const populatedBus = await Bus.findById(bus._id).populate('driver');
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
    const buses = await Bus.find().populate("driver").sort({ createdAt: -1 });
    res.json({ success: true, buses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate("driver");
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    res.json({ success: true, bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('driver');
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
