const User = require("../models/User");
const Class = require("../models/Class");
const AcademicYear = require("../models/AcademicYear");
const TeacherAssignment = require("../models/TeacherAssignment");
const crypto = require("crypto");

const generateVerificationId = () => crypto.randomBytes(8).toString('hex');

const getIDCardData = async (user) => {
  if (!user.verificationId) {
    user.verificationId = generateVerificationId();
    await user.save();
  }

  const baseData = {
    _id: user._id,
    name: user.name,
    role: user.role,
    profilePic: user.profilePic,
    schoolName: "StudyMate School",
    idCardStatus: user.idCardStatus || "active",
    verificationId: user.verificationId,
  };

  if (user.role === "student") {
    const studentClass = await Class.findOne({ students: user._id });
    const activeYear = await AcademicYear.findOne({ status: "active" });

    return {
      ...baseData,
      studentId: user.studentId,
      grNumber: user.grNumber,
      className: studentClass ? `${studentClass.standard} - ${studentClass.section}` : "N/A",
      academicYear: activeYear ? activeYear.name : "N/A",
    };
  }

  if (user.role === "teacher") {
    const assignments = await TeacherAssignment.find({ teacherId: user._id })
      .populate("standardId sectionId");
    
    // Group unique classes
    const classes = new Set();
    assignments.forEach(a => {
      if (a.standardId?.name && a.sectionId?.name) {
        classes.add(`${a.standardId.name} - ${a.sectionId.name}`);
      }
    });

    return {
      ...baseData,
      employeeId: user.employeeId,
      designation: user.designation || "Teacher",
      joiningDate: user.joiningDate,
      assignedClasses: classes.size > 0 ? Array.from(classes).join(', ') : "N/A",
    };
  }

  if (user.role === "principal") {
    return {
      ...baseData,
      employeeId: user.employeeId,
      designation: user.designation || "Principal",
      joiningDate: user.joiningDate,
    };
  }

  return baseData;
};

// @desc    Get my ID card
// @route   GET /api/id-card/mine
// @access  Private
const getMyIDCard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const cardData = await getIDCardData(user);
    res.json({ success: true, data: cardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user ID card by ID
// @route   GET /api/id-card/:id
// @access  Private (Principal)
const getUserIDCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const cardData = await getIDCardData(user);
    res.json({ success: true, data: cardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update ID card profile fields
// @route   PUT /api/id-card/:id
// @access  Private (Principal)
const updateIDCard = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const { employeeId, designation, joiningDate, idCardStatus, studentId, grNumber, name } = req.body;

    if (name) user.name = name;
    if (idCardStatus) user.idCardStatus = idCardStatus;
    
    if (user.role === "teacher" || user.role === "principal") {
      if (employeeId !== undefined) user.employeeId = employeeId;
      if (designation !== undefined) user.designation = designation;
      if (joiningDate !== undefined) user.joiningDate = joiningDate;
    } else if (user.role === "student") {
      if (studentId !== undefined) user.studentId = studentId;
      if (grNumber !== undefined) user.grNumber = grNumber;
    }

    // Force regenerate verification ID
    user.verificationId = generateVerificationId();

    await user.save();

    const cardData = await getIDCardData(user);
    res.json({ success: true, message: "ID Card updated successfully", data: cardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify ID card via QR Code
// @route   GET /api/id-card/verify/:verificationId
// @access  Public
const verifyIDCard = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const user = await User.findOne({ verificationId });

    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid ID Card" });
    }

    if (user.idCardStatus === "revoked") {
      return res.status(403).json({ success: false, message: "ID Card has been revoked" });
    }

    // Only expose limited public data
    const publicData = {
      name: user.name,
      role: user.role,
      schoolName: "StudyMate School",
      profilePic: user.profilePic,
      status: user.idCardStatus,
      verificationId: user.verificationId,
    };

    if (user.role === "student") {
        publicData.studentId = user.studentId;
    } else {
        publicData.employeeId = user.employeeId;
        publicData.designation = user.designation;
    }

    res.json({ success: true, data: publicData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users for ID Card management
// @route   GET /api/id-card/users
// @access  Private (Principal)
const getAllUsersForIDCard = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    
    if (role && role !== "all") {
      query.role = role;
    } else {
        query.role = { $in: ["student", "teacher", "principal"] };
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { studentId: { $regex: search, $options: "i" } },
            { employeeId: { $regex: search, $options: "i" } },
            { grNumber: { $regex: search, $options: "i" } },
        ];
    }

    const users = await User.find(query).select("name role studentId employeeId profilePic idCardStatus grNumber designation");
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyIDCard,
  getUserIDCard,
  updateIDCard,
  verifyIDCard,
  getAllUsersForIDCard,
};
