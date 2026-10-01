const AcademicYear = require("../models/AcademicYear");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const PromotionBatch = require("../models/PromotionBatch");
const User = require("../models/User");

// Mapping rules (simplified for now, ideally fetched from a configurable collection)
const getNextStandard = (currentStandard) => {
  const mapping = {
    '1st Standard': '2nd Standard',
    '2nd Standard': '3rd Standard',
    '3rd Standard': '4th Standard',
    '4th Standard': '5th Standard',
    '5th Standard': '6th Standard',
    '6th Standard': '7th Standard',
    '7th Standard': '8th Standard',
    '8th Standard': '9th Standard',
    '9th Standard': '10th Standard',
    '10th Standard': 'Graduated'
  };
  return mapping[currentStandard];
};

// @desc    Preview Promotion
// @route   POST /api/promotions/preview
// @access  Private (Principal only)
const previewPromotion = async (req, res) => {
  try {
    const { sourceAcademicYearId, destinationAcademicYearId } = req.body;
    
    // Find all active enrollments for source year
    const sourceEnrollments = await Enrollment.find({ academicYearId: sourceAcademicYearId, status: "active" })
      .populate('studentId')
      .populate('classId');

    const previewResults = [];
    const classesCache = await Class.find({});

    for (const enr of sourceEnrollments) {
      const student = enr.studentId;
      const currentClass = enr.classId;

      if (!currentClass) continue;

      const nextStandardName = getNextStandard(currentClass.standard);
      
      let action = 'promote';
      let toClassId = null;
      let errorDetails = null;

      if (!nextStandardName) {
        action = 'exclude';
        errorDetails = 'No next standard mapping found';
      } else if (nextStandardName === 'Graduated') {
        action = 'graduate';
      } else {
        // Try to map to the same section in the next standard
        const destClass = classesCache.find(c => c.standard === nextStandardName && c.section === currentClass.section);
        if (destClass) {
          toClassId = destClass._id;
        } else {
          errorDetails = `Destination class ${nextStandardName} - ${currentClass.section} not found`;
        }
      }

      previewResults.push({
        studentId: student._id,
        studentName: student.name,
        email: student.email,
        fromClassId: currentClass._id,
        fromClassName: currentClass.className,
        toClassId,
        toClassName: toClassId ? classesCache.find(c => c._id.toString() === toClassId.toString())?.className : null,
        action,
        errorDetails
      });
    }

    res.json({ success: true, data: previewResults });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Confirm Promotion
// @route   POST /api/promotions/confirm
// @access  Private (Principal only)
const confirmPromotion = async (req, res) => {
  try {
    const { sourceAcademicYearId, destinationAcademicYearId, previewData } = req.body;

    const batch = await PromotionBatch.create({
      sourceAcademicYearId,
      destinationAcademicYearId,
      initiatedBy: req.user._id,
      status: "processing",
      results: []
    });

    let totalPromoted = 0, totalGraduated = 0, totalRepeating = 0, totalTransferred = 0, totalExcluded = 0, totalErrors = 0;

    for (const item of previewData) {
      try {
        const existingEnrollment = await Enrollment.findOne({ studentId: item.studentId, academicYearId: destinationAcademicYearId });
        if (existingEnrollment) {
           throw new Error("Student already enrolled in destination academic year");
        }

        // Handle graduation
        if (item.action === 'graduate') {
           // Update old enrollment
           await Enrollment.findOneAndUpdate(
             { studentId: item.studentId, academicYearId: sourceAcademicYearId },
             { status: 'graduated' }
           );
           totalGraduated++;
           batch.results.push({ studentId: item.studentId, action: item.action, fromClassId: item.fromClassId, status: "success" });
           continue;
        }

        if (item.action === 'exclude' || item.action === 'transfer') {
           if (item.action === 'transfer') totalTransferred++;
           if (item.action === 'exclude') totalExcluded++;
           batch.results.push({ studentId: item.studentId, action: item.action, fromClassId: item.fromClassId, status: "success" });
           continue;
        }

        // Normal promotion or repeating
        const sourceEnr = await Enrollment.findOne({ studentId: item.studentId, academicYearId: sourceAcademicYearId });
        
        await Enrollment.create({
          studentId: item.studentId,
          academicYearId: destinationAcademicYearId,
          classId: item.toClassId,
          status: "active",
          type: item.action === 'repeat' ? 'repeating' : 'promoted',
          previousEnrollmentId: sourceEnr ? sourceEnr._id : null,
          promotionDate: new Date()
        });

        if (item.action === 'promote') totalPromoted++;
        if (item.action === 'repeat') totalRepeating++;

        batch.results.push({ studentId: item.studentId, action: item.action, fromClassId: item.fromClassId, toClassId: item.toClassId, status: "success" });

      } catch (err) {
        totalErrors++;
        batch.results.push({ studentId: item.studentId, action: item.action, fromClassId: item.fromClassId, toClassId: item.toClassId, status: "error", errorDetails: err.message });
      }
    }

    batch.summary = {
      totalProcessed: previewData.length,
      totalPromoted, totalGraduated, totalRepeating, totalTransferred, totalExcluded, totalErrors
    };
    batch.status = totalErrors === 0 ? "completed" : "completed"; // Mark as completed even with errors for simplicity, errors are tracked
    batch.completedAt = new Date();
    await batch.save();

    res.json({ success: true, message: "Promotion batch processed", data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Promotion History
// @route   GET /api/promotions/history
// @access  Private (Principal only)
const getPromotionHistory = async (req, res) => {
  try {
    const history = await PromotionBatch.find()
       .populate('sourceAcademicYearId', 'name')
       .populate('destinationAcademicYearId', 'name')
       .populate('initiatedBy', 'name')
       .sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  previewPromotion,
  confirmPromotion,
  getPromotionHistory
};
