import { useState } from 'react';
import CareersTable from './CareersTable';
import { Icon } from '@iconify/react';

const CareersManagement = () => {
  const [totalCareers, setTotalCareers] = useState(0);
  const handleCareersCount = (count) => setTotalCareers(count);
  return (
    <div>
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
    </div>
  );
};

export default CareersManagement; 