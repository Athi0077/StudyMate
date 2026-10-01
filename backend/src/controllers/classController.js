const Class = require("../models/Class");
const User = require("../models/User");

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher only)
const createClass = async (req, res) => {
  try {
    const { standard, section } = req.body;
    const teacherId = req.user._id;

    if (!standard || !section) {
      return res.status(400).json({ success: false, message: "Standard and section are required" });
    }

    const className = `${standard} - ${section}`;

    // Prevent duplicate class creation by the same teacher
    const classExists = await Class.findOne({ teacherId, className });
    if (classExists) {
      return res.status(400).json({ success: false, message: "This class already exists." });
    }

    const newClass = await Class.create({
      standard,
      section,
      className,
      teacherId,
      status: "active",
    });

    res.status(201).json({ success: true, message: "Class created successfully", data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's classes
// @route   GET /api/classes/my-classes
// @access  Private (Teacher only)
const getMyClasses = async (req, res) => {
  try {
    const TeacherAssignment = require("../models/TeacherAssignment");
    const Standard = require("../models/Standard");
    const Section = require("../models/Section");

    // Get assignments for this teacher
    const assignments = await TeacherAssignment.find({ teacherId: req.user._id })
      .populate("standardId")
      .populate("sectionId");

    // Build an array of class name conditions to match against the Class model
    const classConditions = assignments.map(a => ({
      standard: a.standardId?.name,
      section: a.sectionId?.name
    })).filter(c => c.standard && c.section);

    // Query Class model: either they are the Class Teacher OR they have a subject assignment
    let query = { teacherId: req.user._id };
    if (classConditions.length > 0) {
      query = {
        $or: [
          { teacherId: req.user._id },
          ...classConditions
        ]
      };
    }

    let classes = await Class.find(query).populate('students', '_id role');
    
    // Filter out invalid/deleted student IDs
    classes = classes.map(c => {
      const cls = c.toObject();
      cls.students = cls.students.filter(s => s && s.role === 'student');
      return cls;
    });

    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's joined class
// @route   GET /api/classes/my-class
// @access  Private (Student only)
const getStudentClass = async (req, res) => {
  try {
    let targetStudentId = req.user._id;

    if (req.user.role === 'parent') {
      const parentUser = await User.findById(req.user._id);
      if (!parentUser || !parentUser.children || parentUser.children.length === 0) {
        return res.status(404).json({ success: false, message: "No children linked to your account." });
      }
      targetStudentId = req.query.studentId || parentUser.children[0];
      
      // Ensure the requested studentId is actually a child of this parent
      if (req.query.studentId && !parentUser.children.map(id => id.toString()).includes(req.query.studentId)) {
        return res.status(403).json({ success: false, message: "Unauthorized access to this student's class." });
      }
    }

    const studentClass = await Class.findOne({ students: targetStudentId }).populate("teacherId", "name email");
    if (!studentClass) {
      return res.status(404).json({ success: false, message: "No class joined yet." });
    }
    
    // For student privacy, don't populate all student details, maybe just count or basic info
    const populatedClass = await Class.findById(studentClass._id)
      .populate("teacherId", "name email")
      .populate("students", "name");

    const Standard = require("../models/Standard");
    const Section = require("../models/Section");
    const TeacherAssignment = require("../models/TeacherAssignment");

    const standardDoc = await Standard.findOne({ name: studentClass.standard });
    
    let sectionDoc = null;
    if (standardDoc) {
      sectionDoc = await Section.findOne({ name: studentClass.section, standardId: standardDoc._id });
    }

    let staff = [];
    if (standardDoc && sectionDoc) {
      staff = await TeacherAssignment.find({
        standardId: standardDoc._id,
        sectionId: sectionDoc._id,
      }).populate("teacherId", "name");
    }

    res.json({ success: true, data: populatedClass, staff: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Principal only)
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate("teacherId", "name email");
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available classes for student to join
// @route   GET /api/classes/available
// @access  Private (Student only)
const getAvailableClasses = async (req, res) => {
  try {
    const classes = await Class.find({ status: "active" }).populate("teacherId", "name");
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get class details by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId)
      .populate("teacherId", "name email")
      .populate("students", "name email phone address studentId");

    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Role-based access control
    if (req.user.role === "teacher") {
      let hasAccess = false;
      // Check if they are the primary class teacher
      if (classData.teacherId && classData.teacherId._id.toString() === req.user._id.toString()) {
        hasAccess = true;
      } else {
        // Check if they are assigned as a subject teacher
        const TeacherAssignment = require("../models/TeacherAssignment");
        // We only need standard and section populated to compare names
        const assignments = await TeacherAssignment.find({ teacherId: req.user._id })
          .populate("standardId", "name")
          .populate("sectionId", "name");
        
        hasAccess = assignments.some(a => 
          a.standardId?.name === classData.standard && 
          a.sectionId?.name === classData.section
        );
      }

      if (!hasAccess) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    if (req.user.role === "student" && !classData.students.some(s => s._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Add parent info to students
    const studentsWithParents = await Promise.all(classData.students.map(async (student) => {
      const parent = await User.findOne({ role: 'parent', children: student._id });
      return {
        ...student.toObject(),
        parentName: parent ? parent.name : null,
        parentPhone: parent ? parent.phone : null
      };
    }));
    
    const enhancedClassData = classData.toObject();
    enhancedClassData.students = studentsWithParents;

    res.json({ success: true, data: enhancedClassData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student leaves their class
// @route   DELETE /api/classes/my-class
// @access  Private (Student only)
const leaveClass = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    
    if (!studentClass) {
      return res.status(400).json({ success: false, message: "You are not a member of any class" });
    }

    studentClass.students = studentClass.students.filter(
      (studentId) => studentId.toString() !== req.user._id.toString()
    );
    
    await studentClass.save();
    
    // We should also remove the approved request
    const ClassJoinRequest = require("../models/ClassJoinRequest");
    await ClassJoinRequest.deleteMany({ studentId: req.user._id, classId: studentClass._id });

    res.json({ success: true, message: "Left class successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Principal only)
const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const classToDelete = await Class.findById(classId);

    if (!classToDelete) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Optional: add logic here to delete or update related records if needed
    // e.g., TeacherAssignments, Homework, etc.
    
    await Class.findByIdAndDelete(classId);

    res.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createClass,
  getMyClasses,
  getStudentClass,
  getAllClasses,
  getAvailableClasses,
  getClassById,
  leaveClass,
  deleteClass,
};
