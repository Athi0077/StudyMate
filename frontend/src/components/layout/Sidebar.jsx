import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Home, ClipboardList, BookOpen, Calendar, Bell, Users, FileText, CheckSquare, Layers, LogOut, CalendarDays, User, Contact, MessageSquare, Megaphone, Shield, Cake, CloudSun, ClipboardCheck, GraduationCap, Gamepad2, Zap, PartyPopper } from 'lucide-react';

export const navConfig = {
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: Home },
    { name: 'Subjects', path: '/student/class', icon: BookOpen },
    { name: 'Homework', path: '/student/homework', icon: ClipboardList },
    { name: 'Projects', path: '/student/projects', icon: FileText },
    { name: 'Tests', path: '/student/tests', icon: ClipboardCheck },
    { name: 'Exams', path: '/student/exams', icon: GraduationCap },
    { name: 'My Todos', path: '/student/todos', icon: CheckSquare },
    { name: 'Report Card', path: '/student/report-card', icon: FileText },
    { name: 'Attendance', path: '/student/attendance', icon: Calendar },
    { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Analytics', path: '/student/analytics', icon: Layers },
    { name: 'Resource Library', path: '/student/resources', icon: Layers },
    { name: 'Fun Activities', path: '/student/fun-activities', icon: Gamepad2 },
    { name: 'Events', path: '/student/events', icon: PartyPopper },
    { name: 'Special Classes', path: '/student/special-classes', icon: Zap },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: "Today's Birthdays", path: '/student/birthdays', icon: Cake },
    { name: 'My ID Card', path: '/student/my-id-card', icon: Contact },
    { name: 'Help Center', path: '/student/reports', icon: MessageSquare },
    { name: 'Profile', path: '/student/profile', icon: User }
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: Home },
    { name: 'My Classes', path: '/teacher/classes', icon: Layers },
    { name: 'Add Students', path: '/teacher/general-register', icon: Contact },
    { name: 'Attendance', path: '/teacher/attendance', icon: Calendar },
    { name: 'Timetable', path: '/teacher/timetable', icon: CalendarDays },
    { name: 'Parents', path: '/teacher/parents', icon: Contact },
    { name: 'Homework', path: '/teacher/homework', icon: ClipboardList },
    { name: 'Projects', path: '/teacher/projects', icon: FileText },
    { name: 'Tests', path: '/teacher/tests', icon: ClipboardCheck },
    { name: 'Exams', path: '/teacher/exams', icon: GraduationCap },
    { name: 'Fun Activities', path: '/teacher/fun-activities', icon: Gamepad2 },
    { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    { name: 'Leave Requests', path: '/teacher/leave-requests', icon: FileText },
    { name: 'Todos & Tasks', path: '/teacher/todos', icon: CheckSquare },
    { name: 'Special Classes', path: '/teacher/special-classes', icon: Zap },
    { name: "Today's Birthdays", path: '/teacher/birthdays', icon: Cake },
    { name: 'Events', path: '/teacher/events', icon: PartyPopper },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'My ID Card', path: '/teacher/my-id-card', icon: Contact },
    { name: 'Help Center', path: '/teacher/reports', icon: MessageSquare },
    { name: 'Profile', path: '/teacher/profile', icon: User }
  ],
  principal: [
    { name: 'Dashboard', path: '/principal/dashboard', icon: Home },
    { name: 'Attendance', path: '/principal/attendance', icon: Calendar },
    { name: 'Teachers', path: '/principal/teachers', icon: Users },
    { name: 'Standards & Sections', path: '/principal/standards', icon: BookOpen },
    { name: 'Teacher Assignments', path: '/principal/assignments', icon: Users },
    { name: 'Students', path: '/principal/students', icon: Users },
    { name: 'Classes', path: '/principal/classes', icon: Layers },
    { name: 'Parents', path: '/principal/parents', icon: Contact },
    { name: 'Academic Years', path: '/principal/academic-years', icon: CalendarDays },
    { name: 'Temp Access', path: '/principal/temporary-access', icon: Shield },
    { name: 'Exams', path: '/principal/exams', icon: GraduationCap },
    { name: 'Homework', path: '/principal/homework', icon: ClipboardList },
    { name: 'Events', path: '/principal/events', icon: PartyPopper },
    { name: 'Fun Activities', path: '/principal/fun-activities', icon: Gamepad2 },
    { name: 'Special Classes', path: '/principal/special-classes', icon: Zap },
    { name: 'Announcements', path: '/principal/announcements', icon: Megaphone },
    { name: 'Motivational Quotes', path: '/principal/quotes', icon: MessageSquare },
    { name: 'Work Assignments', path: '/principal/todos', icon: CheckSquare },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: "Today's Birthdays", path: '/principal/birthdays', icon: Cake },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'ID Card Management', path: '/principal/id-cards', icon: Contact },
    { name: 'My ID Card', path: '/principal/my-id-card', icon: Contact },
    { name: 'Help Center', path: '/principal/reports', icon: MessageSquare },
    { name: 'Profile', path: '/principal/profile', icon: User }
    // { name: 'AI Student Insights', path: '/principal/ai-dashboard', icon: Sparkles },
  ],
  parent: [
    { name: 'Dashboard', path: '/parent/dashboard', icon: Home },
    { name: 'Activities', path: '/parent/activities', icon: ClipboardList },
    { name: 'Special Classes', path: '/parent/special-classes', icon: Zap },
    { name: 'Weather', path: '/weather', icon: CloudSun },
    { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
    { name: 'Help Center', path: '/parent/reports', icon: MessageSquare },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/parent/profile', icon: User }
  ],
  superadmin: [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: Home },
    { name: 'Principals', path: '/super-admin/principals', icon: Users },
    { name: 'Amount Calculator', path: '/super-admin/calculator', icon: FileText },
    { name: 'Profile', path: '/super-admin/profile', icon: User }
  ]
};

