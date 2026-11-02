import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

const userLinks = [
  { path: '/user', icon: 'carbon:dashboard', label: 'Dashboard' },
  { path: '/user/certificates', icon: 'carbon:certificate', label: 'Certificates' },
  { path: '/user/career-applications', icon: 'carbon:user-activity', label: 'Career Applications' },
  { path: '/user/lessons', icon: 'carbon:book', label: 'Lessons' },
  { path: '/user/profile', icon: 'carbon:user-profile', label: 'Profile' },
];

const UserSidebar = () => (
  <div className="fixed inset-y-0 left-0 z-50 w-48 bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white flex flex-col h-full shadow-2xl">
    {/* Header */}
    <div className="flex items-center space-x-2 px-4 py-4 border-b border-green-700/50">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
        <img src="/src/assets/logo-icon.png" alt="HB-Lab Logo" className="h-5 w-auto" />
      </div>
      <div>
        <h1 className="text-base font-bold text-white">HB-Lab</h1>
        <p className="text-[10px] text-green-200">User Panel</p>
      </div>
    </div>
    {/* Links */}
    <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
      {userLinks.map(link => (
        <NavLink key={link.path} to={link.path} className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}>
          <Icon icon={link.icon} className="h-4 w-4 mr-2" />
          <span className="font-medium">{link.label}</span>
        </NavLink>
      ))}
    </nav>
    {/* Sticky Footer - Logout at the bottom */}
    <div className="p-2 bg-gradient-to-b from-green-900 via-green-800 to-green-900 sticky bottom-0">
      <button className="flex items-center w-full px-3 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20 text-xs">
        <div className="p-1 rounded-lg mr-2 bg-white/20 text-white group-hover:bg-white/30 transition-all duration-200">
          <Icon icon="carbon:logout" className="h-4 w-4" />
        </div>
        <span className="font-medium">Logout</span>
      </button>
    </div>
  </div>
);

export default UserSidebar; 