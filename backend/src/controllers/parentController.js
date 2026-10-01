const User = require("../models/User");

// @desc    Create a Parent account
// @route   POST /api/parents
// @access  Private (Principal)
const createParent = async (req, res) => {
  try {
    const { name, email, password, childrenIds } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (userExists.role !== 'parent') {
        return res.status(400).json({ success: false, message: "Email already registered to a non-parent account" });
      }
      
      if (req.user.role === "teacher") {
        const Class = require("../models/Class");
        const teacherClasses = await Class.find({ teacherId: req.user._id }).select("students");
        const studentIds = teacherClasses.flatMap(c => c.students.map(id => id.toString()));
        if (childrenIds && childrenIds.length > 0) {
          const hasUnauthorizedChild = childrenIds.some(id => !studentIds.includes(id.toString()));
          if (hasUnauthorizedChild) {
             return res.status(403).json({ success: false, message: "You can only link students from your assigned classes" });
          }
        }
      }

      if (childrenIds && childrenIds.length > 0) {
        const existingIds = userExists.children.map(id => id.toString());
        const newIds = childrenIds.filter(id => !existingIds.includes(id.toString()));
        if (newIds.length === 0) {
           return res.status(400).json({ success: false, message: "Students are already linked to this parent" });
        }
        userExists.children = [...existingIds, ...newIds];
        await userExists.save();
        return res.status(200).json({ success: true, message: "Parent exists. New students linked successfully.", data: userExists });
      } else {
        return res.status(400).json({ success: false, message: "Parent already exists. Please select students to link." });
      }
    }

    if (req.user.role === "teacher") {
      const Class = require("../models/Class");
      const teacherClasses = await Class.find({ teacherId: req.user._id }).select("students");
      const studentIds = teacherClasses.flatMap(c => c.students.map(id => id.toString()));
      
      if (childrenIds && childrenIds.length > 0) {
        const hasUnauthorizedChild = childrenIds.some(id => !studentIds.includes(id.toString()));
        if (hasUnauthorizedChild) {
           return res.status(403).json({ success: false, message: "You can only link students from your assigned classes" });
        }
      } else {
        return res.status(403).json({ success: false, message: "Teachers must select at least one student from their class" });
      }
    }

    const parent = await User.create({
      name,
      email,
      password,
      role: "parent",
      status: "active",
      children: childrenIds || []
    });

    res.status(201).json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Parents
// @route   GET /api/parents
// @access  Private (Principal)
const getParents = async (req, res) => {
  try {
    let parents = await User.find({ role: "parent" }).populate("children", "name studentId email");
    
    if (req.user.role === "teacher") {
      const Class = require("../models/Class");
      const teacherClasses = await Class.find({ teacherId: req.user._id }).select("students");
      const studentIds = teacherClasses.flatMap(c => c.students.map(id => id.toString()));
      
      parents = parents.filter(parent => 
        parent.children.some(child => studentIds.includes(child._id.toString()))
      );
    }
    
    res.json({ success: true, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Parent
// @route   PUT /api/parents/:id
// @access  Private (Principal, Teacher)
const updateParent = async (req, res) => {
  try {
    const parent = await User.findById(req.params.id);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    const { name, email, password, childrenIds } = req.body;
    
    if (email && email !== parent.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ success: false, message: "Email already taken" });
      parent.email = email;
    }
    
    if (name) parent.name = name;
    if (password) parent.password = password;
    
    if (childrenIds) {
       parent.children = childrenIds;
    }

    await parent.save();
    res.json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Parent
// @route   DELETE /api/parents/:id
// @access  Private (Principal, Teacher)
const deleteParent = async (req, res) => {
  try {
    const parent = await User.findById(req.params.id);
    if (!parent || parent.role !== "parent") {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }
    
    await parent.deleteOne();
    res.json({ success: true, message: "Parent deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createParent,
  getParents,
  updateParent,
  deleteParent
};