const Sidebar = ({ role }) => {
  const { logout, currentUser } = useContext(AuthContext);
  const location = useLocation();
  const normRole = (role || 'student').toLowerCase();
  const navItems = navConfig[normRole] || navConfig.student;

  // Light mode: role-specific tints. Dark mode: unified navy sidebar with precise colors.
  const getRoleSidebarTheme = () => {
    const darkSidebar = 'dark:!bg-[#0B1120] dark:border-r dark:border-[#1E293B]';
    const darkActive = 'dark:!bg-[#059669] dark:!text-[#FFFFFF] dark:shadow-none [&>svg]:dark:!text-[#FFFFFF]';
    const darkInactive = 'dark:!text-[#E2E8F0] dark:hover:!bg-[#172235] dark:hover:!text-[#FFFFFF] [&>svg]:dark:!text-[#CBD5E1] hover:[&>svg]:dark:!text-[#34D399]';
    
    switch (normRole) {
      case 'superadmin':
        return {
          aside: `bg-indigo-50/80 border-r border-indigo-200/60 ${darkSidebar}`,
          logoAccent: 'text-indigo-600 dark:text-[#E2E8F0]',
          activeItem: `bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-indigo-100/70 hover:text-indigo-700 ${darkInactive}`
        };
      case 'principal':
        return {
          aside: `bg-emerald-50/80 border-r border-emerald-200/60 ${darkSidebar}`,
          logoAccent: 'text-emerald-600 dark:text-[#E2E8F0]',
          activeItem: `bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-emerald-100/70 hover:text-emerald-700 ${darkInactive}`
        };
      case 'teacher':
        return {
          aside: `bg-red-50/80 border-r border-red-200/60 ${darkSidebar}`,
          logoAccent: 'text-red-600 dark:text-[#E2E8F0]',
          activeItem: `bg-red-600 text-white shadow-sm shadow-red-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-red-100/70 hover:text-red-700 ${darkInactive}`
        };
      case 'student':
        return {
          aside: `bg-blue-50/80 border-r border-blue-200/60 ${darkSidebar}`,
          logoAccent: 'text-blue-600 dark:text-[#E2E8F0]',
          activeItem: `bg-blue-600 text-white shadow-sm shadow-blue-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-blue-100/70 hover:text-blue-700 ${darkInactive}`
        };
      case 'parent':
      case 'parents':
        return {
          aside: `bg-orange-50/80 border-r border-orange-200/60 ${darkSidebar}`,
          logoAccent: 'text-orange-500 dark:text-[#E2E8F0]',
          activeItem: `bg-orange-500 text-white shadow-sm shadow-orange-500/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-orange-100/70 hover:text-orange-700 ${darkInactive}`
        };
      default:
        return {
          aside: `bg-blue-50/80 border-r border-blue-200/60 ${darkSidebar}`,
          logoAccent: 'text-blue-600 dark:text-[#E2E8F0]',
          activeItem: `bg-blue-600 text-white shadow-sm shadow-blue-600/30 ${darkActive}`,
          inactiveItem: `text-gray-700 hover:bg-blue-100/70 hover:text-blue-700 ${darkInactive}`
        };
    }
  };

  const theme = getRoleSidebarTheme();

  return (
    <aside className={`w-64 h-screen ${theme.aside} backdrop-blur-xl flex flex-col shadow-lg z-20 transition-colors duration-300`}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-[#F1F5F9]">Study<span className={theme.logoAccent}>Mate</span></h2>
        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium">School Management</p>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 dark:[&::-webkit-scrollbar-track]:bg-[#0B1120] dark:[&::-webkit-scrollbar-thumb]:bg-[#475569] dark:[&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb:hover]:bg-[#64748B]">
        {navItems.filter(item => {
          if (role === 'principal' && currentUser?.tempPrincipalAccess && currentUser?.role === 'teacher') {
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                isActive 
                  ? theme.activeItem 
                  : theme.inactiveItem
              }`}
            >
              <IconComponent className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200/50 dark:border-[#1E293B]">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/60 text-gray-700 hover:bg-red-50 hover:text-red-600 dark:bg-[#0B1120] dark:border dark:border-[#334155] dark:text-[#E2E8F0] dark:hover:bg-[#172235] dark:hover:text-[#E2E8F0] transition shadow-xs">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

