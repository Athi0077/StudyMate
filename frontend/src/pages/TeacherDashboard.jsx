import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';
import { GraduationCap, Users, FileText, Inbox, Calendar, CheckCircle, Edit3, BookOpen, Clock, FileWarning } from 'lucide-react';
import AnnouncementPopup from '../components/common/AnnouncementPopup';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import { Sparkles } from 'lucide-react';

const TeacherDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for expired temp access redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tempExpired') === 'true') {
      toast.error('Your temporary Principal access has expired. You have been returned to your Teacher Dashboard.', { duration: 5000 });
      // Remove it from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const fetchDashboard = async () => {
      try {
        const userId = currentUser._id || currentUser.id;
        const [dashRes, assignRes, hwRes, quoteRes] = await Promise.all([
          api.get('/dashboard/teacher'),
          api.get(`/teacher-assignments/teacher/${userId}`),
          api.get('/homework/teacher'),
          api.get('/quotes/current').catch(() => ({ data: { data: null } }))
        ]);
        setDashboardData(dashRes.data.data);
        setClasses(assignRes.data.data || []);
        setHomeworks(hwRes.data.data || []);
        setQuote(quoteRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser && (currentUser._id || currentUser.id)) {
      fetchDashboard();
      
      // Init socket for real-time quote updates
      const token = localStorage.getItem('token');
      if (token) {
        const socket = initSocket(token);
        socket.on('quote:published', (newQuote) => {
          setQuote(newQuote);
        });
      }
    }

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('quote:published');
        // We don't disconnect entirely here in case other components use it, but we clean up listener
      }
    };
  }, [currentUser]);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="bg-gray-200 h-40 rounded-3xl w-full"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-gray-200 h-24 rounded-2xl"></div>)}
          </div>
          <div className="bg-gray-200 h-24 rounded-3xl w-full"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-200 h-64 rounded-3xl w-full"></div>
              <div className="bg-gray-200 h-64 rounded-3xl w-full"></div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-200 h-40 rounded-3xl w-full"></div>
              <div className="bg-gray-200 h-64 rounded-3xl w-full"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate attendance percentage if available
  const att = dashboardData?.todayAttendance;
  const totalAtt = att ? (att.present + att.absent + att.leave) : 0;
  const attPercentage = totalAtt > 0 ? Math.round((att.present / totalAtt) * 100) : 0;

  return (
    <Layout>
      <AnnouncementPopup />
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-sm border border-red-50/50">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Good Morning,<br/>
              <span className="text-primary">{currentUser?.name}! 👋</span>
            </h2>
            <p className="text-gray-700 text-lg">
              A great teacher can inspire hope, ignite imagination, and instill a love for learning.
            </p>
          </div>
          {quote && (
            <div className="mt-6 md:mt-0 w-full md:w-auto">
              <blockquote className="bg-white/60 p-4 rounded-xl shadow-sm text-gray-800 italic font-medium border-l-4 border-primary text-sm md:max-w-sm">
                "{quote.quote}"
              </blockquote>
              {quote.author && (
                <p className="text-gray-600 text-xs font-semibold mt-2 text-right">— {quote.author}</p>
              )}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-primary">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-gray-400">→</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{classes?.length || 0}</p>
              <p className="text-sm font-semibold text-gray-500">My Classes</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-gray-400">→</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dashboardData?.totalStudents || 0}</p>
              <p className="text-sm font-semibold text-gray-500">Total Students</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-gray-400">→</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dashboardData?.homeworkAssignedCount || 0}</p>
              <p className="text-sm font-semibold text-gray-500">Homework Assigned</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Inbox className="w-5 h-5" />
              </div>
              <span className="text-gray-400">→</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{dashboardData?.pendingSubmissionsCount || 0}</p>
              <p className="text-sm font-semibold text-gray-500">Pending Submissions</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-soft border border-gray-50 flex flex-col justify-between hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-gray-400">→</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{attPercentage}%</p>
              <p className="text-sm font-semibold text-gray-500">Student Attendance</p>
            </div>
          </div>
        </div>

        {/* Teacher Self Attendance Card */}
        <div className="bg-white p-6 rounded-3xl shadow-soft flex items-center justify-between border-l-4 border-green-500">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">My Attendance</h3>
            <p className="text-sm text-gray-500">Mark yourself present for today ({new Date().toLocaleDateString()})</p>
          </div>
          <div>
            {dashboardData?.myAttendance ? (
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Present Today
              </div>
            ) : (
              <button 
                onClick={async () => {
                  try {
                    await api.post('/attendance/teacher/mark');
                    const res = await api.get('/dashboard/teacher');
                    setDashboardData(res.data.data);
                    toast.success('Attendance marked successfully');
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to mark attendance');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold shadow-sm transition"
              >
                I am Present
              </button>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2/3 width on lg) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* My Classes & Attendance Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* My Classes Grid */}
              <div className="bg-white p-6 rounded-3xl shadow-soft">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">My Classes</h3>
                  <Link to="/teacher/classes" className="text-primary text-sm font-semibold hover:underline">View All →</Link>
                </div>
                <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
                  {classes.length > 0 ? classes.map((assignment, idx) => {
                    const colors = [
                      { bg: 'bg-red-100', text: 'text-red-500' },
                      { bg: 'bg-blue-100', text: 'text-blue-500' },
                      { bg: 'bg-green-100', text: 'text-green-500' },
                      { bg: 'bg-purple-100', text: 'text-purple-500' }
                    ];
                    const color = colors[idx % colors.length];
                    const classNameStr = `${assignment.standardId?.name || ''} - ${assignment.sectionId?.name || ''}`;
                    const shortName = (assignment.standardId?.name?.substring(0,1) || '') + (assignment.sectionId?.name?.substring(0,1) || '');
                    
                    return (
                      <div key={assignment._id} className="border border-gray-100 rounded-xl p-3 hover:shadow-md transition bg-gray-50/50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 ${color.bg} ${color.text} rounded-full flex items-center justify-center font-bold shrink-0`}>
                            {shortName.toUpperCase() || 'C'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate">{classNameStr}</h4>
                            <p className="text-xs text-gray-500 truncate">{assignment.subject || 'General'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 text-xs font-semibold">
                          <Link to="/teacher/classes" className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">View</Link>
                          <Link to="/teacher/homework/create" className="bg-primary-light text-primary px-3 py-1.5 rounded-lg hover:bg-red-200 transition">+ HW</Link>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center text-gray-500 py-4 text-sm font-medium border border-dashed rounded-xl">No classes assigned yet.</div>
                  )}
                </div>
                <div className="mt-4">
                  <Link to="/teacher/homework/create" className="block w-full bg-primary text-white text-center font-semibold py-3 rounded-xl hover:bg-primary-dark transition shadow-sm">
                    + Add Homework
                  </Link>
                </div>
              </div>

              {/* Today's Attendance Chart Mock */}
              <div className="bg-white p-6 rounded-3xl shadow-soft flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Today's Attendance</h3>
                  <span className="text-gray-500 text-sm font-medium">📅 Today</span>
                </div>
                
                <div className="flex-1 flex items-center justify-center gap-6">
                  {/* Mock Donut Chart SVG */}
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 36 36" className="w-full h-full">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="4"/>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray={`${attPercentage}, 100`}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{totalAtt}</span>
                      <span className="text-xs text-gray-500 font-medium">Students</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          <span className="text-sm font-semibold text-gray-700">Present</span>
                        </div>
                        <span className="text-sm font-bold">{att?.present || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span className="text-sm font-semibold text-gray-700">Absent</span>
                        </div>
                        <span className="text-sm font-bold">{att?.absent || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          <span className="text-sm font-semibold text-gray-700">Leave</span>
                        </div>
                        <span className="text-sm font-bold">{att?.leave || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Link to="/teacher/attendance" className="block w-full bg-primary-light text-primary text-center font-semibold py-3 rounded-xl hover:bg-red-100 transition">
                    Take Attendance →
                  </Link>
                </div>
              </div>
              
            </div>

            {/* Recent Homework Table */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Homework</h3>
                <Link to="/teacher/homework" className="text-primary text-sm font-semibold hover:underline">View All →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 font-semibold border-b border-gray-100">
                      <th className="pb-3 px-2">Title</th>
                      <th className="pb-3 px-2">Class</th>
                      <th className="pb-3 px-2">Subject</th>
                      <th className="pb-3 px-2">Due Date</th>
                      <th className="pb-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {homeworks.length > 0 ? homeworks.slice(0, 5).map(hw => {
                      // Determine status based on due date
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const due = new Date(hw.dueDate);
                      due.setHours(0,0,0,0);
                      
                      let statusText = hw.status;
                      let statusColor = "bg-gray-100 text-gray-700";
                      let dueText = new Date(hw.dueDate).toLocaleDateString();
                      
                      if (due.getTime() === today.getTime()) {
                        statusText = "Due Today";
                        statusColor = "bg-orange-100 text-orange-700";
                        dueText = "Today";
                      } else if (due.getTime() - today.getTime() === 86400000) {
                        statusText = "Due Tomorrow";
                        statusColor = "bg-yellow-100 text-yellow-700";
                        dueText = "Tomorrow";
                      } else if (due > today) {
                        statusText = "Upcoming";
                        statusColor = "bg-blue-100 text-blue-700";
                      } else {
                        statusText = "Past Due";
                        statusColor = "bg-red-100 text-red-700";
                      }

                      return (
                        <tr key={hw._id} className="hover:bg-gray-50/50 transition">
                          <td className="py-4 px-2 font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-primary">📄</span> {hw.title}
                          </td>
                          <td className="py-4 px-2 text-gray-600 font-medium">{hw.classId?.className}</td>
                          <td className="py-4 px-2 text-gray-600">{hw.subjectId?.name}</td>
                          <td className={`py-4 px-2 font-semibold ${due.getTime() === today.getTime() ? 'text-red-500' : 'text-gray-500'}`}>
                            {dueText}
                          </td>
                          <td className="py-4 px-2">
                            <span className={`${statusColor} px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">No recent homework found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (1/3 width on lg) */}
          <div className="space-y-6">
            
            
            {/* Pending Requests */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Pending Requests</h3>
                <Link to="/teacher/leave-requests" className="text-primary text-sm font-semibold hover:underline">View All →</Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl">📄</div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">Leave Requests</h4>
                      <p className="text-xs text-gray-500">Students requesting leave</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700">
                    {dashboardData?.pendingRequests?.leave || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/teacher/homework" className="bg-red-50 hover:bg-red-100 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition duration-200">
                  <Edit3 className="w-6 h-6 text-red-600" />
                  <span className="font-bold text-red-700 text-xs">Create Homework</span>
                </Link>
                <Link to="/teacher/classes" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition duration-200">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-blue-700 text-xs">View Students</span>
                </Link>
                <Link to="/teacher/attendance" className="bg-green-50 hover:bg-green-100 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition duration-200">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-bold text-green-700 text-xs">Take Attendance</span>
                </Link>
                <Link to="/teacher/syllabus" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2 transition duration-200">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                  <span className="font-bold text-purple-700 text-xs">Manage Syllabus</span>
                </Link>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white p-6 rounded-3xl shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h3>
                <Link to="/teacher/homework" className="text-primary text-sm font-semibold hover:underline">View All →</Link>
              </div>
              <div className="space-y-4">
                {dashboardData?.homeworkDueToday?.length > 0 ? dashboardData.homeworkDueToday.map((hw) => (
                  <div key={hw._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{hw.title}</h4>
                        <p className="text-xs text-gray-500">{hw.subjectId?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Today</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center py-6 text-gray-400">
                    <FileWarning className="w-12 h-12 mb-2 text-gray-300" />
                    <p className="text-sm font-medium">No deadlines today</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default TeacherDashboard;
