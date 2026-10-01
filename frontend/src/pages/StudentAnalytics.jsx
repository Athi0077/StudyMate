import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Target, Award, BookOpen } from 'lucide-react';
import api from '../utils/api';

const StudentAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/dashboard/student/analytics');
        setAnalytics(res.data.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Layout><div className="p-8 text-center text-gray-500 animate-pulse font-semibold">Loading your analytics...</div></Layout>;
  
  const { performanceOverTime, subjectAverages, skillDistribution, overallAverage, bestSubject } = analytics || {};

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp className="text-primary" size={32} />
              My Analytics
            </h1>
            <p className="text-gray-500 mt-2">Track your academic progress and see where you excel.</p>
          </div>
        </div>

        {/* Smart Insight Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><Award /> Great job this month!</h3>
            <p className="text-blue-100 mt-1">Your Science grade improved by 10% since September. Keep up the excellent work!</p>
          </div>
          <div className="hidden md:block text-5xl">🚀</div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <Target size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Overall Average</p>
              <h4 className="text-3xl font-black text-gray-800">{overallAverage}%</h4>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Best Subject</p>
              <h4 className="text-3xl font-black text-gray-800">{bestSubject}</h4>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Current Trend</p>
              <h4 className="text-3xl font-black text-green-500">+4.2%</h4>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-6">Performance Over Time</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceOverTime} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-gray-800 mb-6">Skill Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillDistribution}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar name="Student" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Average Grades by Subject</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAverages} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="subject" stroke="#9ca3af" axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="grade" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default StudentAnalytics;
