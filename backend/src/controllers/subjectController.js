const Subject = require("../models/Subject");
const Class = require("../models/Class");

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ status: "active" });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign subject to class
// @route   POST /api/classes/:classId/subjects
// @access  Private (Teacher only)
const assignSubjectToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (classData.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (classData.subjects.includes(subjectId)) {
      return res.status(400).json({ success: false, message: "Subject already assigned to this class" });
    }

    classData.subjects.push(subjectId);
    await classData.save();

    res.json({ success: true, message: "Subject assigned successfully", data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subjects for a specific class
// @route   GET /api/classes/:classId/subjects
// @access  Private
const getClassSubjects = async (req, res) => {
  try {
    const { classId } = req.params;
    const classData = await Class.findById(classId).populate("subjects");
    
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    let allowedSubjects = classData.subjects;

    if (req.user.role === "teacher") {
      const TeacherAssignment = require("../models/TeacherAssignment");
      const Standard = require("../models/Standard");
      const Section = require("../models/Section");
      
      const standard = await Standard.findOne({ name: classData.standard });
      const section = await Section.findOne({ name: classData.section, standardId: standard?._id });
      
      if (standard && section) {
        const assignments = await TeacherAssignment.find({
          teacherId: req.user._id,
          standardId: standard._id,
          sectionId: section._id
        });
        
        const teacherSubjects = assignments.map(a => a.subject).filter(s => s);
        
        if (teacherSubjects.length > 0) {
          allowedSubjects = classData.subjects.filter(sub => 
            teacherSubjects.some(ts => ts.toLowerCase() === sub.name.toLowerCase())
          );
        }
      }
    }

    res.json({ success: true, data: allowedSubjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSubjects,
  assignSubjectToClass,
  getClassSubjects,
};
