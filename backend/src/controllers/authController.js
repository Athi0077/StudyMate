const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role === "principal" || role === "teacher") {
      return res.status(400).json({ success: false, message: "Public registration is only available for students." });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    let status = "active";
    if (role === "teacher") {
      status = "pending";
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      status,
    });

    if (user) {
      if (user.role === 'student' && req.body.classId) {
        const Class = require("../models/Class");
        const Enrollment = require("../models/Enrollment");
        const AcademicYear = require("../models/AcademicYear");
        
        // Auto-enroll the student directly into the class
        const targetClass = await Class.findById(req.body.classId);
        if (targetClass) {
          if (!targetClass.students.includes(user._id)) {
            targetClass.students.push(user._id);
            await targetClass.save();
          }

          // Create active enrollment if there's an active academic year
          const activeYear = await AcademicYear.findOne({ status: 'active' });
          if (activeYear) {
            await Enrollment.create({
              studentId: user._id,
              academicYearId: activeYear._id,
              classId: targetClass._id,
              status: "active",
              type: "new_admission"
            });
          }
        }
      }

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: generateToken(user._id, user.role),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profilePic: user.profilePic,
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const SecurityEvent = require("../models/SecurityEvent");

    const user = await User.findOne({ 
      $or: [
        { email: email },
        { studentId: email }
      ] 
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check rate limit lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(429).json({ success: false, message: `Account temporarily locked. Try again in ${waitMinutes} minutes.` });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      let lockMessage = "Invalid email or password";
      if (user.loginAttempts >= 5) {
        // Lock for 15 minutes
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        lockMessage = "Account temporarily locked due to too many failed attempts.";
        
        await SecurityEvent.create({
          targetId: user._id,
          eventType: "account_locked",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }
      await user.save();

      await SecurityEvent.create({
        targetId: user._id,
        eventType: "login_failed",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });

      return res.status(401).json({ success: false, message: lockMessage });
    }

    if (user.status === "blocked" || user.status === "inactive") {
      return res.status(403).json({ success: false, message: "Account is disabled" });
    }

    if (user.status === "pending" && user.role === "teacher") {
      return res.status(403).json({ success: false, message: "Your account is waiting for Principal approval." });
    }

    // Reset lock state
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await SecurityEvent.create({
      actorId: user._id,
      targetId: user._id,
      eventType: "login_success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    // We pass sessionVersion to generateToken so it gets embedded in JWT
    res.json({
      success: true,
      token: generateToken(user._id, user.role, user.sessionVersion || 1),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
        profilePic: user.profilePic,
        mustChangePassword: user.mustChangePassword
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      let hasTempAccess = false;
      if (user.role === "teacher") {
        const TemporaryPrincipalAccess = require("../models/TemporaryPrincipalAccess");
        const now = new Date();
        const activeAccess = await TemporaryPrincipalAccess.findOne({
          teacherId: user._id,
          status: "Active",
          startAt: { $lte: now },
          expiresAt: { $gt: now }
        });
        if (activeAccess) hasTempAccess = true;
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          status: user.status,
          profilePic: user.profilePic,
          tempPrincipalAccess: hasTempAccess
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (client-side clears token)
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect current password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    if (newPassword === user.studentId || newPassword.toLowerCase() === user.name.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Password cannot be your name or Student ID." });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    await user.save();

    const SecurityEvent = require("../models/SecurityEvent");
    await SecurityEvent.create({
      actorId: user._id,
      targetId: user._id,
      eventType: "password_change",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.json({
      success: true,
      message: "Password changed successfully",
      token: generateToken(user._id, user.role, user.sessionVersion),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  changePassword,
};
