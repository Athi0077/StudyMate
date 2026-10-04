import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Award, 
  X, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';

const StudentFunActivities = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: "A" | "B" | "C" | "D" }
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);

  // Quiz Result Modal State
  const [resultData, setResultData] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fun-activities/quizzes/student');
      setQuizzes(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  };

  // Timer Effect when quiz is active
  useEffect(() => {
    let timer;
    if (activeQuiz && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeQuiz, timeRemaining]);

  const handleStartQuiz = async (quizId) => {
    try {
      setLoadingQuiz(true);
      const res = await api.get(`/fun-activities/quizzes/${quizId}`);
      const quiz = res.data.data;

      if (quiz.submission) {
        return toast.error("You have already submitted this quiz.");
      }

      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});

      if (quiz.timeLimit > 0) {
        setTimeRemaining(quiz.timeLimit * 60);
      } else {
        setTimeRemaining(0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start quiz");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleOptionSelect = (questionId, optionKey) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionKey,
    });
  };

  const handleAutoSubmit = () => {
    toast.error("Time is up! Submitting your quiz now...");
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    try {
      setSubmitting(true);

      const formattedAnswers = activeQuiz.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: selectedAnswers[q._id] || '',
      }));

      const timeTakenInSeconds = activeQuiz.timeLimit > 0 
        ? (activeQuiz.timeLimit * 60) - timeRemaining 
        : 0;

      const res = await api.post(`/fun-activities/quizzes/${activeQuiz._id}/submit`, {
        answers: formattedAnswers,
        timeTaken: timeTakenInSeconds,
      });

      if (res.data.success) {
        toast.success("Quiz submitted successfully! 🎉");
        setResultData(res.data.data);
        setShowResultModal(true);
        setActiveQuiz(null);
        fetchQuizzes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResult = async (quizId) => {
    try {
      setLoading(true);
      const res = await api.get(`/fun-activities/quizzes/${quizId}`);
      const quiz = res.data.data;
      if (quiz.submission) {
        setResultData({
          quizTitle: quiz.title,
          score: quiz.submission.score,
          totalMarks: quiz.submission.totalMarks,
          percentage: quiz.submission.percentage,
          submittedAt: quiz.submission.submittedAt,
          submissionDetails: quiz,
        });
        setShowResultModal(true);
      }
    } catch (err) {
      toast.error("Failed to load result");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Fun Activities
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Interactive Quizzes</h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Test your knowledge with exciting subject quizzes assigned to your class! Earn scores and track your progress.
            </p>
          </div>

          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0 z-10">
            🧠
          </div>

          <div className="absolute right-0 top-0 bottom-0 opacity-10 w-1/3 bg-gradient-to-l from-amber-400 to-transparent pointer-events-none"></div>
        </div>

        {/* Quizzes List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Available Quizzes
            </h2>
            <span className="text-xs text-gray-500 font-medium">Total: {quizzes.length}</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-12 text-center border border-gray-100 dark:border-[#1E293B] shadow-sm space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                🎯
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">No Quizzes Available</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                There are no active quizzes assigned to your class at the moment. Check back soon when your teachers publish new quizzes!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz._id}
                  className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Subject Badge & Status */}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-900/50">
                        {quiz.subject}
                      </span>

                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        quiz.studentStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : quiz.studentStatus === 'closed'
                          ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400'
                          : quiz.studentStatus === 'coming_soon'
                          ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300'
                      }`}>
                        {quiz.studentStatus === 'completed' ? '✓ Completed' : quiz.studentStatus}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 line-clamp-1">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{quiz.description}</p>
                    )}

                    {/* Info Pills */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-600 dark:text-slate-300 pt-1">
                      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#172235] p-2 rounded-xl">
                        <HelpCircle className="w-4 h-4 text-blue-500" />
                        <span>{quiz.questionCount} Questions</span>
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
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>{new Date(quiz.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Completion Score Badge */}
                    {quiz.submission && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Your Score:</span>
                        <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                          {quiz.submission.score} / {quiz.submission.totalMarks} ({quiz.submission.percentage}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-gray-100 dark:border-[#1E293B]">
                    {quiz.studentStatus === 'completed' ? (
                      <button
                        onClick={() => handleViewResult(quiz._id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
                      >
                        <Award className="w-4 h-4 text-amber-400" /> View Result Summary
                      </button>
                    ) : quiz.studentStatus === 'active' ? (
                      <button
                        onClick={() => handleStartQuiz(quiz._id)}
                        disabled={loadingQuiz}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" /> Start Quiz Now
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full text-center px-4 py-2.5 bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500 text-xs font-bold rounded-xl"
                      >
                        {quiz.studentStatus === 'coming_soon' ? 'Starts Soon' : 'Quiz Closed'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* INTERACTIVE QUIZ PARTICIPATION MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-[#1E293B] space-y-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
            
            {/* Header: Title & Timer */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1E293B] pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{activeQuiz.subject} Quiz</span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">{activeQuiz.title}</h3>
              </div>

              {activeQuiz.timeLimit > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                  timeRemaining < 60 
                    ? 'bg-red-100 text-red-600 border-red-300 animate-pulse' 
                    : 'bg-amber-100 text-amber-700 border-amber-300'
                }`}>
                  <Clock className="w-4 h-4" /> {formatTimer(timeRemaining)}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100)}% Completed</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300" 
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Question Block */}
            {activeQuiz.questions[currentQuestionIndex] && (
              <div className="space-y-6 py-2">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-slate-100">
                  {currentQuestionIndex + 1}. {activeQuiz.questions[currentQuestionIndex].question}
                </h4>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-3">
                  {activeQuiz.questions[currentQuestionIndex].options.map((opt) => {
                    const qId = activeQuiz.questions[currentQuestionIndex]._id;
                    const isSelected = selectedAnswers[qId] === opt.key;

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleOptionSelect(qId, opt.key)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-900 dark:text-blue-100 shadow-sm'
                            : 'bg-gray-50 dark:bg-[#172235] border-gray-200 dark:border-[#334155] text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-[#334155]'
                        }`}>
                          {opt.key}
                        </span>

                        <span className="font-semibold text-sm flex-1">{opt.text}</span>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation & Submit Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#1E293B]">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz 🎉'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* QUIZ RESULT CELEBRATION MODAL */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-[#1E293B] text-center space-y-6">
            
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto shadow-xl">
              🎉
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Quiz Completed!</h3>
              <p className="text-xs text-gray-500">{resultData.quizTitle || 'Great job completing your quiz!'}</p>
            </div>

            {/* Score Display Card */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-3xl border border-blue-100 dark:border-blue-900/50 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Your Final Score</p>
              <p className="text-4xl font-extrabold text-blue-900 dark:text-blue-100">
                {resultData.score} <span className="text-lg text-blue-500 font-semibold">/ {resultData.totalMarks}</span>
              </p>
              <span className="inline-block px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-full shadow-xs">
                {resultData.percentage}% Score
              </span>
            </div>

            <button
              onClick={() => setShowResultModal(false)}
              className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default StudentFunActivities;
