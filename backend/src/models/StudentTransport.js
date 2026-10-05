const mongoose = require("mongoose");

const studentTransportSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  pickupStop: { type: mongoose.Schema.Types.ObjectId, ref: "BusStop", required: true },
  dropStop: { type: mongoose.Schema.Types.ObjectId, ref: "BusStop", required: true },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
}, { timestamps: true });

module.exports = mongoose.model("StudentTransport", studentTransportSchema);
