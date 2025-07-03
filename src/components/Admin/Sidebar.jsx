// components/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useAuth } from '../../assets/context/AuthContext.jsx';

const Sidebar = ({ sidebarOpen, mobileSidebarOpen, toggleSidebar, toggleMobileSidebar }) => {
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const [careersOpen, setCareersOpen] = useState(activeTab === 'careers' || activeTab === 'applications');
  const { logout } = useAuth();

  const navItems = [
    { path: '/admin', icon: 'carbon:dashboard', label: 'Dashboard', key: 'dashboard' },
    { path: '/admin/users', icon: 'carbon:user', label: 'Users Management', key: 'users' },
    { path: '/admin/trainers', icon: 'carbon:user-certification', label: 'Trainers', key: 'trainers' },
    { path: '/admin/certificates', icon: 'carbon:certificate', label: 'Certificates', key: 'certificates' },
    { path: '/admin/projects', icon: 'carbon:project', label: 'Projects', key: 'projects' },
    { path: '/admin/settings', icon: 'carbon:settings', label: 'Settings', key: 'settings' }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white transition-all duration-300 ease-in-out transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-green-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <img 
                src="/src/assets/logo-icon.png"
                alt="HB-Lab Logo" 
                className="h-6 w-auto"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">HB-Lab</h1>
              <p className="text-xs text-green-200">Admin Panel</p>
            </div>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Icon icon="carbon:close" className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 py-6">
            <UserProfileCard />
            
            <nav className="space-y-2">
              {/* Dashboard - First */}
              <NavLink
                to="/admin"
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg mr-3 transition-all duration-200
                  ${activeTab === 'dashboard' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                  }
                `}>
                  <Icon icon="carbon:dashboard" className="h-5 w-5" />
                </div>
                <span className="font-medium">Dashboard</span>
                {activeTab === 'dashboard' && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Careers Dropdown */}
              <div>
                <button
                  className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
                    (activeTab === 'careers' || activeTab === 'applications') ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setCareersOpen((open) => !open)}
                  aria-expanded={careersOpen}
                >
                  <div className={`p-2 rounded-lg mr-3 transition-all duration-200 ${
                    (activeTab === 'careers' || activeTab === 'applications') ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    <Icon icon="carbon:user-activity" className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Careers</span>
                  <Icon icon="carbon:chevron-down" className={`ml-auto h-4 w-4 transition-transform duration-200 ${careersOpen ? 'rotate-180' : ''}`} />
                </button>
                {careersOpen && (
                  <div className="ml-10 mt-1 space-y-1">
                    <NavLink
                      to="/admin/careers"
                      className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'}`}
                    >
                      <Icon icon="carbon:list" className="h-4 w-4 mr-2" />
                      All Careers
                    </NavLink>
                    <NavLink
                      to="/admin/applications"
                      className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'}`}
                    >
                      <Icon icon="carbon:view" className="h-4 w-4 mr-2" />
                      View Applications
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Other nav items */}
              {navItems.slice(1).map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                      : 'text-green-100 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg mr-3 transition-all duration-200
                    ${activeTab === item.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                    }
                  `}>
                    <Icon icon={item.icon} className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.key && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer - Logout */}
          <div className="p-4 bg-gradient-to-b from-green-900 via-green-800 to-green-900">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-white bg-white/10 hover:bg-white/20 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 border border-white/20"
            >
              <div className="p-2 rounded-lg mr-3 bg-white/20 text-white group-hover:bg-white/30 transition-all duration-200">
                <Icon icon="carbon:logout" className="h-5 w-5" />
              </div>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const UserProfileCard = () => (
  <div className="mb-8">
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Icon icon="carbon:user" className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-green-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">Admin User</p>
          <p className="text-sm text-green-200">Super Administrator</p>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="text-xs text-green-200">Online</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Sidebar;