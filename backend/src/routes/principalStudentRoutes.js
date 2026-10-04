const express = require("express");
const router = express.Router();
const { getStudentDetailsForPrincipal } = require("../controllers/principalStudentController");
const { protect, authorize } = require("../middleware/authMiddleware");

// @route   GET /api/principal/students/details/:studentId
// @access  Private (Principal only)
router.get("/details/:studentId", protect, authorize("principal"), getStudentDetailsForPrincipal);

module.exports = router;
