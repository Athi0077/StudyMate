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

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-2/3 bg-white shadow rounded p-6 overflow-x-auto">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">Students</h3>
          {classData.students.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3 whitespace-nowrap">Student Info</th>
                    <th className="p-3 whitespace-nowrap">Parent Info</th>
                    <th className="p-3 w-1/4 min-w-[200px]">Address</th>
                    <th className="p-3 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classData.students.map((student, index) => (
                    <tr key={student._id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 text-gray-500">{index + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-gray-800">{student.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5 font-mono">ID: {student.studentId || 'N/A'}</div>
                        {student.email && !student.email.endsWith('@studymate.school') && <div className="text-gray-500 text-xs mt-0.5">{student.email}</div>}
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
                        <button 
                          onClick={() => handleResetPassword(student)}
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap"
                        >
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
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
