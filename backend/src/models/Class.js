const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    standard: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    classLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ students: 1 });
classSchema.index({ teacherId: 1 });

const Class = mongoose.model("Class", classSchema);

module.exports = Class;
