const express = require("express");
const router = express.Router();
const {
  getTeacherClasses,
  getTimetableForSession,
  initializeSession,
  getSessionById,
  saveSessionAttendance,
  saveClassRecord,
  saveLessonLog,
  saveHomework,
  completeSession,
  getMonitoringData
} = require("../controllers/classSessionController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Teacher Routes
router.get("/classes", protect, requireRole("teacher"), getTeacherClasses);
router.get("/:classId/timetable", protect, requireRole("teacher"), getTimetableForSession);
router.post("/initialize", protect, requireRole("teacher"), initializeSession);

router.get("/session/:sessionId", protect, getSessionById);
router.put("/:sessionId/attendance", protect, requireRole("teacher"), saveSessionAttendance);
router.put("/:sessionId/class-record", protect, requireRole("teacher"), saveClassRecord);
router.put("/:sessionId/lesson-log", protect, requireRole("teacher"), saveLessonLog);
router.post("/:sessionId/homework", protect, requireRole("teacher"), saveHomework);
router.put("/:sessionId/complete", protect, requireRole("teacher"), completeSession);

// Principal Routes
router.get("/monitoring", protect, requireRole("principal"), getMonitoringData);

// Parent Routes
router.get("/parent/children/:childId", protect, requireRole("parent", "parents"), require("../controllers/classSessionController").getParentChildClassSessions);

module.exports = router;
