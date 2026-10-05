const mongoose = require("mongoose");

const busStopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  pickupTime: { type: String, required: true },
  dropTime: { type: String, required: true },
  sequence: { type: Number, required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
}, { timestamps: true });

module.exports = mongoose.model("BusStop", busStopSchema);
