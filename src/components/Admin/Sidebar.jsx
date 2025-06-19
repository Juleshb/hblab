// components/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';

const Sidebar = ({ sidebarOpen, mobileSidebarOpen, toggleSidebar, toggleMobileSidebar }) => {
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  const navItems = [
    { path: '/admin', icon: 'carbon:dashboard', label: 'Dashboard', key: 'dashboard' },
    { path: '/admin/users', icon: 'carbon:user', label: 'Users Management', key: 'users' },
    { path: '/admin/trainers', icon: 'carbon:user-certification', label: 'Trainers', key: 'trainers' },
    { path: '/admin/careers', icon: 'carbon:user-activity', label: 'Careers', key: 'careers' },
    { path: '/admin/certificates', icon: 'carbon:certificate', label: 'Certificates', key: 'certificates' },
    { path: '/admin/projects', icon: 'carbon:project', label: 'Projects', key: 'projects' },
    { path: '/admin/reports', icon: 'carbon:report', label: 'Reports', key: 'reports' },
    { path: '/admin/settings', icon: 'carbon:settings', label: 'Settings', key: 'settings' }
  ];

  return (
    <>
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-teal-800 text-white transition-all duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-teal-700">
          <div className="flex items-center">
            <img 
              src="/src/assets/logo-white.png"
              alt="HB-Lab Logo" 
              className="h-8 w-auto"
            />
          </div>
          <button onClick={toggleSidebar} className="text-white lg:hidden">
            <Icon icon="carbon:close" className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-6">
          <UserProfileCard />
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  activeTab === item.key ? 'bg-teal-700 text-white' : 'text-teal-200 hover:bg-teal-600'
                }`}
              >
                <Icon icon={item.icon} className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-teal-700">
          <button className="flex items-center w-full text-teal-200 hover:text-white">
            <Icon icon="carbon:logout" className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

const UserProfileCard = () => (
  <div className="mb-8">
    <div className="flex items-center space-x-3 bg-teal-700 rounded-lg p-3">
      <div className="relative">
        <Icon 
          icon="carbon:user" 
          className="h-10 w-10 text-white bg-teal-600 rounded-full p-2 border-2 border-white" 
        />
        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-teal-700"></span>
      </div>
      <div>
        <p className="font-medium">Admin User</p>
        <p className="text-xs text-teal-200">Super Admin</p>
      </div>
    </div>
  </div>
);

export default Sidebar;