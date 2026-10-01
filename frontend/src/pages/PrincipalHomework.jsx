import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

const PrincipalHomework = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeworks = async () => {
      try {
        const res = await api.get('/homework/admin-overview');
        setHomeworks(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeworks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework?")) return;
    try {
      await api.delete(`/homework/${id}`);
      toast.success("Homework deleted successfully");
      setHomeworks(prev => prev.filter(hw => hw._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete homework");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">All Homework Overview</h2>

        <div className="bg-white shadow-soft rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading homeworks...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="p-4 font-medium">Class</th>
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium">Teacher</th>
                    <th className="p-4 font-medium">Homework Title</th>
                    <th className="p-4 font-medium">Due Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {homeworks.length > 0 ? (
                    homeworks.map(hw => (
                      <tr key={hw._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-bold text-gray-800">{hw.classId?.className}</td>
                        <td className="p-4 text-gray-600">{hw.subjectId?.name}</td>
                        <td className="p-4 text-gray-600">{hw.teacherId?.name}</td>
                        <td className="p-4 text-gray-800 font-medium">{hw.title}</td>
                        <td className="p-4 text-gray-600">{new Date(hw.dueDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 text-xs rounded-lg font-semibold capitalize ${hw.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {hw.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDelete(hw._id)} className="text-red-500 hover:text-red-700 transition" title="Delete Homework">
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-12 text-center text-gray-500">No homework assignments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalHomework;
