import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Clock, CheckCircle, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const PrincipalClassPeriodSessions = () => {
  const { classId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classDetails, setClassDetails] = useState(null);

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    if (classId) {
      fetchMonitoringData();
    }
  }, [selectedDate, classId]);

  const fetchClassDetails = async () => {
    try {
      const res = await api.get(`/classes/${classId}`);
      if (res.data.success) {
        setClassDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/class-sessions/monitoring?date=${selectedDate}&classId=${classId}`);
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load class sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex items-center gap-4">
          <Link 
            to="/principal/attendance/period-monitoring"
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {classDetails ? `${classDetails.className} - Period Sessions` : 'Period Attendance & Monitoring'}
            </h2>
            <p className="text-gray-500 font-semibold">Monitor period-wise attendance for this class</p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-soft border border-gray-50">
          <div className="flex items-center gap-4">
            <label className="font-bold text-gray-700">Date:</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-gray-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading session data...</div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sessions.map(session => {
              const totalStudents = session.attendance?.length || 0;
              const presentCount = session.attendance?.filter(a => a.status === 'present').length || 0;
              
              return (
                <div key={session._id} className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {session.classId?.className} <span className="text-gray-400 font-medium text-sm">• Period {session.periodNumber}</span>
                      </h3>
                      <p className="font-bold text-primary mt-1">{session.subject}</p>
                    </div>
                    {session.sessionStatus === 'COMPLETED' ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In Progress
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Teacher</p>
                      {session.isSubstitute ? (
                        <>
                          <p className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                            <span className="text-[10px] uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-black">Sub</span>
                            {session.actualTeacherId?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400 line-through mt-0.5">{session.teacherId?.name}</p>
                        </>
                      ) : (
                        <p className="font-bold text-gray-800">{session.teacherId?.name || 'Unknown'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Attendance</p>
                      <p className="font-bold text-gray-800">{totalStudents > 0 ? `${presentCount} / ${totalStudents} Present` : 'Not Taken'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <span className="text-gray-500 font-medium text-sm w-1/4">Chapter/Topic</span>
                      <span className="font-bold text-gray-800 text-sm text-right w-3/4">
                        {session.chapter ? `${session.chapter} - ${session.topic}` : 'Not Specified'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <span className="text-gray-500 font-medium text-sm w-1/4">Lesson Log</span>
                      <span className="font-bold text-gray-800 text-sm text-right w-3/4">
                        {session.lessonLog || 'Not Logged'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 font-medium text-sm w-1/4">Homework</span>
                      <span className="font-bold text-gray-800 text-sm text-right w-3/4">
                        {session.homeworkId ? 'Assigned' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Sessions Found</h3>
            <p className="text-gray-500">There are no period sessions logged for {selectedDate} in this class.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PrincipalClassPeriodSessions;
