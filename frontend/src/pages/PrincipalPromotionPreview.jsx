import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';

const PrincipalPromotionPreview = () => {
  const { id } = useParams(); // destination year ID
  const navigate = useNavigate();
  
  const [activeYear, setActiveYear] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSetup = async () => {
      try {
        setLoading(true);
        // Find active year
        const yearsRes = await api.get('/academic-years');
        const active = yearsRes.data.data.find(y => y.status === 'active');
        if (!active) {
          toast.error("No active academic year found for promotion source.");
          return;
        }
        setActiveYear(active);

        // Fetch preview
        const previewRes = await api.post('/promotions/preview', {
          sourceAcademicYearId: active._id,
          destinationAcademicYearId: id
        });
        
        setPreviewData(previewRes.data.data);
      } catch (err) {
        toast.error("Failed to load promotion preview");
      } finally {
        setLoading(false);
      }
    };
    fetchSetup();
  }, [id]);

  const handleActionChange = (index, newAction) => {
    const newData = [...previewData];
    newData[index].action = newAction;
    setPreviewData(newData);
  };

  const handleConfirm = async () => {
    if (!window.confirm("You are about to process the annual promotion. This will create new enrollment records for eligible students. Continue?")) return;

    try {
      setSubmitting(true);
      await api.post('/promotions/confirm', {
        sourceAcademicYearId: activeYear._id,
        destinationAcademicYearId: id,
        previewData
      });
      toast.success("Promotion processing completed!");
      navigate('/principal/academic-years');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process promotion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout role="principal">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Promotion Preview</h2>
        
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Generating preview... this might take a moment.</div>
          ) : previewData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active enrollments found in the source academic year to promote.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="p-4 font-medium">Student</th>
                      <th className="p-4 font-medium">Current Class</th>
                      <th className="p-4 font-medium">Next Class (Proposed)</th>
                      <th className="p-4 font-medium">Action</th>
                      <th className="p-4 font-medium">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.map((item, idx) => (
                      <tr key={item.studentId} className="hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">{item.studentName}</p>
                          <p className="text-xs text-gray-500">{item.email}</p>
                        </td>
                        <td className="p-4 text-gray-600">{item.fromClassName}</td>
                        <td className="p-4 text-gray-600">{item.toClassName || '-'}</td>
                        <td className="p-4">
                          <select 
                            className="border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                            value={item.action}
                            onChange={(e) => handleActionChange(idx, e.target.value)}
                          >
                            <option value="promote">Promote</option>
                            <option value="graduate">Graduate</option>
                            <option value="repeat">Repeat</option>
                            <option value="transfer">Transfer Out</option>
                            <option value="exclude">Exclude</option>
                          </select>
                        </td>
                        <td className="p-4">
                          {item.errorDetails ? (
                            <span className="text-red-500 font-medium text-xs bg-red-50 px-2 py-1 rounded">{item.errorDetails}</span>
                          ) : (
                            <span className="text-green-500 font-medium text-xs bg-green-50 px-2 py-1 rounded">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={handleConfirm}
                  disabled={submitting || previewData.some(p => p.errorDetails && p.action === 'promote')}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Confirm Promotion'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalPromotionPreview;
