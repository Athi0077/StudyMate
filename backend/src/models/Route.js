const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  routeNumber: { type: String, required: true, unique: true },
  description: { type: String },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
}, { timestamps: true });

module.exports = mongoose.model("Route", routeSchema);
