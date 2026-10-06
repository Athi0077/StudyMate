import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ChevronLeft, CheckCircle, Circle, Users, FileText, BookOpen, Clock, PlayCircle } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Attendance', key: 'ATTENDANCE_COMPLETED' },
  { id: 2, title: 'Class Record', key: 'CLASS_RECORD_COMPLETED' },
  { id: 3, title: 'Lesson Log', key: 'LESSON_LOG_COMPLETED' },
  { id: 4, title: 'Homework', key: 'HOMEWORK_COMPLETED' }
];

const TeacherClassSessionWorkflow = () => {
  const { classId, sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [students, setStudents] = useState([]);
  
  // Forms state
  const [attendanceData, setAttendanceData] = useState([]);
  const [classRecord, setClassRecord] = useState({ chapter: '', topic: '', classRecord: '', lessonStatus: 'Completed' });
  const [lessonLog, setLessonLog] = useState({ lessonLog: '', pagesCovered: '', teachingMethod: 'Board', teacherNotes: '' });
  const [homework, setHomework] = useState({ title: '', description: '', dueDate: '', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await api.get(`/class-sessions/session/${sessionId}`);
      if (res.data.success) {
        const data = res.data.data;
        setSession(data);
        
        // Init students list from class
        if (data.classId) {
          // If we need student details, we might need to fetch them if not populated
          // Let's fetch class details to get full student list
          const classRes = await api.get(`/classes/${classId}`);
          const classStudents = classRes.data.data?.students || [];
          setStudents(classStudents);
          
          if (data.attendance && data.attendance.length > 0) {
            setAttendanceData(data.attendance.map(a => ({
              studentId: a.studentId._id || a.studentId,
              status: a.status
            })));
          } else {
            setAttendanceData(classStudents.map(s => ({
              studentId: s._id,
              status: 'present' // default
            })));
          }
        }

        // Init forms
        setClassRecord({
          chapter: data.chapter || '',
          topic: data.topic || '',
          classRecord: data.classRecord || '',
          lessonStatus: data.lessonStatus || 'Completed'
        });
        
        setLessonLog({
          lessonLog: data.lessonLog || '',
          pagesCovered: data.pagesCovered || '',
          teachingMethod: data.teachingMethod || 'Board',
          teacherNotes: data.teacherNotes || ''
        });

        // Determine starting step
        if (data.sessionStatus === 'COMPLETED') setCurrentStep(5);
        else if (data.sessionStatus === 'HOMEWORK_COMPLETED') setCurrentStep(5);
        else if (data.sessionStatus === 'LESSON_LOG_COMPLETED') setCurrentStep(4);
        else if (data.sessionStatus === 'CLASS_RECORD_COMPLETED') setCurrentStep(3);
        else if (data.sessionStatus === 'ATTENDANCE_COMPLETED') setCurrentStep(2);
        else setCurrentStep(1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));
  };

  const markAll = (status) => {
    setAttendanceData(prev => prev.map(a => ({ ...a, status })));
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    try {
      await api.put(`/class-sessions/${sessionId}/attendance`, { attendance: attendanceData });
      toast.success('Attendance saved');
      setCurrentStep(2);
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const submitClassRecord = async () => {
    setSubmitting(true);
    try {
      await api.put(`/class-sessions/${sessionId}/class-record`, classRecord);
      toast.success('Class Record saved');
      setCurrentStep(3);
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class record');
    } finally {
      setSubmitting(false);
    }
  };

  const submitLessonLog = async () => {
    setSubmitting(true);
    try {
      await api.put(`/class-sessions/${sessionId}/lesson-log`, lessonLog);
      toast.success('Lesson Log saved');
      setCurrentStep(4);
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lesson log');
    } finally {
      setSubmitting(false);
    }
  };

  const submitHomework = async () => {
    setSubmitting(true);
    try {
      if (homework.title || homework.description) {
        if (!homework.dueDate) {
          toast.error("Please provide a due date for the homework");
          setSubmitting(false);
          return;
        }
        await api.post(`/class-sessions/${sessionId}/homework`, homework);
        toast.success('Homework assigned');
      } else {
        // Skip homework
        toast.success('Homework step skipped');
      }
      
      // Complete session
      await api.put(`/class-sessions/${sessionId}/complete`);
      setCurrentStep(5);
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign homework');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center p-12">Loading...</div></Layout>;
  if (!session) return <Layout><div className="flex justify-center p-12">Session not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/teacher/class-sessions/${classId}`)}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Class Session</h2>
              <p className="text-gray-500 font-semibold">
                {session.classId?.className} • Period {session.periodNumber} • {session.subject}
              </p>
            </div>
          </div>
          {currentStep === 5 && (
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Completed
            </span>
          )}
        </div>

        {/* Stepper */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id || currentStep === 5;
              const isActive = currentStep === step.id;
              return (
                <div key={step.id} className="flex flex-col items-center bg-white px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${
                    isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-xs font-bold mt-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-soft border border-gray-50">
          
          {/* STEP 1: ATTENDANCE */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" /> Period Attendance
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => markAll('present')} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-100">All Present</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(student => {
                  const att = attendanceData.find(a => a.studentId === student._id);
                  const status = att ? att.status : 'present';
                  return (
                    <div key={student._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white transition shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500 font-medium">Roll: {student.rollNumber || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button 
                          onClick={() => handleAttendanceChange(student._id, 'present')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${status === 'present' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => handleAttendanceChange(student._id, 'absent')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          A
                        </button>
                        <button 
                          onClick={() => handleAttendanceChange(student._id, 'leave')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${status === 'leave' ? 'bg-yellow-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          L
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-green-600">Present: {attendanceData.filter(a => a.status === 'present').length}</span>
                  <span className="text-red-600">Absent: {attendanceData.filter(a => a.status === 'absent').length}</span>
                  <span className="text-gray-600">Total: {students.length}</span>
                </div>
                <button 
                  onClick={submitAttendance}
                  disabled={submitting}
                  className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CLASS RECORD */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-6">
                <BookOpen className="w-6 h-6 text-primary" /> Class Record
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chapter / Unit</label>
                  <input 
                    type="text" 
                    value={classRecord.chapter}
                    onChange={e => setClassRecord({...classRecord, chapter: e.target.value})}
                    placeholder="E.g. Fractions"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Topic</label>
                  <input 
                    type="text" 
                    value={classRecord.topic}
                    onChange={e => setClassRecord({...classRecord, topic: e.target.value})}
                    placeholder="E.g. Addition of fractions"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">What was taught?</label>
                <textarea 
                  rows="4"
                  value={classRecord.classRecord}
                  onChange={e => setClassRecord({...classRecord, classRecord: e.target.value})}
                  placeholder="Summarize what was taught during this period..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Lesson Status</label>
                <div className="flex gap-4">
                  {['Completed', 'Partially Completed', 'Not Completed'].map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="lessonStatus" 
                        value={status}
                        checked={classRecord.lessonStatus === status}
                        onChange={e => setClassRecord({...classRecord, lessonStatus: e.target.value})}
                        className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button 
                  onClick={submitClassRecord}
                  disabled={submitting}
                  className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LESSON LOG */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-primary" /> Lesson Log
              </h3>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description / Activities</label>
                <textarea 
                  rows="3"
                  value={lessonLog.lessonLog}
                  onChange={e => setLessonLog({...lessonLog, lessonLog: e.target.value})}
                  placeholder="E.g. Students practiced addition and solved problems on the board."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pages Covered (Optional)</label>
                  <input 
                    type="text" 
                    value={lessonLog.pagesCovered}
                    onChange={e => setLessonLog({...lessonLog, pagesCovered: e.target.value})}
                    placeholder="E.g. Pages 45-48"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teaching Method</label>
                  <select 
                    value={lessonLog.teachingMethod}
                    onChange={e => setLessonLog({...lessonLog, teachingMethod: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Board">Board / Chalk & Talk</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Activity">Activity</option>
                    <option value="Practical">Practical / Lab</option>
                    <option value="Video">Video / Multimedia</option>
                    <option value="Group Work">Group Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teacher Notes (Internal)</label>
                <textarea 
                  rows="2"
                  value={lessonLog.teacherNotes}
                  onChange={e => setLessonLog({...lessonLog, teacherNotes: e.target.value})}
                  placeholder="Notes for yourself or the principal..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                ></textarea>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button 
                  onClick={submitLessonLog}
                  disabled={submitting}
                  className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: HOMEWORK */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-6">
                <BookOpen className="w-6 h-6 text-primary" /> Assign Homework
              </h3>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-800 flex items-start gap-3">
                <PlayCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Assign homework to the class for this subject. Leave blank if no homework is needed today.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Homework Title</label>
                <input 
                  type="text" 
                  value={homework.title}
                  onChange={e => setHomework({...homework, title: e.target.value})}
                  placeholder="E.g. Exercise 5.2"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea 
                  rows="3"
                  value={homework.description}
                  onChange={e => setHomework({...homework, description: e.target.value})}
                  placeholder="What should the students do?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
                  <input 
                    type="date" 
                    value={homework.dueDate}
                    onChange={e => setHomework({...homework, dueDate: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                  <select 
                    value={homework.priority}
                    onChange={e => setHomework({...homework, priority: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <button 
                  onClick={submitHomework}
                  disabled={submitting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition"
                >
                  Skip Homework
                </button>
                <button 
                  onClick={submitHomework}
                  disabled={submitting}
                  className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Complete Session'}
                </button>
              </div>
            </div>
          )}

          {/* COMPLETED */}
          {currentStep === 5 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Class Session Completed</h2>
              <p className="text-gray-500 text-lg mb-8 max-w-md">
                You have successfully completed the session workflow for Period {session.periodNumber} ({session.subject}).
              </p>
              
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 w-full max-w-md text-left mb-8 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Attendance</span>
                  <span className="font-bold text-green-600">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Class Record</span>
                  <span className="font-bold text-green-600">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Lesson Log</span>
                  <span className="font-bold text-green-600">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Homework</span>
                  <span className="font-bold text-gray-800">{session.homeworkId ? 'Assigned' : 'Skipped'}</span>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/teacher/class-sessions/${classId}`)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-bold transition shadow-md"
              >
                Return to My Class
              </button>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default TeacherClassSessionWorkflow;
