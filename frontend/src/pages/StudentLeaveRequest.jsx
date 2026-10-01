import Layout from '../components/layout/Layout';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const StudentLeaveRequest = () => {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!reason.trim()) {
      setError('Leave reason is required.');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/leave-requests', { date, reason });
      setSuccess('Leave request submitted successfully.');
      setTimeout(() => navigate('/student/attendance'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link to="/student/attendance" className="text-blue-600 hover:underline">&larr; Back to Attendance</Link>
      </div>

      <div className="bg-white p-8 rounded shadow border-t-4 border-orange-500">
        <h2 className="text-2xl font-bold mb-6">Request Leave</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 font-semibold">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 font-semibold">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-700">Leave Date</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]} // usually leave is for future/today
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 font-bold text-gray-700">Reason</label>
            <textarea 
              className="w-full p-2 border rounded h-32 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Family function, medical reasons..."
              required
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
    </Layout>
  );
};

export default StudentLeaveRequest;
