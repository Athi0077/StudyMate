import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import TotalAttendanceReport from '../components/dashboard/TotalAttendanceReport';
import toast from 'react-hot-toast';
import { AlertCircle, ArrowRight, Contact } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock trend data for sparklines
const upTrend = [{ value: 10 }, { value: 25 }, { value: 45 }, { value: 30 }, { value: 60 }, { value: 75 }, { value: 95 }];
const stableTrend = [{ value: 50 }, { value: 52 }, { value: 49 }, { value: 55 }, { value: 50 }, { value: 58 }, { value: 60 }];
const volatileTrend = [{ value: 20 }, { value: 80 }, { value: 40 }, { value: 90 }, { value: 50 }, { value: 85 }, { value: 70 }];

const StatCard = ({ icon, bgIconClass, borderClass, value, label, trendData, strokeColor }) => (
  <div className={`bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700 p-5 rounded-2xl shadow-soft flex flex-col items-center justify-center text-center gap-2 border-b-4 ${borderClass} hover:-translate-y-1 transition duration-300 relative overflow-hidden group`}>
    <div className={`w-12 h-12 ${bgIconClass} rounded-full flex items-center justify-center font-bold text-xl relative z-10 group-hover:scale-110 transition-transform`}>{icon}</div>
    <div className="relative z-10">
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
    {trendData && (
      <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 pointer-events-none translate-y-2 group-hover:translate-y-0 group-hover:opacity-50 transition-all duration-500">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={3} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const PrincipalDashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({ standards: 0, sections: 0, teachers: 0, assignments: 0 });
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);

  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [savingSchoolName, setSavingSchoolName] = useState(false);
  const [selectedSession, setSelectedSession] = useState('MORNING');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get(`/dashboard/principal?session=${selectedSession}`);
        setDashboardData(res.data.data);
        
        const [stdsRes, asgRes, usersRes, reqRes, reportsRes, schoolNameRes] = await Promise.all([
          api.get('/standards'),
          api.get('/teacher-assignments'),
          api.get('/users/active-teachers'),
          api.get('/users/pending-teachers'),
          api.get('/reports'),
          api.get('/id-card/school-name').catch(() => ({ data: { schoolName: 'StudyMate School' } }))
        ]);
        
        let secCount = 0;
        stdsRes.data.data.forEach(s => { secCount += s.sections?.length || 0; });
        
        setStats({
          standards: stdsRes.data.data.length,
          sections: secCount,
          teachers: usersRes.data.data.length,
          assignments: asgRes.data.data.length
        });

        setTeacherAssignments(asgRes.data.data.slice(0, 5));
        setTeacherRequests(reqRes.data.data ? reqRes.data.data.slice(0, 5) : []);

        if (schoolNameRes.data?.schoolName) {
          setSchoolNameInput(schoolNameRes.data.schoolName);
        }
        
        if (reportsRes?.data?.data) {
          const unresolved = reportsRes.data.data.filter(r => r.status !== 'CLOSED' && r.status !== 'RESOLVED');
          unresolved.sort((a, b) => {
            const p = { "Urgent": 3, "High": 2, "Normal": 1 };
            return (p[b.priority] || 0) - (p[a.priority] || 0);
          });
          setPendingReports(unresolved.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, [selectedSession]);

  const handleSetSchoolName = async (e) => {
    e.preventDefault();
    if (!schoolNameInput.trim()) {
      return toast.error("Please enter a valid school name");
    }

    try {
      setSavingSchoolName(true);
      const res = await api.put('/id-card/school-name', { schoolName: schoolNameInput.trim() });
      if (res.data?.success) {
        toast.success("School Name updated on all ID Cards! 🪪");
        setSchoolNameInput(res.data.schoolName);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update School Name");
    } finally {
      setSavingSchoolName(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-8 flex justify-between items-center relative overflow-hidden">
          <div className="z-10 relative">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-emerald-100 mb-2">Good Morning, {currentUser?.name}! 👋</h1>
            <p className="text-gray-600 dark:text-emerald-200/80 max-w-md">Manage your school efficiently and build a brighter future for every student.</p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 opacity-20 w-1/3 bg-gradient-to-l from-green-500 to-transparent"></div>
        </div>

        {/* Attendance Session Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Daily Attendance Overview</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">View real-time attendance statistics by session.</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-[#0b1120] p-1 rounded-xl border border-gray-200 dark:border-slate-700 w-full sm:w-auto">
            <button
              onClick={() => setSelectedSession('MORNING')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${selectedSession === 'MORNING' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Morning
            </button>
            <button
              onClick={() => setSelectedSession('AFTERNOON')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${selectedSession === 'AFTERNOON' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Afternoon
            </button>
          </div>
        </div>

        {/* Daily Attendance Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon="🎓" bgIconClass="bg-blue-100 text-blue-600" borderClass="border-blue-500" value={dashboardData?.totalStudents || 0} label="Total Students" />
          <StatCard icon="✅" bgIconClass="bg-green-100 text-green-600" borderClass="border-green-500" value={dashboardData?.todayAttendance?.present || 0} label={`${selectedSession === 'MORNING' ? 'Morning' : 'Afternoon'} Present`} />
          <StatCard icon="❌" bgIconClass="bg-red-100 text-red-600" borderClass="border-red-500" value={dashboardData?.todayAttendance?.absent || 0} label={`${selectedSession === 'MORNING' ? 'Morning' : 'Afternoon'} Absent`} />
          <StatCard icon="🛌" bgIconClass="bg-amber-100 text-amber-600" borderClass="border-amber-500" value={dashboardData?.todayAttendance?.leave || 0} label="On Leave" />
          <StatCard icon="📊" bgIconClass="bg-indigo-100 text-indigo-600" borderClass="border-indigo-500" value={`${dashboardData?.overallStudentAttendancePercentage || 0}%`} label="Attendance Rate" />
        </div>

        {/* School Overview Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon="👨‍🏫" bgIconClass="bg-purple-100 text-purple-600" borderClass="border-purple-500" trendData={stableTrend} strokeColor="#a855f7" value={stats.teachers || dashboardData?.totalTeachers || 0} label="Total Teachers" />
          <StatCard icon="✔️" bgIconClass="bg-emerald-100 text-emerald-600" borderClass="border-emerald-500" trendData={volatileTrend} strokeColor="#10b981" value={dashboardData?.presentTeachers || 0} label="Teachers Present" />
          <StatCard icon="🏫" bgIconClass="bg-pink-100 text-pink-600" borderClass="border-pink-500" trendData={stableTrend} strokeColor="#ec4899" value={dashboardData?.totalClasses || 0} label="Active Classes" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <TotalAttendanceReport />

            {/* Analytics Charts */}
            {dashboardData?.monthlyAttendance?.length > 0 && dashboardData?.homeworkCompletion?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Attendance Trends */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Attendance Trends</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData.monthlyAttendance} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Present (%)" />
                        <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="Absent (%)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Homework Completion Rates */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Homework Completion</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.homeworkCompletion} margin={{ top: 5, right: 20, bottom: 5, left: -20 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="standard" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="completionRate" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Completion Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Assignments */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">Teacher Assignments</h2>
                <Link to="/principal/assignments" className="text-primary text-sm font-semibold">View All →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">Teacher</th>
                      <th className="pb-3 font-medium">Class & Section</th>
                      <th className="pb-3 font-medium">Subject</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherAssignments.length > 0 ? teacherAssignments.map(asg => (
                      <tr key={asg._id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 font-medium text-gray-800">{asg.teacherId?.name || 'Unknown'}</td>
                        <td className="py-3 text-gray-500">{asg.standardId?.name} - {asg.sectionId?.name}</td>
                        <td className="py-3 text-gray-500">{asg.subject || 'General'}</td>
                        <td className="py-3"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-semibold">Assigned</span></td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">No assignments found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

          <div className="space-y-6">
            {/* Action Center */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
               <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  Action Center
               </h2>
               <div className="flex flex-col gap-3">
                 <Link to="/principal/teachers?tab=pending" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">👥</div>
                     <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition">Teacher Registrations</span>
                   </div>
                   {teacherRequests.length > 0 ? (
                     <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">{teacherRequests.length} Pending</span>
                   ) : (
                     <span className="text-gray-400 text-xs">All cleared</span>
                   )}
                 </Link>

                 <Link to="/principal/leave-requests" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:border-purple-100 border border-transparent transition group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">📅</div>
                     <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition">Leave Requests</span>
                   </div>
                   <span className="text-gray-400 text-xs">All cleared</span>
                 </Link>

                 <Link to="/principal/exams" className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 hover:border-emerald-100 border border-transparent transition group">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">📝</div>
                     <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition">Exam Approvals</span>
                   </div>
                   <span className="text-gray-400 text-xs">All cleared</span>
                 </Link>
               </div>
            </div>

            {/* Unresolved Reports Widget */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500 animate-pulse" />
                    Needs Attention
                 </h2>
                 <Link to="/principal/reports" className="text-primary text-sm font-semibold flex items-center gap-1">
                    View All <ArrowRight className="w-4 h-4" />
                 </Link>
               </div>
               <div className="space-y-3">
                  {pendingReports.length > 0 ? pendingReports.map((report) => (
                    <div key={report._id} className="p-3 bg-orange-50 border border-orange-100 rounded-xl hover:shadow-sm transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-0.5 rounded-md">
                          {report.priority}
                        </span>
                        <span className="text-[10px] text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{report.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">From: {report.reporterId?.name} ({report.reporterRole})</p>
                      <Link to="/principal/reports" className="mt-2 text-xs font-bold text-blue-600 block hover:underline">
                        Resolve Now →
                      </Link>
                    </div>
                  )) : (
                    <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100">
                      <p className="text-green-700 font-semibold text-sm">All caught up! 🎉</p>
                      <p className="text-green-600 text-xs mt-1">No pending reports.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* ID Card School Name Setting Widget */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Contact className="w-5 h-5 text-indigo-600" />
                ID Card School Name
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Set the official school name displayed on all digital ID cards.
              </p>
              <form onSubmit={handleSetSchoolName} className="flex gap-2">
                <input 
                  type="text" 
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. ABC School"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  type="submit" 
                  disabled={savingSchoolName}
                  className="bg-primary text-white font-extrabold px-5 py-2 rounded-xl text-sm hover:bg-primary-dark transition disabled:opacity-50 shadow-soft uppercase tracking-wider"
                >
                  {savingSchoolName ? 'Saving...' : 'SET'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalDashboard;
