const User = require("../models/User");
const Settings = require("../models/Settings");

// @desc    Get dashboard statistics
// @route   GET /api/super-admin/dashboard
// @access  Private/SuperAdmin
const getDashboardStats = async (req, res) => {
  try {
    const roles = ["student", "teacher", "principal", "parent"];
    
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );

    const counts = await Promise.all(countPromises);
    
    const stats = {
      student: counts[0],
      teacher: counts[1],
      principal: counts[2],
      parent: counts[3],
    };

    const totalRegistered = counts.reduce((a, b) => a + b, 0);

    let settings = await Settings.findOne();
    const amounts = settings?.calculatorAmounts || { student: 0, teacher: 0, principal: 0, parent: 0 };
    
    const totals = {
      student: stats.student * (amounts.student || 0),
      teacher: stats.teacher * (amounts.teacher || 0),
      principal: stats.principal * (amounts.principal || 0),
      parent: stats.parent * (amounts.parent || 0)
    };

    const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

    res.json({
      success: true,
      stats,
      totalRegistered,
      grandTotal,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get account counts
// @route   GET /api/super-admin/account-counts
// @access  Private/SuperAdmin
const getAccountCounts = async (req, res) => {
  try {
    const roles = ["student", "teacher", "principal", "parent"];
    
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );

    const counts = await Promise.all(countPromises);
    
    const stats = {
      student: counts[0],
      teacher: counts[1],
      principal: counts[2],
      parent: counts[3],
    };

    res.json({
      success: true,
      counts: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get calculator amounts
// @route   GET /api/super-admin/calculator
// @access  Private/SuperAdmin
const getCalculatorAmounts = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
    }

    // Get current counts to return calculation
    const roles = ["student", "teacher", "principal", "parent"];
    
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );

    const counts = await Promise.all(countPromises);
    
    const stats = {
      student: counts[0],
      teacher: counts[1],
      principal: counts[2],
      parent: counts[3],
    };

    const amounts = settings.calculatorAmounts || { student: 0, teacher: 0, principal: 0, parent: 0 };

    const totals = {
      student: stats.student * (amounts.student || 0),
      teacher: stats.teacher * (amounts.teacher || 0),
      principal: stats.principal * (amounts.principal || 0),
      parent: stats.parent * (amounts.parent || 0)
    };

    const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

    res.json({
      success: true,
      amounts,
      counts: stats,
      totals,
      grandTotal,
      updatedBy: settings.updatedBy,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update calculator amounts
// @route   PUT /api/super-admin/calculator
// @access  Private/SuperAdmin
const updateCalculatorAmounts = async (req, res) => {
  try {
    const { student, teacher, principal, parent } = req.body;
    
    // Validate inputs
    if (student < 0 || teacher < 0 || principal < 0 || parent < 0 || 
        isNaN(student) || isNaN(teacher) || isNaN(principal) || isNaN(parent) ||
        !isFinite(student) || !isFinite(teacher) || !isFinite(principal) || !isFinite(parent)) {
      return res.status(400).json({ success: false, message: "Invalid amounts" });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({});
    }

    settings.calculatorAmounts = {
      student: Number(student),
      teacher: Number(teacher),
      principal: Number(principal),
      parent: Number(parent)
    };
    settings.updatedBy = req.user._id;

    await settings.save();

    // Recalculate
    const roles = ["student", "teacher", "principal", "parent"];
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );
    const countsArray = await Promise.all(countPromises);
    
    const counts = {
      student: countsArray[0],
      teacher: countsArray[1],
      principal: countsArray[2],
      parent: countsArray[3],
    };

    const totals = {
      student: counts.student * settings.calculatorAmounts.student,
      teacher: counts.teacher * settings.calculatorAmounts.teacher,
      principal: counts.principal * settings.calculatorAmounts.principal,
      parent: counts.parent * settings.calculatorAmounts.parent
    };

    const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

    res.json({
      success: true,
      amounts: settings.calculatorAmounts,
      counts,
      totals,
      grandTotal,
      updatedBy: settings.updatedBy,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAccountCounts,
  getCalculatorAmounts,
  updateCalculatorAmounts
};
