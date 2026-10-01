const express = require("express");
const router = express.Router();
const {
  createStandard,
  getStandards,
  updateStandard,
  deleteStandard,
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/standardController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// All these routes are Principal only
router.use(protect, requireRole("principal"));

router.post("/", createStandard);
router.get("/", getStandards);
router.put("/:id", updateStandard);
router.delete("/:id", deleteStandard);

router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

module.exports = router;
