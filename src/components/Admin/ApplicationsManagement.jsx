import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import StatCard from './StatCard';
import ApplicationsTable from './ApplicationsTable';
import ApplicationModal from './ApplicationModal';
import Sidebar from './Sidebar';

const ApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const toggleMobileSidebar = () => setMobileSidebarOpen((open) => !open);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
        
        // Calculate stats
        const total = data.length;
        const pending = data.filter(app => app.status === 'pending').length;
        const approved = data.filter(app => app.status === 'approved').length;
        const rejected = data.filter(app => app.status === 'rejected').length;
        
        setStats({ total, pending, approved, rejected });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchApplications(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        const response = await fetch(`/api/applications/${applicationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchApplications(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting application:', error);
      }
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

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
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Applications Management</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage career applications and track their status
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={fetchApplications}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Icon icon="carbon:refresh" className="h-4 w-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Applications"
              value={stats.total}
              icon="carbon:user-multiple"
              color="blue"
              loading={loading}
            />
            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon="carbon:time"
              color="yellow"
              loading={loading}
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon="carbon:checkmark"
              color="green"
              loading={loading}
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon="carbon:close"
              color="red"
              loading={loading}
            />
          </div>

          {/* Applications Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Career Applications</h3>
              <p className="mt-1 text-sm text-gray-500">
                Review and manage all submitted career applications
              </p>
            </div>
            <ApplicationsTable 
              applications={applications}
              loading={loading}
              onView={handleViewApplication}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDeleteApplication}
            />
          </div>
        </div>

        {/* Application Detail Modal */}
        {isModalOpen && selectedApplication && (
          <ApplicationModal
            application={selectedApplication}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedApplication(null);
            }}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationsManagement; 