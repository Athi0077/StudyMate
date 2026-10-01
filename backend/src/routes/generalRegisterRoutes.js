const express = require('express');
const router = express.Router();
const generalRegisterController = require('../controllers/generalRegisterController');
const { protect } = require('../middleware/authMiddleware');

// Route to register a student
router.post('/students', protect, generalRegisterController.registerStudent);

// Route to get students
router.get('/students', protect, generalRegisterController.getStudents);

// Route to update a student
router.put('/students/:id', protect, generalRegisterController.updateStudent);

// Route to delete a student
router.delete('/students/:id', protect, generalRegisterController.deleteStudent);

module.exports = router;
