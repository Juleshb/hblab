// layouts/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardHome from './DashboardHome';
import HbmsShell from './HBMS/HbmsShell';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const section = segments[1] || 'dashboard';
  const hbmsLabels = {
    organization: 'HBMS organization',
    workers: 'HBMS workers',
    projects: 'HBMS projects',
    tasks: 'HBMS tasks',
  };
  const activeTab = section === 'hbms' ? (hbmsLabels[segments[2]] || 'HBMS') : section === 'studio' ? 'Studio films' : section;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  // Determine if we're at the root dashboard route
  const isRootDashboard = location.pathname.endsWith('/admin') || 
                         location.pathname.endsWith('/admin/');

  if (location.pathname.startsWith('/admin/hbms')) {
    return <HbmsShell><Outlet /></HbmsShell>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-60">
        <Header 
          toggleMobileSidebar={toggleMobileSidebar}
          activeTab={activeTab}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-3 lg:p-4 text-sm">
          {isRootDashboard ? <DashboardHome /> : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;