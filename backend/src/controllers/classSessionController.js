const mongoose = require("mongoose");
const ClassSession = require("../models/ClassSession");
const Timetable = require("../models/Timetable");
const Class = require("../models/Class");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Homework = require("../models/Homework");
const SyllabusChapter = require("../models/SyllabusChapter");
const TeacherAssignment = require("../models/TeacherAssignment");

// Helper to determine if a period is morning or afternoon for summary
const determineSessionSummary = (periodTime, periodNumber) => {
  // Simple heuristic: if period starts before 12:00, it's morning.
  // Otherwise afternoon. We only trigger this for the FIRST morning period or FIRST afternoon period
  // but to be safe we can just use time.
  // Assuming periodTime is "HH:MM"
  if (!periodTime) return null;
  const hour = parseInt(periodTime.split(":")[0]);
  if (hour < 12) return "MORNING";
  return "AFTERNOON";
};

// @desc    Get classes assigned to teacher
// @route   GET /api/class-sessions/classes
// @access  Private (Teacher)
const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // A teacher can see classes they are class teacher of
    const classTeacherClasses = await Class.find({ teacherId, status: "active" });

    // Plus classes they are assigned to via TeacherAssignment
    const assignments = await TeacherAssignment.find({ teacherId }).populate("standardId").populate("sectionId");
    
    // We also need classes where they appear in Timetable as subjectTeacherId
    // But returning all active classes they are involved in is enough.
    const standardSectionMap = {};
    assignments.forEach(a => {
      if (a.standardId && a.sectionId) {
        standardSectionMap[`${a.standardId._id.toString()}-${a.sectionId._id.toString()}`] = true;
      }
    });

    const allActiveClasses = await Class.find({ status: "active" });
    
    const accessibleClasses = [];
    allActiveClasses.forEach(c => {
      const isClassTeacher = c.teacherId?.toString() === teacherId.toString();
      let isSubjectTeacher = false;
      if (c.standardId && c.sectionId) {
        isSubjectTeacher = standardSectionMap[`${c.standardId.toString()}-${c.sectionId.toString()}`] === true;
      } else {
        isSubjectTeacher = standardSectionMap[`${c.standard}-${c.section}`] === true; // legacy fallback
      }
      
      if (isClassTeacher || isSubjectTeacher) {
        accessibleClasses.push(c);
      }
    });

    // Remove duplicates
    const uniqueClassesMap = new Map();
    accessibleClasses.forEach(c => uniqueClassesMap.set(c._id.toString(), c));

    // Wait, let's also check timetables directly
    const timetables = await Timetable.find({ "periods.subjectTeacherId": teacherId }).populate("classId");
    timetables.forEach(t => {
      if (t.classId && t.classId.status === "active") {
        uniqueClassesMap.set(t.classId._id.toString(), t.classId);
      }
    });

    const finalClasses = Array.from(uniqueClassesMap.values());

    res.json({ success: true, data: finalClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get timetable with session statuses for a specific date
// @route   GET /api/class-sessions/:classId/timetable?date=YYYY-MM-DD
// @access  Private (Teacher)
const getTimetableForSession = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    const timetable = await Timetable.findOne({ classId })
      .populate('periods.subjectTeacherId', 'name');

    if (!timetable) {
      return res.json({ success: true, data: [], message: "No timetable found" });
    }

    // Filter periods for the given day
    const dayPeriods = timetable.periods.filter(p => p.day === dayOfWeek && p.type === 'regular');

    // Get existing class sessions for this date and class
    const sessions = await ClassSession.find({ classId, date });
    const sessionMap = {};
    sessions.forEach(s => {
      sessionMap[s.periodNumber] = s;
    });

    // Get teacher assignments for fallback authorization
    const teacherId = req.user._id;
    const assignments = await TeacherAssignment.find({ teacherId }).populate('standardId sectionId');
    const classDoc = await Class.findById(classId);

    // Merge status
    const result = dayPeriods.map(p => {
      const session = sessionMap[p.periodNumber];
      
      let isMyPeriod = false;
      if (p.subjectTeacherId && p.subjectTeacherId._id && p.subjectTeacherId._id.toString() === teacherId.toString()) {
        isMyPeriod = true;
      }

      // Fallback: Check TeacherAssignment
      if (!isMyPeriod && classDoc) {
        for (let a of assignments) {
          if (a.standardId && a.sectionId) {
            const aClassName = `${a.standardId.name} - ${a.sectionId.name}`;
            if (aClassName === classDoc.className) {
              if (
                (a.subjectId && p.subjectId && a.subjectId.toString() === p.subjectId.toString()) ||
                (a.subject && p.subject && a.subject.toLowerCase() === p.subject.toLowerCase()) || 
                a.isClassTeacher
              ) {
                isMyPeriod = true;
                break;
              }
            }
          }
        }
      }

      return {
        timetableId: timetable._id,
        period: p,
        sessionStatus: session ? session.sessionStatus : "NOT_STARTED",
        sessionId: session ? session._id : null,
        isMyPeriod
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Initialize or get existing class session
// @route   POST /api/class-sessions/initialize
// @access  Private (Teacher)
const initializeSession = async (req, res) => {
  try {
    const { classId, timetableId, periodNumber, date } = req.body;
    const teacherId = req.user._id;

    // Validate timetable and period
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) return res.status(404).json({ success: false, message: "Timetable not found" });

    const period = timetable.periods.find(p => p.periodNumber === periodNumber && p.type === 'regular');
    if (!period) return res.status(404).json({ success: false, message: "Period not found" });

    let isAuthorized = false;
    if (period.subjectTeacherId && period.subjectTeacherId.toString() === teacherId.toString()) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      const assignments = await TeacherAssignment.find({ teacherId }).populate('standardId sectionId');
      const classDoc = await Class.findById(classId);
      if (classDoc) {
        for (let a of assignments) {
          if (a.standardId && a.sectionId) {
            const aClassName = `${a.standardId.name} - ${a.sectionId.name}`;
            if (aClassName === classDoc.className) {
              if (
                (a.subjectId && period.subjectId && a.subjectId.toString() === period.subjectId.toString()) ||
                (a.subject && period.subject && a.subject.toLowerCase() === period.subject.toLowerCase()) || 
                a.isClassTeacher
              ) {
                isAuthorized = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "You are not authorized to start a session for this period" });
    }

    let session = await ClassSession.findOne({ classId, date, periodNumber, teacherId });
    if (!session) {
      session = await ClassSession.create({
        date,
        classId,
        timetableId,
        periodNumber,
        subject: period.subject,
        teacherId,
        sessionStatus: "NOT_STARTED"
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    if (error.code === 11000) {
      // Handle race condition
      const session = await ClassSession.findOne({ classId: req.body.classId, date: req.body.date, periodNumber: req.body.periodNumber });
      return res.json({ success: true, data: session });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session details by ID
// @route   GET /api/class-sessions/session/:sessionId
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.sessionId)
      .populate("classId", "className standard section")
      .populate("teacherId", "name email profilePic")
      .populate("attendance.studentId", "name email profilePic rollNumber")
      .populate("homeworkId");

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit attendance for session
// @route   PUT /api/class-sessions/:sessionId/attendance
// @access  Private (Teacher)
const saveSessionAttendance = async (req, res) => {
  try {
    const { attendance } = req.body;
    const session = await ClassSession.findById(req.params.sessionId).populate("timetableId");

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.teacherId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });

    session.attendance = attendance;
    
    if (session.sessionStatus === "NOT_STARTED") {
      session.sessionStatus = "ATTENDANCE_COMPLETED";
    }
    await session.save();

    // -- Generate Morning/Afternoon Summary transparently --
    const period = session.timetableId.periods.find(p => p.periodNumber === session.periodNumber);
    const timeSession = determineSessionSummary(period?.startTime, session.periodNumber);
    
    // We only create an AttendanceSession if it doesn't already exist for this class/date/timeSession
    // This allows the first period of the morning/afternoon to establish the summary
    if (timeSession) {
      const existingSummary = await AttendanceSession.findOne({
        classId: session.classId,
        attendanceDate: session.date,
        session: timeSession
      });

      if (!existingSummary) {
        // Create the summary
        await AttendanceSession.create({
          classId: session.classId,
          attendanceDate: session.date,
          session: timeSession,
          submittedBy: req.user._id,
          records: attendance.map(a => ({ studentId: a.studentId, status: a.status }))
        });

        // Sync to Daily Attendance collection for dashboard compatibility
        const attendanceOps = attendance.map(item => ({
          updateOne: {
            filter: { studentId: item.studentId, classId: session.classId, date: new Date(session.date).setHours(0,0,0,0), session: timeSession },
            update: {
              $set: {
                status: item.status,
                markedBy: req.user._id,
                markedAt: Date.now()
              }
            },
            upsert: true
          }
        }));

        if (attendanceOps.length > 0) {
          await Attendance.bulkWrite(attendanceOps);
        }
      }
    }

    res.json({ success: true, message: "Attendance saved", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit class record for session
// @route   PUT /api/class-sessions/:sessionId/class-record
// @access  Private (Teacher)
const saveClassRecord = async (req, res) => {
  try {
    const { chapterId, chapter, topic, classRecord, lessonStatus } = req.body;
    const session = await ClassSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.teacherId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });

    session.chapterId = chapterId || session.chapterId;
    session.chapter = chapter !== undefined ? chapter : session.chapter;
    session.topic = topic !== undefined ? topic : session.topic;
    session.classRecord = classRecord !== undefined ? classRecord : session.classRecord;
    session.lessonStatus = lessonStatus || session.lessonStatus;

    if (session.sessionStatus === "ATTENDANCE_COMPLETED") {
      session.sessionStatus = "CLASS_RECORD_COMPLETED";
    }

    await session.save();

    res.json({ success: true, message: "Class record saved", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit lesson log for session
// @route   PUT /api/class-sessions/:sessionId/lesson-log
// @access  Private (Teacher)
const saveLessonLog = async (req, res) => {
  try {
    const { lessonLog, pagesCovered, teachingMethod, teacherNotes } = req.body;
    const session = await ClassSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.teacherId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });

    session.lessonLog = lessonLog !== undefined ? lessonLog : session.lessonLog;
    session.pagesCovered = pagesCovered !== undefined ? pagesCovered : session.pagesCovered;
    session.teachingMethod = teachingMethod || session.teachingMethod;
    session.teacherNotes = teacherNotes !== undefined ? teacherNotes : session.teacherNotes;

    if (session.sessionStatus === "CLASS_RECORD_COMPLETED" || session.sessionStatus === "ATTENDANCE_COMPLETED") {
      session.sessionStatus = "LESSON_LOG_COMPLETED";
    }

    await session.save();

    res.json({ success: true, message: "Lesson log saved", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit homework for session
// @route   POST /api/class-sessions/:sessionId/homework
// @access  Private (Teacher)
const saveHomework = async (req, res) => {
  try {
    const { title, description, dueDate, priority, attachments } = req.body;
    const session = await ClassSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.teacherId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Integrate with existing Homework model
    const subjectRecord = await Timetable.findById(session.timetableId);
    let subjectId = null;
    
    // Find subject ID based on the subject string (or we can just skip if subjectId is required by Homework model and we can't find it easily)
    // Homework model requires subjectId. Let's try to find it.
    const Subject = require("../models/Subject");
    const subjectDoc = await Subject.findOne({ name: session.subject });
    
    if (!subjectDoc) {
      // If subject doesn't exist, we might fail Homework creation.
      // We will create a dummy subject or require frontend to send it.
      // To keep it simple, we use a fallback if possible, but actually we can create one if missing
    }

    let actualSubjectId = subjectDoc ? subjectDoc._id : null;
    if (!actualSubjectId) {
      // Try to get any subject ID for this class just to satisfy the constraint, 
      // or create one.
      const newSub = await Subject.create({ name: session.subject, code: session.subject.substring(0, 3).toUpperCase() });
      actualSubjectId = newSub._id;
    }

    const homework = await Homework.create({
      title: title || `Homework for ${session.subject}`,
      description,
      classId: session.classId,
      subjectId: actualSubjectId,
      teacherId: req.user._id,
      dueDate,
      priority: priority || "normal",
      attachments: attachments || [],
      status: "published",
      publishedAt: Date.now()
    });

    session.homeworkId = homework._id;
    if (session.sessionStatus === "LESSON_LOG_COMPLETED" || session.sessionStatus === "CLASS_RECORD_COMPLETED") {
      session.sessionStatus = "HOMEWORK_COMPLETED";
    }

    await session.save();

    res.json({ success: true, message: "Homework assigned", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete the session
// @route   PUT /api/class-sessions/:sessionId/complete
// @access  Private (Teacher)
const completeSession = async (req, res) => {
  try {
    const session = await ClassSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.teacherId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Unauthorized" });

    session.sessionStatus = "COMPLETED";
    session.completedAt = Date.now();

    await session.save();

    res.json({ success: true, message: "Session completed", data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session details for Principal monitoring
// @route   GET /api/class-sessions/monitoring
// @access  Private (Principal)
const getMonitoringData = async (req, res) => {
  try {
    const { date, classId } = req.query;
    
    let filter = {};
    if (date) filter.date = date;
    if (classId) filter.classId = classId;
    
    // We should filter by active sessions for the day
    const sessions = await ClassSession.find(filter)
      .populate("classId", "className standard section")
      .populate("teacherId", "name email")
      .sort({ periodNumber: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeacherClasses,
  getTimetableForSession,
  initializeSession,
  getSessionById,
  saveSessionAttendance,
  saveClassRecord,
  saveLessonLog,
  saveHomework,
  completeSession,
  getMonitoringData
};
