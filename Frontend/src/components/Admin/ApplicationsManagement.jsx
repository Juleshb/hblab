import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import StatCard from './StatCard';
import ApplicationsTable from './ApplicationsTable';
import ApplicationModal from './ApplicationModal';
import { useAdminSidebar } from './Sidebar';
import Header from './Header';

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
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();

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
        const apps = Array.isArray(data) ? data : (data.applications || []);
        setApplications(apps);
        
        // Calculate stats
        const total = apps.length;
        const pending = apps.filter(app => app.status === 'pending').length;
        const approved = apps.filter(app => app.status === 'approved').length;
        const rejected = apps.filter(app => app.status === 'rejected').length;
        
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header activeTab="applications" toggleMobileSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Applications"
              value={stats.total}
              icon="carbon:user-multiple"
              color="green"
              loading={loading}
            />
            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon="carbon:time"
              color="green"
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
              color="green"
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
        </main>
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