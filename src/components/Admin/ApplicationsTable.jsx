import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const ApplicationsTable = ({ applications, loading, onView, onStatusUpdate, onDelete }) => {
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedApplications = applications
    .filter(app => 
      app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.careerTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: 'carbon:time' },
      approved: { color: 'bg-green-100 text-green-800', icon: 'carbon:checkmark' },
      rejected: { color: 'bg-red-100 text-red-800', icon: 'carbon:close' },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: 'carbon:view' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon icon={config.icon} className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-500">Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="carbon:search" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Icon icon="carbon:filter" className="h-4 w-4" />
            <span>{filteredAndSortedApplications.length} of {applications.length} applications</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('fullName')}
              >
                <div className="flex items-center space-x-1">
                  <span>Applicant</span>
                  {sortField === 'fullName' && (
                    <Icon 
                      icon={sortDirection === 'asc' ? 'carbon:chevron-up' : 'carbon:chevron-down'} 
                      className="h-4 w-4" 
                    />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('careerTitle')}
              >
                <div className="flex items-center space-x-1">
                  <span>Position</span>
                  {sortField === 'careerTitle' && (
                    <Icon 
                      icon={sortDirection === 'asc' ? 'carbon:chevron-up' : 'carbon:chevron-down'} 
                      className="h-4 w-4" 
                    />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortField === 'status' && (
                    <Icon 
                      icon={sortDirection === 'asc' ? 'carbon:chevron-up' : 'carbon:chevron-down'} 
                      className="h-4 w-4" 
                    />
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Applied</span>
                  {sortField === 'createdAt' && (
                    <Icon 
                      icon={sortDirection === 'asc' ? 'carbon:chevron-up' : 'carbon:chevron-down'} 
                      className="h-4 w-4" 
                    />
                  )}
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedApplications.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Icon icon="carbon:document" className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'Applications will appear here once submitted.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {application.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {application.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.careerTitle}</div>
                    <div className="text-sm text-gray-500">{application.careerDepartment}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(application.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onView(application)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                        title="View Details"
                      >
                        <Icon icon="carbon:view" className="h-4 w-4" />
                      </button>
                      
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onStatusUpdate(application.id, 'approved')}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                            title="Approve"
                          >
                            <Icon icon="carbon:checkmark" className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onStatusUpdate(application.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            title="Reject"
                          >
                            <Icon icon="carbon:close" className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => onDelete(application.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                        title="Delete"
                      >
                        <Icon icon="carbon:trash-can" className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplicationsTable; 