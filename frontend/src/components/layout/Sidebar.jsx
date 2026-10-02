import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Home, ClipboardList, BookOpen, Calendar, Bell, Users, FileText, CheckSquare, Layers, LogOut, CalendarDays, User, Contact, MessageSquare, Megaphone, Shield, Sparkles, Cake } from 'lucide-react';

export const navConfig = {
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Subjects', path: '/student/class', icon: BookOpen },
    { name: 'Homework', path: '/student/homework', icon: ClipboardList },
    { name: 'Projects', path: '/student/projects', icon: FileText },
    { name: 'Tests', path: '/student/tests', icon: BookOpen },
    { name: 'Exams', path: '/student/exams', icon: BookOpen },
    { name: 'My Todos', path: '/student/todos', icon: CheckSquare },
    { name: 'Report Card', path: '/student/report-card', icon: FileText },
    { name: 'Attendance', path: '/student/attendance', icon: Calendar },
    { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Analytics', path: '/student/analytics', icon: Layers },
    { name: 'Resource Library', path: '/student/resources', icon: Layers },
    { name: 'Events', path: '/student/events', icon: Sparkles },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: "Today's Birthdays", path: '/student/birthdays', icon: Cake },
    { name: 'My ID Card', path: '/student/my-id-card', icon: Contact },
    { name: 'Help Center', path: '/student/reports', icon: MessageSquare },
    { name: 'Profile', path: '/student/profile', icon: User }
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: Home },
    { name: "Today's Birthdays", path: '/teacher/birthdays', icon: Cake },
    { name: 'Events', path: '/teacher/events', icon: Sparkles },
    { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    { name: 'My Classes', path: '/teacher/classes', icon: Layers },
    { name: 'Timetable', path: '/teacher/timetable', icon: CalendarDays },
    { name: 'Add Students', path: '/teacher/general-register', icon: Contact },
    { name: 'Parents', path: '/teacher/parents', icon: Contact },
    { name: 'Homework', path: '/teacher/homework', icon: ClipboardList },
    { name: 'Projects', path: '/teacher/projects', icon: FileText },
    { name: 'Tests', path: '/teacher/tests', icon: BookOpen },
    { name: 'Exams', path: '/teacher/exams', icon: BookOpen },
    { name: 'Attendance', path: '/teacher/attendance', icon: Calendar },
    { name: 'Leave Requests', path: '/teacher/leave-requests', icon: FileText },
    { name: 'Todos & Tasks', path: '/teacher/todos', icon: CheckSquare },
    { name: 'Help Center', path: '/teacher/reports', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'My ID Card', path: '/teacher/my-id-card', icon: Contact },
    { name: 'Profile', path: '/teacher/profile', icon: User }
  ],
  principal: [
    { name: 'Dashboard', path: '/principal/dashboard', icon: Home },
    { name: "Today's Birthdays", path: '/principal/birthdays', icon: Cake },
    { name: 'Events', path: '/principal/events', icon: Sparkles },
    { name: 'Motivational Quotes', path: '/principal/quotes', icon: MessageSquare },
    { name: 'Announcements', path: '/principal/announcements', icon: Megaphone },
    // { name: 'AI Student Insights', path: '/principal/ai-dashboard', icon: Sparkles },
    { name: 'Teachers', path: '/principal/teachers', icon: Users },
    { name: 'Temp Access', path: '/principal/temporary-access', icon: Shield },
    { name: 'Students', path: '/principal/students', icon: Users },
    { name: 'Parents', path: '/principal/parents', icon: Contact },
    { name: 'Standards & Sections', path: '/principal/standards', icon: BookOpen },
    { name: 'Teacher Assignments', path: '/principal/assignments', icon: Users },
    { name: 'Academic Years', path: '/principal/academic-years', icon: CalendarDays },
    { name: 'Classes', path: '/principal/classes', icon: Layers },
    { name: 'Exams', path: '/principal/exams', icon: BookOpen },
    { name: 'Homework', path: '/principal/homework', icon: ClipboardList },
    { name: 'Attendance', path: '/principal/attendance', icon: Calendar },
    { name: 'Work Assignments', path: '/principal/todos', icon: CheckSquare },
    { name: 'Help Center', path: '/principal/reports', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'ID Card Management', path: '/principal/id-cards', icon: Contact },
    { name: 'My ID Card', path: '/principal/my-id-card', icon: Contact },
    { name: 'Profile', path: '/principal/profile', icon: User }
  ],
  parent: [
    { name: 'Dashboard', path: '/parent/dashboard', icon: Home },
    { name: 'Activities', path: '/parent/activities', icon: ClipboardList },
    { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Help Center', path: '/parent/reports', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/parent/profile', icon: User }
  ],
  superadmin: [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: Home },
    { name: 'Amount Calculator', path: '/super-admin/calculator', icon: FileText }
  ]
};

const Sidebar = ({ role }) => {
  const { logout, currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navItems = navConfig[role] || navConfig.student;
  
  return (
    <aside className="w-64 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-lg z-20">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">Study<span className="text-primary">Mate</span></h2>
        <p className="text-xs text-gray-400">School Management</p>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.filter(item => {
          if (role === 'principal' && currentUser?.tempPrincipalAccess && currentUser?.role === 'teacher') {
            // Hide sensitive tabs for temporary principals
            const hiddenPaths = ['/principal/teachers', '/principal/temporary-access', '/principal/admissions'];
            if (hiddenPaths.some(hp => item.path.startsWith(hp))) return false;
          }
          return true;
        }).map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const IconComponent = item.icon;
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                isActive 
                  ? 'bg-primary text-white shadow-soft' 
                  : 'text-gray-600 hover:bg-primary-light hover:text-primary'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-50">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-red-50 hover:text-red-600 transition">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
