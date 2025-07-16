// layouts/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardHome from './DashboardHome';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  // Determine if we're at the root dashboard route
  const isRootDashboard = location.pathname.endsWith('/admin') || 
                         location.pathname.endsWith('/admin/');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        mobileSidebarOpen={mobileSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleMobileSidebar={toggleMobileSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
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