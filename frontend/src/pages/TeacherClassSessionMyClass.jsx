import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Clock, Calendar, ChevronLeft, Lock, PlayCircle, CheckCircle, ArrowRightCircle } from 'lucide-react';

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getNextDateForDay = (dayName) => {
  const targetDayIndex = daysOfWeek.indexOf(dayName);
  if (targetDayIndex === -1) return new Date(); // Fallback

  const now = new Date();
  const currentDayIndex = now.getDay();
  
  // If we just want "this week's" dates for tabs relative to today
  const difference = targetDayIndex - currentDayIndex;
  
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + difference);
  return targetDate;
};

const TeacherClassSessionMyClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [classInfo, setClassInfo] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const todayName = daysOfWeek[new Date().getDay()] === "Sunday" ? "Monday" : daysOfWeek[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(todayName);
  
  // Array of valid working days
  const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  useEffect(() => {
    fetchTimetableForDay(selectedDay);
  }, [classId, selectedDay]);

  const fetchClassData = async () => {
    try {
      const res = await api.get(`/classes/${classId}`);
      if (res.data.success) {
        setClassInfo(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load class information');
    }
  };

  const fetchTimetableForDay = async (day) => {
    setLoading(true);
    try {
      // Get the exact date for the selected day in current week
      const targetDate = getNextDateForDay(day);
      const dateString = targetDate.toISOString().split('T')[0];
      
      const res = await api.get(`/class-sessions/${classId}/timetable?date=${dateString}`);
      if (res.data.success) {
        setPeriods(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load timetable for selected day');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (periodData) => {
    try {
      console.log("========== START SESSION DEBUG ==========");
console.log("Current User:", currentUser);
console.log("Current User ID:", currentUser?._id);

console.log("Period Data:", periodData);
console.log("Period:", periodData?.period);

console.log(
  "Subject Teacher:",
  periodData?.period?.subjectTeacherId
);

console.log(
  "Subject Teacher ID:",
  periodData?.period?.subjectTeacherId?._id
);

console.log(
  "IDs:",
  periodData?.period?.subjectTeacherId?._id,
  currentUser?._id
);

console.log(
  "Authorized:",
  periodData?.period?.subjectTeacherId?._id === currentUser?._id
);

console.log("==========================================");
      // Prevent unauthorized access
      const teacherId = periodData.period.subjectTeacherId?._id || periodData.period.subjectTeacherId;
      if (String(teacherId) !== String(currentUser._id)) {
        toast.error("You are not authorized to start this session.");
        return;
      }

      // Initialize session
      const targetDate = getNextDateForDay(selectedDay);
      const dateString = targetDate.toISOString().split('T')[0];

      const res = await api.post('/class-sessions/initialize', {
        classId,
        timetableId: periodData.timetableId,
        periodNumber: periodData.period.periodNumber,
        date: dateString
      });

      if (res.data.success) {
        const sessionId = res.data.data._id;
        navigate(`/teacher/class-sessions/${classId}/session/${sessionId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to initialize session');
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex items-center gap-4">
          <button 
            onClick={() => navigate('/teacher/class-sessions')}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">My Class</h2>
            <p className="text-gray-500 font-semibold">{classInfo ? `${classInfo.className} ` : 'Loading...'}</p>
          </div>
        </div>

        {/* Day Tabs */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-50 p-2 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            {workingDays.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  selectedDay === day 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-transparent text-gray-500 hover:bg-gray-50'
                }`}
              >
                {day}
                {day === todayName && <span className="ml-2 text-[10px] uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Today</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Periods List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-2">
            <Calendar className="w-5 h-5 text-primary" />
            Timetable — {selectedDay}
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white animate-pulse rounded-2xl shadow-soft"></div>)}
            </div>
          ) : periods.length > 0 ? (
            <div className="space-y-4">
              {periods.sort((a,b) => a.period.periodNumber - b.period.periodNumber).map((item, index) => {
                const { period, sessionStatus, sessionId, isMyPeriod } = item;
                
                let statusBadge = null;
                let actionButton = null;

                if (!isMyPeriod) {
                  statusBadge = <span className="flex items-center gap-1 text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full"><Lock className="w-3 h-3" /> Locked</span>;
                  actionButton = (
                    <button disabled className="bg-gray-100 text-gray-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-not-allowed">
                      Teacher {period.subjectTeacherId?.name?.split(' ')[0]}
                    </button>
                  );
                } else if (sessionStatus === 'COMPLETED') {
                  statusBadge = <span className="flex items-center gap-1 text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Completed</span>;
                  actionButton = (
                    <button onClick={() => navigate(`/teacher/class-sessions/${classId}/session/${sessionId}`)} className="bg-green-50 hover:bg-green-100 text-green-700 font-bold px-4 py-2 rounded-xl transition">
                      View Session
                    </button>
                  );
                } else if (sessionStatus === 'NOT_STARTED') {
                  statusBadge = <span className="flex items-center gap-1 text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full"><PlayCircle className="w-3 h-3" /> Upcoming</span>;
                  actionButton = (
                    <button onClick={() => handleStartSession(item)} className="bg-primary hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl shadow-md transition flex items-center gap-2">
                      Start Session
                    </button>
                  );
                } else {
                  statusBadge = <span className="flex items-center gap-1 text-sm font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full"><ArrowRightCircle className="w-3 h-3" /> In Progress</span>;
                  actionButton = (
                    <button onClick={() => navigate(`/teacher/class-sessions/${classId}/session/${sessionId}`)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-6 py-2 rounded-xl shadow-md transition flex items-center gap-2">
                      Continue Session
                    </button>
                  );
                }

                return (
                  <div key={index} className={`bg-white p-5 rounded-2xl shadow-sm border-l-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-md ${isMyPeriod ? 'border-primary' : 'border-gray-300 opacity-75'}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-gray-100">
                        <span className="text-xs font-bold text-gray-400">Period</span>
                        <span className="text-xl font-black text-gray-800">{period.periodNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-extrabold text-gray-900">{period.subject}</h4>
                          {statusBadge}
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {period.startTime} - {period.endTime}</span>
                          {!isMyPeriod && <span>👨‍🏫 {period.subjectTeacherId?.name}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-2 md:mt-0">
                      {actionButton}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl shadow-soft flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Timetable Available</h3>
              <p className="text-gray-500 max-w-sm">
                There are no classes scheduled for {selectedDay}.
              </p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default TeacherClassSessionMyClass;
