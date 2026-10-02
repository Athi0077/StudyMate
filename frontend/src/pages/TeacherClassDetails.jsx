import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ChatRoom from '../components/common/ChatRoom';

const TeacherClassDetails = () => {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');
  
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

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <Link to="/teacher/classes" className="text-blue-600 hover:underline">&larr; Back to My Classes</Link>
      </div>
      <div className="bg-white shadow rounded p-6 mb-6 border-t-4 border-blue-600">
        <h2 className="text-3xl font-bold mb-2">{classData.className}</h2>
        <div className="text-gray-700 mb-1">Teacher: <span className="font-semibold">{classData.teacherId.name}</span></div>
        <div className="text-gray-700">Students: <span className="font-semibold">{classData.students.length}</span></div>
      </div>

      {/* Fee status toast notification */}
      {feeToast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md animate-fade-in transition-all ${
          feeToast.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <span>{feeToast.type === 'success' ? '✅' : '❌'}</span>
          {feeToast.message}
          <button onClick={() => setFeeToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-2/3 bg-white shadow rounded p-6 overflow-x-auto">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Students</h3>
          {classData.students.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm min-w-[850px]">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3 whitespace-nowrap">Student Info</th>
                    <th className="p-3 whitespace-nowrap">Parent Info</th>
                    <th className="p-3 w-1/5 min-w-[160px]">Address</th>
                    <th className="p-3 whitespace-nowrap min-w-[150px]">Fee Status</th>
                    <th className="p-3 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classData.students.map((student, index) => {
                    const status = feeStatuses[student._id]?.feeStatus || 'pending';
                    const isUpdating = feeLoading[student._id];
                    return (
                    <tr key={student._id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 text-gray-500">{index + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                          {student.name}
                          {classData.classLeader && classData.classLeader._id === student._id && (
                            <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-md border border-yellow-200">👑 Class Leader</span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 font-mono">ID: {student.studentId || 'N/A'}</div>
                        {student.phone && <div className="text-blue-600 font-medium text-xs mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">📞 {student.phone}</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-gray-800 font-medium">{student.parentName || 'Not Linked'}</div>
                        {student.parentPhone && <div className="text-purple-600 font-medium text-xs mt-1 bg-purple-50 inline-block px-2 py-0.5 rounded-md">📞 {student.parentPhone}</div>}
                      </td>
                      <td className="p-3 text-gray-600">
                        <p className="line-clamp-2 text-xs" title={student.address}>{student.address || 'N/A'}</p>
                      </td>
                      <td className="p-3">
                        <div className="relative">
                          <select
                            id={`fee-status-${student._id}`}
                            value={status}
                            disabled={isUpdating}
                            onChange={(e) => handleFeeStatusChange(student._id, e.target.value)}
                            className={`text-xs font-bold px-3 py-2 rounded-lg border cursor-pointer transition-all appearance-none pr-7 w-full
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
                          {isUpdating && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                          )}
                          {!isUpdating && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-gray-400">▼</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => handleResetPassword(student)}
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No students joined yet.</p>
          )}
        </div>
        
        <div className="lg:w-1/3">
          <ChatRoom entityType="class" entityId={classData._id} />
        </div>
      </div>

      {resetModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Reset Student Password</h3>
            {!tempPassword ? (
              <>
                <p className="mb-4 text-gray-700">Are you sure you want to reset the password for <span className="font-bold">{studentToReset?.name}</span>? This will log them out of all active devices immediately.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                  <button onClick={confirmReset} disabled={isResetting} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded disabled:opacity-50">
                    {isResetting ? 'Resetting...' : 'Yes, Reset Password'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4 border border-green-200">
                  <p className="font-bold mb-2">Password Reset Successful!</p>
                  <p className="text-sm mb-4">Please securely share this temporary password with the student. They will be required to change it on their next login.</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-3 py-2 rounded border border-green-200 font-mono text-lg flex-1 text-center">{tempPassword}</code>
                    <button onClick={() => navigator.clipboard.writeText(tempPassword)} className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">Copy</button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setResetModalOpen(false)} className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 rounded">Done</button>
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

