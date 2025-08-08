import StudentDashboard from './StudentDashboard';
import StudentCertificates from './StudentCertificates';
import StudentSidebar from './StudentSidebar';
import CareerApplications from './CareerApplications';
import { useAuth } from '../../assets/context/AuthContext';
import React, { useState } from 'react';

import StudentHeader from './StudentHeader';

export const StudentLayout = ({ children, title, notifications = [], onClearNotifications }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StudentSidebar mobileSidebarOpen={mobileSidebarOpen} toggleMobileSidebar={toggleMobileSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StudentHeader user={user} onLogout={logout} title={title} notifications={notifications} onClearNotifications={onClearNotifications} toggleSidebar={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-2 sm:p-3 lg:p-4 text-sm">
          {children}
        </main>
      </div>
    </div>
  );
};

export { StudentDashboard, StudentCertificates, CareerApplications }; 