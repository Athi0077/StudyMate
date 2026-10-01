const express = require("express");
const router = express.Router();
const { protect, requireSuperAdmin } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAccountCounts,
  getCalculatorAmounts,
  updateCalculatorAmounts
} = require("../controllers/superAdminController");

router.use(protect);
router.use(requireSuperAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/account-counts", getAccountCounts);
router.get("/calculator", getCalculatorAmounts);
router.put("/calculator", updateCalculatorAmounts);

module.exports = router;
