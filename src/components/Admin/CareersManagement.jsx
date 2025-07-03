import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CareersTable from './CareersTable';
import { Icon } from '@iconify/react';

const CareersManagement = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [totalCareers, setTotalCareers] = useState(0);

  const handleCareersCount = (count) => setTotalCareers(count);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        mobileSidebarOpen={mobileSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        toggleMobileSidebar={toggleMobileSidebar} 
      />
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <Header toggleMobileSidebar={toggleMobileSidebar} activeTab="careers" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Careers Management</h1>
              <p className="text-gray-600">Manage and add new career opportunities for your organization.</p>
            </div>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Icon icon="carbon:user-activity" className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Careers</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCareers}</p>
                </div>
              </div>
            </div>
          </div>
          <CareersTable onCareersCount={handleCareersCount} />
        </main>
      </div>
    </div>
  );
};

export default CareersManagement; 