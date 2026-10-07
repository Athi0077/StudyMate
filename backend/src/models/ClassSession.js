const mongoose = require("mongoose");

const classSessionSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },
    periodNumber: {
      type: Number,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actualTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    substituteAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubstituteAssignment",
    },
    isSubstitute: {
      type: Boolean,
      default: false,
    },
    // The attendance array for this specific period
    attendance: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent", "leave", "late"],
          required: true,
        },
      },
    ],
    // Class Record
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SyllabusChapter",
    },
    chapter: {
      type: String,
    },
    topic: {
      type: String,
    },
    classRecord: {
      type: String,
    },
    lessonStatus: {
      type: String,
      enum: ["Completed", "Partially Completed", "Not Completed"],
    },
    // Lesson Log
    lessonLog: {
      type: String,
    },
    pagesCovered: {
      type: String,
    },
    teachingMethod: {
      type: String,
      enum: [
        "Board",
        "Discussion",
        "Activity",
        "Practical",
        "Video",
        "Group Work",
        "Other",
      ],
    },
    teacherNotes: {
      type: String,
    },
    // Homework
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
    },
    sessionStatus: {
      type: String,
      enum: [
        "NOT_STARTED",
        "ATTENDANCE_COMPLETED",
        "CLASS_RECORD_COMPLETED",
        "LESSON_LOG_COMPLETED",
        "HOMEWORK_COMPLETED",
        "COMPLETED",
      ],
      default: "NOT_STARTED",
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate period attendance
classSessionSchema.index(
  { date: 1, classId: 1, periodNumber: 1, teacherId: 1 },
  { unique: true }
);

const ClassSession = mongoose.model("ClassSession", classSessionSchema);

module.exports = ClassSession;
