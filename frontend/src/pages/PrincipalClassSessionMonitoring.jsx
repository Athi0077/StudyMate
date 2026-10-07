import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Search, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const PrincipalClassSessionMonitoring = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls => 
    cls.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.standard?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.section?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedClasses = filteredClasses.reduce((acc, cls) => {
    if (!acc[cls.standard]) {
      acc[cls.standard] = [];
    }
    acc[cls.standard].push(cls);
    return acc;
  }, {});

  // Sort sections alphabetically within each standard
  Object.keys(groupedClasses).forEach(standard => {
    groupedClasses[standard].sort((a, b) => a.section.localeCompare(b.section));
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex items-center gap-4">
          <Link 
            to="/principal/attendance"
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Period Attendance & Monitoring</h2>
            <p className="text-gray-500 font-semibold">Select a class to view period-wise attendance</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-soft border border-gray-50">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by class, standard or section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading classes...</div>
        ) : Object.keys(groupedClasses).length > 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-soft">
            <div className="space-y-6">
              {Object.keys(groupedClasses).map(standard => (
                <div key={standard} className="border rounded-xl p-4">
                  <h4 className="text-lg font-bold mb-4 text-green-700 bg-green-50 inline-block px-4 py-1 rounded-full">{standard}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupedClasses[standard].map(cls => (
                      <Link 
                        key={cls._id} 
                        to={`/principal/attendance/period-monitoring/${cls._id}`}
                        className="bg-white border-2 border-gray-100 hover:border-green-500 hover:shadow-md p-6 rounded-xl flex flex-col justify-center items-center transition cursor-pointer"
                      >
                        <p className="font-bold text-gray-800 text-2xl mb-1">{cls.section}</p>
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Section</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Found</h3>
            <p className="text-gray-500">There are no classes matching your search.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PrincipalClassSessionMonitoring;
