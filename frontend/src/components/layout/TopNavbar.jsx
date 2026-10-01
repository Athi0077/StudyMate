import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../../context/NotificationContext';
import { Moon, Sun, PlusCircle, Bell } from 'lucide-react';

const TopNavbar = ({ user }) => {
  const role = user?.role || 'student';
  const { unreadCount } = useContext(NotificationContext);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };
  
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 py-3 text-gray-800 dark:text-gray-100 w-full shrink-0 z-10 transition-colors duration-300">
      <div className="flex items-center gap-3 md:hidden">
        <div className="text-2xl">🏛️</div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-base font-bold tracking-wide text-gray-900 dark:text-white">StudyMate</h1>
        </div>
      </div>
      <div className="hidden md:block flex-1"></div>
      
      <div className="flex items-center gap-4 md:gap-6 ml-auto">
        <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Toggle Dark Mode">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        {role === 'teacher' && (
          <Link to="/teacher/homework/create" className="hidden sm:flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-full text-sm font-bold transition shadow-sm" title="Quick Add Homework">
            <PlusCircle className="w-4 h-4" />
            <span>New HW</span>
          </Link>
        )}

        <Link to="/notifications" className="relative cursor-pointer block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
          <span className="opacity-90 hover:opacity-100 transition"><Bell className="w-5 h-5" /></span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <Link to={role === 'student' ? '/student/profile' : '#'} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 pr-3 rounded-full transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
          <div className="w-9 h-9 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light rounded-full flex items-center justify-center text-sm font-bold border border-primary/20 shadow-sm overflow-hidden">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col items-start leading-tight hidden xs:flex sm:flex md:flex">
            <span className="text-sm font-bold tracking-wide text-gray-800 dark:text-gray-100">{user?.name || 'User'}</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 capitalize font-medium">{role}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopNavbar;
