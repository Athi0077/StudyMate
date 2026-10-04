const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../src/models/User');
const Standard = require('../src/models/Standard');
const Section = require('../src/models/Section');
const Class = require('../src/models/Class');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Quiz = require('../src/models/Quiz');
const QuizSubmission = require('../src/models/QuizSubmission');
const jwt = require('jsonwebtoken');

describe('StudyMate — Fun Activities Quiz Module Tests', () => {
  let teacherToken, teacherUser;
  let unauthorizedTeacherToken, unauthorizedTeacherUser;
  let student6AToken, student6AUser;
  let student7BToken, student7BUser;
  let principalToken, principalUser;

  let std6, secA, std7, secB;
  let class6A, class7B;

  beforeEach(async () => {
    // 1. Create Principal
    principalUser = await User.create({
      name: 'Principal User',
      email: 'principal@test.com',
      password: 'password123',
      role: 'principal',
      status: 'active',
    });
    principalToken = jwt.sign({ id: principalUser._id, role: 'principal' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    // 2. Create Teachers
    teacherUser = await User.create({
      name: 'Teacher 1',
      email: 'teacher1@test.com',
      password: 'password123',
      role: 'teacher',
      status: 'active',
    });
    teacherToken = jwt.sign({ id: teacherUser._id, role: 'teacher' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    unauthorizedTeacherUser = await User.create({
      name: 'Teacher 2',
      email: 'teacher2@test.com',
      password: 'password123',
      role: 'teacher',
      status: 'active',
    });
    unauthorizedTeacherToken = jwt.sign({ id: unauthorizedTeacherUser._id, role: 'teacher' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    // 3. Create Students
    student6AUser = await User.create({
      name: 'Student 6A',
      email: 'student6a@test.com',
      password: 'password123',
      role: 'student',
      status: 'active',
    });
    student6AToken = jwt.sign({ id: student6AUser._id, role: 'student' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    student7BUser = await User.create({
      name: 'Student 7B',
      email: 'student7b@test.com',
      password: 'password123',
      role: 'student',
      status: 'active',
    });
    student7BToken = jwt.sign({ id: student7BUser._id, role: 'student' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    // 4. Create Standards & Sections
    std6 = await Standard.create({ name: '6th', createdBy: principalUser._id });
    secA = await Section.create({ name: 'A', standardId: std6._id, createdBy: principalUser._id });

    std7 = await Standard.create({ name: '7th', createdBy: principalUser._id });
    secB = await Section.create({ name: 'B', standardId: std7._id, createdBy: principalUser._id });

    // 5. Create Classes and assign students
    class6A = await Class.create({
      standard: '6th',
      section: 'A',
      className: '6th - A',
      teacherId: teacherUser._id,
      students: [student6AUser._id],
      status: 'active',
    });

    class7B = await Class.create({
      standard: '7th',
      section: 'B',
      className: '7th - B',
      teacherId: unauthorizedTeacherUser._id,
      students: [student7BUser._id],
      status: 'active',
    });

    // 6. Assign Teacher 1 to 6th-A Tamil & 7th-B English
    await TeacherAssignment.create({
      teacherId: teacherUser._id,
      standardId: std6._id,
      sectionId: secA._id,
      subject: 'Tamil',
      assignedBy: principalUser._id,
    });

    await TeacherAssignment.create({
      teacherId: teacherUser._id,
      standardId: std7._id,
      sectionId: secB._id,
      subject: 'English',
      assignedBy: principalUser._id,
    });
  });

  describe('1. Teacher Authorization for Quiz Creation', () => {
    it('allows Teacher 1 to create quiz for assigned class & subject (6th-A Tamil) -> PASS', async () => {
      const res = await request(app)
        .post('/api/fun-activities/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Tamil Grammar Challenge',
          description: 'Class 6A Tamil Quiz',
          standardId: std6._id,
          sectionId: secA._id,
          subject: 'Tamil',
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          timeLimit: 15,
          questions: [
            {
              question: 'தமிழின் முதல் எழுத்து எது?',
              options: [
                { key: 'A', text: 'அ' },
                { key: 'B', text: 'க' },
                { key: 'C', text: 'ச' },
                { key: 'D', text: 'த' },
              ],
              correctAnswer: 'A',
              marks: 1,
            }
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Tamil Grammar Challenge');
    });

    it('rejects Teacher 1 when attempting to create quiz for unassigned subject (6th-A Science) -> FAIL 403', async () => {
      const res = await request(app)
        .post('/api/fun-activities/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Science Challenge',
          standardId: std6._id,
          sectionId: secA._id,
          subject: 'Science', // Teacher 1 is NOT assigned to Science
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          questions: [
            {
              question: 'What is H2O?',
              options: [
                { key: 'A', text: 'Water' },
                { key: 'B', text: 'Air' },
                { key: 'C', text: 'Fire' },
                { key: 'D', text: 'Earth' },
              ],
              correctAnswer: 'A',
              marks: 1,
            }
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });

    it('rejects unauthorized teacher trying to create quiz for class assigned to Teacher 1 -> FAIL 403', async () => {
      const res = await request(app)
        .post('/api/fun-activities/quizzes')
        .set('Authorization', `Bearer ${unauthorizedTeacherToken}`)
        .send({
          title: 'Unauthorized Quiz',
          standardId: std6._id,
          sectionId: secA._id,
          subject: 'Tamil',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          questions: [
            {
              question: 'Test?',
              options: [
                { key: 'A', text: '1' },
                { key: 'B', text: '2' },
                { key: 'C', text: '3' },
                { key: 'D', text: '4' },
              ],
              correctAnswer: 'A',
              marks: 1,
            }
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Student Quiz Visibility & Filtering', () => {
    let quiz6A;

    beforeEach(async () => {
      quiz6A = await Quiz.create({
        title: 'Tamil Quiz 6A',
        standardId: std6._id,
        sectionId: secA._id,
        subject: 'Tamil',
        createdBy: teacherUser._id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 86400000),
        totalMarks: 2,
        questions: [
          {
            question: 'Question 1',
            options: [{ key: 'A', text: 'A1' }, { key: 'B', text: 'B1' }, { key: 'C', text: 'C1' }, { key: 'D', text: 'D1' }],
            correctAnswer: 'A',
            marks: 1,
          },
          {
            question: 'Question 2',
            options: [{ key: 'A', text: 'A2' }, { key: 'B', text: 'B2' }, { key: 'C', text: 'C2' }, { key: 'D', text: 'D2' }],
            correctAnswer: 'B',
            marks: 1,
          }
        ],
      });
    });

    it('6-A Student sees 6-A quizzes -> PASS', async () => {
      const res = await request(app)
        .get('/api/fun-activities/quizzes/student')
        .set('Authorization', `Bearer ${student6AToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Tamil Quiz 6A');
    });

    it('7-B Student does NOT see 6-A quizzes -> PASS', async () => {
      const res = await request(app)
        .get('/api/fun-activities/quizzes/student')
        .set('Authorization', `Bearer ${student7BToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('3. Quiz Participation, Server-side Score Calculation & Duplicate Prevention', () => {
    let quiz6A;

    beforeEach(async () => {
      quiz6A = await Quiz.create({
        title: 'Tamil Math Quiz',
        standardId: std6._id,
        sectionId: secA._id,
        subject: 'Tamil',
        createdBy: teacherUser._id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 86400000),
        totalMarks: 2,
        questions: [
          {
            question: 'Question 1',
            options: [{ key: 'A', text: 'A1' }, { key: 'B', text: 'B1' }, { key: 'C', text: 'C1' }, { key: 'D', text: 'D1' }],
            correctAnswer: 'A',
            marks: 1,
          },
          {
            question: 'Question 2',
            options: [{ key: 'A', text: 'A2' }, { key: 'B', text: 'B2' }, { key: 'C', text: 'C2' }, { key: 'D', text: 'D2' }],
            correctAnswer: 'C',
            marks: 1,
          }
        ],
      });
    });

    it('calculates score correctly on server side -> PASS', async () => {
      const q1Id = quiz6A.questions[0]._id;
      const q2Id = quiz6A.questions[1]._id;

      // Submit 1 correct ('A') and 1 wrong ('B')
      const res = await request(app)
        .post(`/api/fun-activities/quizzes/${quiz6A._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [
            { questionId: q1Id, selectedAnswer: 'A' }, // Correct
            { questionId: q2Id, selectedAnswer: 'B' }, // Wrong (Correct is C)
          ],
          timeTaken: 45,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.totalMarks).toBe(2);
      expect(res.body.data.percentage).toBe(50);
      expect(res.body.data.correctCount).toBe(1);
      expect(res.body.data.wrongCount).toBe(1);
    });

    it('rejects duplicate quiz submission from the same student -> REJECT 400', async () => {
      const q1Id = quiz6A.questions[0]._id;
      const q2Id = quiz6A.questions[1]._id;

      // First Submission
      await request(app)
        .post(`/api/fun-activities/quizzes/${quiz6A._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [
            { questionId: q1Id, selectedAnswer: 'A' },
            { questionId: q2Id, selectedAnswer: 'C' },
          ],
        });

      // Second Submission attempt
      const res = await request(app)
        .post(`/api/fun-activities/quizzes/${quiz6A._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [
            { questionId: q1Id, selectedAnswer: 'A' },
            { questionId: q2Id, selectedAnswer: 'C' },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already submitted');
    });

    it('rejects submission if quiz is expired -> REJECT 400', async () => {
      const expiredQuiz = await Quiz.create({
        title: 'Expired Quiz',
        standardId: std6._id,
        sectionId: secA._id,
        subject: 'Tamil',
        createdBy: teacherUser._id,
        startDate: new Date(Date.now() - 7200000),
        endDate: new Date(Date.now() - 3600000), // Closed 1 hour ago
        totalMarks: 1,
        questions: [
          {
            question: 'Q',
            options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }, { key: 'C', text: 'C' }, { key: 'D', text: 'D' }],
            correctAnswer: 'A',
            marks: 1,
          }
        ],
      });

      const res = await request(app)
        .post(`/api/fun-activities/quizzes/${expiredQuiz._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [{ questionId: expiredQuiz.questions[0]._id, selectedAnswer: 'A' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('closed');
    });
  });

  describe('4. Principal Monitoring Overview', () => {
    it('allows Principal to view fun activities overview -> PASS', async () => {
      const res = await request(app)
        .get('/api/fun-activities/principal/overview')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.quizzes).toBeDefined();
    });
  });
});
