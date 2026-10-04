const express = require("express");
const router = express.Router();
const { getStudentDetailsForPrincipal } = require("../controllers/principalStudentController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// All routes require protection and Principal role
router.use(protect);
router.use(requireRole("principal"));

// @route   GET /api/principal/students/details/:studentId
// @access  Private (Principal only)
router.get("/details/:studentId", getStudentDetailsForPrincipal);
router.get("/:studentId/details", getStudentDetailsForPrincipal);
router.get("/:studentId", getStudentDetailsForPrincipal);

module.exports = router;
