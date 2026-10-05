import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Bus, Contact, Map, MapPin, ClipboardCheck, Navigation2, Shield, CalendarClock } from 'lucide-react';

const PrincipalTransportHub = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: 'Manage Buses',
      description: 'Add and manage school buses',
      icon: Bus,
      path: '/principal/transport/buses',
      color: 'bg-emerald-50 text-emerald-600',
      hover: 'hover:bg-emerald-100 hover:border-emerald-200'
    },
    {
      title: 'Drivers & Attendants',
      description: 'Manage transport staff credentials',
      icon: Contact,
      path: '/principal/transport/drivers',
      color: 'bg-blue-50 text-blue-600',
      hover: 'hover:bg-blue-100 hover:border-blue-200'
    },
    {
      title: 'Routes',
      description: 'Define and assign bus routes',
      icon: Map,
      path: '/principal/transport/routes',
      color: 'bg-purple-50 text-purple-600',
      hover: 'hover:bg-purple-100 hover:border-purple-200'
    },
    {
      title: 'Bus Stops',
      description: 'Manage stops for each route',
      icon: MapPin,
      path: '/principal/transport/stops',
      color: 'bg-rose-50 text-rose-600',
      hover: 'hover:bg-rose-100 hover:border-rose-200'
    },
    {
      title: 'Daily Attendance',
      description: 'View student transport attendance',
      icon: ClipboardCheck,
      path: '/principal/transport/attendance',
      color: 'bg-orange-50 text-orange-600',
      hover: 'hover:bg-orange-100 hover:border-orange-200'
    },
    {
      title: 'Live Tracking',
      description: 'Track all active bus sessions',
      icon: Navigation2,
      path: '/principal/transport/tracking',
      color: 'bg-cyan-50 text-cyan-600',
      hover: 'hover:bg-cyan-100 hover:border-cyan-200'
    },
    {
      title: 'Driver App (Demo)',
      description: 'Test the driver tracking app',
      icon: Navigation2,
      path: '/driver/tracking',
      color: 'bg-slate-50 text-slate-600',
      hover: 'hover:bg-slate-100 hover:border-slate-200'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transport Hub</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage all aspects of school transportation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {options.map((option, idx) => {
            const Icon = option.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(option.path)}
                className={`bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-gray-100 dark:border-[#1E293B] cursor-pointer transition-all duration-200 ${option.hover} hover:shadow-md hover:-translate-y-1`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${option.color} dark:bg-opacity-10`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{option.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default PrincipalTransportHub;
