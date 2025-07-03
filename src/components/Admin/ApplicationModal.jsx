import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const ApplicationModal = ({ application, isOpen, onClose, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen || !application) return null;

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(application.id, newStatus);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: 'carbon:time' },
      approved: { color: 'bg-green-100 text-green-800', icon: 'carbon:checkmark' },
      rejected: { color: 'bg-red-100 text-red-800', icon: 'carbon:close' },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: 'carbon:view' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon icon={config.icon} className="h-4 w-4 mr-2" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-auto transform transition-all duration-300 ease-out border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Icon icon="carbon:user-activity" className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Application Details
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Review application for {application.careerTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <Icon icon="carbon:close" className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Icon icon="carbon:user" className="h-5 w-5 mr-2 text-green-500" />
                  Applicant Information
                </h4>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {application.fullName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-gray-900">{application.fullName}</h5>
                      <p className="text-sm text-gray-600">{application.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{application.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{application.location || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Icon icon="carbon:briefcase" className="h-5 w-5 mr-2 text-blue-500" />
                  Position Details
                </h4>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{application.careerTitle}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{application.careerDepartment}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Application Status</label>
                    <div className="mt-2">
                      {getStatusBadge(application.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Icon icon="carbon:document" className="h-5 w-5 mr-2 text-purple-500" />
                  Application Details
                </h4>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Applied Date</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(application.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience Level</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{application.experienceLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Education</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{application.education || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {application.coverLetter && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:document-text" className="h-5 w-5 mr-2 text-orange-500" />
                    Cover Letter
                  </h4>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              {application.resumeUrl && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Icon icon="carbon:document-download" className="h-5 w-5 mr-2 text-teal-500" />
                    Resume/CV
                  </h4>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Icon icon="carbon:download" className="h-4 w-4 mr-2" />
                      Download Resume
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {application.status === 'pending' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Icon icon="carbon:close" className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Updating...' : 'Reject Application'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Icon icon="carbon:checkmark" className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Updating...' : 'Approve Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
