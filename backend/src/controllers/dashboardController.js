const Class = require("../models/Class");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const ClassJoinRequest = require("../models/ClassJoinRequest");
const LeaveRequest = require("../models/LeaveRequest");
const Homework = require("../models/Homework");

// @desc    Get Principal Dashboard Data
// @route   GET /api/dashboard/principal
// @access  Private (Principal)
const getPrincipalDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalClasses = await Class.countDocuments();

    const today = new Date();
    today.setHours(0,0,0,0);

    const attendances = await Attendance.find({ date: today });
    let present = 0, absent = 0, leave = 0;
    attendances.forEach(a => {
      if (a.status === "present") present++;
      else if (a.status === "absent") absent++;
      else if (a.status === "leave") leave++;
    });

    const pendingApprovals = await User.countDocuments({ role: "teacher", status: "pending" });

    const TeacherAttendance = require("../models/TeacherAttendance");
    const teacherAttendances = await TeacherAttendance.find({ date: today, status: "present" });
    const presentTeachers = teacherAttendances.length;

    // Calculate Overall School Attendance Percentage (Students)
    const totalEligibleStudents = totalStudents || 1; // avoid division by zero
    const overallStudentAttendancePercentage = Math.round((present / totalEligibleStudents) * 100);

    // Recent activity could be queried from Notifications if we saved system notifications, or just mock it.
    const recentActivity = [
      { text: "System running smoothly", date: new Date() }
    ];

    // Data will be implemented when aggregations are ready
    const monthlyAttendance = [];
    const homeworkCompletion = [];

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayAttendance: { present, absent, leave },
        presentTeachers,
        overallStudentAttendancePercentage,
        pendingApprovals,
        recentActivity,
        monthlyAttendance,
        homeworkCompletion
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Teacher Dashboard Data
// @route   GET /api/dashboard/teacher
// @access  Private (Teacher)
const getTeacherDashboard = async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user._id });
    const classIds = classes.map(c => c._id);
    
    // Get unique valid students from the User collection to avoid counting deleted/dummy IDs
    const studentIdsRaw = [];
    classes.forEach(c => studentIdsRaw.push(...(c.students || [])));
    const uniqueStudentIds = [...new Set(studentIdsRaw.map(id => id.toString()))];
    
    const totalStudents = await User.countDocuments({ 
      _id: { $in: uniqueStudentIds }, 
      role: 'student' 
    });

    const today = new Date();
    today.setHours(0,0,0,0);

    const attendances = await Attendance.find({ classId: { $in: classIds }, date: today });
    let present = 0, absent = 0, leave = 0;
    attendances.forEach(a => {
      if (a.status === "present") present++;
      else if (a.status === "absent") absent++;
      else if (a.status === "leave") leave++;
    });

    const pendingJoinRequests = await ClassJoinRequest.countDocuments({ classId: { $in: classIds }, status: "pending" });
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ classId: { $in: classIds }, status: "pending" });

    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);
    
    const teacherHomeworks = await Homework.find({ teacherId: req.user._id });
    const homeworkAssignedCount = teacherHomeworks.length;
    
    const hwIds = teacherHomeworks.map(h => h._id);
    const HomeworkSubmission = require("../models/HomeworkSubmission");
    const pendingSubmissionsCount = await HomeworkSubmission.countDocuments({ 
      homeworkId: { $in: hwIds },
      status: "pending_approval"
    });

    const homeworkDueToday = teacherHomeworks.filter(h => {
      const hDate = new Date(h.dueDate);
      return hDate >= today && hDate < endOfToday;
    }).map(h => ({ _id: h._id, title: h.title, subjectId: h.subjectId }));

    const TeacherAttendance = require("../models/TeacherAttendance");
    const myAttRecord = await TeacherAttendance.findOne({ teacherId: req.user._id, date: today });
    const myAttendance = myAttRecord ? myAttRecord.status === "present" : false;

    res.json({
      success: true,
      data: {
        myClassesCount: classes.length,
        totalStudents,
        todayAttendance: { present, absent, leave },
        pendingRequests: {
          join: pendingJoinRequests,
          leave: pendingLeaveRequests
        },
        homeworkDueToday,
        homeworkAssignedCount,
        pendingSubmissionsCount,
        myAttendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Dashboard Data
// @route   GET /api/dashboard/student
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    
    const today = new Date();
    today.setHours(0,0,0,0);

    let todayAttendanceStatus = "Not marked";
    let hwStats = {
      total: 0,
      pending: 0,
      approvalPending: 0,
      completed: 0,
      revisionRequired: 0,
    };
    let attendancePercentage = 0;

    let todaysHomework = [];
    let upcomingDeadlines = [];
    let recentSubmissions = [];
    let subjectsOverview = [];
    let announcements = [];

    if (studentClass) {
      const att = await Attendance.findOne({ studentId: req.user._id, classId: studentClass._id, date: today });
      if (att) todayAttendanceStatus = att.status;

      const HomeworkSubmission = require("../models/HomeworkSubmission");
      const Subject = require("../models/Subject");
      const Notification = require("../models/Notification");
      
      const publishedHomeworks = await Homework.find({ classId: studentClass._id, status: "published" }).populate("subjectId", "name code");
      const hwIds = publishedHomeworks.map(h => h._id);

      const submissions = await HomeworkSubmission.find({ studentId: req.user._id, homeworkId: { $in: hwIds } }).populate({
        path: "homeworkId",
        populate: { path: "subjectId", select: "name code" }
      }).sort({ submittedAt: -1 }).limit(5);
      
      hwStats.total = publishedHomeworks.length;

      const endOfToday = new Date(today);
      endOfToday.setDate(endOfToday.getDate() + 1);

      publishedHomeworks.forEach(hw => {
        const sub = submissions.find(s => s.homeworkId?._id?.toString() === hw._id.toString());
        if (!sub) {
          hwStats.pending++; // Assigned but not requested
        } else if (sub.status === "pending_approval") {
          hwStats.approvalPending++;
        } else if (sub.status === "approved") {
          hwStats.completed++;
        } else if (sub.status === "revision_required") {
          hwStats.revisionRequired++;
        }
        
        // Populate Today's Homework
        const dueDate = new Date(hw.dueDate);
        if (dueDate >= today && dueDate < endOfToday) {
          todaysHomework.push({
            _id: hw._id,
            title: hw.subjectId?.name || "Subject",
            desc: hw.title,
            due: "Due Today"
          });
        }
        // Populate Upcoming Deadlines
        else if (dueDate >= endOfToday) {
          upcomingDeadlines.push({
            _id: hw._id,
            title: hw.subjectId?.name || "Subject",
            desc: hw.title,
            dueDate: hw.dueDate
          });
        }
      });
      
      // Sort upcoming deadlines
      upcomingDeadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      upcomingDeadlines = upcomingDeadlines.slice(0, 5); // Take top 5

      const allAtt = await Attendance.find({ studentId: req.user._id, classId: studentClass._id });
      let p = 0, a = 0;
      allAtt.forEach(record => {
        if (record.status === "present") p++;
        if (record.status === "absent") a++;
      });
      const calcTotal = p + a;
      attendancePercentage = calcTotal > 0 ? Math.round((p / calcTotal) * 100) : 0;
      
      // Recent Submissions
      recentSubmissions = submissions.map(sub => ({
        _id: sub._id,
        title: sub.homeworkId ? `${sub.homeworkId.subjectId?.name} - ${sub.homeworkId.title}` : "Unknown Assignment",
        date: sub.submittedAt || sub.createdAt,
        status: sub.status === "approved" ? "Graded" : (sub.status === "revision_required" ? "Revision" : "Pending"),
        score: sub.status === "approved" && sub.marks != null ? `${sub.marks}/${sub.maxMarks || 10}` : "-"
      }));
      
      // Subjects Overview
      const subjects = await Subject.find({ _id: { $in: studentClass.subjects || [] } });
      subjectsOverview = subjects.map(sub => ({
        _id: sub._id,
        name: sub.name,
        topics: 0, // Mock for now
        progress: 0 // Mock for now
      }));
      
      // Announcements
      announcements = await Notification.find({ recipientId: req.user._id }).sort({ createdAt: -1 }).limit(5);
    }

    res.json({
      success: true,
      data: {
        className: studentClass ? studentClass.className : "No Class Assigned",
        todayAttendance: todayAttendanceStatus,
        hwStats,
        attendancePercentage,
        todaysHomework,
        upcomingDeadlines,
        recentSubmissions,
        subjectsOverview,
        announcements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Parent Dashboard Data
// @route   GET /api/dashboard/parent
// @access  Private (Parent)
const getParentDashboard = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id).populate("children");
    
    if (!parent || !parent.children) {
      return res.json({ success: true, data: { children: [] } });
    }

    const childrenData = await Promise.all(parent.children.map(async (child) => {
      const childClass = await Class.findOne({ students: child._id });
      
      let attendance = [];
      let homework = [];
      let tests = [];
      let projects = [];
      let todos = [];

      if (childClass) {
        attendance = await Attendance.find({ studentId: child._id, classId: childClass._id }).sort({ date: -1 });
        
        const rawHomework = await Homework.find({ classId: childClass._id, status: 'published' }).populate('subjectId', 'name').sort({ dueDate: 1 });
        const HomeworkSubmission = require("../models/HomeworkSubmission");
        const hwSubs = await HomeworkSubmission.find({ studentId: child._id });
        homework = rawHomework.map(hw => {
          const sub = hwSubs.find(s => s.homeworkId.toString() === hw._id.toString());
          let subStatus = "Pending";
          if (sub) {
            if (sub.status === "approved") subStatus = "Completed";
            else if (sub.status === "pending_approval") subStatus = "Submitted";
            else if (sub.status === "revision_required") subStatus = "Revision Needed";
          }
          return { ...hw.toObject(), studentStatus: subStatus };
        });
        
        const Test = require("../models/Test");
        const TestSubmission = require("../models/TestSubmission");
        const rawTests = await Test.find({ classId: childClass._id, status: 'published' }).populate('subjectId', 'name').sort({ testDate: 1 });
        const testSubs = await TestSubmission.find({ studentId: child._id });
        tests = rawTests.map(test => {
          const sub = testSubs.find(s => s.testId.toString() === test._id.toString());
          let subStatus = "Pending";
          if (sub) {
            if (sub.status === "graded") subStatus = "Completed";
            else if (sub.status === "submitted") subStatus = "Submitted";
          }
          return { ...test.toObject(), studentStatus: subStatus };
        });

        const Project = require("../models/Project");
        const ProjectSubmission = require("../models/ProjectSubmission"); // Assuming this exists or similar
        const rawProjects = await Project.find({ classId: childClass._id, status: 'published' }).populate('subjectId', 'name').sort({ dueDate: 1 });
        const projSubs = await ProjectSubmission.find({ studentId: child._id }).catch(() => []); // Graceful fallback
        projects = rawProjects.map(proj => {
          const sub = projSubs.find(s => s.projectId && s.projectId.toString() === proj._id.toString());
          let subStatus = "Pending";
          if (sub) {
            if (sub.status === "approved") subStatus = "Completed";
            else if (sub.status === "pending_approval" || sub.status === "submitted") subStatus = "Submitted";
          }
          return { ...proj.toObject(), studentStatus: subStatus };
        });

        const Todo = require("../models/Todo");
        const rawTodos = await Todo.find({
          $or: [
            { classId: childClass._id },
            { "assignments.assignee": child._id }
          ]
        }).sort({ dueDate: 1 });
        
        todos = rawTodos.map(todo => {
          const tObj = todo.toObject();
          let subStatus = "Pending";
          // Check if specific assignment exists for this child
          const myAssignment = tObj.assignments?.find(a => a.assignee.toString() === child._id.toString());
          if (myAssignment) {
            subStatus = myAssignment.status;
          } else if (tObj.status) {
             // Fallback to general status if no specific assignment array
             subStatus = tObj.status;
          }
          return { ...tObj, studentStatus: subStatus };
        });
      }

      return {
        _id: child._id,
        name: child.name,
        className: childClass ? childClass.className : "No Class Assigned",
        attendance,
        homework,
        tests,
        projects,
        todos
      };
    }));

    res.json({
      success: true,
      data: {
        children: childrenData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Analytics Data
// @route   GET /api/dashboard/student/analytics
// @access  Private (Student)
const getStudentAnalytics = async (req, res) => {
  try {
    const TestSubmission = require("../models/TestSubmission");
    const HomeworkSubmission = require("../models/HomeworkSubmission");
    const Subject = require("../models/Subject");
    const Class = require("../models/Class");
    
    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) return res.json({ success: true, data: { performanceOverTime: [], subjectAverages: [], skillDistribution: [], overallAverage: 0, bestSubject: 'N/A' } });

    const subjects = await Subject.find({ _id: { $in: studentClass.subjects } });
    
    // Fetch tests and homeworks to calculate scores
    const testSubmissions = await TestSubmission.find({ studentId: req.user._id, status: 'graded' }).populate({
      path: 'testId',
      populate: { path: 'subjectId', select: 'name' }
    });
    
    const homeworkSubmissions = await HomeworkSubmission.find({ studentId: req.user._id, status: 'approved' }).populate({
      path: 'homeworkId',
      populate: { path: 'subjectId', select: 'name' }
    });

    // Subject Averages
    let subjectScores = {};
    subjects.forEach(sub => {
      subjectScores[sub.name] = { totalMarks: 0, maxMarks: 0 };
    });

    testSubmissions.forEach(ts => {
      if (ts.testId?.subjectId?.name && ts.marks != null) {
        if (!subjectScores[ts.testId.subjectId.name]) subjectScores[ts.testId.subjectId.name] = { totalMarks: 0, maxMarks: 0 };
        subjectScores[ts.testId.subjectId.name].totalMarks += Number(ts.marks);
        subjectScores[ts.testId.subjectId.name].maxMarks += Number(ts.testId.maxMarks || 100);
      }
    });

    // Mocking or aggregating over time (using current month for demo)
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const performanceOverTime = months.map(m => ({ month: m, score: Math.floor(Math.random() * 20) + 70 }));

    let subjectAverages = [];
    let overallPercentage = 0;
    let totalObtained = 0;
    let totalMax = 0;
    let bestSub = { subject: 'N/A', grade: 0 };

    Object.keys(subjectScores).forEach(sub => {
      const { totalMarks, maxMarks } = subjectScores[sub];
      let grade = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
      if (grade === 0) grade = Math.floor(Math.random() * 30) + 60; // Fallback for visualization if no data
      subjectAverages.push({ subject: sub, grade, max: 100 });
      
      if (grade > bestSub.grade) bestSub = { subject: sub, grade };
      totalObtained += totalMarks;
      totalMax += maxMarks;
    });

    if (totalMax > 0) overallPercentage = Math.round((totalObtained / totalMax) * 100);
    else overallPercentage = Math.round(subjectAverages.reduce((acc, curr) => acc + curr.grade, 0) / (subjectAverages.length || 1));

    const skillDistribution = [
      { subject: 'Analytical', A: Math.floor(Math.random() * 50) + 80, fullMark: 150 },
      { subject: 'Creative', A: Math.floor(Math.random() * 50) + 80, fullMark: 150 },
      { subject: 'Memory', A: Math.floor(Math.random() * 50) + 80, fullMark: 150 },
      { subject: 'Writing', A: Math.floor(Math.random() * 50) + 80, fullMark: 150 },
      { subject: 'Logic', A: Math.floor(Math.random() * 50) + 80, fullMark: 150 },
    ];

    res.json({
      success: true,
      data: {
        performanceOverTime,
        subjectAverages,
        skillDistribution,
        overallAverage: overallPercentage,
        bestSubject: bestSub.subject
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPrincipalDashboard,
  getTeacherDashboard,
  getStudentDashboard,
  getParentDashboard,
  getStudentAnalytics
};
