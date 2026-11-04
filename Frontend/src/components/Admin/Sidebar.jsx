// components/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { useAuth } from '../../assets/context/AuthContext.jsx';

const AdminSidebar = ({ sidebarOpen, mobileSidebarOpen, toggleSidebar, toggleMobileSidebar }) => {
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const [learningOpen, setLearningOpen] = useState(['lessons', 'progress'].includes(activeTab));
  const [hbmsOpen, setHbmsOpen] = useState(location.pathname.includes('/admin/hbms'));
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Desktop Sidebar - Fixed Position */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-2xl border-r border-green-800/30 fixed left-0 top-0 z-40">
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
              <p className="text-[10px] text-green-200">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-green-800/40 scrollbar-track-transparent">
            <UserProfileCard />
            
            {/* Navigation */}
            <nav className="space-y-1">
              {/* Dashboard */}
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'dashboard' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:dashboard" className="h-4 w-4" />
                </div>
                <span className="font-medium">Dashboard</span>
                {activeTab === 'dashboard' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Careers */}
              <NavLink
                to="/admin/careers"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'careers' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:user-activity" className="h-4 w-4" />
                </div>
                <span className="font-medium">Careers</span>
                {activeTab === 'careers' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Applications */}
              <NavLink
                to="/admin/applications"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'applications' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:view" className="h-4 w-4" />
                </div>
                <span className="font-medium">Applications</span>
                {activeTab === 'applications' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              <NavLink
                to="/admin/certificates"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'certificates' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:certificate" className="h-4 w-4" />
                </div>
                <span className="font-medium">Certificates</span>
                {activeTab === 'certificates' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Learning Dropdown */}
              <div>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                    learningOpen 
                      ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                      : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setLearningOpen((open) => !open)}
                  aria-expanded={learningOpen}
                >
                  <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                    learningOpen 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    <Icon icon="carbon:education" className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Learning</span>
                  <Icon 
                    icon="carbon:chevron-down" 
                    className={`ml-auto h-3 w-3 transition-transform duration-200 ${learningOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {learningOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    <NavLink 
                      to="/admin/lessons" 
                      className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${
                        isActive 
                          ? 'bg-green-700/20 text-white' 
                          : 'text-green-100 hover:bg-green-700/10 hover:text-white'
                      }`}
                    > 
                      <Icon icon="carbon:book" className="h-3 w-3 mr-1" /> 
                      <span>Lessons</span>
                    </NavLink>
                    <NavLink 
                      to="/admin/progress" 
                      className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${
                        isActive 
                          ? 'bg-green-700/20 text-white' 
                          : 'text-green-100 hover:bg-green-700/10 hover:text-white'
                      }`}
                    > 
                      <Icon icon="carbon:progress-bar" className="h-3 w-3 mr-1" /> 
                      <span>Progress Tracker</span>
                    </NavLink>
                  </div>
                )}
              </div>

              <HbmsNav open={hbmsOpen} setOpen={setHbmsOpen} />

              {/* Management */}
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'users' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:group" className="h-4 w-4" />
                </div>
                <span className="font-medium">Management</span>
                {activeTab === 'users' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Settings */}
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'settings' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:settings" className="h-4 w-4" />
                </div>
                <span className="font-medium">Settings</span>
                {activeTab === 'settings' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Sticky Footer - Fixed at bottom */}
        <div className="p-3 bg-gradient-to-b from-green-900 via-green-800 to-green-900 border-t border-green-700/50 mt-auto">
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
      </aside>
      
      {/* Mobile Sidebar - Fixed Position */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 w-60 h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white flex flex-col shadow-2xl border-r border-green-800/30 transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin sidebar"
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
              <p className="text-[10px] text-green-200">Admin Panel</p>
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
            <UserProfileCard />
            
            {/* Navigation */}
            <nav className="space-y-1">
              {/* Dashboard */}
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
                onClick={toggleMobileSidebar}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'dashboard' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:dashboard" className="h-4 w-4" />
                </div>
                <span className="font-medium">Dashboard</span>
                {activeTab === 'dashboard' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Careers */}
              <NavLink
                to="/admin/careers"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
                onClick={toggleMobileSidebar}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'careers' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:user-activity" className="h-4 w-4" />
                </div>
                <span className="font-medium">Careers</span>
                {activeTab === 'careers' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Applications */}
              <NavLink
                to="/admin/applications"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
                onClick={toggleMobileSidebar}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'applications' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:view" className="h-4 w-4" />
                </div>
                <span className="font-medium">Applications</span>
                {activeTab === 'applications' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              <NavLink
                to="/admin/certificates"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
                onClick={toggleMobileSidebar}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'certificates' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:certificate" className="h-4 w-4" />
                </div>
                <span className="font-medium">Certificates</span>
                {activeTab === 'certificates' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Learning Dropdown */}
              <div>
                <button
                  className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                    learningOpen 
                      ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                      : 'text-green-100 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setLearningOpen((open) => !open)}
                  aria-expanded={learningOpen}
                >
                  <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                    learningOpen 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                  }`}>
                    <Icon icon="carbon:education" className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Learning</span>
                  <Icon 
                    icon="carbon:chevron-down" 
                    className={`ml-auto h-3 w-3 transition-transform duration-200 ${learningOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                {learningOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    <NavLink 
                      to="/admin/lessons" 
                      className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${
                        isActive 
                          ? 'bg-green-700/20 text-white' 
                          : 'text-green-100 hover:bg-green-700/10 hover:text-white'
                      }`}
                      onClick={toggleMobileSidebar}
                    > 
                      <Icon icon="carbon:book" className="h-3 w-3 mr-1" /> 
                      <span>Lessons</span>
                    </NavLink>
                    <NavLink 
                      to="/admin/progress" 
                      className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${
                        isActive 
                          ? 'bg-green-700/20 text-white' 
                          : 'text-green-100 hover:bg-green-700/10 hover:text-white'
                      }`}
                      onClick={toggleMobileSidebar}
                    > 
                      <Icon icon="carbon:progress-bar" className="h-3 w-3 mr-1" /> 
                      <span>Progress Tracker</span>
                    </NavLink>
                  </div>
                )}
              </div>

              <HbmsNav open={hbmsOpen} setOpen={setHbmsOpen} onNavigate={toggleMobileSidebar} />

              {/* Management */}
              <NavLink
                to="/admin/users"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
                onClick={toggleMobileSidebar}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'users' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:group" className="h-4 w-4" />
                </div>
                <span className="font-medium">Management</span>
                {activeTab === 'users' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>

              {/* Settings */}
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                    : 'text-green-100 hover:bg-white/5 hover:text-white'
                }`}
                onClick={toggleMobileSidebar}
              >
                <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
                  activeTab === 'settings' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
                }`}>
                  <Icon icon="carbon:settings" className="h-4 w-4" />
                </div>
                <span className="font-medium">Settings</span>
                {activeTab === 'settings' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </NavLink>
            </nav>
          </div>

          {/* Sticky Footer - Fixed at bottom */}
          <div className="p-3 bg-gradient-to-b from-green-900 via-green-800 to-green-900 border-t border-green-700/50 mt-auto">
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

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobileSidebar}
        />
      )}
    </>
  );
};

const hbmsLinks = [
  { to: '/admin/hbms', label: 'Overview', icon: 'carbon:dashboard', end: true },
  { to: '/admin/hbms/organization', label: 'Organization', icon: 'carbon:building' },
  { to: '/admin/hbms/workers', label: 'Workers', icon: 'carbon:group' },
  { to: '/admin/hbms/projects', label: 'Projects', icon: 'carbon:folder' },
  { to: '/admin/hbms/programs', label: 'Programs', icon: 'carbon:education' },
  { to: '/admin/hbms/tasks', label: 'Tasks', icon: 'carbon:task' },
  { to: '/admin/hbms/attendance', label: 'Attendance', icon: 'carbon:time' },
  { to: '/admin/hbms/messages', label: 'Messages', icon: 'carbon:notification' },
  { to: '/admin/hbms/documents', label: 'Documents', icon: 'carbon:document' },
  { to: '/admin/hbms/reports', label: 'Reports', icon: 'carbon:report' },
  { to: '/admin/hbms/roles', label: 'Roles', icon: 'carbon:user-role' },
];

const HbmsNav = ({ open, setOpen, onNavigate }) => (
  <div>
    <button
      type="button"
      className={`flex items-center w-full px-3 py-2 rounded-lg transition-all duration-200 group text-xs ${
        open
          ? 'bg-white/10 text-white shadow-lg border border-white/20'
          : 'text-green-100 hover:bg-white/5 hover:text-white'
      }`}
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
    >
      <div className={`p-1 rounded-lg mr-2 transition-all duration-200 ${
        open ? 'bg-white/20 text-white' : 'bg-green-700/30 text-green-200 group-hover:bg-white/10 group-hover:text-white'
      }`}>
        <Icon icon="carbon:operations-record" className="h-4 w-4" />
      </div>
      <span className="font-medium">HBMS</span>
      <Icon icon="carbon:chevron-down" className={`ml-auto h-3 w-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && (
      <div className="ml-8 mt-1 space-y-1">
        {hbmsLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) => `flex items-center px-2 py-1 rounded-lg text-xs transition-all duration-200 ${
              isActive ? 'bg-green-700/20 text-white' : 'text-green-100 hover:bg-green-700/10 hover:text-white'
            }`}
          >
            <Icon icon={link.icon} className="h-3 w-3 mr-1" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    )}
  </div>
);

const UserProfileCard = () => (
  <div className="mb-8">
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Icon icon="carbon:user" className="h-5 w-5 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-green-900 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-white">Admin User</p>
          <p className="text-xs text-green-200">Super Administrator</p>
          <div className="flex items-center mt-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
            <span className="text-[10px] text-green-200">Online</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const useAdminSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(open => !open);
  return { sidebarOpen, toggleSidebar };
};

export default AdminSidebar;
