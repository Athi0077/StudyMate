import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import Layout from '../components/layout/Layout';
import { Calendar, Clock, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ParentClassSessions = () => {
  const { currentUser } = useContext(AuthContext);
  const [children, setChildren] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await api.get('/dashboard/parent');
        const childrenData = res.data.data.children || [];
        setChildren(childrenData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load children data");
      }
    };
    fetchChildren();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchSessions();
    } else {
      setLoading(false);
    }
  }, [children, activeTab, selectedDate]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const child = children[activeTab];
      if (!child) return;
      
      const res = await api.get(`/class-sessions/parent/children/${child._id}?date=${selectedDate}`);
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'present':
        return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> Present</span>;
      case 'absent':
        return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" /> Absent</span>;
      case 'leave':
        return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> On Leave</span>;
      default:
        return <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">Not Taken</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Class Sessions History</h2>
            <p className="text-gray-500 font-semibold mt-1">View what was taught in class today and period attendance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {children.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {children.map((child, index) => (
              <button
                key={child._id}
                onClick={() => setActiveTab(index)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition whitespace-nowrap flex items-center gap-2 border ${
                  activeTab === index 
                    ? 'bg-primary text-white border-primary shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${activeTab === index ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                  {child.name.charAt(0)}
                </div>
                {child.name}
              </button>
            ))}
          </div>
        )}

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
        ) : children.length === 0 ? (
           <div className="bg-white p-12 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
             <p className="text-gray-500">No children linked to your account.</p>
           </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map(session => (
              <div key={session._id} className="bg-white p-6 rounded-3xl shadow-soft border border-gray-50 flex flex-col gap-4 relative overflow-hidden group hover:border-primary/30 transition">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">Period {session.periodNumber}</span>
                    <h3 className="text-xl font-bold text-gray-900">{session.subject}</h3>
                    <p className="text-gray-500 font-medium text-sm flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Teacher: {session.teacher}
                    </p>
                  </div>
                  {getStatusBadge(session.studentStatus)}
                </div>

                <div className="mt-2 space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Topic Taught
                    </h4>
                    <p className="font-semibold text-gray-800 text-sm">
                      {session.chapter ? `${session.chapter} - ${session.topic}` : (session.sessionStatus === 'COMPLETED' || session.sessionStatus === 'LESSON_LOG_COMPLETED' ? 'No specific topic recorded.' : 'Class in progress / not logged yet.')}
                    </p>
                  </div>
                  
                  {session.lessonLog && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lesson Notes</h4>
                      <p className="font-semibold text-gray-700 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {session.lessonLog}
                      </p>
                    </div>
                  )}

                  {session.homeworkAssigned && (
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex justify-between items-center">
                       <div>
                         <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-0.5">Homework Assigned</p>
                         <p className="font-bold text-purple-900 text-sm">{session.homeworkTitle || 'View in activities'}</p>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-soft text-center border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Sessions Found</h3>
            <p className="text-gray-500">There are no period sessions logged for {selectedDate}.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ParentClassSessions;
