const Quiz = require("../models/Quiz");
const QuizSubmission = require("../models/QuizSubmission");
const TeacherAssignment = require("../models/TeacherAssignment");
const Standard = require("../models/Standard");
const Section = require("../models/Section");
const Class = require("../models/Class");
const User = require("../models/User");

// @desc    Get teacher's assigned standards, sections, and subjects for quiz creation
// @route   GET /api/fun-activities/teacher-assignments
// @access  Private (Teacher)
exports.getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Fetch all active assignments for this teacher
    const assignments = await TeacherAssignment.find({ teacherId })
      .populate("standardId", "name")
      .populate("sectionId", "name");

    // Format assigned classes and subjects cleanly for frontend cascading dropdowns
    const standardsMap = {};

    assignments.forEach((asg) => {
      if (!asg.standardId || !asg.sectionId) return;

      const stdId = asg.standardId._id.toString();
      const stdName = asg.standardId.name;
      const secId = asg.sectionId._id.toString();
      const secName = asg.sectionId.name;
      const subject = asg.subject;

      if (!standardsMap[stdId]) {
        standardsMap[stdId] = {
          standardId: stdId,
          standardName: stdName,
          sectionsMap: {},
        };
      }

      if (!standardsMap[stdId].sectionsMap[secId]) {
        standardsMap[stdId].sectionsMap[secId] = {
          sectionId: secId,
          sectionName: secName,
          subjects: new Set(),
        };
      }

      if (subject) {
        standardsMap[stdId].sectionsMap[secId].subjects.add(subject);
      }
    });

    const formattedAssignments = Object.values(standardsMap).map((std) => ({
      standardId: std.standardId,
      standardName: std.standardName,
      sections: Object.values(std.sectionsMap).map((sec) => ({
        sectionId: sec.sectionId,
        sectionName: sec.sectionName,
        subjects: Array.from(sec.subjects),
      })),
    }));

    res.json({ success: true, data: formattedAssignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new Quiz with Teacher Authorization Validation
// @route   POST /api/fun-activities/quizzes
// @access  Private (Teacher)
exports.createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      standardId,
      sectionId,
      subject,
      startDate,
      endDate,
      timeLimit,
      questions,
    } = req.body;

    const teacherId = req.user._id;

    if (!title || !standardId || !sectionId || !subject || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (title, standard, section, subject, start date, end date).",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quiz must have at least one question.",
      });
    }

    // STRICT BACKEND AUTHORIZATION: Verify teacher assignment
    const teacherAssignments = await TeacherAssignment.find({
      teacherId,
      standardId,
      sectionId,
    });

    if (!teacherAssignments || teacherAssignments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create a quiz for this class/subject.",
      });
    }

    const hasSubjectAccess = teacherAssignments.some((asg) => {
      if (asg.isClassTeacher) return true;
      if (asg.subject && asg.subject.toLowerCase() === subject.trim().toLowerCase()) return true;
      return false;
    });

    if (!hasSubjectAccess) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create a quiz for this class/subject.",
      });
    }

    // Validate Questions Structure & Calculate Total Marks
    let calculatedTotalMarks = 0;
    const validatedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !q.question.trim()) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} text is required.`,
        });
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} must have exactly 4 options (A, B, C, D).`,
        });
      }

      const validKeys = ["A", "B", "C", "D"];
      const formattedOptions = [];
      for (const key of validKeys) {
        const opt = q.options.find((o) => o.key === key);
        if (!opt || !opt.text || !opt.text.trim()) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1} option ${key} text is required.`,
          });
        }
        formattedOptions.push({ key, text: opt.text.trim() });
      }

      if (!q.correctAnswer || !validKeys.includes(q.correctAnswer)) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} must have a valid correct answer selected (A, B, C, or D).`,
        });
      }

      const qMarks = Number(q.marks) > 0 ? Number(q.marks) : 1;
      calculatedTotalMarks += qMarks;

      validatedQuestions.push({
        question: q.question.trim(),
        options: formattedOptions,
        correctAnswer: q.correctAnswer,
        marks: qMarks,
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start or end date format." });
    }

    if (end <= start) {
      return res.status(400).json({ success: false, message: "End date must be after start date." });
    }

    const newQuiz = await Quiz.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      standardId,
      sectionId,
      subject: subject.trim(),
      createdBy: teacherId,
      questions: validatedQuestions,
      totalMarks: calculatedTotalMarks,
      startDate: start,
      endDate: end,
      timeLimit: Number(timeLimit) > 0 ? Number(timeLimit) : 0,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Quiz created and assigned successfully!",
      data: newQuiz,
    });
  } catch (error) {
    console.error("Error in createQuiz:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quizzes created by logged-in teacher
// @route   GET /api/fun-activities/quizzes/teacher
// @access  Private (Teacher)
exports.getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const quizzes = await Quiz.find({ createdBy: teacherId })
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 });

    // Enhance quizzes with submission statistics
    const enhancedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizObj = quiz.toObject();
        const submissionsCount = await QuizSubmission.countDocuments({ quizId: quiz._id });

        // Get class student count
        const stdName = quiz.standardId?.name;
        const secName = quiz.sectionId?.name;
        let totalEnrolled = 0;
        if (stdName && secName) {
          const studentClass = await Class.findOne({
            standard: stdName,
            section: secName,
          });
          if (studentClass && studentClass.students) {
            totalEnrolled = studentClass.students.length;
          }
        }

        let averageScore = 0;
        if (submissionsCount > 0) {
          const aggregate = await QuizSubmission.aggregate([
            { $match: { quizId: quiz._id } },
            { $group: { _id: null, avgPercentage: { $avg: "$percentage" } } },
          ]);
          if (aggregate.length > 0) {
            averageScore = Math.round(aggregate[0].avgPercentage);
          }
        }

        const now = new Date();
        let displayStatus = quiz.status;
        if (now > quiz.endDate) displayStatus = "closed";
        else if (now < quiz.startDate) displayStatus = "coming_soon";

        return {
          ...quizObj,
          displayStatus,
          totalSubmissions: submissionsCount,
          totalEnrolled,
          averageScore,
        };
      })
    );

    res.json({ success: true, data: enhancedQuizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quizzes assigned to student's standard + section
// @route   GET /api/fun-activities/quizzes/student
// @access  Private (Student)
exports.getStudentQuizzes = async (req, res) => {
  try {
    let studentId = req.user._id;

    if (req.user.role === "parent") {
      const parentUser = await User.findById(req.user._id);
      if (!parentUser || !parentUser.children || parentUser.children.length === 0) {
        return res.status(404).json({ success: false, message: "No children linked to account." });
      }
      studentId = req.query.studentId || parentUser.children[0];
    }

    // Find student's class
    const studentClass = await Class.findOne({ students: studentId });
    if (!studentClass) {
      return res.json({ success: true, data: [] });
    }

    const standardDoc = await Standard.findOne({ name: studentClass.standard });
    if (!standardDoc) return res.json({ success: true, data: [] });

    const sectionDoc = await Section.findOne({
      name: studentClass.section,
      standardId: standardDoc._id,
    });
    if (!sectionDoc) return res.json({ success: true, data: [] });

    // Fetch quizzes assigned to student's exact Standard + Section
    const quizzes = await Quiz.find({
      standardId: standardDoc._id,
      sectionId: sectionDoc._id,
    })
      .populate("createdBy", "name")
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 });

    const now = new Date();
    const studentQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const quizObj = quiz.toObject();

        // Check if student has submitted
        const submission = await QuizSubmission.findOne({
          quizId: quiz._id,
          studentId,
        });

        let status = "active";
        if (submission) {
          status = "completed";
        } else if (now > quiz.endDate) {
          status = "closed";
        } else if (now < quiz.startDate) {
          status = "coming_soon";
        }

        // Don't leak answers in student list
        delete quizObj.questions;

        return {
          ...quizObj,
          questionCount: quiz.questions ? quiz.questions.length : 0,
          studentStatus: status,
          submission: submission
            ? {
                score: submission.score,
                totalMarks: submission.totalMarks,
                percentage: submission.percentage,
                submittedAt: submission.submittedAt,
                timeTaken: submission.timeTaken,
              }
            : null,
        };
      })
    );

    res.json({ success: true, data: studentQuizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single Quiz by ID (sanitized for student if unsubmitted)
// @route   GET /api/fun-activities/quizzes/:id
// @access  Private
exports.getQuizById = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId)
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .populate("createdBy", "name email");

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    const quizObj = quiz.toObject();

    if (req.user.role === "student") {
      let studentId = req.user._id;

      // Check student is in assigned class
      const studentClass = await Class.findOne({ students: studentId });
      if (
        !studentClass ||
        studentClass.standard !== quiz.standardId?.name ||
        studentClass.section !== quiz.sectionId?.name
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this quiz.",
        });
      }

      const submission = await QuizSubmission.findOne({ quizId: quiz._id, studentId });
      quizObj.submission = submission;

      // If NOT submitted yet, hide correct answers from response
      if (!submission) {
        quizObj.questions = quizObj.questions.map((q) => {
          const sanitizedQ = { ...q };
          delete sanitizedQ.correctAnswer;
          return sanitizedQ;
        });
      }
    }

    res.json({ success: true, data: quizObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Quiz answers by Student
// @route   POST /api/fun-activities/quizzes/:id/submit
// @access  Private (Student)
exports.submitQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers, timeTaken } = req.body; // answers: [{ questionId, selectedAnswer }]
    const studentId = req.user._id;

    const quiz = await Quiz.findById(quizId).populate("standardId").populate("sectionId");
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    // Verify student is enrolled in the quiz's standard and section
    const studentClass = await Class.findOne({ students: studentId });
    if (
      !studentClass ||
      studentClass.standard !== quiz.standardId?.name ||
      studentClass.section !== quiz.sectionId?.name
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to participate in this quiz.",
      });
    }

    const now = new Date();

    if (now < quiz.startDate) {
      return res.status(400).json({ success: false, message: "This quiz has not started yet." });
    }

    if (now > quiz.endDate) {
      return res.status(400).json({ success: false, message: "This quiz is closed." });
    }

    // STRICT BACKEND CHECK: Prevent duplicate submissions
    const existingSubmission = await QuizSubmission.findOne({ quizId: quiz._id, studentId });
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this quiz.",
      });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "Invalid answers submitted." });
    }

    // SERVER-SIDE SCORE CALCULATION
    let totalScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const processedAnswers = [];

    quiz.questions.forEach((q) => {
      const studentAnswer = answers.find(
        (a) => a.questionId && a.questionId.toString() === q._id.toString()
      );

      const selectedAnswer = studentAnswer ? studentAnswer.selectedAnswer : "";
      const isCorrect = selectedAnswer === q.correctAnswer;
      const marksObtained = isCorrect ? q.marks : 0;

      if (isCorrect) {
        totalScore += marksObtained;
        correctCount++;
      } else {
        wrongCount++;
      }

      processedAnswers.push({
        questionId: q._id,
        selectedAnswer: selectedAnswer || "N/A",
        isCorrect,
        marksObtained,
      });
    });

    const totalMarks = quiz.totalMarks || 1;
    const percentage = Math.round((totalScore / totalMarks) * 100);

    const submission = await QuizSubmission.create({
      quizId: quiz._id,
      studentId,
      answers: processedAnswers,
      score: totalScore,
      totalMarks,
      percentage,
      startedAt: new Date(),
      submittedAt: new Date(),
      timeTaken: Number(timeTaken) || 0,
    });

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully 🎉",
      data: {
        submissionId: submission._id,
        score: totalScore,
        totalMarks,
        percentage,
        correctCount,
        wrongCount,
        timeTaken: submission.timeTaken,
      },
    });
  } catch (error) {
    console.error("Error in submitQuiz:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Detailed Quiz Results for Teacher / Principal
// @route   GET /api/fun-activities/quizzes/:id/results
// @access  Private (Teacher / Principal)
exports.getQuizResults = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId)
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .populate("createdBy", "name email");

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    // Teacher authorization check
    if (req.user.role === "teacher" && quiz.createdBy._id.toString() !== req.user._id.toString()) {
      const teacherAssignments = await TeacherAssignment.find({
        teacherId: req.user._id,
        standardId: quiz.standardId._id,
        sectionId: quiz.sectionId._id,
      });
      if (!teacherAssignments || teacherAssignments.length === 0) {
        return res.status(403).json({ success: false, message: "Unauthorized access to quiz results." });
      }
    }

    // Find class to list all enrolled students
    const stdName = quiz.standardId?.name;
    const secName = quiz.sectionId?.name;
    const studentClass = await Class.findOne({ standard: stdName, section: secName }).populate(
      "students",
      "name email studentId grNumber profilePic"
    );

    const submissions = await QuizSubmission.find({ quizId: quiz._id }).populate(
      "studentId",
      "name email studentId grNumber profilePic"
    );

    const submissionMap = {};
    submissions.forEach((sub) => {
      if (sub.studentId) {
        submissionMap[sub.studentId._id.toString()] = sub;
      }
    });

    const studentsList = studentClass && studentClass.students ? studentClass.students : [];

    const studentResults = studentsList.map((st) => {
      const sub = submissionMap[st._id.toString()];
      if (sub) {
        return {
          studentId: st._id,
          name: st.name,
          email: st.email,
          grNumber: st.grNumber || st.studentId || "-",
          status: "Completed",
          score: sub.score,
          totalMarks: sub.totalMarks,
          percentage: sub.percentage,
          submittedAt: sub.submittedAt,
          timeTaken: sub.timeTaken,
        };
      } else {
        return {
          studentId: st._id,
          name: st.name,
          email: st.email,
          grNumber: st.grNumber || st.studentId || "-",
          status: "Not Attempted",
          score: 0,
          totalMarks: quiz.totalMarks,
          percentage: 0,
          submittedAt: null,
          timeTaken: 0,
        };
      }
    });

    const participatedCount = submissions.length;
    const totalEnrolled = studentsList.length;
    const notParticipatedCount = Math.max(0, totalEnrolled - participatedCount);

    let averageScorePercentage = 0;
    if (participatedCount > 0) {
      const sumPercentage = submissions.reduce((acc, curr) => acc + curr.percentage, 0);
      averageScorePercentage = Math.round(sumPercentage / participatedCount);
    }

    res.json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          standard: stdName,
          section: secName,
          subject: quiz.subject,
          totalMarks: quiz.totalMarks,
          questionCount: quiz.questions.length,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
          timeLimit: quiz.timeLimit,
          creatorName: quiz.createdBy?.name,
        },
        stats: {
          totalStudents: totalEnrolled,
          participated: participatedCount,
          notParticipated: notParticipatedCount,
          averageScore: averageScorePercentage,
        },
        studentResults,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Principal Fun Activities Overview & Analytics
