const express = require("express");
const router = express.Router();
const { getAllSubjects } = require("../controllers/subjectController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllSubjects);

module.exports = router;
