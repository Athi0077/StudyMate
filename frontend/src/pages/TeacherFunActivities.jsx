import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  PlusCircle, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  Award, 
  Trash2, 
  Eye, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X, 
  FileText, 
  AlertCircle,
  BarChart3,
  BookOpen
} from 'lucide-react';

const TeacherFunActivities = () => {
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'create'
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Create Quiz Form State
  const [selectedStandard, setSelectedStandard] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [quizInfo, setQuizInfo] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    timeLimit: 10,
  });

  const [questions, setQuestions] = useState([
    {
      question: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
      marks: 1,
    }
  ]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results Modal State
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, quizzesRes] = await Promise.all([
        api.get('/fun-activities/teacher-assignments'),
        api.get('/fun-activities/quizzes/teacher')
      ]);

      setAssignments(assignmentsRes.data.data || []);
      setQuizzes(quizzesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Standard Selection Change
  const handleStandardChange = (stdId) => {
    setSelectedStandard(stdId);
    setSelectedSection('');
    setSelectedSubject('');
    setAvailableSubjects([]);

    const std = assignments.find(a => a.standardId === stdId);
    setAvailableSections(std ? std.sections : []);
  };

  // Step 2: Section Selection Change
  const handleSectionChange = (secId) => {
    setSelectedSection(secId);
    setSelectedSubject('');

    const std = assignments.find(a => a.standardId === selectedStandard);
    if (std) {
      const sec = std.sections.find(s => s.sectionId === secId);
      setAvailableSubjects(sec ? sec.subjects : []);
      if (sec && sec.subjects.length === 1) {
        setSelectedSubject(sec.subjects[0]);
      }
    }
  };

  // Question manipulation
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ],
        correctAnswer: 'A',
        marks: 1,
      }
    ]);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      return toast.error("Quiz must have at least one question");
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index, text) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex, optKey, text) => {
    const updated = [...questions];
    const option = updated[qIndex].options.find(o => o.key === optKey);
    if (option) {
      option.text = text;
    }
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIndex, key) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = key;
    setQuestions(updated);
  };

  const handleMarksChange = (qIndex, marks) => {
    const updated = [...questions];
    updated[qIndex].marks = Math.max(1, parseInt(marks) || 1);
    setQuestions(updated);
  };

  // Validate Quiz Before Preview
  const handleOpenPreview = (e) => {
    e.preventDefault();

    if (!selectedStandard) return toast.error("Please select a Standard");
    if (!selectedSection) return toast.error("Please select a Section");
    if (!selectedSubject) return toast.error("Please select a Subject");

    if (!quizInfo.title.trim()) return toast.error("Quiz Title is required");
    if (!quizInfo.startDate) return toast.error("Start Date is required");
    if (!quizInfo.endDate) return toast.error("End Date is required");

    if (new Date(quizInfo.endDate) <= new Date(quizInfo.startDate)) {
      return toast.error("End Date must be after Start Date");
    }

    // Validate Questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return toast.error(`Question ${i + 1} text is required`);
      for (const opt of q.options) {
        if (!opt.text.trim()) return toast.error(`Question ${i + 1} Option ${opt.key} is required`);
      }
    }

    setShowPreviewModal(true);
  };

  // Submit Quiz Creation to Backend
  const handleConfirmAssignQuiz = async () => {
    try {
      setSubmitting(true);
      const payload = {
        title: quizInfo.title,
        description: quizInfo.description,
        standardId: selectedStandard,
        sectionId: selectedSection,
        subject: selectedSubject,
        startDate: quizInfo.startDate,
        endDate: quizInfo.endDate,
        timeLimit: parseInt(quizInfo.timeLimit) || 0,
        questions,
      };

      const res = await api.post('/fun-activities/quizzes', payload);
      if (res.data.success) {
        toast.success("Quiz created & assigned successfully! 🎉");
        setShowPreviewModal(false);
        // Reset Form
        setQuizInfo({ title: '', description: '', startDate: '', endDate: '', timeLimit: 10 });
        setSelectedStandard('');
        setSelectedSection('');
        setSelectedSubject('');
        setQuestions([
          {
            question: '',
            options: [
              { key: 'A', text: '' },
              { key: 'B', text: '' },
              { key: 'C', text: '' },
              { key: 'D', text: '' },
            ],
            correctAnswer: 'A',
            marks: 1,
          }
        ]);
        setActiveTab('quizzes');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResults = async (quizId) => {
    try {
      setLoadingResults(true);
      setShowResultsModal(true);
      const res = await api.get(`/fun-activities/quizzes/${quizId}/results`);
      setSelectedQuizResults(res.data.data);
    } catch (err) {
      toast.error("Failed to load results");
      setShowResultsModal(false);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Are you sure you want to delete this quiz? All student submissions will be permanently removed.")) return;

    try {
      await api.delete(`/fun-activities/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete quiz");
    }
  };

  const selectedStandardObj = assignments.find(a => a.standardId === selectedStandard);
  const selectedSectionObj = selectedStandardObj?.sections.find(s => s.sectionId === selectedSection);
  const totalQuestions = questions.length;
  const totalQuizMarks = questions.reduce((acc, q) => acc + (parseInt(q.marks) || 1), 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-rose-900 via-purple-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Fun Activities Module
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quiz Management</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Create engaging multiple-choice quizzes exclusively for your assigned classes and subjects. Track student participation and scores seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                activeTab === 'quizzes' 
                  ? 'bg-white text-gray-900 shadow-md' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              My Quizzes ({quizzes.length})
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                activeTab === 'create' 
                  ? 'bg-amber-400 text-gray-900 shadow-md' 
                  : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Create Quiz
            </button>
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 w-1/3 bg-gradient-to-l from-amber-400 to-transparent pointer-events-none"></div>
        </div>

        {/* Tab 1: My Quizzes List */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-rose-600" />
                Active & Assigned Quizzes
              </h2>
              <span className="text-xs text-gray-500 font-medium">Total: {quizzes.length} Quizzes</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-12 text-center border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                  🧩
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">No Quizzes Created Yet</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                  You haven't assigned any quizzes to your classes yet. Click "Create Quiz" to set up your first interactive challenge!
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition"
                >
                  <PlusCircle className="w-4 h-4" /> Create Your First Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <div 
                    key={quiz._id}
                    className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Class & Subject Header */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-full border border-rose-200 dark:border-rose-900/50">
                          {quiz.standardId?.name} - {quiz.sectionId?.name} • {quiz.subject}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          quiz.displayStatus === 'closed' 
                            ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400' 
                            : quiz.displayStatus === 'coming_soon'
                            ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400'
                        }`}>
                          {quiz.displayStatus}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 line-clamp-1">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{quiz.description}</p>
                      )}

                      {/* Info Pills */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 dark:text-slate-300 pt-1">
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                          <HelpCircle className="w-4 h-4 text-indigo-500" />
                          <span>{quiz.questions?.length || 0} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>{quiz.totalMarks} Marks</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                          <Clock className="w-4 h-4 text-rose-500" />
                          <span>{quiz.timeLimit > 0 ? `${quiz.timeLimit} Mins` : 'No Limit'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                          <Users className="w-4 h-4 text-emerald-500" />
                          <span>{quiz.totalSubmissions}/{quiz.totalEnrolled} Done</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center justify-between pt-1">
                        <span>Starts: {new Date(quiz.startDate).toLocaleDateString()}</span>
                        <span>Ends: {new Date(quiz.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-gray-100 dark:border-[#1E293B] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenResults(quiz._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> View Results
                      </button>

                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Quiz Wizard */}
        {activeTab === 'create' && (
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-[#1E293B]">
            <form onSubmit={handleOpenPreview} className="space-y-8">
              
              {/* STEP 1, 2, 3 — CASCADING ASSIGNMENT SELECTION */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center">1</span>
                  Target Class & Subject Selection
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                  Select ONLY from your authorized teaching assignments (Standard → Section → Subject).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Step 1: Standard */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Step 1 — Standard <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm"
                      value={selectedStandard}
                      onChange={(e) => handleStandardChange(e.target.value)}
                    >
                      <option value="">Select Standard</option>
                      {assignments.map((asg) => (
                        <option key={asg.standardId} value={asg.standardId}>
                          {asg.standardName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Section */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Step 2 — Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!selectedStandard}
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm disabled:opacity-50"
                      value={selectedSection}
                      onChange={(e) => handleSectionChange(e.target.value)}
                    >
                      <option value="">Select Section</option>
                      {availableSections.map((sec) => (
                        <option key={sec.sectionId} value={sec.sectionId}>
                          Section {sec.sectionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Subject */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Step 3 — Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!selectedSection}
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold text-sm disabled:opacity-50"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.map((subj, idx) => (
                        <option key={idx} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* BASIC QUIZ DETAILS */}
              <div className="pt-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center">2</span>
                  Quiz Details & Timeline
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Quiz Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Tamil Grammar Challenge or Algebra Basics"
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                      value={quizInfo.title}
                      onChange={(e) => setQuizInfo({ ...quizInfo, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                      Description (Optional)
                    </label>
                    <textarea 
                      rows="2"
                      placeholder="Add brief instructions for students..."
                      className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium resize-none"
                      value={quizInfo.description}
                      onChange={(e) => setQuizInfo({ ...quizInfo, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                        Start Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs sm:text-sm"
                        value={quizInfo.startDate}
                        onChange={(e) => setQuizInfo({ ...quizInfo, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                        End Date & Time <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs sm:text-sm"
                        value={quizInfo.endDate}
                        onChange={(e) => setQuizInfo({ ...quizInfo, endDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 mb-2">
                        Time Limit (Minutes)
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0 = No limit"
                        className="w-full p-3 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                        value={quizInfo.timeLimit}
                        onChange={(e) => setQuizInfo({ ...quizInfo, timeLimit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* QUESTIONS BUILDER */}
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 text-xs font-extrabold flex items-center justify-center">3</span>
                    Questions Builder ({questions.length})
                  </h3>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                    Total Marks: {totalQuizMarks}
                  </span>
                </div>

                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div 
                      key={qIndex}
                      className="p-6 bg-gray-50 dark:bg-[#172235]/60 rounded-2xl border border-gray-200 dark:border-[#334155] space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          Question {qIndex + 1}
                        </span>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs font-bold text-gray-500">Marks:</label>
                            <input 
                              type="number" 
                              min="1"
                              className="w-16 p-1.5 bg-white dark:bg-[#0b1120] border border-gray-200 dark:border-[#334155] text-center rounded-lg font-bold text-sm"
                              value={q.marks}
                              onChange={(e) => handleMarksChange(qIndex, e.target.value)}
                            />
                          </div>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIndex)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg transition"
                              title="Remove Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Question Text */}
                      <input 
                        type="text" 
                        required
                        placeholder={`Enter question ${qIndex + 1} text...`}
                        className="w-full p-3 bg-white dark:bg-[#0b1120] border border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                        value={q.question}
                        onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      />

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt) => (
                          <div 
                            key={opt.key}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                              q.correctAnswer === opt.key 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' 
                                : 'bg-white dark:bg-[#0b1120] border-gray-200 dark:border-[#334155]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCorrectAnswerChange(qIndex, opt.key)}
                              className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 transition ${
                                q.correctAnswer === opt.key 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                              title="Set as Correct Answer"
                            >
                              {opt.key}
                            </button>

                            <input 
                              type="text" 
                              required
                              placeholder={`Option ${opt.key}`}
                              className="w-full bg-transparent text-sm font-medium text-gray-800 dark:text-slate-100 focus:outline-none"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(qIndex, opt.key, e.target.value)}
                            />

                            {q.correctAnswer === opt.key && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mr-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-3 border-2 border-dashed border-rose-300 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 font-bold rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" /> Add Question
                </button>
              </div>

              {/* Submit & Assign Action */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" /> Assign Quiz
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* PREVIEW & CONFIRMATION MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Preview Quiz Assignment
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm font-medium">
              <div className="p-4 bg-gray-50 dark:bg-[#172235] rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Quiz Title:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100">{quizInfo.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Class & Section:</span>
                  <span className="font-bold text-rose-600">{selectedStandardObj?.standardName} - Section {selectedSectionObj?.sectionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subject:</span>
                  <span className="font-bold text-indigo-600">{selectedSubject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Questions:</span>
                  <span className="font-bold">{totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Marks:</span>
                  <span className="font-bold">{totalQuizMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time Limit:</span>
                  <span className="font-bold">{quizInfo.timeLimit > 0 ? `${quizInfo.timeLimit} Mins` : 'No Limit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="font-bold">{new Date(quizInfo.startDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date:</span>
                  <span className="font-bold">{new Date(quizInfo.endDate).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 transition text-sm"
              >
                Back to Edit
              </button>

              <button
                onClick={handleConfirmAssignQuiz}
                disabled={submitting}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg transition text-sm flex items-center gap-2"
              >
                {submitting ? 'Assigning...' : 'Confirm & Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ RESULTS MODAL */}
      {showResultsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">
                  {selectedQuizResults?.quiz?.title || 'Quiz Results'}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedQuizResults?.quiz?.standard} - Section {selectedQuizResults?.quiz?.section} • {selectedQuizResults?.quiz?.subject}
                </p>
              </div>

              <button onClick={() => setShowResultsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingResults ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : selectedQuizResults ? (
              <div className="space-y-6">
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-blue-600">Total Enrolled</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{selectedQuizResults.stats.totalStudents}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-emerald-600">Participated</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{selectedQuizResults.stats.participated}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-amber-600">Not Attempted</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{selectedQuizResults.stats.notParticipated}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-center">
                    <p className="text-xs font-semibold text-purple-600">Average Score</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{selectedQuizResults.stats.averageScore}%</p>
                  </div>
                </div>

                {/* Student Results Table */}
                <div className="overflow-x-auto border border-gray-100 dark:border-[#1E293B] rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-center">Percentage</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B] font-medium text-gray-800 dark:text-slate-200">
                      {selectedQuizResults.studentResults.map((st, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold">{st.name}</td>
                          <td className="p-3 text-center">
                            {st.status === 'Completed' ? `${st.score} / ${st.totalMarks}` : '-'}
                          </td>
                          <td className="p-3 text-center font-bold">
                            {st.status === 'Completed' ? `${st.percentage}%` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              st.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {st.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherFunActivities;
