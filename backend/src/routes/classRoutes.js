const express = require("express");
const router = express.Router();
const {
  createClass,
  getMyClasses,
  getStudentClass,
  getAllClasses,
  getAvailableClasses,
  getClassById,
  leaveClass,
  deleteClass,
} = require("../controllers/classController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("teacher"), createClass);
router.get("/", protect, requireRole("principal"), getAllClasses);
router.get("/available", getAvailableClasses);
router.get("/my-classes", protect, requireRole("teacher"), getMyClasses);
router.get("/my-class", protect, requireRole("student", "parent"), getStudentClass);
router.delete("/my-class", protect, requireRole("student"), leaveClass);

const { assignSubjectToClass, getClassSubjects } = require("../controllers/subjectController");
router.post("/:classId/subjects", protect, requireRole("teacher"), assignSubjectToClass);
router.get("/:classId/subjects", protect, getClassSubjects);

router.get("/:id", protect, getClassById);
router.delete("/:id", protect, requireRole("principal"), deleteClass);

module.exports = router;
