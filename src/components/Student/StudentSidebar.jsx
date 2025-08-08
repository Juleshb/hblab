import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '../../assets/context/AuthContext';
import UserProfileCard from './UserProfileCard'; // Import the new component

const StudentSidebar = ({ sidebarOpen, mobileSidebarOpen, toggleSidebar, toggleMobileSidebar }) => {
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const [learningOpen, setLearningOpen] = useState(
    ['lessons', 'progress'].includes(activeTab)
  );
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-2xl border-r border-green-800/30"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-green-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img 
                src="/src/assets/logo-icon.png"
                alt="HB-Lab Logo" 
                className="h-5 w-auto"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">HB-Lab</h1>
              <p className="text-[10px] text-green-200">Student Panel</p>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-green-800/40 scrollbar-track-transparent">
            <UserProfileCard compact={true} />
            <nav className="space-y-1">
              <NavLink
                to="/student/dashboard"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}>
                  <Icon icon="carbon:dashboard" className="h-4 w-4" />
                </div>
                <span className="font-medium">Dashboard</span>
                {activeTab === 'dashboard' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}
              </NavLink>

              <NavLink
                to="/student/certificates"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'certificates' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}>
                  <Icon icon="carbon:certificate" className="h-4 w-4" />
                </div>
                <span className="font-medium">My Certificates</span>
                {activeTab === 'certificates' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}
              </NavLink>

              <NavLink
                to="/student/career-applications"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'career-applications' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}>
                  <Icon icon="carbon:user-activity" className="h-4 w-4" />
                </div>
                <span className="font-medium">Career Applications</span>
                {activeTab === 'career-applications' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}
              </NavLink>

              {/* Learning Dropdown */}
              <div>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                    learningOpen ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setLearningOpen((open) => !open)}
                  aria-expanded={learningOpen}
                >
                  <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                    learningOpen ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    <Icon icon="carbon:education" className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Learning</span>
                  <Icon icon="carbon:chevron-down" className={`ml-auto h-3 w-3 transition-transform duration-200 ${learningOpen ? 'rotate-180' : ''}`} />
                </button>
                {learningOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    <NavLink to="/student/lessons" className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'}`}> <Icon icon="carbon:book" className="h-3 w-3 mr-1" /> Lessons </NavLink>
                    <NavLink to="/student/progress" className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'}`}> <Icon icon="carbon:progress-bar" className="h-3 w-3 mr-1" /> Progress Tracker </NavLink>
                  </div>
                )}
              </div>

              <NavLink
                to="/student/profile"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}>
                  <Icon icon="carbon:user-profile" className="h-4 w-4" />
                </div>
                <span className="font-medium">My Profile</span>
                {activeTab === 'profile' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}
              </NavLink>

            </nav>
          </div>
          {/* Sticky Footer */}
          <div className="p-3 bg-gradient-to-b from-green-900 via-green-800 to-green-900 w-full">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20"
            >
              <div className="p-1 rounded-lg mr-2 bg-white/20 text-white group-hover:bg-white/30 transition-all duration-200">
                <Icon icon="carbon:logout" className="h-4 w-4" />
              </div>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 w-60 h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white flex flex-col shadow-2xl border-r border-green-800/30 transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Student sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-green-700/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img 
                src="/src/assets/logo-icon.png"
                alt="HB-Lab Logo" 
                className="h-5 w-auto"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">HB-Lab</h1>
              <p className="text-[10px] text-green-200">Student Panel</p>
            </div>
          </div>
          <button 
            onClick={toggleMobileSidebar} 
            className="p-1 rounded-lg hover:bg-green-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close sidebar"
          >
            <Icon icon="carbon:close" className="h-4 w-4" />
          </button>
        </div>
        {/* Content */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-green-800/40 scrollbar-track-transparent">
            <UserProfileCard compact={true} />
            <nav className="space-y-1">
              {/* Copied from desktop */}
              <NavLink to="/student/dashboard" className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}>
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}><Icon icon="carbon:dashboard" className="h-4 w-4" /></div><span className="font-medium">Dashboard</span>{activeTab === 'dashboard' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}</NavLink>
              <NavLink to="/student/certificates" className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}>
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'certificates' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}><Icon icon="carbon:certificate" className="h-4 w-4" /></div><span className="font-medium">My Certificates</span>{activeTab === 'certificates' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}</NavLink>
              <NavLink to="/student/career-applications" className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}>
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'career-applications' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}><Icon icon="carbon:user-activity" className="h-4 w-4" /></div><span className="font-medium">Career Applications</span>{activeTab === 'career-applications' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}</NavLink>
              <div>
                <button className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${learningOpen ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`} onClick={() => setLearningOpen((open) => !open)} aria-expanded={learningOpen}>
                  <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${learningOpen ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}><Icon icon="carbon:education" className="h-4 w-4" /></div><span className="font-medium">Learning</span><Icon icon="carbon:chevron-down" className={`ml-auto h-3 w-3 transition-transform duration-200 ${learningOpen ? 'rotate-180' : ''}`} /></button>
                {learningOpen && (<div className="ml-8 mt-1 space-y-1"><NavLink to="/student/lessons" className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'}`}> <Icon icon="carbon:book" className="h-3 w-3 mr-1" /> Lessons </NavLink><NavLink to="/student/progress" className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'}`}> <Icon icon="carbon:progress-bar" className="h-3 w-3 mr-1" /> Progress Tracker </NavLink></div>)}</div>
              <NavLink to="/student/profile" className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${isActive ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'}`}>
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${activeTab === 'profile' ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'}`}><Icon icon="carbon:user-profile" className="h-4 w-4" /></div><span className="font-medium">My Profile</span>{activeTab === 'profile' && (<div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>)}</NavLink>
            </nav>
          </div>
          {/* Sticky Footer */}
          <div className="p-3 bg-gradient-to-b from-green-900 via-green-800 to-green-900 sticky bottom-0 w-full">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20"
            >
              <div className="p-1 rounded-lg mr-2 bg-white/20 text-white group-hover:bg-white/30 transition-all duration-200">
                <Icon icon="carbon:logout" className="h-4 w-4" />
              </div>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudentSidebar; 