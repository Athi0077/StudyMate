const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  attendant: { type: mongoose.Schema.Types.ObjectId, ref: "Attendant" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  attenderName: { type: String },
  attenderPhone: { type: String },
  status: { type: String, enum: ["ACTIVE", "MAINTENANCE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true });

module.exports = mongoose.model("Bus", busSchema);
