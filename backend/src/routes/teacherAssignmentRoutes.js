const express = require("express");
const router = express.Router();
const {
  assignTeacher,
  getAssignments,
  getTeacherAssignments,
  removeAssignment,
  updateAssignment
} = require("../controllers/teacherAssignmentController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("principal"), assignTeacher);
router.get("/", protect, requireRole("principal"), getAssignments);
router.get("/teacher/:teacherId", protect, getTeacherAssignments); // Both principal and the specific teacher can access, though usually accessed by teacher via their token
router.delete("/:id", protect, requireRole("principal"), removeAssignment);
router.put("/:id", protect, requireRole("principal"), updateAssignment);

module.exports = router;
