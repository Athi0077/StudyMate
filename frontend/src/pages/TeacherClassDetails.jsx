import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';
import { Search, Sparkles, User, Key, CheckCircle, Clock } from 'lucide-react';

const TeacherClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Password Reset State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [studentToReset, setStudentToReset] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Fee Status State
  const [feeStatuses, setFeeStatuses] = useState({});
  const [feeLoading, setFeeLoading] = useState({});
  const [feeToast, setFeeToast] = useState(null);

  const handleResetPassword = (student) => {
    setStudentToReset(student);
    setTempPassword('');
    setResetModalOpen(true);
  };

  const confirmReset = async () => {
    try {
      setIsResetting(true);
      const res = await api.post(`/users/students/${studentToReset._id}/reset-password`);
      if (res.data.success) {
        setTempPassword(res.data.tempPassword);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch fee statuses for the class
  const fetchFeeStatuses = async () => {
    try {
      const res = await api.get(`/fee-status/class/${classId}`);
      if (res.data.success) {
        setFeeStatuses(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch fee statuses:', err);
    }
  };

  // Update a student's fee status
  const handleFeeStatusChange = async (studentId, newStatus) => {
    setFeeLoading((prev) => ({ ...prev, [studentId]: true }));
    setFeeToast(null);
    try {
      const res = await api.put(`/fee-status/student/${studentId}`, { feeStatus: newStatus });
      if (res.data.success) {
        setFeeStatuses((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            feeStatus: newStatus,
            statusUpdatedAt: new Date().toISOString(),
          },
        }));
        setFeeToast({ type: 'success', message: `Fee status updated to "${newStatus}"` });
      }
    } catch (err) {
      setFeeToast({ type: 'error', message: err.response?.data?.message || 'Failed to update fee status' });
    } finally {
      setFeeLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (feeToast) {
      const timer = setTimeout(() => setFeeToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feeToast]);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await api.get(`/classes/${classId}`);
        setClassData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load class');
      }
    };
    fetchClass();
    fetchFeeStatuses();
  }, [classId]);

  if (error) return <div className="p-6 text-red-600 font-bold">{error}</div>;
  if (!classData) return <div className="p-6">Loading...</div>;

  const filteredStudents = (classData.students || []).filter((student) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      student.name?.toLowerCase().includes(q) ||
      student.studentId?.toLowerCase().includes(q) ||
      student.grNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <Link to="/teacher/classes" className="text-red-600 font-bold hover:underline flex items-center gap-1 text-xs mb-2">
          &larr; Back to My Classes
        </Link>
      </div>
      
      <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold">{classData.className}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Teacher: <span className="font-bold text-red-200">{classData.teacherId?.name}</span> • Enrolled: <span className="font-bold text-red-200">{classData.students.length} Students</span>
          </p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-2xl text-center border border-white/10 shrink-0">
          <p className="text-[10px] uppercase font-bold text-red-200">Enrolled Students</p>
          <p className="text-2xl font-black text-white">{classData.students.length}</p>
        </div>
      </div>

      {/* Fee status toast notification */}
      {feeToast && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md ${
          feeToast.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{feeToast.type === 'success' ? '✅' : '❌'}</span>
          {feeToast.message}
          <button onClick={() => setFeeToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 bg-white dark:bg-[#0b1120] shadow-sm rounded-3xl p-6 border border-gray-100 dark:border-[#1E293B] space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-[#1E293B] pb-3">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" /> Student List ({filteredStudents.length})
              </h3>
              <p className="text-xs text-gray-400">Click any student to view their complete academic and performance intelligence.</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-[#172235] border border-gray-200 dark:border-[#334155] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                <thead className="bg-gray-50 dark:bg-[#172235] text-gray-600 dark:text-slate-300 font-bold uppercase">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3 whitespace-nowrap">Student Info</th>
                    <th className="p-3 whitespace-nowrap">Parent Details</th>
                    <th className="p-3 w-1/5 min-w-[150px]">Address</th>
                    <th className="p-3 whitespace-nowrap min-w-[130px]">Fee Status</th>
                    <th className="p-3 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                  {filteredStudents.map((student, index) => {
                    const status = feeStatuses[student._id]?.feeStatus || 'pending';
                    const isUpdating = feeLoading[student._id];
                    return (
                    <tr key={student._id} className="hover:bg-red-50/30 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3 text-gray-500 font-medium">{index + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <Link 
                          to={`/teacher/students/details/${student._id}`}
                          className="font-bold text-gray-900 dark:text-slate-100 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center text-xs overflow-hidden shrink-0">
                            {student.profilePic ? (
                              <img src={student.profilePic} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div>{student.name}</div>
                            {classData.classLeader && classData.classLeader._id === student._id && (
                              <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded border border-yellow-200 inline-block mt-0.5">👑 Class Leader</span>
                            )}
                          </div>
                        </Link>
                        <div className="text-gray-400 text-[10px] mt-0.5 font-mono">ID: {student.studentId || 'N/A'}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-gray-800 dark:text-slate-200 font-medium">{student.parentName || 'Not Linked'}</div>
                        {student.parentPhone && <div className="text-purple-600 font-medium text-[10px] mt-0.5 bg-purple-50 dark:bg-purple-950/40 inline-block px-1.5 py-0.5 rounded">📞 {student.parentPhone}</div>}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-slate-400">
                        <p className="line-clamp-2 text-[11px]" title={student.address}>{student.address || 'N/A'}</p>
                      </td>
                      <td className="p-3">
                        <div className="relative">
                          <select
                            id={`fee-status-${student._id}`}
                            value={status}
                            disabled={isUpdating}
                            onChange={(e) => handleFeeStatusChange(student._id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all appearance-none pr-6 w-full
                              ${status === 'completed'
                                ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400'
                              }
                              ${isUpdating ? 'opacity-60 cursor-wait' : ''}
                            `}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="completed">✅ Completed</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/teacher/students/details/${student._id}`}
                            className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg font-bold transition inline-flex items-center gap-1 shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" /> View Details
                          </Link>

                          <button 
                            onClick={() => handleResetPassword(student)}
                            className="text-[11px] bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap"
                          >
                            Reset Pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-xs py-6 text-center">No students found.</p>
          )}
        </div>
        
        <div className="lg:w-1/3">
          <ChatRoom entityType="class" entityId={classData._id} />
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0b1120] rounded-3xl p-6 max-w-md w-full shadow-xl border border-gray-100 dark:border-[#1E293B]">
            <h3 className="text-lg font-extrabold mb-4 text-gray-900 dark:text-slate-100">Reset Student Password</h3>
            {!tempPassword ? (
              <>
                <p className="mb-4 text-xs text-gray-600 dark:text-slate-400">Are you sure you want to reset the password for <span className="font-bold text-gray-900 dark:text-slate-100">{studentToReset?.name}</span>? This will log them out of all active devices immediately.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                  <button onClick={confirmReset} disabled={isResetting} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-xs font-bold rounded-xl disabled:opacity-50">
                    {isResetting ? 'Resetting...' : 'Yes, Reset Password'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-4 rounded-2xl mb-4 border border-green-200 dark:border-green-900/50">
                  <p className="font-bold text-xs mb-1">Password Reset Successful!</p>
                  <p className="text-[11px] mb-3">Please share this temporary password with the student:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white dark:bg-[#0b1120] px-3 py-2 rounded-xl border font-mono text-base flex-1 text-center font-bold text-emerald-600">{tempPassword}</code>
                    <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-700">Copy</button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 bg-gray-800 text-white font-bold text-xs hover:bg-gray-900 rounded-xl">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
    </Layout>
  );
};

export default TeacherClassDetails;
