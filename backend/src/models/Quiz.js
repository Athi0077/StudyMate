const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D"],
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [optionSchema],
    validate: [
      (val) => val.length === 4,
      "Question must have exactly 4 options (A, B, C, D)",
    ],
  },
  correctAnswer: {
    type: String,
    required: true,
    enum: ["A", "B", "C", "D"],
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
    min: [1, "Marks must be at least 1"],
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Standard",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [questionSchema],
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    timeLimit: {
      type: Number,
      default: 0, // In minutes (0 = no limit)
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ standardId: 1, sectionId: 1, status: 1 });
quizSchema.index({ createdBy: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
