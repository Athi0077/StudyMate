const mongoose = require("mongoose");

const busTrackingSessionSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Or driver reference
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  
  status: { type: String, enum: ["ACTIVE", "COMPLETED", "STOPPED"], default: "ACTIVE" },
  
  lastLatitude: { type: Number },
  lastLongitude: { type: Number },
  lastSpeed: { type: Number }, // in km/h
  lastHeading: { type: Number },
  lastUpdatedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("BusTrackingSession", busTrackingSessionSchema);
