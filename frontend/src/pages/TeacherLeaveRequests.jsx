import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TeacherLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/leave-requests/teacher');
      setRequests(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/leave-requests/${id}/${action}`);
      // Remove from list or refresh
      setRequests(requests.filter(r => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} leave request`);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <Link to="/teacher/attendance" className="text-blue-600 hover:underline">&larr; Back to Attendance</Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">Leave Requests</h2>

      <div className="space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : requests.length > 0 ? (
          requests.map(req => (
            <div key={req._id} className="bg-white border-l-4 border-orange-500 p-6 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <p className="font-bold text-lg text-gray-800">{req.studentId?.name} <span className="text-sm font-normal text-gray-500">({req.classId?.className})</span></p>
                <p className="font-semibold text-blue-600 my-1">{new Date(req.date).toLocaleDateString()}</p>
                <p className="text-gray-700 bg-gray-50 p-2 rounded border mt-2">"{req.reason}"</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(req._id, 'approve')}
                  className="bg-green-600 text-white font-bold px-4 py-2 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleAction(req._id, 'reject')}
                  className="bg-red-100 text-red-700 font-bold px-4 py-2 rounded hover:bg-red-200"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 bg-white shadow rounded text-gray-500">
            No pending leave requests.
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default TeacherLeaveRequests;
