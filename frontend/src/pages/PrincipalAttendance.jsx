import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';

const PrincipalAttendance = () => {
  const [overview, setOverview] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, classesRes] = await Promise.all([
          api.get('/attendance/overview'),
          api.get('/classes')
        ]);
        setOverview(overviewRes.data.data);
        setClasses(classesRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedClasses = classes.reduce((acc, cls) => {
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

  if (loading) return <Layout><div className="p-12 text-center text-gray-500 font-medium">Loading attendance data...</div></Layout>;
  if (!overview) return <Layout><div className="p-12 text-center text-red-500 font-medium">Failed to load overview.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Attendance Overview</h2>

        <div className="bg-white p-8 rounded-2xl shadow-soft">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Today's Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Students</p>
              <p className="text-4xl font-bold mt-3 text-gray-800">{overview.totalStudents}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-xs text-green-700 uppercase font-bold tracking-wider">Present</p>
              <p className="text-4xl font-bold text-green-600 mt-3">{overview.present}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-xs text-red-700 uppercase font-bold tracking-wider">Absent</p>
              <p className="text-4xl font-bold text-red-600 mt-3">{overview.absent}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-xs text-orange-700 uppercase font-bold tracking-wider">On Leave</p>
              <p className="text-4xl font-bold text-orange-500 mt-3">{overview.leave}</p>
            </div>
            <div className="text-center p-4 bg-primary-light rounded-xl">
              <p className="text-xs text-primary uppercase font-bold tracking-wider">Attendance Rate</p>
              <p className="text-4xl font-bold text-primary mt-3">{overview.percentage}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-soft mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Class-wise Attendance</h3>
          {classes.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No classes found.</p>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedClasses).map(standard => (
                <div key={standard} className="border rounded-xl p-4">
                  <h4 className="text-lg font-bold mb-4 text-green-700 bg-green-50 inline-block px-4 py-1 rounded-full">{standard}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupedClasses[standard].map(cls => {
                      const sessionStatus = overview.classSessions?.find(cs => cs.classId?._id === cls._id || cs.classId === cls._id);
                      const m = sessionStatus?.morning;
                      const a = sessionStatus?.afternoon;
                      return (
                        <Link 
                          key={cls._id} 
                          to={`/principal/attendance/${cls._id}`}
                          className="bg-white border-2 border-gray-100 hover:border-green-500 hover:shadow-md p-4 rounded-xl flex flex-col justify-between transition cursor-pointer"
                        >
                          <div className="text-center mb-3">
                            <p className="font-bold text-gray-800 text-lg">{cls.section}</p>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Section</p>
                          </div>
                          <div className="space-y-4 mt-auto">
                            {/* Morning Session Stats */}
                            <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs">
                              <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200">
                                <span className="font-bold text-gray-700">Morning</span>
                                {m ? (
                                  <span className="text-green-700 font-bold" title={`By ${m.submittedBy} at ${new Date(m.submittedAt).toLocaleTimeString()}`}>Completed</span>
                                ) : (
                                  <span className="text-gray-400 font-bold">Not Taken</span>
                                )}
                              </div>
                              {m && (
                                <div className="flex justify-between text-gray-600 font-medium px-1">
                                  <span>P: <span className="text-green-600">{m.present}</span></span>
                                  <span>A: <span className="text-red-600">{m.absent}</span></span>
                                  <span>L: <span className="text-orange-600">{m.leave}</span></span>
                                </div>
                              )}
                            </div>

                            {/* Afternoon Session Stats */}
                            <div className="bg-gray-50 border border-gray-100 p-2 rounded-lg text-xs">
                              <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200">
                                <span className="font-bold text-gray-700">Afternoon</span>
                                {a ? (
                                  <span className="text-green-700 font-bold" title={`By ${a.submittedBy} at ${new Date(a.submittedAt).toLocaleTimeString()}`}>Completed</span>
                                ) : (
                                  <span className="text-gray-400 font-bold">Not Taken</span>
                                )}
                              </div>
                              {a && (
                                <div className="flex justify-between text-gray-600 font-medium px-1">
                                  <span>P: <span className="text-green-600">{a.present}</span></span>
                                  <span>A: <span className="text-red-600">{a.absent}</span></span>
                                  <span>L: <span className="text-orange-600">{a.leave}</span></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalAttendance;
