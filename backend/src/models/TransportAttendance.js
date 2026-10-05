const mongoose = require("mongoose");

const transportAttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  
  morningBoarding: { type: String, enum: ["NOT_MARKED", "BOARDED", "NOT_BOARDED"], default: "NOT_MARKED" },
  morningBoardingTime: { type: Date },
  
  schoolArrival: { type: String, enum: ["NOT_MARKED", "ARRIVED", "NOT_ARRIVED"], default: "NOT_MARKED" },
  schoolArrivalTime: { type: Date },
  
  eveningBoarding: { type: String, enum: ["NOT_MARKED", "BOARDED", "NOT_BOARDED"], default: "NOT_MARKED" },
  eveningBoardingTime: { type: Date },
  
  homeDrop: { type: String, enum: ["NOT_MARKED", "DROPPED", "NOT_DROPPED"], default: "NOT_MARKED" },
  homeDropTime: { type: Date },

  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes: { type: String }
}, { timestamps: true });

// Ensure one record per student per day
transportAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TransportAttendance", transportAttendanceSchema);
