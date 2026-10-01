import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/layout/Layout';

const PrincipalStandards = () => {
  const [standards, setStandards] = useState([]);
  const [newStandardName, setNewStandardName] = useState('');
  const [newSectionNames, setNewSectionNames] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      const res = await api.get('/standards');
      setStandards(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateStandard = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/standards', { name: newStandardName });
      setSuccess('Standard created successfully');
      setNewStandardName('');
      fetchStandards();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating standard');
    }
  };

  const handleDeleteStandard = async (id) => {
    if (!window.confirm("Are you sure you want to delete this standard?")) return;
    setError(''); setSuccess('');
    try {
      await api.delete(`/standards/${id}`);
      setSuccess('Standard deleted');
      fetchStandards();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting standard');
    }
  };

  const handleAddSection = async (standardId) => {
    const sectionName = newSectionNames[standardId];
    if (!sectionName) return;
    setError(''); setSuccess('');
    try {
      await api.post('/standards/sections', { name: sectionName, standardId });
      setSuccess('Section added successfully');
      setNewSectionNames({ ...newSectionNames, [standardId]: '' });
      fetchStandards();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding section');
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Are you sure you want to delete this section?")) return;
    setError(''); setSuccess('');
    try {
      await api.delete(`/standards/sections/${id}`);
      setSuccess('Section deleted');
      fetchStandards();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting section');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Standards & Sections</h2>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-xl">{success}</div>}

        <div className="bg-white p-6 rounded-2xl shadow-soft mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Standard</h3>
          <form onSubmit={handleCreateStandard} className="flex gap-4">
            <input 
              type="text" 
              placeholder="e.g. 1st Standard, 8th Standard" 
              value={newStandardName} 
              onChange={e => setNewStandardName(e.target.value)}
              className="flex-1 p-3 border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <button type="submit" className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition">Create</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {standards.map(standard => (
            <div key={standard._id} className="bg-white p-6 rounded-2xl shadow-soft">
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800">{standard.name}</h3>
                <button onClick={() => handleDeleteStandard(standard._id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-600 text-sm mb-3">Sections:</h4>
                {standard.sections && standard.sections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {standard.sections.map(sec => (
                      <div key={sec._id} className="bg-primary-light text-primary font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span>{sec.name}</span>
                        <button onClick={() => handleDeleteSection(sec._id)} className="text-primary hover:text-red-500 font-bold ml-1 rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-50 transition">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No sections added yet.</p>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <input 
                  type="text" 
                  placeholder="New Section (e.g. A, B)" 
                  value={newSectionNames[standard._id] || ''} 
                  onChange={e => setNewSectionNames({...newSectionNames, [standard._id]: e.target.value})}
                  className="flex-1 p-2.5 border border-gray-100 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <button 
                  onClick={() => handleAddSection(standard._id)}
                  className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm font-semibold"
                >
                  Add Section
                </button>
              </div>
            </div>
          ))}
          
          {standards.length === 0 && <p className="text-gray-500 text-center py-8 col-span-full">No standards created yet. Create one above.</p>}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalStandards;