// @route   GET /api/fun-activities/principal/overview
// @access  Private (Principal)
exports.getPrincipalOverview = async (req, res) => {
  try {
    const { teacherId, standardId, sectionId, subject } = req.query;

    let query = {};
    if (teacherId) query.createdBy = teacherId;
    if (standardId) query.standardId = standardId;
    if (sectionId) query.sectionId = sectionId;
    if (subject) query.subject = { $regex: new RegExp(`^${subject}$`, "i") };

    const quizzes = await Quiz.find(query)
      .populate("createdBy", "name email")
      .populate("standardId", "name")
      .populate("sectionId", "name")
      .sort({ createdAt: -1 });

    const now = new Date();
    let totalQuizzes = quizzes.length;
    let activeQuizzes = 0;
    let completedQuizzes = 0;

    const formattedQuizzes = await Promise.all(
      quizzes.map(async (quiz) => {
        const isClosed = now > quiz.endDate;
        const isComingSoon = now < quiz.startDate;

        if (isClosed) completedQuizzes++;
        else if (!isComingSoon) activeQuizzes++;

        const submissions = await QuizSubmission.find({ quizId: quiz._id });
        const stdName = quiz.standardId?.name;
        const secName = quiz.sectionId?.name;

        let totalEnrolled = 0;
        if (stdName && secName) {
          const studentClass = await Class.findOne({ standard: stdName, section: secName });
          if (studentClass && studentClass.students) {
            totalEnrolled = studentClass.students.length;
          }
        }

        let avgScore = 0;
        if (submissions.length > 0) {
          const sumPerc = submissions.reduce((acc, s) => acc + s.percentage, 0);
          avgScore = Math.round(sumPerc / submissions.length);
        }

        return {
          id: quiz._id,
          title: quiz.title,
          teacherName: quiz.createdBy?.name || "Teacher",
          standard: stdName || "-",
          section: secName || "-",
          subject: quiz.subject,
          startDate: quiz.startDate,
          endDate: quiz.endDate,
          timeLimit: quiz.timeLimit,
          status: isClosed ? "closed" : isComingSoon ? "coming_soon" : "active",
          participatedCount: submissions.length,
          totalEnrolled,
          averageScore: avgScore,
        };
      })
    );

    const totalParticipation = await QuizSubmission.countDocuments();

    res.json({
      success: true,
      data: {
        metrics: {
          totalQuizzes,
          activeQuizzes,
          completedQuizzes,
          totalParticipation,
        },
        quizzes: formattedQuizzes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Quiz
// @route   DELETE /api/fun-activities/quizzes/:id
// @access  Private (Teacher creator / Principal)
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found." });
    }

    if (req.user.role === "teacher" && quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this quiz." });
    }

    await Quiz.findByIdAndDelete(quizId);
    await QuizSubmission.deleteMany({ quizId });

    res.json({ success: true, message: "Quiz deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
