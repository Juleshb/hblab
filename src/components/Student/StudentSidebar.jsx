import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext';

const studentLinks = [
  { path: '/student/dashboard', icon: 'carbon:dashboard', label: 'Dashboard' },
  { path: '/student/certificates', icon: 'carbon:certificate', label: 'Certificates' },
  { path: '/student/career-applications', icon: 'carbon:user-activity', label: 'Career Applications' },
  { path: '/student/lessons', icon: 'carbon:book', label: 'Lessons' },
  { path: '/student/progress', icon: 'carbon:progress-bar', label: 'Progress Tracker' },
  { path: '/student/profile', icon: 'carbon:user-profile', label: 'Profile' },
];

const StudentSidebar = ({ sidebarOpen, toggleSidebar }) => {
  const { logout } = useAuth();
  return (
    <>
      {/* Mobile Overlay */}
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-60 min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-2xl border-r border-green-800/30`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-green-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img src="/src/assets/logo-icon.png" alt="HB-Lab Logo" className="h-6 w-auto" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">HB-Lab</h1>
              <p className="text-[11px] text-green-200">Student Panel</p>
            </div>
          </div>
        </div>
        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-800/40 scrollbar-track-transparent">
          {studentLinks.map(link => (
            <NavLink key={link.path} to={link.path} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-xs font-medium ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white hover:shadow-md'}`}> 
              <Icon icon={link.icon} className="h-5 w-5 mr-1 group-hover:scale-110 transition-transform" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        {/* Sticky Footer - Logout at the bottom */}
        <div className="mt-auto p-3 bg-gradient-to-b from-green-900 via-green-800 to-green-900 w-full">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 text-xs font-semibold shadow-lg"
            aria-label="Logout"
          >
            <div className="p-1 rounded-lg mr-3 bg-white/20 text-white group-hover:bg-white/30 transition-all duration-200">
              <Icon icon="carbon:logout" className="h-5 w-5" />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 w-60 h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white flex flex-col shadow-2xl border-r border-green-800/30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Student sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-green-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img src="/src/assets/logo-icon.png" alt="HB-Lab Logo" className="h-6 w-auto" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">HB-Lab</h1>
              <p className="text-[11px] text-green-200">Student Panel</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-green-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close sidebar"
          >
            <Icon icon="carbon:close" className="h-5 w-5" />
          </button>
        </div>
        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-800/40 scrollbar-track-transparent">
          {studentLinks.map(link => (
            <NavLink key={link.path} to={link.path} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group text-xs font-medium ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white hover:shadow-md'}`}> 
              <Icon icon={link.icon} className="h-5 w-5 mr-1 group-hover:scale-110 transition-transform" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        {/* Sticky Footer - Logout at the bottom */}
        <div className="mt-auto p-3 bg-gradient-to-b from-green-900 via-green-800 to-green-900 sticky bottom-0 w-full">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 text-xs font-semibold shadow-lg"
            aria-label="Logout"
          >
            <div className="p-1 rounded-lg mr-3 bg-white/20 text-white group-hover:bg-white/30 transition-all duration-200">
              <Icon icon="carbon:logout" className="h-5 w-5" />
            </div>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export const useSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(open => !open);
  return { sidebarOpen, toggleSidebar };
};

export default StudentSidebar; 